import { useState, useCallback, useMemo } from "react";
import {
  AssistantAnalysisService,
  ConversationMessage,
  AnalysisConfig,
} from "@/lib/assistant-analysis-service";

export interface UseAssistantAnalysisReturn {
  analyzeConversation: (
    conversationHistory: ConversationMessage[],
    assistantPrompt: string,
    config?: AnalysisConfig
  ) => Promise<string | null>;
  isAnalyzing: boolean;
  analysisError: string | null;
}

export const useAssistantAnalysis = (
  apiKey?: string
): UseAssistantAnalysisReturn => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  const assistantService = useMemo(() => {
    if (!apiKey) return null;
    return new AssistantAnalysisService(apiKey);
  }, [apiKey]);

  const analyzeConversation = useCallback(
    async (
      conversationHistory: ConversationMessage[],
      assistantPrompt: string,
      config?: AnalysisConfig
    ): Promise<string | null> => {
      if (!assistantService) {
        const error =
          "Assistant analysis service not available - API key missing";
        console.error("❌ Assistant analysis error:", error);
        setAnalysisError(error);
        return null;
      }

      setIsAnalyzing(true);
      setAnalysisError(null);

      try {
        console.log("🤖 ASSISTANT MODEL: Initiating analysis...");
        const result = await assistantService.analyzeConversation(
          conversationHistory,
          assistantPrompt,
          config
        );

        if (result) {
          console.log("✅ Assistant analysis completed successfully", result);
        } else {
          console.log("⚠️ Assistant analysis returned no result");
        }

        return result;
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : "Unknown assistant analysis error";
        console.error("❌ Assistant analysis failed:", errorMessage);
        setAnalysisError(errorMessage);
        return null;
      } finally {
        setIsAnalyzing(false);
      }
    },
    [assistantService]
  );

  return {
    analyzeConversation,
    isAnalyzing,
    analysisError,
  };
};
