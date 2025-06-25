import {
  OPENROUTER_CONFIG,
  OpenRouterMessage,
  OpenRouterRequest,
  OpenRouterResponse,
} from "./openrouter";

export class OpenRouterService {
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.baseUrl = OPENROUTER_CONFIG.apiUrl;
  }
  async sendMessage(
    messages: OpenRouterMessage[],
    model: string,
    options: {
      temperature?: number;
      stream?: boolean;
    } = {}
  ): Promise<string> {
    if (!model || model.trim() === "") {
      throw new Error(
        "No model specified. Please configure a model in settings."
      );
    }

    // Validate model name format (OpenRouter expects provider/model format)
    if (!model.includes("/")) {
      console.warn(
        `⚠️  Model name "${model}" doesn't follow provider/model format. This might cause issues.`
      );
    }
    const { temperature = 0.0, stream = false } = options;

    const request: OpenRouterRequest = {
      model,
      messages,
      temperature,
      stream,
    };

    console.log("🚀 Sending request to OpenRouter:", {
      model,
      messageCount: messages.length,
      temperature,
      stream,
    });

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": window.location.origin,
          "X-Title": "Chat UI",
        },
        body: JSON.stringify(request),
      });
      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ error: "Unknown error" }));

        console.error("OpenRouter API Error Details:", errorData);
        console.error("Request details:", {
          model,
          messageCount: messages.length,
          temperature,
        });

        // Handle different error response formats
        const errorMessage =
          errorData.error?.message ||
          errorData.message ||
          errorData.error ||
          JSON.stringify(errorData) ||
          "Request failed"; // Provide more specific error guidance
        let enhancedError = `OpenRouter API error: ${response.status} - ${errorMessage}`;

        if (response.status === 400) {
          enhancedError += `\n\nPossible causes:
- Invalid model name: "${model}"
- Model requires different parameters
- Message format issue
- Token limit exceeded`;
        } else if (response.status === 503) {
          enhancedError += `\n\nService temporarily unavailable:
- The AI model provider (${model.split("/")[0]}) is experiencing issues
- This is typically temporary - please try again in a few moments
- You may want to try a different model if available`;
        } else if (response.status === 502) {
          enhancedError += `\n\nBad Gateway:
- OpenRouter is having connectivity issues with the model provider
- Please try again in a few moments`;
        } else if (response.status >= 500) {
          enhancedError += `\n\nServer Error:
- This is a temporary issue with the service
- Please try again in a few moments`;
        } else if (response.status === 429) {
          enhancedError += `\n\nRate Limit Exceeded:
- You've made too many requests recently
- Please wait a moment before trying again`;
        } else if (response.status === 401) {
          enhancedError += `\n\nAuthentication Error:
- Check your API key in settings
- Make sure your API key is valid and active`;
        }

        throw new Error(enhancedError);
      }

      const data: OpenRouterResponse = await response.json();

      if (!data.choices || data.choices.length === 0) {
        throw new Error("No response from OpenRouter API");
      }

      return data.choices[0].message.content;
    } catch (error) {
      console.error("OpenRouter API Error:", error);
      throw error;
    }
  }
  async sendMessageStream(
    messages: OpenRouterMessage[],
    model: string,
    onChunk: (chunk: string) => void,
    options: {
      temperature?: number;
    } = {}
  ): Promise<void> {
    if (!model || model.trim() === "") {
      throw new Error(
        "No model specified. Please configure a model in settings."
      );
    }
    const { temperature = 0.0 } = options;
    const request: OpenRouterRequest = {
      model,
      messages,
      temperature,
      stream: true,
    };

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": window.location.origin,
          "X-Title": "Chat UI",
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ error: "Unknown error" }));
        throw new Error(
          `OpenRouter API error: ${response.status} - ${errorData.error || "Request failed"}`
        );
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("No response stream available");
      }

      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6).trim();
            if (data === "[DONE]") continue;
            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                onChunk(content);
              }
            } catch {
              // Skip invalid JSON chunks
              continue;
            }
          }
        }
      }
    } catch (error) {
      console.error("OpenRouter Streaming Error:", error);
      throw error;
    }
  }
}
