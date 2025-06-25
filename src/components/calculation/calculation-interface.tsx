"use client";

import { FC, useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import {
  IconCalculator,
  IconX,
  IconMessageCircle,
  IconCheck,
  IconTrash,
} from "@tabler/icons-react";
import { useOpenRouter } from "@/hooks/useOpenRouter";
import { OpenRouterMessage } from "@/lib/openrouter";

interface CalculationInterfaceProps {
  selectedChatId?: string | null;
}

export const CalculationInterface: FC<CalculationInterfaceProps> = ({
  selectedChatId,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [selectedPrompt, setSelectedPrompt] = useState<string | null>(null);
  const [analysisStarted, setAnalysisStarted] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  // Get calculate-main-model prompts
  const allPrompts = useQuery(api.prompts.getPrompts) || [];
  const calculatePrompts = allPrompts.filter(
    (prompt) => prompt.targetModel === "calculate-main-model"
  );

  // Get the selected chat data
  const chats = useQuery(api.messages.getChats) || [];
  const selectedChat = chats.find((chat) => chat._id === selectedChatId);

  // Get conversation history (excluding assistant/mentor messages)
  const conversationHistory = useQuery(
    api.messages.getConversationHistory,
    selectedChatId ? { chatId: selectedChatId } : "skip"
  );

  // Get calculation settings
  const calculationSettings = useQuery(
    api.calculationSettings.getCalculationSettings
  );
  // Get API settings for OpenRouter
  const apiSettings = useQuery(api.settings.getApiSettings);

  // Get existing analysis for this chat
  const existingAnalysis = useQuery(
    api.analyses.getChatAnalysis,
    selectedChatId ? { chatId: selectedChatId } : "skip"
  );

  // Mutations for saving and deleting analysis
  const saveAnalysis = useMutation(api.analyses.saveAnalysis);
  const deleteAnalysis = useMutation(api.analyses.deleteAnalysis);

  // Initialize OpenRouter hook
  const {
    sendMessage: sendToOpenRouter,
    isGenerating,
    error: openRouterError,
  } = useOpenRouter(apiSettings?.apiKey);
  // Reset analysis state when chat changes or load existing analysis
  useEffect(() => {
    if (existingAnalysis) {
      // Load existing analysis
      setAnalysisStarted(true);
      setAnalysisResult(existingAnalysis.result);
      setSelectedPrompt(existingAnalysis.promptId);
      setIsAnalyzing(false);
      setAnalysisError(null);
    } else {
      // Reset state for new chat or no existing analysis
      setAnalysisStarted(false);
      setAnalysisResult(null);
      setAnalysisError(null);
      setSelectedPrompt(null);
      setIsAnalyzing(false);
    }
  }, [selectedChatId, existingAnalysis]);

  const handleStartAnalysis = () => {
    setShowModal(true);
  };
  const handleCloseModal = () => {
    setShowModal(false);
  };

  const handleDeleteAndRestart = async () => {
    if (selectedChatId) {
      try {
        await deleteAnalysis({ chatId: selectedChatId });
        // Reset all state
        setAnalysisStarted(false);
        setAnalysisResult(null);
        setAnalysisError(null);
        setSelectedPrompt(null);
        setIsAnalyzing(false);
      } catch (error) {
        console.error("Error deleting analysis:", error);
        setAnalysisError("Failed to delete analysis");
      }
    }
  };

  const handlePromptSelect = async (
    promptId: string,
    promptContent: string
  ) => {
    setSelectedPrompt(promptId);
    setAnalysisStarted(true);
    setIsAnalyzing(true);
    setAnalysisError(null);
    setShowModal(false);

    try {
      // Check if we have all required data
      if (!conversationHistory || conversationHistory.length === 0) {
        throw new Error("No conversation history found for this chat");
      }

      if (!calculationSettings) {
        throw new Error(
          "Calculation settings not configured. Please set up the model and temperature in calculation settings."
        );
      }

      if (!calculationSettings.modelName) {
        throw new Error("No model specified in calculation settings");
      }

      if (!apiSettings?.apiKey) {
        throw new Error(
          "OpenRouter API key not configured. Please set up your API key in settings."
        );
      }

      // Get the prompt name for saving
      const selectedPromptData = calculatePrompts.find(
        (p) => p._id === promptId
      );
      const promptName = selectedPromptData?.name || "Unknown Prompt";

      // Convert conversation history to OpenRouter format
      const messages: OpenRouterMessage[] = [
        {
          role: "system",
          content: promptContent,
        },
        ...conversationHistory.map(
          (msg) =>
            ({
              role: msg.role === "ai" ? "assistant" : msg.role,
              content: msg.content,
            }) as OpenRouterMessage
        ),
      ];

      // Send to OpenRouter with calculation settings
      const result = await sendToOpenRouter(messages, {
        model: calculationSettings.modelName,
        temperature: calculationSettings.temperature,
      });

      if (result) {
        setAnalysisResult(result);

        // Save analysis to database
        if (selectedChatId) {
          await saveAnalysis({
            chatId: selectedChatId,
            promptId: promptId,
            promptName: promptName,
            promptContent: promptContent,
            modelName: calculationSettings.modelName,
            temperature: calculationSettings.temperature,
            result: result,
          });
        }
      } else {
        throw new Error(
          openRouterError || "Analysis failed - no response received"
        );
      }
    } catch (error) {
      console.error("Analysis error:", error);
      setAnalysisError(
        error instanceof Error ? error.message : "Analysis failed"
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Format analysis result for better display
  const formatAnalysisResult = (result: string) => {
    // Split by common markdown/text patterns
    const lines = result.split("\n");
    const formattedLines = lines.map((line) => {
      // Handle headers
      if (line.startsWith("##")) {
        return `<h3 class="text-lg font-semibold text-slate-800 mt-4 mb-2">${line.replace("##", "").trim()}</h3>`;
      }
      if (line.startsWith("#")) {
        return `<h2 class="text-xl font-bold text-slate-800 mt-6 mb-3">${line.replace("#", "").trim()}</h2>`;
      }

      // Handle bold text
      line = line.replace(
        /\*\*(.*?)\*\*/g,
        '<strong class="font-semibold text-slate-800">$1</strong>'
      );

      // Handle bullet points
      if (line.trim().startsWith("- ") || line.trim().startsWith("* ")) {
        return `<li class="ml-4 mb-1">${line.replace(/^[\s\-\*]+/, "").trim()}</li>`;
      }

      // Handle numbered lists
      if (/^\d+\./.test(line.trim())) {
        return `<li class="ml-4 mb-1">${line.replace(/^\d+\.\s*/, "").trim()}</li>`;
      }

      // Regular paragraphs
      if (line.trim()) {
        return `<p class="mb-3 text-slate-700 leading-relaxed">${line.trim()}</p>`;
      }

      return "<br/>";
    });

    return formattedLines.join("");
  };

  return (
    <div className="h-full flex flex-col">
      {/* Always show header */}
      <div className="flex items-center justify-between border-b border-slate-200/60 p-6 flex-shrink-0 bg-white">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-slate-600 rounded-lg flex items-center justify-center">
            <IconCalculator size={20} className="text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">
              Calculate Score
            </h2>
            <p className="text-sm text-slate-500">
              {selectedChatId
                ? "Analyze your conversation"
                : "Select a chat to analyze"}
            </p>
          </div>{" "}
        </div>
      </div>
      {/* Conditional content based on selectedChatId and analysis state */}{" "}
      {!selectedChatId ? (
        /* No chat selected - show blurred state */ <div className="flex-1 relative overflow-hidden transition-all duration-300 ease-in-out">
          {/* Blurred background pattern - separate from content */}
          <div className="absolute inset-0">
            <div className="w-full h-full bg-gradient-to-br from-slate-100 via-white to-slate-50 blur-lg transform scale-110"></div>
          </div>

          {/* Clear content - completely isolated from background */}
          <div className="relative z-20 flex flex-col items-center justify-center h-full text-center p-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="w-20 h-20 bg-slate-100 rounded-2xl flex items-center justify-center mb-6 mx-auto shadow-sm transform hover:scale-105 transition-all duration-200 ease-out">
              <IconCalculator size={40} className="text-slate-500" />
            </div>
            <h3 className="text-xl font-semibold text-slate-800 mb-3 animate-in fade-in slide-in-from-bottom-2 duration-500 delay-150">
              No Chat Selected
            </h3>
            <p className="text-slate-500 max-w-sm leading-relaxed animate-in fade-in slide-in-from-bottom-2 duration-500 delay-300">
              Click the arrow button on a chat to start analysis.
            </p>
          </div>
        </div>
      ) : !analysisStarted ? (
        /* Chat selected but analysis not started - show blurred state */
        <>
          <div className="flex-1 relative overflow-hidden">
            {/* Blurred background pattern - separate from content */}
            <div className="absolute inset-0">
              <div className="w-full h-full bg-gradient-to-br from-slate-100 via-white to-slate-50 blur-lg transform scale-110"></div>
            </div>

            {/* Clear content - completely isolated from background */}
            <div className="relative z-20 flex flex-col items-center justify-center h-full text-center p-6">
              <div className="w-20 h-20 bg-slate-100 rounded-2xl flex items-center justify-center mb-6 mx-auto shadow-sm">
                <IconCalculator size={40} className="text-slate-500" />
              </div>
              <h3 className="text-xl font-semibold text-slate-800 mb-3">
                {selectedChat?.title || "Ready to Analyze"}
              </h3>
              <p className="text-slate-500 max-w-sm leading-relaxed">
                {existingAnalysis
                  ? "Previous analysis available. Start a new analysis or view existing results above."
                  : "Start the analysis to calculate scores and get insights from this conversation."}
              </p>
            </div>
          </div>

          {/* Start Analysis Button - only show when chat is selected */}
          <div className="border-t border-slate-200/60 p-6 flex-shrink-0 bg-white">
            <button
              onClick={handleStartAnalysis}
              className="w-full bg-slate-600 hover:bg-slate-700 text-white py-3 px-6 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center space-x-2"
            >
              <IconCalculator size={20} />
              <span>
                {existingAnalysis ? "Start New Analysis" : "Start Analysis"}
              </span>
            </button>
          </div>
        </>
      ) : (
        /* Analysis started - show results or loading state */
        <div className="flex-1 bg-white overflow-hidden">
          {isAnalyzing || isGenerating /* Loading state */ ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-6 animate-in fade-in duration-500">
              <div className="w-20 h-20 bg-blue-100 rounded-2xl flex items-center justify-center mb-6 animate-pulse">
                <IconCalculator
                  size={40}
                  className="text-blue-600 animate-spin"
                />
              </div>
              <h3 className="text-xl font-semibold text-slate-800 mb-3 animate-in slide-in-from-bottom-2 duration-500 delay-150">
                Analyzing: {selectedChat?.title}
              </h3>
              <p className="text-slate-500 max-w-sm leading-relaxed mb-4 animate-in slide-in-from-bottom-2 duration-500 delay-300">
                Analysis is in progress. Please wait while we calculate scores
                and generate insights.
              </p>
              <div className="flex items-center space-x-2 text-blue-600 animate-in fade-in duration-500 delay-500">
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
                <div
                  className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"
                  style={{ animationDelay: "0.1s" }}
                ></div>
                <div
                  className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"
                  style={{ animationDelay: "0.2s" }}
                ></div>
              </div>
            </div>
          ) : analysisError ? (
            /* Error state */
            <div className="flex flex-col items-center justify-center h-full text-center p-6">
              <div className="w-20 h-20 bg-red-100 rounded-2xl flex items-center justify-center mb-6">
                <IconX size={40} className="text-red-600" />
              </div>
              <h3 className="text-xl font-semibold text-slate-800 mb-3">
                Analysis Failed
              </h3>
              <p className="text-red-500 max-w-md leading-relaxed mb-6">
                {analysisError}
              </p>
              <button
                onClick={() => {
                  setAnalysisStarted(false);
                  setAnalysisError(null);
                  setAnalysisResult(null);
                }}
                className="bg-slate-600 hover:bg-slate-700 text-white py-2 px-4 rounded-lg font-medium transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : analysisResult /* Results state */ ? (
            <div className="h-full flex flex-col">
              <div className="flex items-center justify-between border-b border-slate-200/60 p-6 flex-shrink-0">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                    <IconCheck size={20} className="text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-800">
                      Analysis Complete
                    </h3>
                    <p className="text-sm text-slate-500">
                      {selectedChat?.title}
                    </p>
                    {existingAnalysis && (
                      <p className="text-xs text-slate-400 mt-1">
                        Analyzed with {existingAnalysis.promptName} •{" "}
                        {existingAnalysis.modelName}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleDeleteAndRestart}
                    className="flex items-center space-x-2 text-red-500 hover:text-red-700 hover:bg-red-50 px-3 py-2 rounded-lg transition-colors"
                    title="Delete and start new analysis"
                  >
                    <IconTrash size={16} />
                    <span className="text-sm font-medium">New Analysis</span>
                  </button>
                  <button
                    onClick={() => {
                      setAnalysisStarted(false);
                      setAnalysisError(null);
                      setAnalysisResult(null);
                    }}
                    className="text-slate-500 hover:text-slate-700 transition-colors"
                  >
                    <IconX size={20} />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                <div className="max-w-none">
                  <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
                    <div className="border-b border-slate-200 px-6 py-4">
                      <h4 className="font-semibold text-slate-800 flex items-center space-x-2">
                        <IconCalculator size={18} className="text-green-500" />
                        <span>Analysis Results</span>
                      </h4>
                      {existingAnalysis && (
                        <div className="mt-2 flex flex-wrap gap-4 text-xs text-slate-500">
                          <span>Model: {existingAnalysis.modelName}</span>
                          <span>
                            Temperature: {existingAnalysis.temperature}
                          </span>
                          <span>
                            Analyzed:{" "}
                            {new Date(
                              existingAnalysis.createdAt
                            ).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="p-6">
                      <div
                        className="prose prose-slate max-w-none"
                        dangerouslySetInnerHTML={{
                          __html: formatAnalysisResult(analysisResult),
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Fallback state */
            <div className="flex flex-col items-center justify-center h-full text-center p-6">
              <div className="w-20 h-20 bg-slate-100 rounded-2xl flex items-center justify-center mb-6">
                <IconCalculator size={40} className="text-slate-500" />
              </div>
              <h3 className="text-xl font-semibold text-slate-800 mb-3">
                Ready to Analyze
              </h3>
              <p className="text-slate-500 max-w-sm leading-relaxed">
                Something went wrong. Please try starting the analysis again.
              </p>
            </div>
          )}
        </div>
      )}{" "}
      {/* Modal - only show when chat is selected and modal is open */}
      {selectedChatId && showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center animate-in fade-in duration-200">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={handleCloseModal}
          />

          {/* Modal Content */}
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
            {" "}
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <h3 className="text-lg font-bold text-slate-800">
                Select Calculation Prompt
              </h3>
              <button
                onClick={handleCloseModal}
                className="w-8 h-8 bg-slate-100 hover:bg-slate-200 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95"
              >
                <IconX size={16} className="text-slate-600" />
              </button>
            </div>
            {/* Prompts List */}
            <div className="p-6">
              {calculatePrompts.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <IconCalculator size={32} className="text-slate-400" />
                  </div>
                  <h4 className="text-lg font-medium text-slate-800 mb-2">
                    No Calculation Prompts Found
                  </h4>
                  <p className="text-slate-500 text-sm">
                    Create calculation prompts in the prompts section to use for
                    analysis.
                  </p>
                </div>
              ) : (
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {calculatePrompts.map((prompt, index) => (
                    <button
                      key={prompt._id}
                      onClick={() =>
                        handlePromptSelect(prompt._id, prompt.content)
                      }
                      className={`w-full p-4 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 hover:border-slate-300 transition-all duration-200 text-left hover:scale-[1.02] hover:shadow-md animate-in slide-in-from-left ${
                        selectedPrompt === prompt._id
                          ? "ring-2 ring-slate-400 border-slate-400"
                          : ""
                      }`}
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center flex-shrink-0">
                          <IconCalculator size={20} className="text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-slate-800 truncate">
                            {prompt.name}
                          </h4>
                          <p className="text-sm text-slate-500 mt-1 line-clamp-2">
                            {prompt.content.length > 100
                              ? prompt.content.substring(0, 100) + "..."
                              : prompt.content}
                          </p>
                          <div className="flex items-center mt-2 text-xs text-slate-400">
                            <IconMessageCircle size={12} className="mr-1" />
                            <span>Calculate Main Model</span>
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
