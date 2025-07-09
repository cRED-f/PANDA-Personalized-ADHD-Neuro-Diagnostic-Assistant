import { OpenAIMessage, OpenAIRequest, OpenAIResponse } from "./openai";

export class OpenAIService {
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.baseUrl = "https://api.openai.com/v1";
  }

  async sendMessage(
    messages: OpenAIMessage[],
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

    const { temperature = 0.0, stream = false } = options;

    const request: OpenAIRequest = {
      model,
      messages,
      temperature,
      stream,
    };

    console.log("🚀 Sending request to OpenAI:", {
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
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ error: "Unknown error" }));

        console.error("OpenAI API Error Details:", errorData);
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
          "Request failed";

        // Provide more specific error guidance
        let enhancedError = `OpenAI API error: ${response.status} - ${errorMessage}`;

        if (response.status === 400) {
          enhancedError += `\n\nPossible causes:
- Invalid model name: "${model}"
- Invalid request parameters
- Message format issue
- Token limit exceeded`;
        } else if (response.status === 401) {
          enhancedError += `\n\nAuthentication Error:
- Check your OpenAI API key in settings
- Make sure your API key is valid and active
- Verify your API key has the necessary permissions`;
        } else if (response.status === 429) {
          enhancedError += `\n\nRate Limit Exceeded:
- You've exceeded your rate limit or quota
- Please wait a moment before trying again
- Consider upgrading your OpenAI plan if needed`;
        } else if (response.status === 503) {
          enhancedError += `\n\nService Unavailable:
- OpenAI is experiencing issues
- This is typically temporary - please try again in a few moments`;
        } else if (response.status >= 500) {
          enhancedError += `\n\nServer Error:
- This is a temporary issue with OpenAI's service
- Please try again in a few moments`;
        }

        throw new Error(enhancedError);
      }

      const data: OpenAIResponse = await response.json();

      if (!data.choices || data.choices.length === 0) {
        throw new Error("No response from OpenAI API");
      }

      return data.choices[0].message.content || "";
    } catch (error) {
      console.error("OpenAI API Error:", error);
      throw error;
    }
  }

  async sendMessageStream(
    messages: OpenAIMessage[],
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

    const request: OpenAIRequest = {
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
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ error: "Unknown error" }));
        throw new Error(
          `OpenAI API error: ${response.status} - ${errorData.error?.message || errorData.message || "Request failed"}`
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
      console.error("OpenAI Streaming Error:", error);
      throw error;
    }
  }
}
