"use client";

import { FC, useCallback, useRef, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { ChatMessages } from "./chat-messages";
import { ChatInput } from "./chat-input";
import { useOpenRouter } from "@/hooks/useOpenRouter";
import { useAssistantAnalysis } from "@/hooks/useAssistantAnalysis";
import { useMentorAnalysis } from "@/hooks/useMentorAnalysis";
import { SetupInstructions } from "@/components/setup-instructions";
import { motion, AnimatePresence } from "framer-motion";

interface ChatUIProps {
  chatId: string | null;
}

export const ChatUI: FC<ChatUIProps> = ({ chatId }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messages = useQuery(
    api.messages.getMessages,
    chatId ? { chatId } : "skip"
  );

  const messagesForUI = useQuery(
    api.messages.getMessagesForUI,
    chatId ? { chatId } : "skip"
  );

  const chats = useQuery(api.messages.getChats);
  const currentChat = chats?.find((chat) => chat._id === chatId);
  const sendMessage = useMutation(api.messages.sendMessage);
  const updateChatTitle = useMutation(api.messages.updateChatTitle);
  // Get API settings from database
  const apiSettings = useQuery(api.settings.getApiSettings);
  const apiKey = apiSettings?.apiKey; // Get assistant configuration and prompts
  const assistantConfig = useQuery(api.assistants.getDefaultAssistant);
  // Get mentor configuration and prompts
  const mentorConfig = useQuery(api.mentors.getDefaultMentor);

  const {
    sendMessage: sendToOpenRouter,
    isGenerating: isOpenRouterGenerating,
    error: openRouterError,
  } = useOpenRouter(apiKey);
  const { analyzeConversation, isAnalyzing: isAssistantAnalyzing } =
    useAssistantAnalysis(apiKey);
  const { analyzeMentorInput, isAnalyzing: isMentorAnalyzing } =
    useMentorAnalysis(apiKey);
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []); // Calculate if this is the first message (no user/ai messages exist yet, excluding assistant messages)
  const isFirstMessage =
    (messagesForUI || []).filter(
      (msg) => msg.role === "user" || msg.role === "ai"
    ).length === 0;

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);
  const handleSendMessage = useCallback(
    async (
      content: string,
      systemPrompt?: string,
      assistantPrompt?: string,
      mentorPrompt?: string
    ) => {
      if (!chatId || !content.trim() || isOpenRouterGenerating) return;

      try {
        // Check if this is the first message in the chat
        const currentMessages = messages || [];
        const isFirstMessage = currentMessages.length === 0;

        // Send user message (only the actual user content, never the prompt)
        await sendMessage({
          chatId,
          content,
          role: "user",
        }); // Update chat title with first message (truncated)
        if (isFirstMessage) {
          const title =
            content.length > 50 ? content.substring(0, 47) + "..." : content;
          await updateChatTitle({
            chatId,
            title,
          });
        } // Prepare conversation history - only user and ai messages for main AI model
        // Exclude assistant messages as they are analysis/suggestions, not part of main conversation
        const conversationHistory = (messages || [])
          .filter((msg) => msg.role !== "system" && msg.role !== "assistant") // Exclude system and assistant messages
          .map((msg) => ({
            role: msg.role as "user" | "ai",
            content: msg.content,
          }));

        // Add the new user message to conversation history
        conversationHistory.push({
          role: "user" as const,
          content,
        }); // Check if we should run assistant analysis
        let assistantAnalysis = "";
        const shouldRunAssistantAnalysis =
          assistantConfig?.isDefault && assistantPrompt;

        if (shouldRunAssistantAnalysis) {
          // Calculate total exchanges based on user+ai pairs (excluding assistant messages)
          const userAiMessages = (messages || []).filter(
            (msg) => msg.role === "user" || msg.role === "ai"
          );
          const totalExchanges = Math.floor((userAiMessages.length + 1) / 2); // +1 for current user message          // Check if we should trigger analysis based on configuration
          const shouldTrigger =
            totalExchanges === 10 || // First activation after 10 exchanges
            (totalExchanges > 10 &&
              (totalExchanges - 10) %
                (assistantConfig.activeAfterQuestions || 3) ===
                0); // Then every N exchanges based on setting

          console.log("🤖 Assistant Analysis Check:", {
            totalExchanges,
            shouldTrigger,
            activeAfterQuestions: assistantConfig.activeAfterQuestions,
            hasAssistantPrompt: !!assistantPrompt,
            assistantConfigDefault: assistantConfig.isDefault,
          });

          if (shouldTrigger) {
            console.log("🔍 Triggering assistant analysis...");

            try {
              const analysis = await analyzeConversation(
                conversationHistory,
                assistantPrompt,
                {
                  modelName: assistantConfig.modelName,
                  temperature: assistantConfig.temperature,
                }
              );
              if (analysis) {
                assistantAnalysis = analysis;
                console.log(
                  "✅ Assistant analysis completed:",
                  analysis.substring(0, 100) + "..."
                );

                // Save assistant analysis as a separate message with role "assistant"
                await sendMessage({
                  chatId,
                  content: analysis,
                  role: "assistant",
                });
              } else {
                console.warn("⚠️ Assistant analysis returned empty result");
              }
            } catch (error) {
              console.error("❌ Assistant analysis failed:", error);
              // Continue without analysis if it fails
            }
          }
        }

        // Check if we should run mentor analysis
        let mentorAnalysis = "";
        const shouldRunMentorAnalysis = mentorConfig?.isDefault && mentorPrompt;

        if (shouldRunMentorAnalysis) {
          // Calculate total exchanges based on user+ai pairs (excluding assistant and mentor messages)
          const userAiMessages = (messages || []).filter(
            (msg) => msg.role === "user" || msg.role === "ai"
          );
          const totalExchanges = Math.floor((userAiMessages.length + 1) / 2); // +1 for current user message          // Mentor activates initially after 6 exchanges, then based on activeAfterQuestions
          const shouldTrigger =
            totalExchanges === 6 || // First activation after 6 exchanges
            (totalExchanges > 6 &&
              (totalExchanges - 6) %
                (mentorConfig.activeAfterQuestions || 3) ===
                0); // Then every N exchanges based on setting

          console.log("🧭 Mentor Analysis Check:", {
            totalExchanges,
            shouldTrigger,
            activeAfterQuestions: mentorConfig.activeAfterQuestions,
            hasMentorPrompt: !!mentorPrompt,
            mentorConfigDefault: mentorConfig.isDefault,
          });
          if (shouldTrigger) {
            console.log("🧭 Triggering mentor analysis...");

            try {
              // Prepare conversation history for mentor (including the new user message)
              const mentorConversationHistory = [
                ...conversationHistory.map((msg) => ({
                  role: msg.role,
                  content: msg.content,
                  timestamp: Date.now(), // We don't have original timestamps, use current
                })),
              ];

              const analysis = await analyzeMentorInput(
                mentorConversationHistory, // Send full conversation history to mentor
                mentorPrompt,
                {
                  modelName: mentorConfig.modelName,
                  temperature: mentorConfig.temperature,
                }
              );
              if (analysis) {
                mentorAnalysis = analysis;
                console.log(
                  "✅ Mentor analysis completed:",
                  analysis.substring(0, 100) + "..."
                );

                // Save mentor analysis as a separate message with role "mentor"
                await sendMessage({
                  chatId,
                  content: analysis,
                  role: "mentor",
                });
              } else {
                console.warn("⚠️ Mentor analysis returned empty result");
              }
            } catch (error) {
              console.error("❌ Mentor analysis failed:", error);
              // Continue without analysis if it fails
            }
          }
        }

        // Prepare enhanced system prompt with assistant and mentor analysis
        let enhancedSystemPrompt = systemPrompt || "";

        // Add assistant analysis first (if available)
        if (assistantAnalysis) {
          enhancedSystemPrompt = `${systemPrompt || ""}

ASSISTANT ANALYSIS (PRIORITY EXECUTION):
${assistantAnalysis}`;
        }

        // Add mentor analysis second (if available)
        if (mentorAnalysis) {
          enhancedSystemPrompt = `${enhancedSystemPrompt}

MENTOR GUIDANCE:
${mentorAnalysis}`;
        }

        // Add instruction if we have any analysis
        if (assistantAnalysis || mentorAnalysis) {
          enhancedSystemPrompt += `

Please incorporate this guidance into your response while maintaining your natural conversation style.`;
          console.log("🎯 Enhanced system prompt with analysis");
        }

        // Prepare conversation history for main model - exclude assistant and mentor messages
        const mainConversationHistory = (messages || [])
          .filter(
            (msg) =>
              msg.role !== "system" &&
              msg.role !== "assistant" &&
              msg.role !== "mentor"
          ) // Exclude system, assistant, and mentor messages
          .map((msg) => ({
            role: msg.role as "user" | "ai",
            content: msg.content,
          }));

        // Add the new user message to conversation history
        mainConversationHistory.push({
          role: "user" as const,
          content,
        });

        // Prepare API messages in the specified order:
        // 1. Assistant analysis, 2. Mentor analysis, 3. Main prompt, 4. Conversation history, 5. User input
        const apiMessages = []; // Always add system prompt first if provided
        if (enhancedSystemPrompt) {
          apiMessages.push({
            role: "system" as const,
            content: enhancedSystemPrompt,
          });
        }

        // Add conversation history - map 'ai' to 'assistant' for OpenRouter
        apiMessages.push(
          ...mainConversationHistory.map((msg) => ({
            role: msg.role === "ai" ? ("assistant" as const) : msg.role,
            content: msg.content,
          }))
        ); // Get AI response from OpenRouter
        console.log(
          "🚀 Sending to OpenRouter with messages:",
          apiMessages.length,
          "messages"
        );
        if (apiKey && sendToOpenRouter && apiSettings?.modelName) {
          const aiResponse = await sendToOpenRouter(apiMessages, {
            model: apiSettings.modelName,
            temperature: apiSettings?.temperature ?? 0.0,
          });
          if (aiResponse) {
            await sendMessage({
              chatId,
              content: aiResponse,
              role: "ai",
            });
          } else {
            // Fallback response if OpenRouter fails
            await sendMessage({
              chatId,
              content:
                openRouterError ||
                "Sorry, I encountered an error processing your request. Please try again.",
              role: "ai",
            });
          }
        } else {
          // Error when no API key or model is configured
          let errorMessage = "Configuration required to enable AI responses: ";
          const missingItems = [];

          if (!apiKey) missingItems.push("OpenRouter API key");
          if (!apiSettings?.modelName) missingItems.push("Model name");

          errorMessage += missingItems.join(" and ");
          errorMessage += ". Please configure these in settings.";

          await sendMessage({
            chatId,
            content: errorMessage,
            role: "ai",
          });
        }
      } catch (error) {
        console.error("Error sending message:", error);
        await sendMessage({
          chatId,
          content:
            "An error occurred while processing your message. Please try again.",
          role: "ai",
        });
      }
    },
    [
      chatId,
      sendMessage,
      updateChatTitle,
      messages,
      apiKey,
      apiSettings,
      sendToOpenRouter,
      openRouterError,
      isOpenRouterGenerating,
      assistantConfig,
      analyzeConversation,
      mentorConfig,
      analyzeMentorInput,
    ]
  );

  const handleStopGeneration = useCallback(() => {}, []);

  const handleEditMessage = useCallback((messageId: string) => {
    console.log("Edit message:", messageId);
    // TODO: Implement message editing
  }, []);
  const handleRegenerateMessage = useCallback((messageId: string) => {
    console.log("Regenerate message:", messageId);
    // TODO: Implement message regeneration
  }, []);
  // Show empty state when no chat is selected
  if (!chatId) {
    return (
      <motion.div
        className="flex h-full flex-col bg-white/95 backdrop-blur-xl"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* Chat Header */}
        <motion.div
          className="flex h-14 items-center justify-center border-b border-white/30 bg-white/50 backdrop-blur-xl px-4"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.4 }}
        >
          <h1 className="text-lg font-semibold text-gray-900">Welcome</h1>
        </motion.div>

        {/* Empty State */}
        <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-white/90 to-gray-50/90 backdrop-blur-xl">
          <motion.div
            className="text-center max-w-md mx-auto p-8"
            initial={{ scale: 0.9, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{
              delay: 0.4,
              duration: 0.6,
              type: "spring",
              bounce: 0.2,
            }}
          >
            <div className="mb-6">
              <motion.div
                className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-500/20 to-purple-500/20 backdrop-blur-xl rounded-full flex items-center justify-center border border-white/30"
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{
                  delay: 0.6,
                  duration: 0.8,
                  type: "spring",
                  bounce: 0.3,
                }}
                whileHover={{ scale: 1.1, rotate: 5 }}
              >
                <motion.svg
                  className="w-8 h-8 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8 }}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </motion.svg>
              </motion.div>
              <motion.h2
                className="text-xl font-semibold text-gray-900 mb-2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9, duration: 0.4 }}
              >
                Start a new conversation
              </motion.h2>
              <motion.p
                className="text-gray-600 mb-6"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.0, duration: 0.4 }}
              >
                Click on &quot;New Chat&quot; in the sidebar to begin your first
                conversation.
              </motion.p>
            </div>
          </motion.div>
        </div>
      </motion.div>
    );
  }
  return (
    <motion.div
      className="flex h-full flex-col bg-white/95 backdrop-blur-xl"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Chat Header */}
      <motion.div
        className="flex h-14 items-center justify-center border-b border-white/30 bg-white/50 backdrop-blur-xl px-4"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.4 }}
      >
        <motion.h1
          className="text-lg font-semibold text-gray-900"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.3 }}
        >
          {currentChat?.title || "Chat"}
        </motion.h1>
      </motion.div>

      {/* Messages */}
      <motion.div
        className="flex-1 overflow-y-auto bg-gradient-to-br from-white/90 to-gray-50/90 backdrop-blur-xl"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        <div className="mx-auto max-w-3xl">
          {/* Show setup instructions when no API key */}
          {!apiKey && (!messages || messages.length === 0) && (
            <motion.div
              className="flex h-full items-center justify-center p-8"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.6 }}
            >
              <SetupInstructions show={true} />
            </motion.div>
          )}{" "}
          <AnimatePresence mode="wait">
            {" "}
            <ChatMessages
              messages={(messages || [])
                .filter((msg) => msg.role !== "system") // Hide system messages from UI, but show assistant and mentor
                .map((msg) => ({
                  _id: msg._id,
                  content: msg.content,
                  role: msg.role as "user" | "ai" | "assistant" | "mentor",
                  timestamp: msg.timestamp,
                  chatId: msg.chatId,
                }))}
              onEditMessage={handleEditMessage}
              onRegenerateMessage={handleRegenerateMessage}
              isGenerating={isOpenRouterGenerating}
            />
          </AnimatePresence>
        </div>
        <div ref={messagesEndRef} />
      </motion.div>

      {/* Chat Input */}
      <motion.div
        className="border-t border-white/30 bg-white/50 backdrop-blur-xl p-4"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.5 }}
      >
        {" "}
        <ChatInput
          onSendMessage={handleSendMessage}
          isGenerating={isOpenRouterGenerating}
          isAssistantAnalyzing={isAssistantAnalyzing}
          isMentorAnalyzing={isMentorAnalyzing}
          isFirstMessage={isFirstMessage}
          onStopGeneration={handleStopGeneration}
        />
      </motion.div>
    </motion.div>
  );
};
