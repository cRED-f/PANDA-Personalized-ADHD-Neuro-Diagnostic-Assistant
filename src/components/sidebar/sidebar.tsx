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
  onToggleSidebar?: () => void;
  onContentTypeChange?: (contentType: ContentType) => void;
  onSelectCalculationChat?: (chatId: string) => void;
}

export const Sidebar: FC<SidebarProps> = ({
  contentType,
  showSidebar,
  onCreateChat,
  onToggleSidebar,
  onContentTypeChange,
  onSelectCalculationChat,
}) => {
  const [currentContentType, setCurrentContentType] =
    useState<ContentType>(contentType);

  const handleContentTypeChange = (newContentType: ContentType) => {
    setCurrentContentType(newContentType);
    onContentTypeChange?.(newContentType);
  }; // Always show the sidebar container - only hide the content area
  return (
    <div className="flex h-full">
      <Tabs
        className="flex h-full"
        value={currentContentType}
        onValueChange={(value) => setCurrentContentType(value as ContentType)}
      >
        {/* Vertical Tab Switcher - Always visible */}
        <motion.div
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <SidebarSwitcher onContentTypeChange={handleContentTypeChange} />
        </motion.div>

        {/* Tab Content - Conditionally visible with animation */}
        <AnimatePresence mode="wait">
          {showSidebar && (
            <motion.div
              className="w-64 flex-1 items-center overflow-hidden"
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 256, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
            >
              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -20, opacity: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
              >
                <TabsContent value="chats" className="h-full p-0">
                  <SidebarContent
                    contentType="chats"
                    onCreateChat={onCreateChat}
                    onToggleSidebar={onToggleSidebar}
                  />
                </TabsContent>
                <TabsContent value="presets" className="h-full p-0">
                  <SidebarContent
                    contentType="presets"
                    onToggleSidebar={onToggleSidebar}
                  />
                </TabsContent>
                <TabsContent value="prompts" className="h-full p-0">
                  <SidebarContent
                    contentType="prompts"
                    onToggleSidebar={onToggleSidebar}
                  />
                </TabsContent>
                <TabsContent value="assistants" className="h-full p-0">
                  <SidebarContent
                    contentType="assistants"
                    onToggleSidebar={onToggleSidebar}
                  />
                </TabsContent>
                <TabsContent value="tools" className="h-full p-0">
                  <SidebarContent
                    contentType="tools"
                    onToggleSidebar={onToggleSidebar}
                  />
                </TabsContent>{" "}
                <TabsContent value="settings" className="h-full p-0">
                  <SidebarContent
                    contentType="settings"
                    onToggleSidebar={onToggleSidebar}
                  />
                </TabsContent>{" "}
                <TabsContent value="calculate-score" className="h-full p-0">
                  <SidebarContent
                    contentType="calculate-score"
                    onToggleSidebar={onToggleSidebar}
                    onSelectCalculationChat={onSelectCalculationChat}
                  />
                </TabsContent>
                <TabsContent
                  value="calculation-settings"
                  className="h-full p-0"
                >
                  <SidebarContent
                    contentType="calculation-settings"
                    onToggleSidebar={onToggleSidebar}
                  />
                </TabsContent>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </Tabs>
    </div>
  );
};
