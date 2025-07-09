import { RealtimeAgent, RealtimeSession } from "@openai/agents/realtime";
import type { RealtimeItem } from "@openai/agents/realtime";
import { OpenAIEphemeralTokenService } from "./openai-ephemeral-token";

export interface RealtimeVoiceConfig {
  apiKey: string;
  model?: string;
  voice?: string;
  temperature?: number;
  instructions?: string;
}

export interface VoiceSessionEvents {
  onTranscript: (text: string, isFinal: boolean) => void;
  onResponse: (text: string, audioUrl?: string) => void;
  onError: (error: string) => void;
  onStatusChange: (
    status:
      | "connecting"
      | "connected"
      | "disconnected"
      | "listening"
      | "speaking"
      | "thinking"
  ) => void;
  onHistoryUpdate: (history: RealtimeItem[]) => void;
}

export class RealtimeVoiceAssistant {
  private agent: RealtimeAgent;
  private session: RealtimeSession;
  private config: RealtimeVoiceConfig;
  private events: VoiceSessionEvents;
  private isConnected = false;
  private tokenService: OpenAIEphemeralTokenService;
  private currentStatus:
    | "connecting"
    | "connected"
    | "disconnected"
    | "listening"
    | "speaking"
    | "thinking" = "disconnected";
  private currentTranscript = "";
  private currentResponse = "";
  private currentResponseText = ""; // Accumulate response text from deltas
  private processedItemIds = new Set<string>(); // Track processed items to prevent duplicates

  constructor(config: RealtimeVoiceConfig, events: VoiceSessionEvents) {
    this.config = config;
    this.events = events;
    this.tokenService = new OpenAIEphemeralTokenService(config.apiKey);

    // Create the agent with psychiatric instructions
    this.agent = new RealtimeAgent({
      name: "AI Psychiatrist",
      instructions: this.createPsychiatristInstructions(),
    });

    // Create the session with optimal real-time settings
    this.session = new RealtimeSession(this.agent, {
      model: config.model || "gpt-4o-realtime-preview-2024-10-01",
      config: {
        voice: config.voice || "alloy",
        inputAudioFormat: "pcm16",
        outputAudioFormat: "pcm16",
        inputAudioTranscription: {
          model: "whisper-1",
        },
        turnDetection: {
          type: "server_vad", // Use server-side voice activity detection
          threshold: 0.5,
          prefix_padding_ms: 300,
          silence_duration_ms: 200,
        },
      },
    });

    this.setupEventListeners();
  }

  private createPsychiatristInstructions(): string {
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
- Keep responses conversational and relatively brief (1-3 sentences typically)
- Ask clarifying questions to better understand their situation
- Focus on ADHD-related challenges, emotional support, and practical strategies

**Important boundaries:**
- You are not a replacement for professional therapy
- Do not diagnose or provide medical advice
- If someone mentions self-harm or crisis, encourage them to seek immediate professional help

**Real-time conversation guidelines:**
- Respond naturally and conversationally
- Feel free to use filler words and natural speech patterns
- You can interrupt yourself if you need to clarify something
- If you hear background noise or unclear speech, politely ask for clarification

Remember: You're here to support and guide, creating a safe space for conversation about mental health and ADHD management.`;
  }

