"use client";

import { FC, useCallback, useRef, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { ChatMessages } from "./chat-messages";
import { ChatInput } from "./chat-input";
import { useAI } from "@/hooks/useAI";
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
  const apiKey = apiSettings?.apiKey;
  const provider = apiSettings?.provider || "OpenAI";

  const {
    sendMessage: sendToAI,
    isGenerating: isAIGenerating,
    error: aiError,
  } = useAI(provider as "OpenAI" | "OpenRouter", apiKey);
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
    async (content: string, systemPrompt?: string) => {
      if (!chatId || !content.trim() || isAIGenerating) return;

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
        const conversationHistory = (messages || [])
          .filter((msg) => msg.role !== "system") // Exclude system messages
          .map((msg) => ({
            role: msg.role as "user" | "ai",
            content: msg.content,
          }));

        // Add the new user message to conversation history
        conversationHistory.push({
          role: "user" as const,
          content,
        });

        // Prepare API messages in the specified order:
        // 1. System prompt (if provided), 2. Conversation history, 3. User input
        const apiMessages = [];

        // Always add system prompt first if provided
        if (systemPrompt) {
          apiMessages.push({
            role: "system" as const,
            content: systemPrompt,
          });
        }

        // Add conversation history - map 'ai' to 'assistant' for both APIs
        apiMessages.push(
          ...conversationHistory.map((msg) => ({
            role: msg.role === "ai" ? ("assistant" as const) : msg.role,
            content: msg.content,
          }))
        ); // Get AI response
        console.log(
          `🚀 Sending to ${provider} with messages:`,
          apiMessages.length,
          "messages"
        );
        if (apiKey && sendToAI && apiSettings?.modelName) {
          const aiResponse = await sendToAI(apiMessages, {
            model: apiSettings.modelName,
            temperature: apiSettings?.temperature ?? 0.0,
          });
          if (aiResponse) {
            // Save the complete AI response to database (including tracking info)
            await sendMessage({
              chatId,
              content: aiResponse,
              role: "ai",
            });
          } else {
            // Fallback response if AI fails
            await sendMessage({
              chatId,
              content:
                aiError ||
                "Sorry, I encountered an error processing your request. Please try again.",
              role: "ai",
            });
          }
        } else {
          // Error when no API key or model is configured
          let errorMessage = "Configuration required to enable AI responses: ";
          const missingItems = [];

          if (!apiKey) missingItems.push(`${provider} API key`);
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
      sendToAI,
      aiError,
      isAIGenerating,
      provider,
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
                .filter((msg) => msg.role !== "system") // Hide system messages from UI
                .map((msg) => ({
                  _id: msg._id,
                  content: msg.content,
                  role: msg.role as "user" | "ai",
                  timestamp: msg.timestamp,
                  chatId: msg.chatId,
                }))}
              onEditMessage={handleEditMessage}
              onRegenerateMessage={handleRegenerateMessage}
              isGenerating={isAIGenerating}
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
          isGenerating={isAIGenerating}
          isFirstMessage={isFirstMessage}
          onStopGeneration={handleStopGeneration}
        />
      </motion.div>
    </motion.div>
  );
};
