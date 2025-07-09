"use client";

import { useState, useCallback, useMemo } from "react";
import { OpenRouterService } from "@/lib/openrouter-service";
import { OpenAIService } from "@/lib/openai-service";
import { OpenRouterMessage } from "@/lib/openrouter";
import { OpenAIMessage } from "@/lib/openai";

export type AIProvider = "OpenRouter" | "OpenAI";
export type AIMessage = OpenRouterMessage | OpenAIMessage;

export const useAI = (provider: AIProvider, apiKey?: string) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const service = useMemo(() => {
    if (!apiKey) return null;

    switch (provider) {
      case "OpenRouter":
        return new OpenRouterService(apiKey);
      case "OpenAI":
        return new OpenAIService(apiKey);
      default:
        return null;
    }
  }, [provider, apiKey]);

  const sendMessage = useCallback(
    async (
      messages: AIMessage[],
      options: {
        model: string;
        temperature?: number;
      }
    ): Promise<string | null> => {
      if (!service) {
        setError(`${provider} API key not provided`);
        return null;
      }

      if (!options.model || options.model.trim() === "") {
        setError("No model specified. Please configure a model in settings.");
        return null;
      }

      setIsGenerating(true);
      setError(null);

      try {
        const response = await service.sendMessage(messages, options.model, {
          temperature: options?.temperature,
        });
        return response;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Unknown error occurred";
        setError(errorMessage);
        return null;
      } finally {
        setIsGenerating(false);
      }
    },
    [service, provider]
  );

  const sendMessageStream = useCallback(
    async (
      messages: AIMessage[],
      onChunk: (chunk: string) => void,
      options: {
        model: string;
        temperature?: number;
      }
    ): Promise<void> => {
      if (!service) {
        setError(`${provider} API key not provided`);
        return;
      }

      if (!options.model || options.model.trim() === "") {
        setError("No model specified. Please configure a model in settings.");
        return;
      }

      setIsGenerating(true);
      setError(null);

      try {
        await service.sendMessageStream(messages, options.model, onChunk, {
          temperature: options?.temperature,
        });
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Unknown error occurred";
        setError(errorMessage);
      } finally {
        setIsGenerating(false);
      }
    },
    [service, provider]
  );

  return {
    sendMessage,
    sendMessageStream,
    isGenerating,
    error,
    clearError: () => setError(null),
  };
};
