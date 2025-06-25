export interface AnalysisConfig {
  modelName?: string;
  temperature?: number;
}

export interface ConversationMessage {
  role: "user" | "ai" | "assistant";
  content: string;
}

export class AssistantAnalysisService {
  private apiKey: string;
  private baseUrl = "https://openrouter.ai/api/v1";

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async analyzeConversation(
    conversationHistory: ConversationMessage[],
    assistantPrompt: string,
    config: AnalysisConfig = {}
  ): Promise<string | null> {
    if (!this.apiKey) {
      throw new Error("OpenRouter API key is required");
    }

    try {
      const { modelName, temperature } = config;

      if (!modelName || modelName.trim() === "") {
        throw new Error(
          "No assistant model specified. Please configure an assistant model in settings."
        );
      }

      console.log("🤖 ASSISTANT MODEL: Starting analysis...");
      console.log(
        "🤖 Assistant prompt:",
        assistantPrompt.substring(0, 100) + "..."
      );
      console.log(
        "🤖 Conversation history length:",
        conversationHistory.length
      ); // Prepare messages for assistant analysis
      const analysisMessages = [
        {
          role: "system" as const,
          content: assistantPrompt,
        },
        ...conversationHistory
          .filter((msg) => msg.content && msg.content.trim().length > 0) // Filter out empty messages
          .map((msg) => ({
            role:
              msg.role === "ai" || msg.role === "assistant"
                ? ("assistant" as const)
                : ("user" as const), // Ensure only valid roles
            content: msg.content.trim(),
          })),
      ];

      // Log the messages being sent for debugging
      console.log("🤖 ASSISTANT MODEL: Messages being sent:", {
        messageCount: analysisMessages.length,
        messages: analysisMessages.map((msg, idx) => ({
          index: idx,
          role: msg.role,
          contentLength: msg.content.length,
          contentPreview: msg.content.substring(0, 50) + "...",
        })),
      }); // Validate that we have proper messages before sending
      if (analysisMessages.length === 0) {
        throw new Error("No valid messages to send for analysis");
      }

      // Ensure system message is valid
      if (
        !analysisMessages[0].content ||
        analysisMessages[0].content.trim().length === 0
      ) {
        throw new Error("Assistant prompt is empty or invalid");
      }

      const requestBody = {
        model: modelName,
        messages: analysisMessages,
        temperature: temperature ?? 0.7,
        stream: false,
      };

      console.log("🤖 ASSISTANT MODEL: Request body:", {
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
        console.error("🤖 ASSISTANT MODEL: API error:", errorText);
        console.error("🤖 ASSISTANT MODEL: Request that failed:", {
          model: requestBody.model,
          messageCount: requestBody.messages.length,
          messages: requestBody.messages,
        });
        throw new Error(
          `OpenRouter API error: ${response.status} - ${errorText}`
        );
      }

      const data = await response.json();

      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        console.error("🤖 ASSISTANT MODEL: Invalid response format:", data);
        throw new Error("Invalid response format from OpenRouter API");
      }

      const analysis = data.choices[0].message.content;
      console.log("🤖 ASSISTANT MODEL: Analysis completed successfully");
      console.log(
        "🤖 ASSISTANT MODEL: Output:",
        analysis.substring(0, 100) + "..."
      );

      return analysis?.trim() || null;
    } catch (error) {
      console.error("🤖 ASSISTANT MODEL: Analysis failed:", error);
      throw error;
    }
  }
}
