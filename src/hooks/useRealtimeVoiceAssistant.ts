"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import {
  RealtimeVoiceAssistant,
  RealtimeVoiceConfig,
  VoiceSessionEvents,
} from "../lib/realtime-voice-assistant";
import { Id } from "../../convex/_generated/dataModel";
import type { RealtimeItem } from "@openai/agents/realtime";

export interface RealtimeVoiceAssistantState {
  isSessionActive: boolean;
  isLoadingSettings: boolean;
  status:
    | "connecting"
    | "connected"
    | "disconnected"
    | "listening"
    | "speaking"
    | "thinking";
  currentSessionId: Id<"voiceSessions"> | null;
  transcript: string;
  response: string;
  history: RealtimeItem[];
  error: string | null;
}

export interface RealtimeVoiceAssistantActions {
  startSession: () => Promise<void>;
  endSession: () => Promise<void>;
  sendTextMessage: (text: string) => void;
  interrupt: () => void;
}

// Global session tracking to prevent multiple sessions
let globalSessionActive = false;

export const useRealtimeVoiceAssistant = (): RealtimeVoiceAssistantState &
  RealtimeVoiceAssistantActions => {
  const [state, setState] = useState<RealtimeVoiceAssistantState>({
    isSessionActive: false,
    isLoadingSettings: true, // Start as loading
    status: "disconnected",
    currentSessionId: null,
    transcript: "",
    response: "",
    history: [],
    error: null,
  });

  const voiceAssistantRef = useRef<RealtimeVoiceAssistant | null>(null);
  const currentSessionStringId = useRef<string | null>(null);

  // Get settings from database
  const settings = useQuery(api.settings.getApiSettings);

  // Convex mutations
  const createSession = useMutation(api.voiceSessions.createVoiceSession);
  const updateSession = useMutation(api.voiceSessions.updateVoiceSession);
  const addMessage = useMutation(api.voiceSessions.addVoiceMessage);

  // Save message to database
  const saveMessage = useCallback(
    async (role: "user" | "assistant", content: string, audioUrl?: string) => {
      if (!currentSessionStringId.current) return;

      try {
        await addMessage({
          sessionId: currentSessionStringId.current,
          messageId: `msg_${Date.now()}_${role}`,
          role,
          content,
          audioUrl,
        });
      } catch (error) {
        console.error("Failed to save message:", error);
      }
    },
    [addMessage]
  );

  // Create voice session events handler
  const createEventsHandler = useCallback(
    (): VoiceSessionEvents => ({
      onTranscript: (text: string, isFinal: boolean) => {
        if (isFinal) {
          console.log("📝 Final transcript received:", text);
          setState((prev) => ({ ...prev, transcript: text }));
          // Save user message to database
          saveMessage("user", text);
        }
      },
      onResponse: (text: string, audioUrl?: string) => {
        console.log("🤖 Response received in hook:", text);
        console.log("💾 Attempting to save assistant message...");
        setState((prev) => ({ ...prev, response: text }));
        // Save assistant message to database
        saveMessage("assistant", text, audioUrl)
          .then(() => {
            console.log("✅ Assistant message saved successfully");
          })
          .catch((error) => {
            console.error("❌ Failed to save assistant message:", error);
          });
      },
      onError: (error: string) => {
        setState((prev) => ({ ...prev, error }));
      },
      onStatusChange: (status) => {
        setState((prev) => ({ ...prev, status }));
      },
      onHistoryUpdate: (history: RealtimeItem[]) => {
        // Only update the history in state, don't process individual items here
        // Individual items are processed by the RealtimeVoiceAssistant class
        setState((prev) => ({ ...prev, history }));
      },
    }),
    [saveMessage]
  );

  const startSession = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, error: null }));

      // Prevent multiple sessions from starting
      if (
        state.isSessionActive ||
        voiceAssistantRef.current ||
        globalSessionActive
      ) {
        console.log("⚠️ Session already active, ignoring start request");
        return;
      }

      // Mark global session as starting to prevent race conditions
      globalSessionActive = true;

      console.log("🔍 Settings check:", {
        settings,
        isUndefined: settings === undefined,
        isNull: settings === null,
        hasApiKey: settings?.apiKey ? "YES" : "NO",
      });

      // Check if settings are still loading
      if (settings === undefined) {
        console.log("⏳ Settings still loading, waiting...");
        setState((prev) => ({
          ...prev,
          error: "Connecting to database... Please wait a moment.",
        }));
        return;
      }

      // Check if no settings record exists
      if (settings === null) {
        setState((prev) => ({
          ...prev,
          error:
            "No settings found. Please click the ⚙️ icon to configure your OpenAI API key first.",
        }));
        return;
      }

      // Check if API key exists
      if (!settings.apiKey || settings.apiKey.trim() === "") {
        setState((prev) => ({
          ...prev,
          error:
            "OpenAI API key is empty. Please configure it in settings (⚙️ icon).",
        }));
        return;
      }

      // Generate a unique session ID string
      const sessionIdString = `session_${Date.now()}`;
      currentSessionStringId.current = sessionIdString;

      // Create new session in database
      const sessionId = await createSession({
        sessionId: sessionIdString,
        title: `Voice Session ${new Date().toLocaleString()}`,
      });

      // Create realtime voice assistant configuration
      const config: RealtimeVoiceConfig = {
        apiKey: settings.apiKey,
        model: "gpt-4o-realtime-preview-2024-10-01",
        voice: "alloy",
        temperature: settings.temperature || 0.7,
      };

      // Create events handler
      const eventsHandler = createEventsHandler();

      // Create and connect voice assistant
      const assistant = new RealtimeVoiceAssistant(config, eventsHandler);
      voiceAssistantRef.current = assistant;

      // Connect to the real-time session
      await assistant.connect();

      setState((prev) => ({
        ...prev,
        isSessionActive: true,
        currentSessionId: sessionId,
        status: "connected",
      }));

      globalSessionActive = true; // Mark global session as active

      console.log("✅ Real-time voice session started successfully");
    } catch (error) {
      console.error("❌ Failed to start real-time session:", error);

      // Clear global flag on error
      globalSessionActive = false;

      // Clean up assistant reference
      if (voiceAssistantRef.current) {
        voiceAssistantRef.current.disconnect().catch(console.error);
        voiceAssistantRef.current = null;
      }

      setState((prev) => ({
        ...prev,
        error:
          error instanceof Error ? error.message : "Failed to start session",
      }));
    }
  }, [settings, createSession, createEventsHandler, state.isSessionActive]);

  const endSession = useCallback(async () => {
    try {
      console.log("🛑 Ending voice session...");

      // Clear global session flag immediately to prevent race conditions
      globalSessionActive = false;

      // Disconnect the voice assistant first (it has its own mic cleanup)
      if (voiceAssistantRef.current) {
        await voiceAssistantRef.current.disconnect();
        voiceAssistantRef.current = null;
        console.log("✅ Voice assistant disconnected");
      }

      // Update session status in database
      if (currentSessionStringId.current) {
        await updateSession({
          sessionId: currentSessionStringId.current,
          updates: {
            status: "completed",
            endTime: Date.now(),
          },
        });
      }

      // Update state
      setState((prev) => ({
        ...prev,
        isSessionActive: false,
        status: "disconnected",
        currentSessionId: null,
        transcript: "",
        response: "",
        history: [],
        error: null,
      }));

      // Clear session ID
      currentSessionStringId.current = null;

      console.log("✅ Real-time voice session ended successfully");
    } catch (error) {
      console.error("❌ Failed to end session:", error);

      // Even if there's an error, clear the global session flag
      globalSessionActive = false;

      setState((prev) => ({
        ...prev,
        error: "Failed to end session",
      }));
    }
  }, [updateSession]);

  const sendTextMessage = useCallback((text: string) => {
    if (!voiceAssistantRef.current) {
      setState((prev) => ({
        ...prev,
        error: "Voice assistant not initialized",
      }));
      return;
    }

    voiceAssistantRef.current.sendTextMessage(text);
  }, []);

  const interrupt = useCallback(() => {
    if (!voiceAssistantRef.current) return;
    voiceAssistantRef.current.interrupt();
  }, []);

  // Debug settings loading
  useEffect(() => {
    console.log("📊 Settings state:", {
      settings,
      isLoading: settings === undefined,
      timestamp: new Date().toISOString(),
    });

    // Update loading state when settings change
    setState((prev) => ({
      ...prev,
      isLoadingSettings: settings === undefined,
    }));
  }, [settings]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      console.log("🧹 Component unmounting, cleaning up voice assistant...");

      // Force cleanup - don't wait for async operations
      if (voiceAssistantRef.current) {
        voiceAssistantRef.current.disconnect().catch(console.error);
        voiceAssistantRef.current = null;
      }

      // Clear global session flag on unmount
      globalSessionActive = false;

      // Simple global stream cleanup on unmount
      try {
        if (typeof window !== "undefined") {
          const globalWindow = window as unknown as Record<string, unknown>;
          const streamKeys = [
            "localStream",
            "mediaStream",
            "realtimeStream",
            "audioStream",
          ];

          streamKeys.forEach((key) => {
            const stream = globalWindow[key] as MediaStream | undefined;
            if (stream && typeof stream.getTracks === "function") {
              console.log(`🧹 Cleanup: stopping ${key}`);
              stream
                .getTracks()
                .forEach((track: MediaStreamTrack) => track.stop());
              globalWindow[key] = null;
            }
          });
        }
      } catch (error) {
        console.warn("Error during unmount cleanup:", error);
      }
    };
  }, []);

  // Cleanup if settings change while session is active
  useEffect(() => {
    if (state.isSessionActive && !settings?.apiKey) {
      console.log("🧹 API key removed, ending session...");
      endSession();
    }
  }, [settings?.apiKey, state.isSessionActive, endSession]);

  return {
    ...state,
    startSession,
    endSession,
    sendTextMessage,
    interrupt,
  };
};
