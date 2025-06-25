"use client";

import { ContentType } from "@/types";
import { FC } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { SidebarCreateButtons } from "./sidebar-create-buttons";
import { SidebarDataList } from "./sidebar-data-list";
import { IconChevronLeft } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { ApiSettings } from "../settings/api-settings";
import { ModelPresets } from "../settings/model-presets";
import { PromptsManager } from "../prompts/prompts-manager";
import { AssistantsManager } from "../assistants/assistants-manager";
import { MentorsManager } from "../mentors/mentors-manager";
import CalculationSettings from "../calculation/calculation-settings";
import CalculateScore from "../calculation/calculate-score";
import { motion } from "framer-motion";

interface SidebarContentProps {
  contentType: ContentType;
  onCreateChat?: () => void;
  onToggleSidebar?: () => void;
  onSelectCalculationChat?: (chatId: string) => void;
}

export const SidebarContent: FC<SidebarContentProps> = ({
  contentType,
  onCreateChat,
  onToggleSidebar,
  onSelectCalculationChat,
}) => {
  const chats = useQuery(api.messages.getChats) || [];
  const renderSidebarContent = (
    contentType: ContentType,
    data: unknown[],
    folders: unknown[] = []
  ) => {
    // Special handling for settings
    if (contentType === "settings") {
      return (
        <motion.div
          className="flex h-full flex-col bg-white/90 backdrop-blur-xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          {/* Header with Hide Button */}
          <motion.div
            className="flex items-center justify-between border-b border-white/20 p-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <h2 className="text-sm font-medium text-gray-900">Settings</h2>
            {onToggleSidebar && (
              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 rounded-md text-gray-500 hover:bg-white/50 hover:text-gray-700 transition-colors duration-200"
                  onClick={onToggleSidebar}
                >
                  <IconChevronLeft size={16} />
                </Button>
              </motion.div>
            )}
          </motion.div>

          {/* Settings Content */}
          <motion.div
            className="flex-1 overflow-y-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <ApiSettings />
          </motion.div>
        </motion.div>
      );
    } // Special handling for presets
    if (contentType === "presets") {
      return (
        <motion.div
          className="flex h-full flex-col bg-white/90 backdrop-blur-xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          {/* Header with Hide Button */}
          <motion.div
            className="flex items-center justify-between border-b border-white/20 p-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <h2 className="text-sm font-medium text-gray-900">Model Presets</h2>
            {onToggleSidebar && (
              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 rounded-md text-gray-500 hover:bg-white/50 hover:text-gray-700 transition-colors duration-200"
                  onClick={onToggleSidebar}
                >
                  <IconChevronLeft size={16} />
                </Button>
              </motion.div>
            )}
          </motion.div>

          {/* Presets Content */}
          <motion.div
            className="flex-1 overflow-y-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <ModelPresets />
          </motion.div>
        </motion.div>
      );
    }

    // Special handling for prompts
    if (contentType === "prompts") {
      return (
        <motion.div
          className="flex h-full flex-col bg-white/90 backdrop-blur-xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          {/* Header with Hide Button */}
          <motion.div
            className="flex items-center justify-between border-b border-white/20 p-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <h2 className="text-sm font-medium text-gray-900">Prompts</h2>
            {onToggleSidebar && (
              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 rounded-md text-gray-500 hover:bg-white/50 hover:text-gray-700 transition-colors duration-200"
                  onClick={onToggleSidebar}
                >
                  <IconChevronLeft size={16} />
                </Button>
              </motion.div>
            )}
          </motion.div>

          {/* Prompts Content */}
          <motion.div
            className="flex-1 overflow-y-auto p-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <PromptsManager />
          </motion.div>
        </motion.div>
      );
    } // Special handling for assistants
    if (contentType === "assistants") {
      return (
        <motion.div
          className="flex h-full flex-col bg-white/90 backdrop-blur-xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          {/* Header with Hide Button */}
          <motion.div
            className="flex items-center justify-between border-b border-white/20 p-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <h2 className="text-sm font-medium text-gray-900">Assistants</h2>
            {onToggleSidebar && (
              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 rounded-md text-gray-500 hover:bg-white/50 hover:text-gray-700 transition-colors duration-200"
                  onClick={onToggleSidebar}
                >
                  <IconChevronLeft size={16} />
                </Button>
              </motion.div>
            )}
          </motion.div>

          {/* Assistants Content */}
          <motion.div
            className="flex-1 overflow-y-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <AssistantsManager />
          </motion.div>
        </motion.div>
      );
    }

    // Special handling for mentor (tools)
    if (contentType === "tools") {
      return (
        <motion.div
          className="flex h-full flex-col bg-white/90 backdrop-blur-xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          {/* Header with Hide Button */}
          <motion.div
            className="flex items-center justify-between border-b border-white/20 p-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <h2 className="text-sm font-medium text-gray-900">Mentor</h2>
            {onToggleSidebar && (
              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 rounded-md text-gray-500 hover:bg-white/50 hover:text-gray-700 transition-colors duration-200"
                  onClick={onToggleSidebar}
                >
                  <IconChevronLeft size={16} />
                </Button>
              </motion.div>
            )}
          </motion.div>
          {/* Mentor Content */}{" "}
          <motion.div
            className="flex-1 overflow-y-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <MentorsManager />
          </motion.div>
        </motion.div>
      );
    } // Special handling for calculation settings
    if (contentType === "calculation-settings") {
      return (
        <div className="h-full">
          <CalculationSettings onToggleSidebar={onToggleSidebar} />
        </div>
      );
    } // Special handling for calculate score
    if (contentType === "calculate-score") {
      return (
        <div className="h-full">
          <CalculateScore
            onToggleSidebar={onToggleSidebar}
            onSelectCalculationChat={onSelectCalculationChat}
          />
        </div>
      );
    }

    return (
      <motion.div
        className="flex h-full flex-col bg-white/90 backdrop-blur-xl"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {" "}
        {/* Header with Hide Button */}
        <motion.div
          className="flex items-center justify-between border-b border-white/20 p-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-sm font-medium text-gray-900">
            {contentType.charAt(0).toUpperCase() + contentType.slice(1)}
          </h2>
          {onToggleSidebar && (
            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 rounded-md text-gray-500 hover:bg-white/50 hover:text-gray-700 transition-colors duration-200"
                onClick={onToggleSidebar}
              >
                <IconChevronLeft size={16} />
              </Button>
            </motion.div>
          )}
        </motion.div>
        {/* Create Button */}
        <motion.div
          className="p-3 border-b border-white/20"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <SidebarCreateButtons
            contentType={contentType}
            onCreateChat={onCreateChat}
          />
        </motion.div>
        {/* Data List */}
        <motion.div
          className="flex-1 overflow-y-auto px-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          {data.length > 0 && (
            <SidebarDataList
              contentType={contentType}
              data={data}
              folders={folders}
            />
          )}

          {data.length === 0 && (
            <motion.div
              className="flex h-32 items-center justify-center text-sm text-gray-500"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 }}
            >
              No {contentType} yet
            </motion.div>
          )}
        </motion.div>
      </motion.div>
    );
  };
  switch (contentType) {
    case "chats":
      return renderSidebarContent("chats", chats, []);
    case "presets":
      return renderSidebarContent("presets", [], []);
    case "prompts":
      return renderSidebarContent("prompts", [], []);
    case "assistants":
      return renderSidebarContent("assistants", [], []);
    case "tools":
      return renderSidebarContent("tools", [], []);
    case "settings":
      return renderSidebarContent("settings", [], []);
    case "calculation-settings":
      return renderSidebarContent("calculation-settings", [], []);
    case "calculate-score":
      return renderSidebarContent("calculate-score", [], []);
    default:
      return null;
  }
};
