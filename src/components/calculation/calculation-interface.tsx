"use client";

import { FC, useState, useEffect, useCallback } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { IconCalculator, IconX, IconTrash } from "@tabler/icons-react";
import { useAI } from "@/hooks/useAI";
import { OpenRouterMessage } from "@/lib/openrouter";
import {
  filterAIMessageForDatabase,
  filterAIMessageForCalculation,
} from "@/lib/utils";

interface CalculationInterfaceProps {
  selectedChatId?: string | null;
  selectedSessionId?: string | null; // For voice chat analysis
}

export const CalculationInterface: FC<CalculationInterfaceProps> = ({
  selectedChatId,
  selectedSessionId,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [selectedPrompts, setSelectedPrompts] = useState<string[]>([]);
  const [analysisStarted, setAnalysisStarted] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<string[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  const [singleModelMode, setSingleModelMode] = useState(false);
  const [selectedSinglePrompt, setSelectedSinglePrompt] = useState<string>("");
  const [singleModelResult, setSingleModelResult] = useState<string>("");
  const [makeTextMode, setMakeTextMode] = useState(false);

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

  // Voice chat queries
  // const voiceChats = useQuery(api.voiceChats.getAllVoiceChats) || [];

  const conversationHistory = useQuery(
    api.messages.getConversationHistory,
    selectedChatId ? { chatId: selectedChatId } : "skip"
  );

  // Voice messages for voice chat analysis
  const voiceMessages = useQuery(
    api.voiceChats.getVoiceMessages,
    selectedSessionId ? { sessionId: selectedSessionId } : "skip"
  );

  const existingAnalysis = useQuery(
    api.analyses.getChatAnalysis,
    selectedChatId ? { chatId: selectedChatId } : "skip"
  );

  // Voice analysis queries
  const existingVoiceAnalysis = useQuery(
    api.voiceChats.getVoiceAnalysis,
    selectedSessionId ? { sessionId: selectedSessionId } : "skip"
  );

  // Make Text Analysis queries and mutations
  const existingMakeTextAnalysis = useQuery(
    api.messages.getMakeTextAnalysis,
    selectedChatId ? { chatId: selectedChatId } : "skip"
  );

  // Voice Make Text Analysis queries
  const existingVoiceMakeTextAnalysis = useQuery(
    api.voiceChats.getVoiceMakeTextAnalysis,
    selectedSessionId ? { sessionId: selectedSessionId } : "skip"
  );

  const saveMakeTextAnalysis = useMutation(api.messages.saveMakeTextAnalysis);
  const saveCombinedText = useMutation(api.messages.saveCombinedText);
  const deleteMakeTextAnalysis = useMutation(
    api.messages.deleteMakeTextAnalysis
  );

  // Voice analysis mutations
  const saveVoiceMakeTextAnalysis = useMutation(
    api.voiceChats.saveVoiceMakeTextAnalysis
  );
  const saveVoiceCombinedText = useMutation(
    api.voiceChats.saveVoiceCombinedText
  );
  const deleteVoiceMakeTextAnalysis = useMutation(
    api.voiceChats.deleteVoiceMakeTextAnalysis
  );

  const saveAnalysis = useMutation(api.analyses.saveAnalysis);
  const deleteAnalysis = useMutation(api.analyses.deleteAnalysis);

  // Voice analysis mutations
  const saveVoiceAnalysis = useMutation(api.voiceChats.saveVoiceAnalysis);
  const deleteVoiceAnalysis = useMutation(api.voiceChats.deleteVoiceAnalysis);

  const { sendMessage: sendToAI, isGenerating } = useAI(
    "OpenAI", // Using OpenAI for calculations by default
    calculationSettings?.calculationApiKey
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
    // Handle text chat analysis
    if (selectedChatId && existingAnalysis) {
      setAnalysisStarted(true);
      setAnalysisResults(existingAnalysis.map((a) => a.result));
      setSelectedPrompts(existingAnalysis.map((a) => a.promptId));
      setIsAnalyzing(false);
      setAnalysisError(null);
      setMakeTextMode(false);
    } else if (selectedChatId && existingMakeTextAnalysis) {
      // Handle Make Text Analysis for text chats
      setMakeTextMode(true);
      setAnalysisStarted(true);
      setAnalysisResults(
        existingMakeTextAnalysis.analysisResults.map((a) => a.result)
      );
      setSelectedPrompts(
        existingMakeTextAnalysis.analysisResults.map((a) => a.promptId)
      );
      setIsAnalyzing(false);
      setAnalysisError(null);
    }
    // Handle voice chat analysis
    else if (selectedSessionId && existingVoiceAnalysis) {
      setAnalysisStarted(true);
      setAnalysisResults(existingVoiceAnalysis.map((a) => a.result));
      setSelectedPrompts(existingVoiceAnalysis.map((a) => a.promptId));
      setIsAnalyzing(false);
      setAnalysisError(null);
      setMakeTextMode(false);
    } else if (selectedSessionId && existingVoiceMakeTextAnalysis) {
      // Handle Make Text Analysis for voice chats
      setMakeTextMode(true);
      setAnalysisStarted(true);
      setAnalysisResults(
        existingVoiceMakeTextAnalysis.analysisResults.map((a) => a.result)
      );
      setSelectedPrompts(
        existingVoiceMakeTextAnalysis.analysisResults.map((a) => a.promptId)
      );
      setIsAnalyzing(false);
      setAnalysisError(null);
    } else {
      setAnalysisStarted(false);
      setAnalysisResults([]);
      setAnalysisError(null);
      setSelectedPrompts([]);
      setIsAnalyzing(false);
      setMakeTextMode(false);
    }
  }, [
    selectedChatId,
    selectedSessionId,
    existingAnalysis,
    existingMakeTextAnalysis,
    existingVoiceAnalysis,
    existingVoiceMakeTextAnalysis,
    conversationHistory,
    voiceMessages,
    generateFilteredHistory,
  ]);

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

  // Function to create combined text from conversation with exchange numbers
  const createMakeText = useCallback(() => {
    if (!conversationHistory) return "";

    // Apply the same filtering logic as other analysis modes
    const filteredHistory = generateFilteredHistory(conversationHistory);
    if (!filteredHistory) return "";

    let userCount = 0;
    let aiCount = 0;

    const combinedText = filteredHistory
      .map((msg) => {
        let exchangeNumber = "";
        let role = "";

        if (msg.role === "user") {
          userCount++;
          exchangeNumber = `Exchange ${userCount}`;
          role = "user";
        } else if (msg.role === "ai") {
          aiCount++;
          exchangeNumber = `Exchange ${aiCount}`;
          role = "assistant";
        } else {
          // Handle other roles (mentor, assistant, system)
          role =
            msg.role === "assistant"
              ? "assistant"
              : msg.role === "mentor"
                ? "mentor"
                : msg.role === "system"
                  ? "system"
                  : "assistant";
        }

        // Filter out tracking info from AI messages
        const cleanContent =
          msg.role === "ai"
            ? filterAIMessageForCalculation(msg.content)
            : msg.content;

        return exchangeNumber
          ? `${exchangeNumber} ${role}: ${cleanContent}`
          : `${role}: ${cleanContent}`;
      })
      .join("\n\n");

    return combinedText;
  }, [conversationHistory, generateFilteredHistory]);

  // Function to create combined text from voice messages with exchange numbers
  const createVoiceMakeText = useCallback(() => {
    if (!voiceMessages) return "";

    // Apply similar filtering logic as text conversations
    const generateFilteredVoiceHistory = (
      originalHistory: Array<{
        role: "user" | "assistant";
        content: string;
        transcription?: string;
      }>
    ) => {
      if (!originalHistory) return undefined;

      return originalHistory.filter((msg, msgIndex) => {
        if (msg.role === "assistant") {
          const aiCount = originalHistory
            .slice(0, msgIndex + 1)
            .filter((m) => m.role === "assistant").length;
          return aiCount > 5;
        } else if (msg.role === "user") {
          const userCount = originalHistory
            .slice(0, msgIndex + 1)
            .filter((m) => m.role === "user").length;
          return userCount > 6;
        }
        return true;
      });
    };

    const filteredHistory = generateFilteredVoiceHistory(voiceMessages);
    if (!filteredHistory) return "";

    let userCount = 0;
    let aiCount = 0;

    const combinedText = filteredHistory
      .map((msg) => {
        let exchangeNumber = "";
        let role = "";

        if (msg.role === "user") {
          userCount++;
          exchangeNumber = `Exchange ${userCount}`;
          role = "user";
        } else if (msg.role === "assistant") {
          aiCount++;
          exchangeNumber = `Exchange ${aiCount}`;
          role = "assistant";
        }

        // Use the transcription if available, otherwise use content
        const content = msg.transcription || msg.content;

        return exchangeNumber
          ? `${exchangeNumber} ${role}: ${content}`
          : `${role}: ${content}`;
      })
      .join("\n\n");

    return combinedText;
  }, [voiceMessages]);

  // Function to create combined text (works for both text and voice)
  // const createCombinedMakeText = useCallback(() => {
  //   if (makeTextMode) {
  //     // For Make Text Analysis, use the voice messages if in voice chat
  //     return selectedSessionId ? createVoiceMakeText() : createMakeText();
  //   }
  //   return "";
  // }, [makeTextMode, selectedSessionId, createVoiceMakeText, createMakeText]);

  // Handle Make Text button click - create and save combined text first
  const handleMakeTextClick = async () => {
    if (
      (!conversationHistory && !voiceMessages) ||
      (!selectedChatId && !selectedSessionId)
    )
      return;

    try {
      setIsAnalyzing(true);

      // Create the combined text based on type
      const makeText = selectedChatId
        ? createMakeText()
        : createVoiceMakeText();

      console.log("📝 Creating and saving combined text:", {
        type: selectedChatId ? "text" : "voice",
        textLength: makeText.length,
        textPreview:
          makeText.substring(0, 500) + (makeText.length > 500 ? "..." : ""),
      });

      // Save combined text to database based on type
      if (selectedChatId) {
        await saveCombinedText({
          chatId: selectedChatId,
          combinedText: makeText,
        });
      } else if (selectedSessionId) {
        await saveVoiceCombinedText({
          sessionId: selectedSessionId,
          combinedText: makeText,
        });
      }

      console.log("✅ Combined text saved successfully");

      // Now show the modal for prompt selection
      setShowModal(true);
      setMakeTextMode(true);
    } catch (error) {
      console.error("Error creating/saving combined text:", error);
      setAnalysisError(
        error instanceof Error
          ? `Failed to create combined text: ${error.message}`
          : "Failed to create combined text"
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleMakeTextAnalysis = async () => {
    if (
      (!conversationHistory && !voiceMessages) ||
      !calculationSettings ||
      (!selectedChatId && !selectedSessionId)
    )
      return;

    setMakeTextMode(true);
    setAnalysisStarted(true);
    setIsAnalyzing(true);
    setAnalysisError(null);
    setShowModal(false);

    try {
      // Get the combined text from the database based on type
      const makeTextData = selectedChatId
        ? existingMakeTextAnalysis
        : existingVoiceMakeTextAnalysis;
      if (!makeTextData || !makeTextData.combinedText) {
        throw new Error(
          "No combined text found in database. Please create combined text first."
        );
      }

      const makeText = makeTextData.combinedText;

      // Console log the make text data
      console.log("📝 Make Text Analysis - Using saved combined text:", {
        type: selectedChatId ? "text" : "voice",
        textLength: makeText.length,
        textPreview:
          makeText.substring(0, 500) + (makeText.length > 500 ? "..." : ""),
        selectedPrompts: selectedPrompts.length,
        prompts: selectedPrompts.map((promptId) => {
          const prompt = allPrompts.find((p) => p._id === promptId);
          return {
            id: promptId,
            name: prompt?.name || "Unknown",
          };
        }),
      });

      const modelNames = calculationSettings.modelNames;
      const results: string[] = [];
      const analysisResults: Array<{
        modelName: string;
        promptId: string;
        promptName: string;
        promptContent: string;
        temperature: number;
        result: string;
      }> = [];

      // Send make text with each selected prompt to each model
      for (let index = 0; index < selectedPrompts.length; index++) {
        const promptId = selectedPrompts[index];
        const prompt = allPrompts.find((p) => p._id === promptId);

        if (!prompt || !promptId) continue;

        const messages = [
          { role: "system" as const, content: prompt.content },
          { role: "user" as const, content: makeText },
        ];

        console.log(`📤 Sending to model ${modelNames[index]}:`, {
          promptName: prompt.name,
          systemPromptLength: prompt.content.length,
          userTextLength: makeText.length,
          messageCount: messages.length,
          totalCharacters: prompt.content.length + makeText.length,
          estimatedTokens: Math.ceil(
            (prompt.content.length + makeText.length) / 4
          ), // Rough token estimate
          actualMessages: messages.map((msg) => ({
            role: msg.role,
            contentLength: msg.content.length,
            contentPreview: msg.content.substring(0, 100) + "...",
          })),
        });

        console.log("🔍 About to call sendToAI with messages:", {
          requestType: "MAKE_TEXT_ANALYSIS",
          modelIndex: index,
          modelName: modelNames[index],
          messagesLength: messages.length,
          messagesTypes: messages.map((m) => m.role),
        });

        const result = await sendToAI(messages, {
          model: modelNames[index],
          temperature: calculationSettings.temperatures[index],
        });

        if (result) {
          results.push(result);

          // Store for make text analysis database save
          analysisResults.push({
            modelName: modelNames[index],
            promptId,
            promptName: prompt.name,
            promptContent: prompt.content,
            temperature: calculationSettings.temperatures[index],
            result: result,
          });

          // Save analysis with make text mode flag (for compatibility)
          if (selectedChatId) {
            await saveAnalysis({
              chatId: selectedChatId,
              promptId,
              promptName: prompt.name,
              promptContent: prompt.content,
              modelName: modelNames[index],
              temperature: calculationSettings.temperatures[index],
              result: result, // Save full result for make text mode
            });
          } else if (selectedSessionId) {
            await saveVoiceAnalysis({
              sessionId: selectedSessionId,
              promptId,
              promptName: prompt.name,
              promptContent: prompt.content,
              modelName: modelNames[index],
              temperature: calculationSettings.temperatures[index],
              result: result, // Save full result for make text mode
            });
          }
        }
      }

      // Update the Make Text Analysis in the database with results based on type
      if (selectedChatId) {
        await saveMakeTextAnalysis({
          chatId: selectedChatId,
          combinedText: makeText,
          analysisResults: analysisResults,
        });
      } else if (selectedSessionId) {
        await saveVoiceMakeTextAnalysis({
          sessionId: selectedSessionId,
          combinedText: makeText,
          analysisResults: analysisResults,
        });
      }

      setAnalysisResults(results);
    } catch (error) {
      console.error("Make text analysis error:", error);
      setAnalysisError(
        error instanceof Error ? error.message : "Make text analysis failed"
      );
    } finally {
      setIsAnalyzing(false);
    }
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

          // Filter AI content to remove tracking info before sending to analysis models
          const cleanContent =
            role === "assistant"
              ? filterAIMessageForCalculation(msg.content)
              : msg.content;

          const contentWithExchange =
            role === "assistant"
              ? `[Exchange ${exchangeNumber} - Psychiatrist]: ${cleanContent}`
              : `[Exchange ${exchangeNumber} - User]: ${cleanContent}`;

          return {
            role,
            content: contentWithExchange,
          } as OpenRouterMessage;
        }),
      ];

      const result = await sendToAI(messages, {
        model: calculationSettings.singleModelName || "gpt-4o-mini",
        temperature: calculationSettings.singleModelTemperature || 0.7,
      });

      if (result) {
        setSingleModelResult(result);

        if (selectedChatId) {
          await saveAnalysis({
            chatId: selectedChatId,
            promptId: selectedSinglePrompt,
            promptName: prompt?.name || "Single Model Prompt",
            promptContent: prompt?.content || "",
            modelName: calculationSettings.singleModelName || "single-model",
            temperature: calculationSettings.singleModelTemperature || 0.7,
            result: filterAIMessageForDatabase(result),
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
    if ((!conversationHistory && !voiceMessages) || !calculationSettings)
      return;
    setAnalysisStarted(true);
    setIsAnalyzing(true);
    setAnalysisError(null);
    setShowModal(false);

    try {
      const modelNames = calculationSettings.modelNames;

      // Create combined text for multi-model analysis (same as Make Text Analysis)
      const combinedText = selectedChatId
        ? createMakeText()
        : createVoiceMakeText();

      console.log("📝 Multi-Model Analysis - Using combined text approach:", {
        type: selectedChatId ? "text" : "voice",
        textLength: combinedText.length,
        textPreview:
          combinedText.substring(0, 500) +
          (combinedText.length > 500 ? "..." : ""),
        modelCount: modelNames.length,
      });

      const results: string[] = [];

      // Send combined text with each selected prompt to each model
      for (let index = 0; index < selectedPrompts.length; index++) {
        const promptId = selectedPrompts[index];
        const prompt = allPrompts.find((p) => p._id === promptId);

        if (!prompt || !promptId) continue;

        const messages = [
          { role: "system" as const, content: prompt.content },
          { role: "user" as const, content: combinedText },
        ];

        console.log("🔍 About to call sendToAI for Multi-Model Analysis:", {
          requestType: "MULTI_MODEL_ANALYSIS_COMBINED_TEXT",
          modelIndex: index,
          modelName: modelNames[index],
          messagesLength: messages.length,
          messagesTypes: messages.map((m) => m.role),
          isTextChat: !!selectedChatId,
          isVoiceChat: !!selectedSessionId,
          promptName: prompt.name,
          combinedTextLength: combinedText.length,
        });

        const result = await sendToAI(messages, {
          model: modelNames[index],
          temperature: calculationSettings.temperatures[index],
        });

        if (result) {
          results.push(result);
        }
      }

      setAnalysisResults(results);

      // Save analysis results based on type
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
              result: result
                ? filterAIMessageForDatabase(result)
                : "No response",
            });
          })
        );
      } else if (selectedSessionId) {
        await Promise.all(
          results.map(async (result, index) => {
            const promptId = selectedPrompts[index];
            const prompt = allPrompts.find((p) => p._id === promptId);
            await saveVoiceAnalysis({
              sessionId: selectedSessionId,
              promptId,
              promptName: prompt?.name || "Unknown Prompt",
              promptContent: prompt?.content || "",
              modelName: modelNames[index],
              temperature: calculationSettings.temperatures[index],
              result: result
                ? filterAIMessageForDatabase(result)
                : "No response",
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
    console.log("🎨 Formatting analysis result:", {
      resultLength: result.length,
      resultPreview: result.substring(0, 300),
      fullResult: result,
    });

    let cleanedResult = result;

    // Find the first occurrence of any main analysis section header (more flexible patterns)
    const mainSectionPatterns = [
      /# 📋 \*\*HYPERACTIVITY ANALYSIS:/,
      /# 📋 \*\*OPPOSITIONAL BEHAVIOR ANALYSIS:/,
      /# 📋 \*\*COGNITIVE ANALYSIS:/,
      /# 📋 \*\*ADHD INDEX ANALYSIS:/,
      /# 📋 \*\*.*ANALYSIS:/,
      // More flexible patterns for different response formats
      /ADHD.*Assessment.*Report/i,
      /Hyperactivity.*Assessment/i,
      /Oppositional.*Assessment/i,
      /Cognitive.*Assessment/i,
      /ADHD.*Analysis/i,
      /Assessment.*Report/i,
      /Specialist.*Report/i,
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

    // If we found a main section, start from there, otherwise use the full result
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
      // Handle markdown headers
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

      // Handle plain text headers (common patterns)
      if (line.match(/^[A-Z][A-Z\s]+:?\s*$/)) {
        // All caps lines like "ASSESSMENT SUMMARY:" or "COGNITIVE ANALYSIS"
        return `<h3 class="text-lg font-semibold text-slate-800 mt-4 mb-2">${line.trim()}</h3>`;
      }

      if (
        line.match(/^ADHD.*Assessment.*Report/i) ||
        line.match(/^.*Assessment.*Specialist.*Report/i) ||
        line.match(/^Model:.*gpt/i)
      ) {
        // Report titles
        return `<h2 class="text-xl font-bold text-slate-800 mt-6 mb-3">${line.trim()}</h2>`;
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
    setMakeTextMode(false);
  };

  const handleDeleteAndRestart = async () => {
    if (selectedChatId || selectedSessionId) {
      try {
        if (selectedChatId) {
          await deleteAnalysis({ chatId: selectedChatId });
          await deleteMakeTextAnalysis({ chatId: selectedChatId });
        } else if (selectedSessionId) {
          await deleteVoiceAnalysis({ sessionId: selectedSessionId });
          await deleteVoiceMakeTextAnalysis({ sessionId: selectedSessionId });
        }

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
        setMakeTextMode(false);
      } catch (error) {
        console.error("Error deleting analysis:", error);
        setAnalysisError("Failed to delete analysis");
      }
    }
  };

  const enhanceAnalysisWithFullExchanges = (result: string) => {
    const messageHistory = selectedChatId ? conversationHistory : voiceMessages;
    if (!messageHistory) {
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

          for (let i = 0; i < messageHistory.length; i++) {
            const msg = messageHistory[i];
            let msgContent: string;

            if (selectedChatId) {
              // Text chat message
              msgContent = msg.content;
            } else {
              // Voice chat message - safely access transcription
              const voiceMsg = msg as {
                transcription?: string;
                content: string;
              };
              msgContent = voiceMsg.transcription || voiceMsg.content;
            }

            if (
              msg.role === "user" &&
              msgContent.includes(userTextFromAnalysis)
            ) {
              userMsg = msg;
              // Calculate the real exchange number based on position in original conversation
              realExchangeNumber = Math.floor(i / 2) + 1;

              // Find the corresponding assistant/psychiatrist message
              const assistantRole = selectedChatId ? "ai" : "assistant";
              if (i > 0 && messageHistory[i - 1].role === assistantRole) {
                psychiatristMsg = messageHistory[i - 1];
              } else if (
                i < messageHistory.length - 1 &&
                messageHistory[i + 1].role === assistantRole
              ) {
                psychiatristMsg = messageHistory[i + 1];
              }

              break;
            }
          }

          if (psychiatristMsg && userMsg && realExchangeNumber) {
            // Clean psychiatrist content based on message type
            let psychiatristContent: string;
            if (selectedChatId) {
              psychiatristContent = psychiatristMsg.content;
            } else {
              const voicePsychiatristMsg = psychiatristMsg as {
                transcription?: string;
                content: string;
              };
              psychiatristContent =
                voicePsychiatristMsg.transcription ||
                voicePsychiatristMsg.content;
            }

            const cleanPsychiatristContent = psychiatristContent
              .replace(/\*\[.*?\]\*/g, "")
              .replace(/\[.*?\]/g, "")
              .replace(/\*\(.*?\)\*/g, "")
              .replace(/\(.*?\)/g, "")
              .trim();

            // Get user content based on message type
            let userContent: string;
            if (selectedChatId) {
              userContent = userMsg.content;
            } else {
              const voiceUserMsg = userMsg as {
                transcription?: string;
                content: string;
              };
              userContent = voiceUserMsg.transcription || voiceUserMsg.content;
            }

            const fullExchange = `**Exchange ${realExchangeNumber}:**

**${selectedChatId ? "Psychiatrist" : "Assistant"}:** "${cleanPsychiatristContent}"

**User:** "${userContent}"`;

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
                ? "Analyze your text conversation"
                : selectedSessionId
                  ? "Analyze your voice conversation"
                  : "Select a chat to analyze"}
            </p>
          </div>
        </div>
      </div>

      {!selectedChatId && !selectedSessionId ? (
        <div className="flex-1 relative overflow-hidden transition-all duration-300 ease-in-out">
          <div className="absolute inset-0">
            <div className="w-full h-full bg-gradient-to-br from-slate-100 via-white to-slate-50 blur-lg transform scale-110"></div>
          </div>
          <div className="relative z-20 flex flex-col items-center justify-center h-full text-center p-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h3 className="text-xl font-semibold text-slate-800 mb-3">
              No Chat Selected
            </h3>
            <p className="text-slate-500 max-w-sm leading-relaxed">
              Click the arrow button on a text chat or voice chat to start
              analysis.
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
              <button
                onClick={handleMakeTextClick}
                className="w-full bg-green-600 hover:bg-green-700 text-white py-3 px-6 rounded-lg font-medium transition-colors duration-200"
              >
                Make Text Analysis
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
                    : makeTextMode
                      ? "Make Text Analysis Complete"
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
              {/* Two Panel Layout: Left = Analysis Results (70%), Right = Combined Text (30%) */}
              <div className="flex-1 flex overflow-hidden">
                {/* Left Panel - Analysis Results (70%) */}
                <div className="w-[70%] overflow-y-auto p-6 bg-white">
                  <h4 className="font-bold text-slate-800 mb-4">
                    Analysis Results
                  </h4>

                  {analysisResults.length > 0 || singleModelResult ? (
                    <div className="space-y-6">
                      {singleModelMode && singleModelResult ? (
                        // Single model result display
                        <div className="max-w-none bg-slate-50 rounded-lg border border-slate-200 shadow-sm">
                          <div className="p-6">
                            <div className="mb-2 flex flex-col sm:flex-row sm:items-center sm:justify-between">
                              <span className="font-semibold text-slate-700">
                                Model:{" "}
                                {calculationSettings?.singleModelName ||
                                  "Single Model"}
                              </span>
                              <span className="text-sm text-slate-500">
                                Temperature:{" "}
                                {calculationSettings?.singleModelTemperature ||
                                  0.7}
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
                            className="max-w-none bg-slate-50 rounded-lg border border-slate-200 shadow-sm"
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
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                      <p className="text-slate-500 max-w-sm leading-relaxed">
                        Analysis results will appear here after running the
                        analysis.
                      </p>
                    </div>
                  )}
                </div>

                {/* Right Panel - Combined Text (30%) */}
                <div className="w-[30%] border-l border-slate-200 overflow-y-auto p-6 bg-slate-50">
                  <h4 className="font-bold text-slate-800 mb-4">
                    Combined Text
                  </h4>
                  <div className="space-y-4">
                    {existingMakeTextAnalysis?.combinedText ||
                    existingVoiceMakeTextAnalysis?.combinedText ? (
                      <div className="p-4 rounded-lg border border-blue-200 bg-blue-50">
                        <div className="mb-3 flex items-center justify-between">
                          <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded font-medium">
                            Combined Conversation Text
                          </span>
                          <span className="text-xs text-slate-500">
                            {
                              (
                                existingMakeTextAnalysis?.combinedText ||
                                existingVoiceMakeTextAnalysis?.combinedText ||
                                ""
                              ).length
                            }{" "}
                            characters
                          </span>
                        </div>
                        <div
                          className="text-slate-700 text-sm leading-relaxed"
                          dangerouslySetInnerHTML={{
                            __html: (() => {
                              const formattedText =
                                existingMakeTextAnalysis?.combinedText ||
                                existingVoiceMakeTextAnalysis?.combinedText ||
                                "";

                              // Split by double newlines to get exchanges
                              const exchanges = formattedText.split("\n\n");
                              let result = "";

                              exchanges.forEach((exchange) => {
                                if (exchange.trim()) {
                                  // Check if this starts with an exchange number
                                  const exchangeMatch = exchange.match(
                                    /^(Exchange \d+)\s+(user|assistant|mentor|system):\s*([\s\S]*)$/
                                  );

                                  if (exchangeMatch) {
                                    const [, exchangeNum, role, content] =
                                      exchangeMatch;

                                    // Determine styling based on role
                                    const roleColor =
                                      role === "user"
                                        ? "bg-green-100 text-green-800"
                                        : role === "assistant"
                                          ? "bg-blue-100 text-blue-800"
                                          : role === "mentor"
                                            ? "bg-purple-100 text-purple-800"
                                            : "bg-gray-100 text-gray-800";

                                    const borderColor =
                                      role === "user"
                                        ? "border-l-green-400"
                                        : role === "assistant"
                                          ? "border-l-blue-400"
                                          : role === "mentor"
                                            ? "border-l-purple-400"
                                            : "border-l-gray-400";

                                    result += `
                                      <div class="mb-4">
                                        <div class="flex items-center gap-2 mb-2">
                                          <span class="text-xs font-bold px-2 py-1 rounded ${roleColor}">
                                            ${exchangeNum}
                                          </span>
                                          <span class="text-xs font-semibold text-slate-600 capitalize">
                                            ${role}
                                          </span>
                                        </div>
                                        <div class="ml-2 p-3 bg-white rounded border-l-4 ${borderColor} shadow-sm">
                                          <div class="text-slate-700 leading-relaxed">
                                            ${content.trim().replace(/\n/g, "<br>")}
                                          </div>
                                        </div>
                                      </div>
                                    `;
                                  } else {
                                    // Handle any malformed content
                                    result += `<div class="mb-2 p-2 bg-gray-50 rounded text-slate-600 text-xs">${exchange.replace(/\n/g, "<br>")}</div>`;
                                  }
                                }
                              });

                              return result;
                            })(),
                          }}
                        />
                      </div>
                    ) : (
                      <div className="p-4 rounded-lg border border-gray-200 bg-gray-50">
                        <p className="text-gray-500 text-sm">
                          No combined text available. Run Make Text Analysis to
                          generate combined text.
                        </p>
                      </div>
                    )}
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
                <button
                  onClick={handleMakeTextClick}
                  className="w-full bg-green-600 hover:bg-green-700 text-white py-3 px-6 rounded-lg font-medium transition-colors duration-200"
                >
                  Make Text Analysis
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
                : makeTextMode
                  ? "Select Prompts for Make Text Analysis"
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
            ) : makeTextMode ? (
              // Make text mode - show all prompts for selection
              <div className="mb-4">
                <div className="mb-3 p-3 bg-green-50 border-l-4 border-green-400 rounded">
                  <p className="text-sm text-green-800">
                    <strong>✅ Combined Text Created:</strong> The conversation
                    has been successfully combined and saved to the database.
                    Now select prompts for each model to start the analysis.
                  </p>
                </div>
                {modelNames.map((modelName, index) => {
                  const promptsForModel = modelPrompts[index] || [];
                  return (
                    <div key={modelName} className="mb-3">
                      <h4 className="text-slate-700 font-medium text-sm">
                        {modelName} Prompt:
                      </h4>
                      <select
                        value={selectedPrompts[index] || ""}
                        onChange={(e) =>
                          handlePromptSelect(index, e.target.value)
                        }
                        className="w-full border p-2 rounded text-sm"
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
                    : makeTextMode
                      ? handleMakeTextAnalysis
                      : handleStartAnalysis
                }
                className="bg-slate-600 text-white py-2 px-4 rounded-lg disabled:bg-gray-400 disabled:cursor-not-allowed"
                disabled={
                  singleModelMode
                    ? !selectedSinglePrompt
                    : makeTextMode
                      ? selectedPrompts.some((p) => !p) ||
                        !(
                          existingMakeTextAnalysis?.combinedText ||
                          existingVoiceMakeTextAnalysis?.combinedText
                        )
                      : selectedPrompts.some((p) => !p)
                }
              >
                {singleModelMode
                  ? "Start Single Model Analysis"
                  : makeTextMode
                    ? "Start Make Text Analysis"
                    : "Start Multi-Model Analysis"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
