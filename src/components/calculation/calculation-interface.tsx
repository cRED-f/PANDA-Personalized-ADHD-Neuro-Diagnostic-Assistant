"use client";

import { FC, useState, useEffect, useCallback } from "react";
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
  const [selectedPrompts, setSelectedPrompts] = useState<string[]>([]);
  const [analysisStarted, setAnalysisStarted] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<string[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [highlightedExchanges, setHighlightedExchanges] = useState<Set<number>>(
    new Set()
  );

  const [singleModelMode, setSingleModelMode] = useState(false);
  const [selectedSinglePrompt, setSelectedSinglePrompt] = useState<string>("");
  const [singleModelResult, setSingleModelResult] = useState<string>("");
  const [filteredHistoryForDisplay, setFilteredHistoryForDisplay] =
    useState<typeof conversationHistory>(undefined);

  const calculationSettings = useQuery(
    api.calculationSettings.getCalculationSettings
  );

  const allPrompts = useQuery(api.prompts.getPrompts) || [];

  const modelNames = [
    "calculate-1",
    "calculate-2",
    "calculate-3",
    "calculate-4",
  ] as const;

  const modelPrompts1 =
    useQuery(api.prompts.getPromptsByTarget, {
      targetModel: "calculate-1",
    }) || [];
  const modelPrompts2 =
    useQuery(api.prompts.getPromptsByTarget, {
      targetModel: "calculate-2",
    }) || [];
  const modelPrompts3 =
    useQuery(api.prompts.getPromptsByTarget, {
      targetModel: "calculate-3",
    }) || [];
  const modelPrompts4 =
    useQuery(api.prompts.getPromptsByTarget, {
      targetModel: "calculate-4",
    }) || [];

  const singleModelPrompts =
    useQuery(api.prompts.getPromptsByTarget, {
      targetModel: "single-model",
    }) || [];

  const modelPrompts = [
    modelPrompts1,
    modelPrompts2,
    modelPrompts3,
    modelPrompts4,
  ];

  const chats = useQuery(api.messages.getChats) || [];
  const selectedChat = chats.find((chat) => chat._id === selectedChatId);

  const conversationHistory = useQuery(
    api.messages.getConversationHistory,
    selectedChatId ? { chatId: selectedChatId } : "skip"
  );

  const apiSettings = useQuery(api.settings.getApiSettings);

  const existingAnalysis = useQuery(
    api.analyses.getChatAnalysis,
    selectedChatId ? { chatId: selectedChatId } : "skip"
  );

  const saveAnalysis = useMutation(api.analyses.saveAnalysis);
  const deleteAnalysis = useMutation(api.analyses.deleteAnalysis);

  const { sendMessage: sendToOpenRouter, isGenerating } = useOpenRouter(
    apiSettings?.apiKey
  );

  const generateFilteredHistory = useCallback(
    (originalHistory: typeof conversationHistory) => {
      if (!originalHistory) return undefined;

      return originalHistory.filter((msg, msgIndex) => {
        if (msg.role === "ai") {
          const aiCount = originalHistory
            .slice(0, msgIndex + 1)
            .filter((m) => m.role === "ai").length;
          return aiCount > 5;
        } else if (msg.role === "user") {
          const userCount = originalHistory
            .slice(0, msgIndex + 1)
            .filter((m) => m.role === "user").length;
          return userCount > 6;
        }
        return true;
      });
    },
    []
  );

  useEffect(() => {
    if (existingAnalysis) {
      setAnalysisStarted(true);
      setAnalysisResults(existingAnalysis.map((a) => a.result));
      setSelectedPrompts(existingAnalysis.map((a) => a.promptId));
      setIsAnalyzing(false);
      setAnalysisError(null);
      setFilteredHistoryForDisplay(
        generateFilteredHistory(conversationHistory)
      );
    } else {
      setAnalysisStarted(false);
      setAnalysisResults([]);
      setAnalysisError(null);
      setSelectedPrompts([]);
      setIsAnalyzing(false);
      setFilteredHistoryForDisplay(undefined);
    }
  }, [
    selectedChatId,
    existingAnalysis,
    conversationHistory,
    generateFilteredHistory,
  ]);
  const extractExchangeNumbers = (result: string) => {
    const exchangeNumbers = new Set<number>();
    const exchangeRegex = /\*\*Exchange (\d+):\*\*/g;
    let match;

    while ((match = exchangeRegex.exec(result)) !== null) {
      const exchangeNumber = parseInt(match[1], 10);
      if (!isNaN(exchangeNumber)) {
        exchangeNumbers.add(exchangeNumber);
      }
    }

    return exchangeNumbers;
  };

  useEffect(() => {
    if (analysisResults.length > 0) {
      const newHighlights = new Set<number>();

      analysisResults.forEach((result) => {
        const exchanges = extractExchangeNumbers(result);
        exchanges.forEach((exchange) => newHighlights.add(exchange));
      });

      setHighlightedExchanges(newHighlights);
    }
  }, [analysisResults]);

  useEffect(() => {
    if (calculationSettings?.modelNames) {
      setSelectedPrompts(Array(calculationSettings.modelNames.length).fill(""));
    }
  }, [calculationSettings]);

  const handlePromptSelect = (index: number, promptId: string) => {
    const newSelectedPrompts = [...selectedPrompts];
    newSelectedPrompts[index] = promptId;
    setSelectedPrompts(newSelectedPrompts);
  };

  const handleSingleModelAnalysis = async () => {
    if (!conversationHistory || !calculationSettings || !selectedSinglePrompt)
      return;

    setSingleModelMode(true);
    setAnalysisStarted(true);
    setIsAnalyzing(true);
    setAnalysisError(null);
    setShowModal(false);

    try {
      const prompt = allPrompts.find((p) => p._id === selectedSinglePrompt);

      const excludedMessages: Array<{
        index: number;
        role: string;
        content: string;
        reason: string;
      }> = [];

      const filteredHistory = generateFilteredHistory(conversationHistory);

      conversationHistory.forEach((msg, msgIndex) => {
        if (msg.role === "ai") {
          const aiCount = conversationHistory
            .slice(0, msgIndex + 1)
            .filter((m) => m.role === "ai").length;

          if (aiCount <= 5) {
            excludedMessages.push({
              index: msgIndex,
              role: msg.role,
              content: msg.content.substring(0, 100) + "...",
              reason: `AI exchange ${aiCount}/5 (excluded)`,
            });
          }
        } else if (msg.role === "user") {
          const userCount = conversationHistory
            .slice(0, msgIndex + 1)
            .filter((m) => m.role === "user").length;

          if (userCount <= 6) {
            excludedMessages.push({
              index: msgIndex,
              role: msg.role,
              content: msg.content.substring(0, 100) + "...",
              reason: `User exchange ${userCount}/6 (excluded)`,
            });
          }
        }
      });

      if (!filteredHistory) {
        throw new Error("Failed to generate filtered history");
      }

      const messages = [
        { role: "system" as const, content: prompt?.content || "" },
        ...filteredHistory.map((msg, filteredIndex) => {
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

          const exchangeNumber = Math.floor(filteredIndex / 2) + 1;

          const contentWithExchange =
            role === "assistant"
              ? `[Exchange ${exchangeNumber} - Psychiatrist]: ${msg.content}`
              : `[Exchange ${exchangeNumber} - User]: ${msg.content}`;

          return {
            role,
            content: contentWithExchange,
          } as OpenRouterMessage;
        }),
      ];

      const result = await sendToOpenRouter(messages, {
        model:
          calculationSettings.singleModelName || "anthropic/claude-3.5-sonnet",
        temperature: calculationSettings.singleModelTemperature || 0.7,
      });

      if (result) {
        setSingleModelResult(result);
        setFilteredHistoryForDisplay(filteredHistory);

        if (selectedChatId) {
          await saveAnalysis({
            chatId: selectedChatId,
            promptId: selectedSinglePrompt,
            promptName: prompt?.name || "Single Model Prompt",
            promptContent: prompt?.content || "",
            modelName: calculationSettings.singleModelName || "single-model",
            temperature: calculationSettings.singleModelTemperature || 0.7,
            result: result,
          });
        }
      }
    } catch (error) {
      console.error("Single model analysis error:", error);
      setAnalysisError(
        error instanceof Error ? error.message : "Single model analysis failed"
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleStartAnalysis = async () => {
    if (!conversationHistory || !calculationSettings) return;
    setAnalysisStarted(true);
    setIsAnalyzing(true);
    setAnalysisError(null);
    setShowModal(false);

    const excludedMessages: Array<{
      index: number;
      role: string;
      content: string;
      reason: string;
    }> = [];
    const filteredHistory = generateFilteredHistory(conversationHistory);

    conversationHistory.forEach((msg, msgIndex) => {
      if (msg.role === "ai") {
        const aiCount = conversationHistory
          .slice(0, msgIndex + 1)
          .filter((m) => m.role === "ai").length;

        if (aiCount <= 5) {
          excludedMessages.push({
            index: msgIndex,
            role: msg.role,
            content: msg.content.substring(0, 100) + "...",
            reason: `AI exchange ${aiCount}/5 (excluded)`,
          });
        }
      } else if (msg.role === "user") {
        const userCount = conversationHistory
          .slice(0, msgIndex + 1)
          .filter((m) => m.role === "user").length;

        if (userCount <= 6) {
          excludedMessages.push({
            index: msgIndex,
            role: msg.role,
            content: msg.content.substring(0, 100) + "...",
            reason: `User exchange ${userCount}/6 (excluded)`,
          });
        }
      }
    });

    try {
      const modelNames = calculationSettings.modelNames;
      const messagesForModels = modelNames.map((modelName, index) => {
        const promptId = selectedPrompts[index];
        const prompt = allPrompts.find((p) => p._id === promptId);

        if (!filteredHistory) {
          throw new Error("Failed to generate filtered history");
        }

        return {
          model: modelName,
          temperature: calculationSettings.temperatures[index],
          messages: [
            { role: "system" as const, content: prompt?.content || "" },
            ...filteredHistory.map((msg, filteredIndex) => {
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

              // Calculate exchange number based on filtered conversation
              // Each exchange consists of 2 messages (psychiatrist + user)
              const exchangeNumber = Math.floor(filteredIndex / 2) + 1;

              // Include the exchange number in the message content
              const contentWithExchange =
                role === "assistant"
                  ? `[Exchange ${exchangeNumber} - Psychiatrist]: ${msg.content}`
                  : `[Exchange ${exchangeNumber} - User]: ${msg.content}`;

              return {
                role,
                content: contentWithExchange,
              } as OpenRouterMessage;
            }),
          ],
          filteredHistory, // Store filtered history for later use
        };
      });
      const results = await Promise.all(
        messagesForModels.map(async (modelData) => {
          const result = await sendToOpenRouter(modelData.messages, {
            model: modelData.model,
            temperature: modelData.temperature,
          });
          return result;
        })
      );
      setAnalysisResults(
        results.filter((result): result is string => result !== null)
      );
      setFilteredHistoryForDisplay(filteredHistory); // Store filtered history for display
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
    let cleanedResult = result;

    // Find the first occurrence of any main analysis section header
    const mainSectionPatterns = [
      /# 📋 \*\*HYPERACTIVITY ANALYSIS:/,
      /# 📋 \*\*OPPOSITIONAL BEHAVIOR ANALYSIS:/,
      /# 📋 \*\*COGNITIVE ANALYSIS:/,
      /# 📋 \*\*ADHD INDEX ANALYSIS:/,
      /# 📋 \*\*.*ANALYSIS:/,
    ];

    let firstSectionIndex = -1;
    for (const pattern of mainSectionPatterns) {
      const match = cleanedResult.search(pattern);
      if (
        match !== -1 &&
        (firstSectionIndex === -1 || match < firstSectionIndex)
      ) {
        firstSectionIndex = match;
      }
    }

    // If we found a main section, start from there
    if (firstSectionIndex !== -1) {
      cleanedResult = cleanedResult.substring(firstSectionIndex);
    }

    let enhancedResult = enhanceAnalysisWithFullExchanges(cleanedResult);

    const allBoldMatches = enhancedResult.match(/\*\*[^*\n]+\*\*/g);
    if (allBoldMatches) {
      allBoldMatches.forEach((match) => {
        const content = match.replace(/\*\*/g, "");
        const boldHTML = `<strong class="font-bold text-slate-900">${content}</strong>`;
        enhancedResult = enhancedResult.split(match).join(boldHTML);
      });
    }

    const lines = enhancedResult.split("\n");
    const formattedLines = lines.map((line) => {
      if (line.startsWith("##")) {
        const headerText = line.replace("##", "").trim();
        const processedHeader = headerText.replace(
          /\*\*(.*?)\*\*/g,
          '<strong class="font-semibold">$1</strong>'
        );
        return `<h3 class="text-lg font-semibold text-slate-800 mt-4 mb-2">${processedHeader}</h3>`;
      }
      if (line.startsWith("#")) {
        const headerText = line.replace("#", "").trim();
        const processedHeader = headerText.replace(
          /\*\*(.*?)\*\*/g,
          '<strong class="font-semibold">$1</strong>'
        );
        return `<h2 class="text-xl font-bold text-slate-800 mt-6 mb-3">${processedHeader}</h2>`;
      }

      let processedLine = line;

      const boldMatches = line.match(/\*\*[^*\n]+\*\*/g);
      if (boldMatches) {
        boldMatches.forEach((match) => {
          const content = match.replace(/\*\*/g, "");
          const boldHTML = `<strong class="font-bold text-slate-900 bg-yellow-200 px-1 rounded">${content}</strong>`;
          // Replace all instances of this exact pattern
          processedLine = processedLine.split(match).join(boldHTML);
        });
      }

      // Fallback: handle any remaining ** patterns
      processedLine = processedLine.replace(
        /\*\*([^*\n]+)\*\*/g,
        '<strong class="font-bold text-slate-900">$1</strong>'
      );

      if (
        processedLine.trim().startsWith("- ") ||
        processedLine.trim().startsWith("* ")
      ) {
        return `<li class="ml-4 mb-1">${processedLine.replace(/^[\s\-\*]+/, "").trim()}</li>`;
      }

      // Handle numbered lists
      if (/^\d+\./.test(processedLine.trim())) {
        return `<li class="ml-4 mb-1">${processedLine.replace(/^\d+\.\s*/, "").trim()}</li>`;
      }

      // Regular paragraphs
      if (processedLine.trim()) {
        return `<p class="mb-3 text-slate-700 leading-relaxed">${processedLine.trim()}</p>`;
      }

      return "<br/>";
    });

    return formattedLines.join("");
  };

  const handleStartAnalysisClick = () => {
    setSingleModelMode(false);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSingleModelMode(false);
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
        // Reset single model states
        setSingleModelMode(false);
        setSelectedSinglePrompt("");
        setSingleModelResult("");
      } catch (error) {
        console.error("Error deleting analysis:", error);
        setAnalysisError("Failed to delete analysis");
      }
    }
  };

  const enhanceAnalysisWithFullExchanges = (result: string) => {
    if (!conversationHistory) {
      return result;
    }

    const exchangeRegex =
      /\*\*Exchange (\d+):\*\*[\s\S]*?(?=\n\*\*Exchange \d+:|\n\*\*FREQUENCY ANALYSIS:|\n\*\*SCORE JUSTIFICATION:|\n---|$)/g;
    let enhancedResult = result;
    const matches = [...result.matchAll(exchangeRegex)];

    matches.forEach((match) => {
      const modelExchangeNumber = parseInt(match[1], 10);
      const fullMatchText = match[0];

      console.log(
        `🔍 Processing model exchange ${modelExchangeNumber}:`,
        fullMatchText.substring(0, 200)
      );

      if (!isNaN(modelExchangeNumber)) {
        const userTextMatches =
          fullMatchText.match(/\*\*User:\*\*\s*"([^"]*)"/) ||
          fullMatchText.match(/User:\s*"([^"]*)"/) ||
          fullMatchText.match(/"([^"]*)"[^"]*$/m);

        if (userTextMatches && userTextMatches[1]) {
          const userTextFromAnalysis = userTextMatches[1].trim();

          let realExchangeNumber = null;
          let psychiatristMsg = null;
          let userMsg = null;

          for (let i = 0; i < conversationHistory.length; i++) {
            const msg = conversationHistory[i];
            if (
              msg.role === "user" &&
              msg.content.includes(userTextFromAnalysis)
            ) {
              userMsg = msg;
              // Calculate the real exchange number based on position in original conversation
              realExchangeNumber = Math.floor(i / 2) + 1;

              // Find the corresponding psychiatrist message
              if (i > 0 && conversationHistory[i - 1].role === "ai") {
                psychiatristMsg = conversationHistory[i - 1];
              } else if (
                i < conversationHistory.length - 1 &&
                conversationHistory[i + 1].role === "ai"
              ) {
                psychiatristMsg = conversationHistory[i + 1];
              }

              break;
            }
          }

          if (psychiatristMsg && userMsg && realExchangeNumber) {
            const cleanPsychiatristContent = psychiatristMsg.content
              .replace(/\*\[.*?\]\*/g, "")
              .replace(/\[.*?\]/g, "")
              .replace(/\*\(.*?\)\*/g, "")
              .replace(/\(.*?\)/g, "")
              .replace(/---[\s\S]*?\*\*Reminder\*\*[\s\S]*$/gm, "")
              .replace(/\*\*Reminder\*\*[\s\S]*$/gm, "")
              .replace(/\*\(.*?\)\*[\s\S]*$/gm, "")
              .replace(/---[\s\S]*Progress:[\s\S]*$/gm, "")
              .replace(/---[\s\S]*$/gm, "")
              .trim();

            const fullExchange = `**Exchange ${realExchangeNumber}:**

**Psychiatrist:** "${cleanPsychiatristContent}"

**User:** "${userMsg.content}"`;

            const analysisAfterMatch = fullMatchText.match(
              /\n(\*\*(?:FREQUENCY ANALYSIS|SCORE JUSTIFICATION):[\s\S]*)$/
            );
            const analysisText = analysisAfterMatch
              ? "\n" + analysisAfterMatch[1]
              : "";

            enhancedResult = enhancedResult.replace(
              fullMatchText,
              fullExchange + analysisText
            );
          }
        }
      }
    });

    return enhancedResult;
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
            <div className="space-y-3">
              <button
                onClick={handleStartAnalysisClick}
                className="w-full bg-slate-600 hover:bg-slate-700 text-white py-3 px-6 rounded-lg font-medium transition-colors duration-200"
              >
                Start Multi-Model Analysis
              </button>
              <button
                onClick={() => {
                  setShowModal(true);
                  setSingleModelMode(true);
                }}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 px-6 rounded-lg font-medium transition-colors duration-200"
              >
                Start Single Model Analysis
              </button>
            </div>
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
          ) : analysisResults.length > 0 || singleModelResult ? (
            <div className="h-full flex flex-col">
              <div className="flex items-center justify-between border-b border-slate-200/60 p-6 flex-shrink-0">
                <h3 className="text-lg font-bold text-slate-800">
                  {singleModelMode
                    ? "Single Model Analysis Complete"
                    : "Multi-Model Analysis Complete"}
                </h3>
                <button
                  onClick={handleDeleteAndRestart}
                  className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors duration-200"
                  title="Delete analysis and restart"
                >
                  <IconTrash size={16} /> Delete & Restart
                </button>
              </div>
              {/* Dual-panel layout */}
              <div className="flex-1 flex overflow-hidden">
                {/* Analysis Results Panel */}
                <div className="flex-1 overflow-y-auto p-6 border-r border-slate-200">
                  <h4 className="font-bold text-slate-800 mb-4">
                    Analysis Results
                  </h4>

                  {singleModelMode && singleModelResult ? (
                    // Single model result display
                    <div className="max-w-none bg-white rounded-lg border border-slate-200 shadow-sm mb-6">
                      <div className="p-6">
                        <div className="mb-2 flex flex-col sm:flex-row sm:items-center sm:justify-between">
                          <span className="font-semibold text-slate-700">
                            Model:{" "}
                            {calculationSettings?.singleModelName ||
                              "Single Model"}
                          </span>
                          <span className="text-sm text-slate-500">
                            Temperature:{" "}
                            {calculationSettings?.singleModelTemperature || 0.7}
                          </span>
                        </div>
                        <div
                          className="prose prose-slate max-w-none"
                          dangerouslySetInnerHTML={{
                            __html: formatAnalysisResult(singleModelResult),
                          }}
                        />
                      </div>
                    </div>
                  ) : (
                    // Multi-model results display
                    analysisResults.map((result, index) => (
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
                    ))
                  )}
                </div>

                {/* Conversation History Panel */}
                <div className="w-1/3 overflow-y-auto p-6 bg-slate-50">
                  <h4 className="font-bold text-slate-800 mb-4">
                    Conversation History
                  </h4>
                  <div className="space-y-4">
                    {filteredHistoryForDisplay?.map((msg, index) => {
                      // Calculate exchange number based on message pairs
                      const exchangeNumber = Math.floor(index / 2) + 1;
                      const isHighlighted =
                        highlightedExchanges.has(exchangeNumber);

                      return (
                        <div
                          key={index}
                          className={`p-4 rounded-lg border ${
                            isHighlighted
                              ? "border-blue-500 bg-blue-50 shadow-sm"
                              : "border-slate-200 bg-white"
                          }`}
                        >
                          <div className="flex items-start">
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                                msg.role === "ai"
                                  ? "bg-blue-500"
                                  : "bg-green-500"
                              }`}
                            >
                              <span className="text-white font-bold text-sm">
                                {msg.role === "ai" ? "P" : "U"}
                              </span>
                            </div>
                            <div className="flex-1">
                              <div className="flex justify-between items-start">
                                <span className="font-semibold text-slate-700">
                                  {msg.role === "ai" ? "Psychiatrist" : "User"}
                                </span>
                                <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">
                                  Exchange {exchangeNumber}
                                </span>
                              </div>
                              <div
                                className="mt-1 text-slate-700 whitespace-pre-wrap"
                                dangerouslySetInnerHTML={{
                                  __html: (() => {
                                    // Process bold text FIRST, before removing any notes
                                    let processedContent = msg.content;

                                    // For AI messages, remove everything after the main question
                                    if (msg.role === "ai") {
                                      // Remove progress tracking and reminder sections
                                      processedContent = processedContent
                                        .replace(
                                          /---[\s\S]*Progress:[\s\S]*$/gm,
                                          ""
                                        )
                                        .replace(
                                          /---[\s\S]*?\*\*Reminder\*\*[\s\S]*$/gm,
                                          ""
                                        )
                                        .replace(
                                          /\*\*Reminder\*\*[\s\S]*$/gm,
                                          ""
                                        )
                                        .replace(/---[\s\S]*$/gm, "")
                                        .trim();
                                    }

                                    processedContent = processedContent.replace(
                                      /\*\*([^*]+)\*\*/g,
                                      '<strong class="font-bold text-slate-900">$1</strong>'
                                    );

                                    processedContent = processedContent
                                      .replace(/\*\([^*\)]*\)\*/g, "")
                                      .replace(/\([^<>)]*\)/g, "")
                                      .trim();

                                    return processedContent;
                                  })(),
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center p-6">
              <h3 className="text-xl font-semibold text-slate-800 mb-3">
                {selectedChat?.title || "Ready to Analyze"}
              </h3>
              <p className="text-slate-500 max-w-sm leading-relaxed">
                Start the analysis to calculate scores and get insights from
                this conversation.
              </p>
              <div className="mt-6 w-full space-y-3">
                <button
                  onClick={handleStartAnalysisClick}
                  className="w-full bg-slate-600 hover:bg-slate-700 text-white py-3 px-6 rounded-lg font-medium transition-colors duration-200"
                >
                  Start Multi-Model Analysis
                </button>
                <button
                  onClick={() => {
                    setShowModal(true);
                    setSingleModelMode(true);
                  }}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 px-6 rounded-lg font-medium transition-colors duration-200"
                >
                  Start Single Model Analysis
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal for prompt selection */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6 relative max-h-[80vh] overflow-y-auto">
            <button
              onClick={handleCloseModal}
              className="absolute top-3 right-3"
            >
              <IconX size={20} />
            </button>
            <h3 className="text-lg font-bold text-slate-800 mb-4">
              {singleModelMode
                ? "Select Single Model Prompt"
                : "Select Prompts"}
            </h3>

            {singleModelMode ? (
              // Single model prompt selection
              <div className="mb-4">
                <h4 className="text-slate-700 font-medium mb-2">
                  Single Model Prompt
                </h4>
                <select
                  value={selectedSinglePrompt}
                  onChange={(e) => setSelectedSinglePrompt(e.target.value)}
                  className="w-full border p-2 rounded"
                >
                  <option value="">Select a single model prompt</option>
                  {singleModelPrompts.map((prompt) => (
                    <option key={prompt._id} value={prompt._id}>
                      {prompt.name}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              // Multi-model prompt selection
              modelNames.map((modelName, index) => {
                const promptsForModel = modelPrompts[index] || [];

                return (
                  <div key={modelName} className="mb-4">
                    <h4 className="text-slate-700 font-medium">
                      Model {index + 1}: {modelName}
                    </h4>

                    <select
                      value={selectedPrompts[index] || ""}
                      onChange={(e) =>
                        handlePromptSelect(index, e.target.value)
                      }
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
              })
            )}

            <div className="flex justify-end mt-4">
              <button
                onClick={
                  singleModelMode
                    ? handleSingleModelAnalysis
                    : handleStartAnalysis
                }
                className="bg-slate-600 text-white py-2 px-4 rounded-lg"
                disabled={
                  singleModelMode
                    ? !selectedSinglePrompt
                    : selectedPrompts.some((p) => !p)
                }
              >
                {singleModelMode
                  ? "Start Single Model Analysis"
                  : "Start Multi-Model Analysis"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
