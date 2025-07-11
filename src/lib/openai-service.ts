import { OpenAIMessage, OpenAIRequest, OpenAIResponse } from "./openai";

export interface VoiceTranscriptionResult {
  text: string;
  confidence?: number;
  language?: string;
  duration?: number;
}

export interface VoiceGenerationResult {
  audioUrl: string;
  duration?: number;
}

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

  /**
   * Convert speech to text using OpenAI Whisper
   */
  async speechToText(
    audioFile: File,
    options: {
      model?: string;
      language?: string;
      prompt?: string;
      temperature?: number;
    } = {}
  ): Promise<VoiceTranscriptionResult> {
    const {
      model = "gpt-4o-transcribe",
      language = "en",
      prompt,
      temperature = 0,
    } = options;

    const formData = new FormData();
    formData.append("file", audioFile);
    formData.append("model", model);
    formData.append("language", language);
    formData.append("response_format", "verbose_json");
    formData.append("temperature", temperature.toString());

    if (prompt) {
      formData.append("prompt", prompt);
    }

    console.log("🎤 Sending audio to OpenAI Whisper:", {
      model,
      language,
      fileSize: audioFile.size,
      fileName: audioFile.name,
    });

    try {
      const response = await fetch(`${this.baseUrl}/audio/transcriptions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("OpenAI Whisper Error Response:", errorText);
        throw new Error(
          `OpenAI Whisper API error: ${response.status} ${errorText}`
        );
      }

      const data = await response.json();

      console.log("✅ OpenAI Whisper Response:", {
        text: data.text?.substring(0, 100) + "...",
        language: data.language,
        duration: data.duration,
      });

      return {
        text: data.text,
        confidence: data.confidence,
        language: data.language,
        duration: data.duration,
      };
    } catch (error) {
      console.error("OpenAI Whisper Error:", error);
      throw error;
    }
  }

  /**
   * Convert text to speech using OpenAI TTS
   */
  async textToSpeech(
    text: string,
    options: {
      model?: string;
      voice?: string;
      response_format?: string;
      speed?: number;
    } = {}
  ): Promise<VoiceGenerationResult> {
    const {
      model = "gpt-4o-mini-tts",
      voice = "alloy",
      response_format = "wav",
      speed = 1.0,
    } = options;

    console.log("🔊 Sending text to OpenAI TTS:", {
      model,
      voice,
      textLength: text.length,
      speed,
    });

    try {
      const response = await fetch(`${this.baseUrl}/audio/speech`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          input: text,
          voice,
          response_format,
          speed,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("OpenAI TTS Error Response:", errorText);
        throw new Error(
          `OpenAI TTS API error: ${response.status} ${errorText}`
        );
      }

      // Get audio as blob
      const audioBlob = await response.blob();

      // Create object URL for the audio
      const audioUrl = URL.createObjectURL(audioBlob);

      console.log("✅ OpenAI TTS Response:", {
        audioSize: audioBlob.size,
        audioType: audioBlob.type,
      });

      return {
        audioUrl,
        duration: undefined, // Duration would need to be calculated separately
      };
    } catch (error) {
      console.error("OpenAI TTS Error:", error);
      throw error;
    }
  }

  /**
   * Transcribe audio using OpenAI Whisper
   */
  async transcribeAudio(audioFile: File): Promise<VoiceTranscriptionResult> {
    try {
      const formData = new FormData();
      formData.append("file", audioFile);
      formData.append("model", "gpt-4o-transcribe");
      formData.append("response_format", "json");

      console.log("🎤 Transcribing audio with Whisper...");

      const response = await fetch(`${this.baseUrl}/audio/transcriptions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `Transcription failed: ${response.status} ${response.statusText}. ${
            errorData.error?.message || ""
          }`
        );
      }

      const result = await response.json();
      console.log("✅ Transcription successful:", result.text);

      return {
        text: result.text || "",
        language: result.language,
        duration: result.duration,
      };
    } catch (error) {
      console.error("❌ Transcription error:", error);
      throw error;
    }
  }

  /**
   * Generate speech using OpenAI TTS
   */
  async generateSpeech(
    text: string,
    voice: string = "alloy",
    model: string = "gpt-4o-mini-tts"
  ): Promise<ArrayBuffer> {
    try {
      console.log("🗣️ Generating speech with TTS...");

      const response = await fetch(`${this.baseUrl}/audio/speech`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          input: text,
          voice,
          response_format: "wav",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `Speech generation failed: ${response.status} ${response.statusText}. ${
            errorData.error?.message || ""
          }`
        );
      }

      const audioBuffer = await response.arrayBuffer();
      console.log("✅ Speech generation successful");

      return audioBuffer;
    } catch (error) {
      console.error("❌ Speech generation error:", error);
      throw error;
    }
  }

  /**
   * Generate chat completion
   */
  async generateChatCompletion(
    messages: OpenAIMessage[],
    model: string = "gpt-4.1",
    options: {
      temperature?: number;
      max_tokens?: number;
    } = {}
  ): Promise<OpenAIResponse> {
    try {
      console.log("🤔 Generating chat completion...");

      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: options.temperature || 0.7,
          max_tokens: options.max_tokens || 500,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `Chat completion failed: ${response.status} ${response.statusText}. ${
            errorData.error?.message || ""
          }`
        );
      }

      const result = await response.json();
      console.log("✅ Chat completion successful");

      return result;
    } catch (error) {
      console.error("❌ Chat completion error:", error);
      throw error;
    }
  }

  /**
   * Create a psychiatrist-focused system prompt
   */
  createPsychiatristPrompt(): string {
    return `You are a compassionate AI psychiatrist assistant specializing in ADHD support and mental health guidance. Your role is to:

1. Listen actively and empathetically to the user's concerns
2. Provide supportive, non-judgmental responses
3. Offer practical strategies for managing ADHD symptoms
4. Suggest coping mechanisms and self-care practices
5. Encourage professional help when appropriate
6. Maintain appropriate boundaries as an AI assistant

Guidelines:
- Always be warm, understanding, and supportive
- Use simple, clear language
- Ask clarifying questions to better understand their situation
- Provide actionable advice when appropriate
- Remember you are not a replacement for professional therapy
- Keep responses conversational and relatively brief (2-3 sentences typically)
- Focus on ADHD-related challenges, emotional support, and practical strategies

Remember: You're here to support and guide, not to diagnose or provide medical advice.`;
  }
}
