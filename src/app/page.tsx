"use client";

import React, { useEffect, useCallback, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Sidebar } from "@/components/sidebar/sidebar";
import { ChatUI } from "@/components/chat/chat-ui";
import { ChatProvider, useChatContext } from "@/contexts/chat-context";
import { Button } from "@/components/ui/button";
import { IconChevronRight } from "@tabler/icons-react";
import { WithTooltip } from "@/components/ui/with-tooltip";
import { motion, AnimatePresence } from "framer-motion";
import { ContentType } from "@/types";
import { CalculationInterface } from "@/components/calculation/calculation-interface";

function HomeContent() {
  const { currentChatId, setCurrentChatId } = useChatContext();
  const createChat = useMutation(api.messages.createChat);
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [currentContentType, setCurrentContentType] =
    useState<ContentType>("chats");
  const [selectedCalculationChatId, setSelectedCalculationChatId] = useState<
    string | null
  >(null);

  const chats = useQuery(api.messages.getChats);

  const renderMainContent = () => {
    switch (currentContentType) {
      case "calculate-score":
      case "calculation-settings":
        return (
          <CalculationInterface selectedChatId={selectedCalculationChatId} />
        );
      default:
        return <ChatUI chatId={currentChatId} />;
    }
  };

  const handleNewChat = useCallback(async () => {
    const chatId = await createChat({ title: "New Chat" });
    setCurrentChatId(chatId);
  }, [createChat, setCurrentChatId]);

  // Set current chat to first available chat if none is selected and chats exist
  // Also validate that saved chat ID still exists
  useEffect(() => {
    const chatList = chats || [];

    if (chatList.length > 0) {
      // If we have a current chat ID, verify it still exists
      if (currentChatId) {
        const chatExists = chatList.some((chat) => chat._id === currentChatId);
        if (!chatExists) {
          // Saved chat no longer exists, clear it and set to first available
          setCurrentChatId(chatList[0]._id);
        }
      } else {
        // No current chat selected, set to first available
        setCurrentChatId(chatList[0]._id);
      }
    } else if (currentChatId) {
      // No chats exist but we have a current chat ID, clear it
      setCurrentChatId(null);
    }
  }, [chats, currentChatId, setCurrentChatId]);

  return (
    <motion.div
      className="h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 relative overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
    >
      {/* Animated background blur elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-20 -left-40 w-80 h-80 bg-gradient-to-r from-blue-200/30 to-purple-200/30 rounded-full blur-3xl"
          animate={{
            x: [0, 100, 0],
            y: [0, -50, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute bottom-20 -right-40 w-96 h-96 bg-gradient-to-r from-pink-200/25 to-orange-200/25 rounded-full blur-3xl"
          animate={{
            x: [0, -80, 0],
            y: [0, 30, 0],
            scale: [1, 0.8, 1],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute top-1/2 left-1/2 w-64 h-64 bg-gradient-to-r from-green-200/20 to-teal-200/20 rounded-full blur-3xl"
          animate={{
            x: [0, 60, -60, 0],
            y: [0, -40, 40, 0],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 30,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </div>

      {/* Fixed Sidebar */}
      <motion.div
        className="fixed left-0 top-0 h-full z-10 isolate"
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
      >
        <div className="backdrop-blur-xl bg-white/80 border-r border-white/20 h-full">
          <Sidebar
            contentType={currentContentType}
            showSidebar={sidebarVisible}
            onCreateChat={handleNewChat}
            onToggleSidebar={() => setSidebarVisible(!sidebarVisible)}
            onContentTypeChange={setCurrentContentType}
            onSelectCalculationChat={setSelectedCalculationChatId}
          />
        </div>
      </motion.div>

      {/* Show Sidebar Button - positioned in header area when sidebar is hidden */}
      <AnimatePresence>
        {!sidebarVisible && (
          <motion.div
            className="fixed left-16 top-3 z-50"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <WithTooltip
              delayDuration={200}
              side="right"
              display={<div className="text-sm">Show Sidebar</div>}
              trigger={
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 rounded-md bg-white/80 backdrop-blur-md text-gray-600 shadow-lg ring-1 ring-white/20 hover:bg-white/90 hover:text-gray-900 hover:ring-gray-300 transition-all duration-200"
                    onClick={() => setSidebarVisible(true)}
                  >
                    <IconChevronRight size={16} />
                  </Button>
                </motion.div>
              }
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Chat Area with left margin and animation */}
      <motion.div
        className="h-full flex flex-col transition-all duration-300"
        style={{
          marginLeft: sidebarVisible ? "320px" : "56px",
        }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.4, ease: "easeOut" }}
      >
        <div className="backdrop-blur-sm bg-white/70 h-full">
          {renderMainContent()}
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function Home() {
  return (
    <ChatProvider>
      <HomeContent />
    </ChatProvider>
  );
}
