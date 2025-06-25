export interface MentorConfig {
  modelName?: string;
  temperature?: number;
}

export interface ConversationMessage {
  role: "user" | "ai" | "assistant" | "mentor" | "system";
  content: string;
  timestamp: number;
}

export class MentorAnalysisService {
  private apiKey: string;
  private baseUrl = "https://openrouter.ai/api/v1";

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async analyzeMentorInput(
    conversationHistory: ConversationMessage[],
    mentorPrompt: string,
    config?: MentorConfig
  ): Promise<string | null> {
    if (!this.apiKey) {
      throw new Error("OpenRouter API key is required");
    }

    try {
      console.log("🧭 MENTOR MODEL: Starting analysis...");
      console.log(
        "🧭 Conversation history length:",
        conversationHistory.length
      );
      console.log("🧭 Mentor prompt:", mentorPrompt.substring(0, 100) + "...");

      // Prepare the mentor system prompt
      const systemMessage = {
        role: "system" as const,
        content: mentorPrompt,
      }; // Convert conversation history to OpenRouter format
      const conversationMessages = conversationHistory.map((msg) => {
        // Map roles to OpenRouter-compatible format
        let role: "user" | "assistant" | "system";
        if (
          msg.role === "ai" ||
          msg.role === "assistant" ||
          msg.role === "mentor"
        ) {
          role = "assistant";
        } else if (msg.role === "system") {
          role = "system";
        } else {
          role = "user";
        }

        return {
          role,
          content: msg.content,
        };
      });

      const requestBody = {
        model: config?.modelName || "anthropic/claude-3.5-sonnet",
        messages: [systemMessage, ...conversationMessages],
        temperature: config?.temperature ?? 0.7,
        stream: false,
      };

      console.log("🧭 MENTOR MODEL: Request body:", {
        model: requestBody.model,
        temperature: requestBody.temperature,
        messageCount: requestBody.messages.length,
      });

      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
          "HTTP-Referer": window.location.origin,
          "X-Title": "Chat Application",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("🧭 MENTOR MODEL: API error:", errorText);
        throw new Error(
          `OpenRouter API error: ${response.status} - ${errorText}`
        );
      }

      const data = await response.json();

      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        console.error("🧭 MENTOR MODEL: Invalid response format:", data);
        throw new Error("Invalid response format from OpenRouter API");
      }

      const mentorAnalysis = data.choices[0].message.content;
      console.log("🧭 MENTOR MODEL: Analysis completed successfully");
      console.log(
        "🧭 MENTOR MODEL: Output:",
        mentorAnalysis.substring(0, 100) + "..."
      );

      return mentorAnalysis;
    } catch (error) {
      console.error("🧭 MENTOR MODEL: Analysis failed:", error);
      throw error;
    }
  }
}
