import { OpenAIService } from "./openai-service";

export interface ChainedVoiceConfig {
  apiKey: string;
  model?: string;
  voice?: string;
  temperature?: number;
  instructions?: string;
  getConversationHistory?: () => Promise<
    Array<{
      role: "user" | "assistant";
      content: string;
    }>
  >;
}

export interface ChainedVoiceEvents {
  onTranscript: (text: string, isFinal: boolean) => void;
  onResponse: (text: string, audioUrl?: string) => void;
  onError: (error: string) => void;
  onStatusChange: (
    status:
      | "idle"
      | "recording"
      | "transcribing"
      | "thinking"
      | "speaking"
      | "error"
  ) => void;
  onAudioReady: (audioUrl: string) => void;
}

export class ChainedVoiceAssistant {
  private config: ChainedVoiceConfig;
  private events: ChainedVoiceEvents;
  private openAIService: OpenAIService;
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private isRecording = false;
  private currentStatus:
    | "idle"
    | "recording"
    | "transcribing"
    | "thinking"
    | "speaking"
    | "error" = "idle";

  constructor(config: ChainedVoiceConfig, events: ChainedVoiceEvents) {
    this.config = config;
    this.events = events;
    this.openAIService = new OpenAIService(config.apiKey);
  }

  private updateStatus(status: typeof this.currentStatus): void {
    if (this.currentStatus !== status) {
      this.currentStatus = status;
      this.events.onStatusChange(status);
    }
  }

