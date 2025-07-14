"use client";

import { ContentType } from "@/types";
import { FC, useState } from "react";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { SidebarSwitcher } from "./sidebar-switcher";
import { SidebarContent } from "./sidebar-content";
import { motion, AnimatePresence } from "framer-motion";

interface SidebarProps {
  contentType: ContentType;
  showSidebar: boolean;
  onCreateChat?: () => void;
  onCreateVoiceChat?: () => void;
  onToggleSidebar?: () => void;
  onContentTypeChange?: (contentType: ContentType) => void;
  onSelectCalculationChat?: (chatId: string) => void;
  onSelectCalculationSession?: (sessionId: string) => void;
  onSelectVoiceCalculationSession?: (sessionId: string) => void;
  onSelectVoiceChat?: (sessionId: string) => void;
}

export const Sidebar: FC<SidebarProps> = ({
  contentType,
  showSidebar,
  onCreateChat,
  onCreateVoiceChat,
  onToggleSidebar,
  onContentTypeChange,
  onSelectCalculationChat,
  onSelectCalculationSession,
  onSelectVoiceCalculationSession,
  onSelectVoiceChat,
}) => {
  const [currentContentType, setCurrentContentType] =
    useState<ContentType>(contentType);

  const handleContentTypeChange = (newContentType: ContentType) => {
    setCurrentContentType(newContentType);
    onContentTypeChange?.(newContentType);
  };

  // Determine if voice assistant is active
  const isVoiceAssistantActive =
    contentType === "voice-assistant" ||
    (contentType === "voice-chats" && !showSidebar); // Always show the sidebar container - only hide the content area
  return (
    <div className="relative h-full">
      <Tabs
        className="flex h-full relative z-30"
        value={currentContentType}
        onValueChange={(value) => setCurrentContentType(value as ContentType)}
      >
        {/* Vertical Tab Switcher - Always visible */}
        <motion.div
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="relative z-40"
        >
          <SidebarSwitcher onContentTypeChange={handleContentTypeChange} />
        </motion.div>

        {/* Tab Content - Conditionally visible with animation */}
        <AnimatePresence mode="wait">
          {showSidebar && currentContentType !== "voice-assistant" && (
            <motion.div
              className="fixed left-24 top-1/2 transform -translate-y-1/2  w-48 h-[80vh] z-30"
              initial={{ x: -50, opacity: 0, scale: 0.95 }}
              animate={{ x: 0, opacity: 1, scale: 1 }}
              exit={{ x: -50, opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
            >
              <div className="h-full bg-white/20 backdrop-blur-xl rounded-2xl border border-white/30 shadow-2xl overflow-hidden">
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: 20, opacity: 0 }}
                  transition={{ duration: 0.3, delay: 0.1 }}
                  className="h-full"
                >
                  <TabsContent value="chats" className="h-full p-0">
                    <SidebarContent
                      contentType="chats"
                      onCreateChat={onCreateChat}
                      onCreateVoiceChat={onCreateVoiceChat}
                      onToggleSidebar={onToggleSidebar}
                      onSelectVoiceChat={onSelectVoiceChat}
                    />
                  </TabsContent>
                  <TabsContent value="voice-chats" className="h-full p-0">
                    <SidebarContent
                      contentType="voice-chats"
                      onCreateVoiceChat={onCreateVoiceChat}
                      onToggleSidebar={onToggleSidebar}
                      onSelectVoiceChat={onSelectVoiceChat}
                      isVoiceAssistantActive={isVoiceAssistantActive}
                    />
                  </TabsContent>
                  <TabsContent value="voice-assistant" className="h-full p-0">
                    <SidebarContent
                      contentType="voice-assistant"
                      onToggleSidebar={onToggleSidebar}
                      onSelectVoiceChat={onSelectVoiceChat}
                    />
                  </TabsContent>
                  <TabsContent value="presets" className="h-full p-0">
                    <SidebarContent
                      contentType="presets"
                      onToggleSidebar={onToggleSidebar}
                      onSelectVoiceChat={onSelectVoiceChat}
                    />
                  </TabsContent>
                  <TabsContent value="prompts" className="h-full p-0">
                    <SidebarContent
                      contentType="prompts"
                      onToggleSidebar={onToggleSidebar}
                      onSelectVoiceChat={onSelectVoiceChat}
                    />
                  </TabsContent>
                  <TabsContent value="settings" className="h-full p-0">
                    <SidebarContent
                      contentType="settings"
                      onToggleSidebar={onToggleSidebar}
                      onSelectVoiceChat={onSelectVoiceChat}
                    />
                  </TabsContent>
                  <TabsContent
                    value="calculation-settings"
                    className="h-full p-0"
                  >
                    <SidebarContent
                      contentType="calculation-settings"
                      onToggleSidebar={onToggleSidebar}
                      onSelectVoiceChat={onSelectVoiceChat}
                    />
                  </TabsContent>
                  <TabsContent value="import-export" className="h-full p-0">
                    <SidebarContent
                      contentType="import-export"
                      onToggleSidebar={onToggleSidebar}
                      onSelectVoiceChat={onSelectVoiceChat}
                    />
                  </TabsContent>
                </motion.div>
              </div>
            </motion.div>
          )}

          {/* Special floating sidebar for calculation modes */}
          {showSidebar &&
            (currentContentType === "calculate-score" ||
              currentContentType === "calculation-settings" ||
              currentContentType === "voice-calculate-score") && (
              <motion.div
                className="fixed left-24 top-1/2 transform -translate-y-1/2 w-52 h-[85vh] z-30"
                initial={{ x: -50, opacity: 0, scale: 0.95 }}
                animate={{ x: 0, opacity: 1, scale: 1 }}
                exit={{ x: -50, opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.4, ease: "easeInOut" }}
              >
                <div className="h-full bg-white/20 backdrop-blur-xl rounded-2xl border border-white/30 shadow-2xl overflow-hidden">
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 20, opacity: 0 }}
                    transition={{ duration: 0.3, delay: 0.1 }}
                    className="h-full"
                  >
                    <TabsContent value="calculate-score" className="h-full p-0">
                      <SidebarContent
                        contentType="calculate-score"
                        onToggleSidebar={onToggleSidebar}
                        onSelectCalculationChat={onSelectCalculationChat}
                        onSelectCalculationSession={onSelectCalculationSession}
                        onSelectVoiceChat={onSelectVoiceChat}
                      />
                    </TabsContent>
                    <TabsContent
                      value="voice-calculate-score"
                      className="h-full p-0"
                    >
                      <SidebarContent
                        contentType="voice-calculate-score"
                        onToggleSidebar={onToggleSidebar}
                        onSelectVoiceCalculationSession={
                          onSelectVoiceCalculationSession
                        }
                        onSelectVoiceChat={onSelectVoiceChat}
                      />
                    </TabsContent>
                    <TabsContent
                      value="calculation-settings"
                      className="h-full p-0"
                    >
                      <SidebarContent
                        contentType="calculation-settings"
                        onToggleSidebar={onToggleSidebar}
                        onSelectVoiceChat={onSelectVoiceChat}
                      />
                    </TabsContent>
                  </motion.div>
                </div>
              </motion.div>
            )}
        </AnimatePresence>
      </Tabs>
    </div>
  );
};