  private setupEventListeners(): void {
    // History updates - this gives us transcript and response data
    this.session.on("history_updated", (history: RealtimeItem[]) => {
      console.log("📜 History updated, length:", history.length);
      this.events.onHistoryUpdate(history);
      // Don't process all history here - only process new items via history_added
    });

    // Individual history items added (real-time updates) - ONLY process new items here
    this.session.on("history_added", (item: RealtimeItem) => {
      console.log("➕ New history item added:", {
        itemId: item.itemId,
        type: item.type,
        role: (item as { role?: string }).role,
        hasContent: !!(item as { content?: unknown[] }).content,
      });
      this.processHistoryItem(item);
    });

    // Audio start/stop events for status
    this.session.on("audio_start", () => {
      this.updateStatus("speaking");
      console.log("🗣️ AI started speaking");
    });

    this.session.on("audio_stopped", () => {
      this.updateStatus("connected");
      console.log("✅ AI finished speaking");
    });

    // Audio interruption
    this.session.on("audio_interrupted", () => {
      this.updateStatus("listening");
      console.log("✋ Audio interrupted");
    });

    // Agent events for status updates
    this.session.on("agent_start", () => {
      this.updateStatus("thinking");
      console.log("🤔 AI started thinking");
    });

    this.session.on("agent_end", () => {
      this.updateStatus("connected");
      console.log("✅ AI finished processing");
    });

    // Transport events for connection status
    this.session.on("transport_event", (event) => {
      // Log ALL transport events for debugging
      console.log("🚗 Transport event:", event.type, event);

      switch (event.type) {
        case "connection.created":
          this.isConnected = true;
          this.updateStatus("connected");
          console.log("🔗 Connected to OpenAI Realtime API");
          break;
        case "session.created":
          console.log("🎯 Session created successfully");
          break;
        case "session.updated":
          console.log("🔄 Session updated");
          break;
        case "input_audio_buffer.speech_started":
          this.updateStatus("listening");
          console.log("🎤 User started speaking");
          break;
        case "input_audio_buffer.speech_stopped":
          console.log("🎤 User stopped speaking");
          break;
        case "input_audio_buffer.committed":
          console.log("📝 Audio committed for processing");
          break;
        case "conversation.item.created":
          console.log("📋 Conversation item created:", event);
          break;
        case "conversation.item.input_audio_transcription.completed":
          console.log("📝 Transcription completed:", event);
          // Try to extract transcript directly from transport event
          const transcriptEvent = event as { transcript?: string };
          if (transcriptEvent.transcript) {
            console.log("🎯 Direct transcript:", transcriptEvent.transcript);
            this.events.onTranscript(transcriptEvent.transcript, true);
          }
          break;
        case "response.created":
          this.updateStatus("thinking");
          this.currentResponseText = ""; // Reset response text accumulator
          console.log("🧠 Response created");
          break;
        case "response.done":
          this.updateStatus("connected");
          // Send the complete accumulated response
          if (this.currentResponseText.trim()) {
            console.log(
              "🎯 Final complete response:",
              this.currentResponseText
            );
            console.log("💾 Triggering onResponse callback...");
            this.events.onResponse(this.currentResponseText.trim());
            this.currentResponseText = ""; // Reset for next response
          }
          console.log("✅ Response completed");
          break;
        case "response.text.delta":
          console.log("💬 Response text delta:", event);
          // Accumulate response text from deltas
          const deltaEvent = event as { delta?: string };
          if (deltaEvent.delta) {
            this.currentResponseText += deltaEvent.delta;
            console.log("📝 Accumulated response:", this.currentResponseText);
          }
          break;
        case "response.text.done":
          console.log("📄 Response text done:", event);
          // This might also have the final text, use it if we don't have accumulated text
          const textEvent = event as { text?: string };
          if (textEvent.text && !this.currentResponseText.trim()) {
            console.log("🎯 Final response from text.done:", textEvent.text);
            this.events.onResponse(textEvent.text);
          }
          break;
        default:
          // Log other events for debugging
          if (event.type.includes("error")) {
            console.error("❌ Transport error:", event);
            this.events.onError(`Transport error: ${event.type}`);
          }
          break;
      }
    });

    // Error handling
    this.session.on("error", (error) => {
      console.error("❌ Realtime session error:", error);
      this.events.onError(
        error.error ? String(error.error) : "Unknown error occurred"
      );
    });
  }

  private processHistoryItem(item: RealtimeItem): void {
    // Prevent duplicate processing using itemId
    if (this.processedItemIds.has(item.itemId)) {
      return;
    }

    this.processedItemIds.add(item.itemId);
    console.log(`🔄 Processing new item: ${item.itemId} (${item.type})`);

    if (item.type === "message") {
      const messageItem = item as {
        type: "message";
        role: string;
        content: Array<{
          type: string;
          text?: string;
          transcript?: string;
        }>;
        itemId: string;
      };

      if (messageItem.role === "user" && messageItem.content) {
        // User transcript
        for (const content of messageItem.content) {
          if (content.type === "input_text" && content.text) {
            console.log("📝 User text:", content.text);
            this.events.onTranscript(content.text, true);
          } else if (content.type === "input_audio" && content.transcript) {
            console.log("🎤 User audio transcript:", content.transcript);
            this.events.onTranscript(content.transcript, true);
          }
        }
      } else if (messageItem.role === "assistant" && messageItem.content) {
        // Assistant response
        for (const content of messageItem.content) {
          if (content.type === "text" && content.text) {
            console.log("🤖 Assistant response:", content.text);
            this.events.onResponse(content.text);
          }
        }
      }
    }
  }

  private updateStatus(status: typeof this.currentStatus): void {
    if (this.currentStatus !== status) {
      this.currentStatus = status;
      this.events.onStatusChange(status);
    }
  }

