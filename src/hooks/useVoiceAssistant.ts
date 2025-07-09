"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import {
  RealtimeVoiceAssistant,
  RealtimeVoiceConfig,
} from "../lib/realtime-voice-assistant";
import type { RealtimeItem } from "@openai/agents/realtime";
import { Id } from "../../convex/_generated/dataModel";

export interface VoiceAssistantState {
  isSessionActive: boolean;
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
  error: string | null;
  history: RealtimeItem[];
}

export interface VoiceAssistantActions {
  startSession: () => Promise<void>;
  endSession: () => Promise<void>;
  sendTextMessage: (text: string) => void;
  interrupt: () => void;
}

export const useVoiceAssistant = (): VoiceAssistantState &
  VoiceAssistantActions => {
  const [state, setState] = useState<VoiceAssistantState>({
    isSessionActive: false,
    status: "disconnected",
    currentSessionId: null,
    transcript: "",
    response: "",
    error: null,
    history: [],
  });

  const voiceAssistantRef = useRef<RealtimeVoiceAssistant | null>(null);
  const currentSessionStringId = useRef<string | null>(null);

  // Get settings from database
  const settings = useQuery(api.settings.getApiSettings);
  const debugInfo = useQuery(api.debug.debugDatabase);

  // Convex mutations
  const createSession = useMutation(api.voiceSessions.createVoiceSession);
  const updateSession = useMutation(api.voiceSessions.updateVoiceSession);
  const addMessage = useMutation(api.voiceSessions.addVoiceMessage);

  // Debug settings loading
  useEffect(() => {
    console.log("🔍 Settings loading state:", {
      settings,
      debugInfo,
      isSettingsUndefined: settings === undefined,
      isSettingsNull: settings === null,
      hasApiKey: settings?.apiKey ? "YES" : "NO",
      apiKeyLength: settings?.apiKey?.length || 0,
    });
  }, [settings, debugInfo]);

  // Save conversation history to database
  const saveHistoryToDatabase = useCallback(
    async (history: RealtimeItem[]) => {
      if (!currentSessionStringId.current) return;

      try {
        // Find new messages that haven't been saved yet
        for (const item of history) {
          if (item.type === "message" && item.content) {
            for (const content of item.content) {
              if (content.type === "input_text" || content.type === "text") {
                const messageContent =
                  content.type === "input_text" ? content.text : content.text;
                const messageRole = item.role === "user" ? "user" : "assistant";

                // Create unique message ID based on content and timestamp
                const messageId = `msg_${Date.now()}_${messageRole}_${messageContent.substring(0, 10)}`;

                await addMessage({
                  sessionId: currentSessionStringId.current,
                  messageId,
                  role: messageRole,
                  content: messageContent,
                });
              }
            }
          }
        }
      } catch (error) {
        console.error("Error saving history to database:", error);
      }
    },
    [addMessage]
  );

  const startSession = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, error: null }));

      console.log("🔍 Starting session with settings:", {
        settings,
        debugInfo,
        isLoading: settings === undefined,
      });

      // Check if settings are still loading
      if (settings === undefined) {
        console.log("⏳ Settings query returned undefined");
        setState((prev) => ({
          ...prev,
          error:
            "Loading settings... Make sure Convex is running (npx convex dev).",
        }));
        return;
      }

      // Check if no settings record exists
      if (settings === null) {
        console.log("⚠️ No settings found in database");
        setState((prev) => ({
          ...prev,
          error:
            "No API settings found. Please click the gear icon (⚙️) to configure your OpenAI API key first.",
        }));
        return;
      }

      // Check if API key exists
      if (!settings.apiKey || settings.apiKey.trim() === "") {
        console.log("⚠️ No API key configured");
        setState((prev) => ({
          ...prev,
          error:
            "OpenAI API key is missing. Please configure it in settings (⚙️ icon).",
        }));
        return;
      }

      // Generate session ID
      const sessionIdString = `session_${Date.now()}`;
      currentSessionStringId.current = sessionIdString;

      // Create session in database
      const sessionId = await createSession({
        sessionId: sessionIdString,
        title: `Voice Session ${new Date().toLocaleString()}`,
      });

      // Create voice assistant configuration
      const config: RealtimeVoiceConfig = {
        apiKey: settings.apiKey,
        model: settings.modelName || "gpt-4o-realtime-preview-2024-10-01",
        voice: "alloy",
        temperature: settings.temperature || 0.7,
      };

      // Create voice assistant instance
      voiceAssistantRef.current = new RealtimeVoiceAssistant(config, {
        onTranscript: (text: string) => {
          setState((prev) => ({ ...prev, transcript: text }));
        },
        onResponse: (text: string) => {
          setState((prev) => ({ ...prev, response: text }));
        },
        onError: (error: string) => {
          setState((prev) => ({ ...prev, error }));
        },
        onStatusChange: (status) => {
          setState((prev) => ({ ...prev, status }));
        },
        onHistoryUpdate: (history: RealtimeItem[]) => {
          setState((prev) => ({ ...prev, history }));

          // Save messages to database
          if (currentSessionStringId.current) {
            saveHistoryToDatabase(history);
          }
        },
      });

      // Connect to OpenAI Realtime API
      await voiceAssistantRef.current.connect();

      setState((prev) => ({
        ...prev,
        isSessionActive: true,
        currentSessionId: sessionId,
        status: "connected",
      }));

      console.log("✅ Voice session started successfully");
    } catch (error) {
      console.error("❌ Failed to start voice session:", error);
      setState((prev) => ({
        ...prev,
        error:
          error instanceof Error
            ? error.message
            : "Failed to start voice session",
      }));
    }
  }, [settings, debugInfo, createSession, saveHistoryToDatabase]);

  const endSession = useCallback(async () => {
    try {
      // Disconnect voice assistant
      if (voiceAssistantRef.current) {
        await voiceAssistantRef.current.disconnect();
        voiceAssistantRef.current = null;
      }

      // Update session in database
      if (currentSessionStringId.current) {
        await updateSession({
          sessionId: currentSessionStringId.current,
          updates: {
            status: "completed",
            endTime: Date.now(),
          },
        });
      }

      // Reset state
      setState((prev) => ({
        ...prev,
        isSessionActive: false,
        status: "disconnected",
        currentSessionId: null,
        transcript: "",
        response: "",
        error: null,
        history: [],
      }));

      currentSessionStringId.current = null;
      console.log("👋 Voice session ended");
    } catch (error) {
      console.error("❌ Failed to end session:", error);
      setState((prev) => ({
        ...prev,
        error: "Failed to end session",
      }));
    }
  }, [updateSession]);

  const sendTextMessage = useCallback((text: string) => {
    if (voiceAssistantRef.current) {
      voiceAssistantRef.current.sendTextMessage(text);
    } else {
      setState((prev) => ({ ...prev, error: "Voice session not active" }));
    }
  }, []);

  const interrupt = useCallback(() => {
    if (voiceAssistantRef.current) {
      voiceAssistantRef.current.interrupt();
    }
  }, []);

  return {
    ...state,
    startSession,
    endSession,
    sendTextMessage,
    interrupt,
  };
};
