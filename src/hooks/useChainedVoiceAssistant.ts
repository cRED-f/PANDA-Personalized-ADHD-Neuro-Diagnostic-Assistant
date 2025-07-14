"use client";

import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { useMutation, useQuery, useConvex } from "convex/react";
import { api } from "../../convex/_generated/api";
import {
  ChainedVoiceAssistant,
  ChainedVoiceConfig,
} from "../lib/chained-voice-assistant";

export interface ChainedVoiceAssistantState {
  isSessionActive: boolean;
  isLoadingSettings: boolean;
  status:
    | "idle"
    | "recording"
    | "transcribing"
    | "thinking"
    | "speaking"
    | "error";
  transcript: string;
  response: string;
  error: string | null;
  isRecording: boolean;
  currentSessionId: string | null;
}

export interface ChainedVoiceAssistantActions {
  startSession: (existingSessionId?: string) => Promise<void>;
  endSession: () => Promise<void>;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<void>;
  clearError: () => void;
}

export const useChainedVoiceAssistant = (): ChainedVoiceAssistantState &
  ChainedVoiceAssistantActions => {
  const [state, setState] = useState<ChainedVoiceAssistantState>({
    isSessionActive: false,
    isLoadingSettings: true,
    status: "idle",
    transcript: "",
    response: "",
    error: null,
    isRecording: false,
    currentSessionId: null,
  });

  const currentSessionIdRef = useRef<string | null>(null);
  const voiceAssistantRef = useRef<ChainedVoiceAssistant | null>(null);

  // Convex client for direct API calls
  const convex = useConvex();

  // Queries
  const settings = useQuery(api.settings.getApiSettings);

  // Mutations
  const createVoiceChat = useMutation(api.voiceChats.createVoiceChat);
  const addVoiceMessage = useMutation(api.voiceChats.addVoiceMessage);

  // Check if settings are loaded
  useEffect(() => {
    if (settings !== undefined) {
      setState((prev) => ({ ...prev, isLoadingSettings: false }));
    }
  }, [settings]);

  // Event handlers for voice assistant
  const eventsHandler = useMemo(
    () => ({
      onTranscript: (text: string, isFinal: boolean) => {
        setState((prev) => ({ ...prev, transcript: text }));

        if (isFinal && currentSessionIdRef.current) {
          // Save user message to voice chat
          addVoiceMessage({
            sessionId: currentSessionIdRef.current,
            messageId: `msg_${Date.now()}_user`,
            role: "user",
            content: text,
            transcription: text,
          }).catch((error) => {
            console.error("Failed to save user message:", error);
          });
        }
      },

      onResponse: () => {
        // Don't update state or save to DB yet - wait for onResponseComplete
        // This event can be used for internal processing if needed
      },

      onResponseComplete: (text: string) => {
        // Now update state and save to DB after audio has finished playing
        setState((prev) => ({ ...prev, response: text }));

        if (currentSessionIdRef.current) {
          // Save assistant message to voice chat
          addVoiceMessage({
            sessionId: currentSessionIdRef.current,
            messageId: `msg_${Date.now()}_assistant`,
            role: "assistant",
            content: text,
          }).catch((error) => {
            console.error("Failed to save assistant message:", error);
          });
        }
      },

      onError: (error: string) => {
        console.error("Voice assistant error:", error);
        setState((prev) => ({ ...prev, error, status: "error" }));
      },

      onStatusChange: (status: ChainedVoiceAssistantState["status"]) => {
        setState((prev) => ({
          ...prev,
          status,
          isRecording: status === "recording",
        }));
      },

      onAudioReady: () => {
        // Audio ready for playback
      },
    }),
    [addVoiceMessage]
  );

  // Get conversation history function - directly fetch from database
  const getConversationHistory = useCallback(async () => {
    if (!currentSessionIdRef.current) {
      return [];
    }

    try {
      // Use Convex client to call the query function
      const messages = await convex.query(api.voiceChats.getVoiceMessages, {
        sessionId: currentSessionIdRef.current,
      });

      if (!messages || !Array.isArray(messages)) {
        return [];
      }

      const history = messages
        .sort((a, b) => a.timestamp - b.timestamp)
        .map((msg) => ({
          role:
            msg.role === "assistant"
              ? ("assistant" as const)
              : ("user" as const),
          content: msg.content,
        }));

      return history;
    } catch (error) {
      console.error("Failed to get conversation history:", error);
      return [];
    }
  }, [convex]);

  // Stable function to start session
  const startSession = useCallback(
    async (existingSessionId?: string) => {
      try {
        if (state.isSessionActive) {
          return;
        }

        if (!settings?.apiKey) {
          throw new Error("No API key found. Please configure your settings.");
        }

        let sessionId = existingSessionId;

        if (!sessionId) {
          // Create a unique session ID
          sessionId = `voice_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

          // Create a voice chat for this session
          await createVoiceChat({
            title: `Voice Chat ${new Date().toLocaleString()}`,
            sessionId: sessionId,
          });
        }

        currentSessionIdRef.current = sessionId;

        // Create voice assistant config
        const config: ChainedVoiceConfig = {
          apiKey: settings.apiKey,
          model: settings.modelName || "gpt-4.1",
          temperature: settings.temperature || 0.7,
          getConversationHistory,
        };

        // Create voice assistant instance
        voiceAssistantRef.current = new ChainedVoiceAssistant(
          config,
          eventsHandler
        );

        setState((prev) => ({
          ...prev,
          isSessionActive: true,
          error: null,
          status: "idle",
          currentSessionId: sessionId,
        }));
      } catch (error) {
        console.error("Failed to start voice session:", error);
        setState((prev) => ({
          ...prev,
          error:
            error instanceof Error ? error.message : "Failed to start session",
          status: "error",
        }));
      }
    },
    [
      state.isSessionActive,
      settings,
      getConversationHistory,
      eventsHandler,
      createVoiceChat,
    ]
  );

  // Stable function to end session
  const endSession = useCallback(async () => {
    try {
      if (voiceAssistantRef.current) {
        await voiceAssistantRef.current.cleanup();
        voiceAssistantRef.current = null;
      }

      currentSessionIdRef.current = null;

      setState((prev) => ({
        ...prev,
        isSessionActive: false,
        currentSessionId: null,
        status: "idle",
        transcript: "",
        response: "",
        error: null,
        isRecording: false,
      }));
    } catch (error) {
      console.error("Failed to end voice session:", error);
      setState((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : "Failed to end session",
      }));
    }
  }, []);

  // Start recording
  const startRecording = useCallback(async () => {
    if (!voiceAssistantRef.current) {
      console.warn("Voice assistant not initialized");
      return;
    }

    try {
      await voiceAssistantRef.current.startRecording();
    } catch (error) {
      console.error("Failed to start recording:", error);
      setState((prev) => ({
        ...prev,
        error:
          error instanceof Error ? error.message : "Failed to start recording",
      }));
    }
  }, []);

  // Stop recording
  const stopRecording = useCallback(async () => {
    if (!voiceAssistantRef.current) {
      console.warn("Voice assistant not initialized");
      return;
    }

    try {
      await voiceAssistantRef.current.stopRecording();
    } catch (error) {
      console.error("Failed to stop recording:", error);
      setState((prev) => ({
        ...prev,
        error:
          error instanceof Error ? error.message : "Failed to stop recording",
      }));
    }
  }, []);

  // Clear error and reset to idle state
  const clearError = useCallback(() => {
    // Reset the voice assistant from error state
    if (voiceAssistantRef.current) {
      voiceAssistantRef.current.resetFromError();
    }

    setState((prev) => ({
      ...prev,
      error: null,
      status: "idle",
      transcript: "",
      response: "",
    }));
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (voiceAssistantRef.current) {
        voiceAssistantRef.current.cleanup().catch(console.error);
      }
    };
  }, []);

  return {
    ...state,
    startSession,
    endSession,
    startRecording,
    stopRecording,
    clearError,
  };
};