  async connect(): Promise<void> {
    try {
      this.updateStatus("connecting");

      // Generate ephemeral token for browser connection
      const ephemeralToken = await this.tokenService.generateEphemeralToken(
        this.config.model || "gpt-4o-realtime-preview-2024-10-01"
      );

      await this.session.connect({
        apiKey: ephemeralToken,
        model: this.config.model || "gpt-4o-realtime-preview-2024-10-01",
      });

      console.log("🚀 Realtime voice session connected");
    } catch (error) {
      console.error("Failed to connect to realtime session:", error);
      this.events.onError(
        error instanceof Error ? error.message : "Failed to connect"
      );
      this.updateStatus("disconnected");
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    try {
      if (this.isConnected) {
        console.log("🛑 Starting realtime session disconnect...");

        // First disconnect the session transport cleanly
        if (this.session.transport) {
          try {
            const transport = this.session.transport as unknown as {
              disconnect?: () => Promise<void>;
              close?: () => void;
              connection?: RTCPeerConnection;
              pc?: RTCPeerConnection;
            };

            // Close WebRTC peer connection if it exists
            const pc = transport.connection || transport.pc;
            if (pc && pc.connectionState !== "closed") {
              console.log("🛑 Closing WebRTC peer connection...");
              pc.close();
            }

            // Disconnect transport
            if (transport.disconnect) {
              console.log("🛑 Calling transport disconnect...");
              await transport.disconnect();
            } else if (transport.close) {
              console.log("🛑 Calling transport close...");
              transport.close();
            }
          } catch (error) {
            console.warn("Transport disconnect failed:", error);
          }
        }

        // Update internal state
        this.isConnected = false;
        this.updateStatus("disconnected");

        // Clear processed items to prevent issues on reconnect
        this.processedItemIds.clear();
        this.currentResponseText = "";

        // Simple microphone cleanup - just stop any global streams
        this.stopGlobalStreams();

        console.log("✅ Realtime session disconnected");
      }
    } catch (error) {
      console.error("Error disconnecting session:", error);
      this.events.onError(
        error instanceof Error ? error.message : "Failed to disconnect"
      );
    }
  }

  private stopGlobalStreams(): void {
    if (typeof window === "undefined") return;

    try {
      console.log("🛑 Cleaning up global streams...");

      // Check common global stream storage locations
      const globalWindow = window as unknown as Record<string, unknown>;

      const possibleStreamLocations = [
        "localStream",
        "mediaStream",
        "realtimeStream",
        "webkitMediaStream",
        "mozMediaStream",
        "userMediaStream",
        "audioStream",
        "micStream",
        "openaiStream",
        "realtimeAudioStream",
      ];

      possibleStreamLocations.forEach((location) => {
        const stream = globalWindow[location] as MediaStream | undefined;
        if (stream && typeof stream.getTracks === "function") {
          console.log(`🛑 Stopping global stream: ${location}`);
          stream.getTracks().forEach((track: MediaStreamTrack) => {
            track.stop();
          });
          globalWindow[location] = null;
        }
      });

      // Remove any audio elements with streams
      const audioElements = document.querySelectorAll("audio");
      audioElements.forEach((audio) => {
        if (audio.srcObject) {
          console.log("🛑 Clearing audio element stream");
          const stream = audio.srcObject as MediaStream;
          stream.getTracks().forEach((track) => track.stop());
          audio.srcObject = null;
        }
      });

      console.log("✅ Global stream cleanup completed");
    } catch (error) {
      console.warn("Error during global stream cleanup:", error);
    }
  }

  // Send text message (for typing while in voice mode)
  sendTextMessage(text: string): void {
    if (!this.isConnected) {
      this.events.onError("Not connected to voice session");
      return;
    }

    try {
      this.session.sendMessage(text);
      console.log("💬 Sent text message:", text);
    } catch (error) {
      console.error("Error sending text message:", error);
      this.events.onError(
        error instanceof Error ? error.message : "Failed to send message"
      );
    }
  }

  // Manual interruption (stop button)
  interrupt(): void {
    if (!this.isConnected) return;

    try {
      this.session.interrupt();
      console.log("✋ Manually interrupted");
    } catch (error) {
      console.error("Error interrupting session:", error);
    }
  }

  // Get conversation history
  getHistory(): RealtimeItem[] {
    return this.session.history || [];
  }

  // Update conversation history if needed
  updateHistory(updater: (history: RealtimeItem[]) => RealtimeItem[]): void {
    if (!this.isConnected) return;

    try {
      this.session.updateHistory(updater);
    } catch (error) {
      console.error("Error updating history:", error);
    }
  }

  // Get current status
  getStatus(): typeof this.currentStatus {
    return this.currentStatus;
  }

  // Check if connected
  isSessionConnected(): boolean {
    return this.isConnected;
  }
}
