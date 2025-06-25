"use client";

import { useState, useCallback, useMemo } from "react";
import { OpenRouterService } from "@/lib/openrouter-service";
import { OpenRouterMessage } from "@/lib/openrouter";

export const useOpenRouter = (apiKey?: string) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const service = useMemo(() => {
    return apiKey ? new OpenRouterService(apiKey) : null;
  }, [apiKey]);
  const sendMessage = useCallback(
    async (
      messages: OpenRouterMessage[],
      options: {
        model: string;
        temperature?: number;
      }
    ): Promise<string | null> => {
      if (!service) {
        setError("OpenRouter API key not provided");
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
    [service]
  );
  const sendMessageStream = useCallback(
    async (
      messages: OpenRouterMessage[],
      onChunk: (chunk: string) => void,
      options: {
        model: string;
        temperature?: number;
      }
    ): Promise<void> => {
      if (!service) {
        setError("OpenRouter API key not provided");
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
    [service]
  );

  return {
    sendMessage,
    sendMessageStream,
    isGenerating,
    error,
    clearError: () => setError(null),
  };
};