  async startRecording(): Promise<void> {
    try {
      this.updateStatus("recording");

      // Get microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000,
        },
      });

      // Create MediaRecorder
      this.mediaRecorder = new MediaRecorder(stream, {
        mimeType: this.getSupportedMimeType(),
      });

      this.audioChunks = [];

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.onstop = async () => {
        try {
          await this.processRecording();
        } catch (error) {
          console.error("Audio processing failed:", error);
          this.events.onError(
            `Audio processing failed: ${error instanceof Error ? error.message : "Unknown error"}`
          );
          this.updateStatus("error");
        }
      };

      this.mediaRecorder.onerror = (error) => {
        console.error("MediaRecorder error:", error);
        this.events.onError("Recording error occurred");
        this.updateStatus("error");
      };

      // Start recording
      this.mediaRecorder.start(100); // Collect data every 100ms
      this.isRecording = true;
    } catch (error) {
      console.error("Failed to start recording:", error);
      this.events.onError("Failed to access microphone");
      this.updateStatus("error");
    }
  }

  async stopRecording(): Promise<void> {
    if (!this.isRecording || !this.mediaRecorder) {
      return;
    }

    this.isRecording = false;

    if (this.mediaRecorder.state === "recording") {
      this.mediaRecorder.stop();
    }

    // Stop all tracks to release microphone
    const stream = this.mediaRecorder.stream;
    if (stream) {
      stream.getTracks().forEach((track) => {
        track.stop();
      });
    }
  }

  private async processRecording(): Promise<void> {
    try {
      if (this.audioChunks.length === 0) {
        this.updateStatus("idle");
        return;
      }

      // Step 1: Create audio blob
      const audioBlob = new Blob(this.audioChunks, {
        type: this.getSupportedMimeType(),
      });

      // Step 2: Speech-to-Text (Transcription)
      this.updateStatus("transcribing");

      const transcript = await this.transcribeAudio(audioBlob);

      if (!transcript || transcript.trim().length === 0) {
        this.updateStatus("idle");
        return;
      }

      this.events.onTranscript(transcript, true);

      // Step 3: LLM Processing (Text-to-Text)
      this.updateStatus("thinking");

      const aiResponse = await this.generateResponse(transcript);

      if (!aiResponse) {
        this.updateStatus("idle");
        return;
      }

      this.events.onResponse(aiResponse);

      // Step 4: Text-to-Speech (Audio Synthesis)
      this.updateStatus("speaking");

      const audioUrl = await this.synthesizeSpeech(aiResponse);

      if (audioUrl) {
        this.events.onAudioReady(audioUrl);

        // Play the audio
        await this.playAudio(audioUrl);
      }

      this.updateStatus("idle");
    } catch (error) {
      console.error("Processing error:", error);
      this.events.onError(
        error instanceof Error ? error.message : "Processing failed"
      );
      this.updateStatus("error");
    }
  }

  private async transcribeAudio(audioBlob: Blob): Promise<string> {
    try {
      // Determine correct file extension and name based on actual MIME type
      let fileName = "recording.webm";
      const mimeType = audioBlob.type;

      if (audioBlob.type.includes("webm")) {
        fileName = "recording.webm";
      } else if (audioBlob.type.includes("mp4")) {
        fileName = "recording.mp4";
      } else if (audioBlob.type.includes("wav")) {
        fileName = "recording.wav";
      } else if (audioBlob.type.includes("ogg")) {
        fileName = "recording.ogg";
      }

      // Convert blob to File for OpenAI API with correct type
      const audioFile = new File([audioBlob], fileName, {
        type: mimeType,
      });

      const result = await this.openAIService.transcribeAudio(audioFile);

      return result.text || "";
    } catch (error) {
      console.error("Transcription failed:", error);
      throw new Error("Speech-to-text failed");
    }
  }

  private async generateResponse(transcript: string): Promise<string> {
    try {
      const systemPrompt =
        this.config.instructions || this.getDefaultInstructions();

      // Build conversation messages
      const messages: Array<{
        role: "system" | "user" | "assistant";
        content: string;
      }> = [
        {
          role: "system",
          content: systemPrompt,
        },
      ];

      // Add conversation history if available
      if (this.config.getConversationHistory) {
        const history = await this.config.getConversationHistory();
        messages.push(...history);
      }

      // Add current user message
      messages.push({
        role: "user",
        content: transcript,
      });

      const response = await this.openAIService.generateChatCompletion(
        messages,
        this.config.model || "gpt-4.1"
      );

      const aiResponse = response.choices[0]?.message?.content || "";

      return aiResponse;
    } catch (error) {
      console.error("LLM processing failed:", error);
      throw new Error("AI response generation failed");
    }
  }

  private async synthesizeSpeech(text: string): Promise<string | null> {
    try {
      const audioBuffer = await this.openAIService.generateSpeech(
        text,
        this.config.voice || "alloy",
        "gpt-4o-mini-tts"
      );

      // Create blob URL for playback
      const audioBlob = new Blob([audioBuffer], { type: "audio/wav" });
      const audioUrl = URL.createObjectURL(audioBlob);

      return audioUrl;
    } catch (error) {
      console.error("Speech synthesis failed:", error);
      throw new Error("Text-to-speech failed");
    }
  }

  private async playAudio(audioUrl: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const audio = new Audio(audioUrl);

      audio.onended = () => {
        URL.revokeObjectURL(audioUrl); // Clean up
        resolve();
      };

      audio.onerror = (error) => {
        console.error("Audio playback failed:", error);
        URL.revokeObjectURL(audioUrl); // Clean up
        reject(new Error("Audio playback failed"));
      };

      audio.play().catch(reject);
    });
  }

  private getSupportedMimeType(): string {
    const mimeTypes = [
      "audio/webm;codecs=opus",
      "audio/webm",
      "audio/mp4",
      "audio/wav",
    ];

    for (const mimeType of mimeTypes) {
      if (MediaRecorder.isTypeSupported(mimeType)) {
        return mimeType;
      }
    }

    return "audio/webm"; // Fallback
  }

  private getDefaultInstructions(): string {
    return `You are a compassionate AI psychiatrist assistant specializing in ADHD support and mental health guidance.

**Your role:**
- Listen actively and empathetically to the user's concerns
- Provide supportive, non-judgmental responses  
- Offer practical strategies for managing ADHD symptoms
- Suggest coping mechanisms and self-care practices
- Encourage professional help when appropriate
- Maintain appropriate boundaries as an AI assistant

**Communication style:**
- Be warm, understanding, and supportive
- Use simple, clear language
- Keep responses conversational and brief (1-3 sentences typically)
- Ask clarifying questions to better understand their situation
- Focus on ADHD-related challenges, emotional support, and practical strategies

**Important boundaries:**
- You are not a replacement for professional therapy
- Do not diagnose or provide medical advice
- If someone mentions self-harm or crisis, encourage them to seek immediate professional help

Remember: You're here to support and guide, creating a safe space for conversation about mental health and ADHD management.`;
  }

  // Public methods
  getStatus(): typeof this.currentStatus {
    return this.currentStatus;
  }

  isCurrentlyRecording(): boolean {
    return this.isRecording;
  }

  async cleanup(): Promise<void> {
    try {
      if (this.isRecording) {
        await this.stopRecording();
      }

      if (this.mediaRecorder) {
        const stream = this.mediaRecorder.stream;
        if (stream) {
          stream.getTracks().forEach((track) => track.stop());
        }
        this.mediaRecorder = null;
      }

      this.audioChunks = [];
      this.updateStatus("idle");
    } catch (error) {
      console.error("Cleanup failed:", error);
    }
  }
}
