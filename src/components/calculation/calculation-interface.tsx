"use client";

import { FC, useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { IconCalculator, IconX, IconTrash } from "@tabler/icons-react";
import { useOpenRouter } from "@/hooks/useOpenRouter";
import { OpenRouterMessage } from "@/lib/openrouter";

interface CalculationInterfaceProps {
  selectedChatId?: string | null;
}

export const CalculationInterface: FC<CalculationInterfaceProps> = ({
  selectedChatId,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [selectedPrompts, setSelectedPrompts] = useState<string[]>([]); // For storing selected prompts for each model
  const [analysisStarted, setAnalysisStarted] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<string[]>([]); // Store results for all models
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  // Get calculation settings (including model names)
  const calculationSettings = useQuery(
    api.calculationSettings.getCalculationSettings
  );

  // Get available prompts for the models
  const allPrompts = useQuery(api.prompts.getPrompts) || [];

  // Static model names
  const modelNames = [
    "calculate-1",
    "calculate-2",
    "calculate-3",
    "calculate-4",
  ];

  // Fetch prompts for each model based on the static model names
  const modelPrompts = modelNames.map((modelName) => {
    return (
      useQuery(api.prompts.getPromptsByTarget, {
        targetModel: modelName,
      }) || []
    );
  });

  // Get the selected chat data
  const chats = useQuery(api.messages.getChats) || [];
  const selectedChat = chats.find((chat) => chat._id === selectedChatId);

  // Get conversation history (excluding assistant/mentor messages)
  const conversationHistory = useQuery(
    api.messages.getConversationHistory,
    selectedChatId ? { chatId: selectedChatId } : "skip"
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
      setAnalysisResults(existingAnalysis.map((a) => a.result)); // Collect results from all analyses
      setSelectedPrompts(existingAnalysis.map((a) => a.promptId));
      setIsAnalyzing(false);
      setAnalysisError(null);
    } else {
      // Reset state for new chat or no existing analysis
      setAnalysisStarted(false);
      setAnalysisResults([]);
      setAnalysisError(null);
      setSelectedPrompts([]);
      setIsAnalyzing(false);
    }
  }, [selectedChatId, existingAnalysis]);

  // Fix: Initialize selectedPrompts when calculationSettings change
  useEffect(() => {
    if (calculationSettings?.modelNames) {
      setSelectedPrompts(Array(calculationSettings.modelNames.length).fill(""));
    }
  }, [calculationSettings]);

  // Fix: Update handlePromptSelect to handle multiple prompts
  const handlePromptSelect = (index: number, promptId: string) => {
    const newSelectedPrompts = [...selectedPrompts];
    newSelectedPrompts[index] = promptId;
    setSelectedPrompts(newSelectedPrompts);
  };

  // Fix: New function to start analysis with selected prompts
  const handleStartAnalysis = async () => {
    if (!conversationHistory || !calculationSettings) return;
    setAnalysisStarted(true);
    setIsAnalyzing(true);
    setAnalysisError(null);
    setShowModal(false);
    try {
      const modelNames = calculationSettings.modelNames;
      const messagesForModels = modelNames.map((modelName, index) => {
        const promptId = selectedPrompts[index];
        const prompt = allPrompts.find((p) => p._id === promptId);
        return {
          model: modelName,
          temperature: calculationSettings.temperatures[index],
          messages: [
            { role: "system" as const, content: prompt?.content || "" },
            ...conversationHistory.map((msg) => {
              let role: "user" | "assistant" | "system";
              if (msg.role === "ai") {
                role = "assistant";
              } else if (msg.role === "user") {
                role = "user";
              } else if (msg.role === "system") {
                role = "system";
              } else {
                role = "user";
              }
              return {
                role,
                content: msg.content,
              } as OpenRouterMessage;
            }),
          ],
        };
      });
      const results = await Promise.all(
        messagesForModels.map(async (modelData) => {
          return await sendToOpenRouter(modelData.messages, {
            model: modelData.model,
            temperature: modelData.temperature,
          });
        })
      );
      setAnalysisResults(results);
      if (selectedChatId) {
        await Promise.all(
          results.map(async (result, index) => {
            const promptId = selectedPrompts[index];
            const prompt = allPrompts.find((p) => p._id === promptId);
            await saveAnalysis({
              chatId: selectedChatId,
              promptId,
              promptName: prompt?.name || "Unknown Prompt",
              promptContent: prompt?.content || "",
              modelName: modelNames[index],
              temperature: calculationSettings.temperatures[index],
              result: result || "No response",
            });
          })
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

  const handleStartAnalysisClick = () => {
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
        setAnalysisResults([]);
        setAnalysisError(null);
        setSelectedPrompts([]);
        setIsAnalyzing(false);
      } catch (error) {
        console.error("Error deleting analysis:", error);
        setAnalysisError("Failed to delete analysis");
      }
    }
  };

  return (
    <div className="h-full flex flex-col">
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
          </div>
        </div>
      </div>

      {!selectedChatId ? (
        <div className="flex-1 relative overflow-hidden transition-all duration-300 ease-in-out">
          <div className="absolute inset-0">
            <div className="w-full h-full bg-gradient-to-br from-slate-100 via-white to-slate-50 blur-lg transform scale-110"></div>
          </div>
          <div className="relative z-20 flex flex-col items-center justify-center h-full text-center p-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h3 className="text-xl font-semibold text-slate-800 mb-3">
              No Chat Selected
            </h3>
            <p className="text-slate-500 max-w-sm leading-relaxed">
              Click the arrow button on a chat to start analysis.
            </p>
          </div>
        </div>
      ) : !analysisStarted ? (
        <>
          <div className="flex-1 relative overflow-hidden">
            <div className="absolute inset-0">
              <div className="w-full h-full bg-gradient-to-br from-slate-100 via-white to-slate-50 blur-lg transform scale-110"></div>
            </div>
            <div className="relative z-20 flex flex-col items-center justify-center h-full text-center p-6">
              <h3 className="text-xl font-semibold text-slate-800 mb-3">
                {selectedChat?.title || "Ready to Analyze"}
              </h3>
              <p className="text-slate-500 max-w-sm leading-relaxed">
                Start the analysis to calculate scores and get insights from
                this conversation.
              </p>
            </div>
          </div>
          <div className="border-t border-slate-200/60 p-6 flex-shrink-0 bg-white">
            <button
              onClick={handleStartAnalysisClick}
              className="w-full bg-slate-600 hover:bg-slate-700 text-white py-3 px-6 rounded-lg font-medium transition-colors duration-200"
            >
              Start Analysis
            </button>
          </div>
        </>
      ) : (
        <div className="flex-1 bg-white overflow-hidden">
          {isAnalyzing || isGenerating ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-6 animate-in fade-in duration-500">
              <h3 className="text-xl font-semibold text-slate-800 mb-3">
                Analyzing: {selectedChat?.title}
              </h3>
              <p className="text-slate-500 max-w-sm leading-relaxed mb-4">
                Analysis is in progress. Please wait while we calculate scores
                and generate insights.
              </p>
              <div className="flex items-center space-x-2 text-blue-600 animate-in fade-in duration-500 delay-500">
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
              </div>
            </div>
          ) : analysisError ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-6">
              <h3 className="text-xl font-semibold text-slate-800 mb-3">
                Analysis Failed
              </h3>
              <p className="text-red-500 max-w-md leading-relaxed mb-6">
                {analysisError}
              </p>
            </div>
          ) : analysisResults.length > 0 ? (
            <div className="h-full flex flex-col">
              <div className="flex items-center justify-between border-b border-slate-200/60 p-6 flex-shrink-0">
                <h3 className="text-lg font-bold text-slate-800">
                  Analysis Complete
                </h3>
                <button
                  onClick={handleDeleteAndRestart}
                  className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors duration-200"
                  title="Delete analysis and restart"
                >
                  <IconTrash size={16} /> Delete & Restart
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-6">
                {analysisResults.map((result, index) => (
                  <div
                    key={index}
                    className="max-w-none bg-white rounded-lg border border-slate-200 shadow-sm mb-6"
                  >
                    <div className="p-6">
                      <div className="mb-2 flex flex-col sm:flex-row sm:items-center sm:justify-between">
                        <span className="font-semibold text-slate-700">
                          Model:{" "}
                          {calculationSettings?.modelNames?.[index] ||
                            `Model ${index + 1}`}
                        </span>
                      </div>
                      <div
                        className="prose prose-slate max-w-none"
                        dangerouslySetInnerHTML={{
                          __html: formatAnalysisResult(result),
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center p-6">
              <h3 className="text-xl font-semibold text-slate-800 mb-3">
                Ready to Analyze
              </h3>
              <p className="text-slate-500 max-w-sm leading-relaxed">
                Something went wrong. Please try starting the analysis again.
              </p>
              <button
                onClick={handleStartAnalysisClick}
                className="mt-6 bg-slate-600 hover:bg-slate-700 text-white py-2 px-6 rounded-lg font-medium transition-colors duration-200"
              >
                Start Analysis
              </button>
            </div>
          )}
        </div>
      )}

      {/* Modal for prompt selection */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6 relative">
            <button
              onClick={handleCloseModal}
              className="absolute top-3 right-3"
            >
              <IconX size={20} />
            </button>
            <h3 className="text-lg font-bold text-slate-800 mb-4">
              Select Prompts
            </h3>

            {/* Loop over the static model names and display corresponding prompts */}
            {modelNames.map((modelName, index) => {
              // Get the prompts for this model
              const promptsForModel = modelPrompts[index] || [];

              return (
                <div key={modelName} className="mb-4">
                  <h4 className="text-slate-700 font-medium">
                    Model {index + 1}: {modelName}
                  </h4>

                  {/* Display select dropdown for the current model */}
                  <select
                    value={selectedPrompts[index] || ""}
                    onChange={(e) => handlePromptSelect(index, e.target.value)}
                    className="w-full border p-2 rounded"
                  >
                    <option value="">Select a prompt</option>
                    {promptsForModel.map((prompt) => (
                      <option key={prompt._id} value={prompt._id}>
                        {prompt.name}
                      </option>
                    ))}
                  </select>
                </div>
              );
            })}

            <div className="flex justify-end mt-4">
              <button
                onClick={handleStartAnalysis}
                className="bg-slate-600 text-white py-2 px-4 rounded-lg"
                disabled={selectedPrompts.some((p) => !p)} // Disable if any prompt is not selected
              >
                Start Analysis
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
