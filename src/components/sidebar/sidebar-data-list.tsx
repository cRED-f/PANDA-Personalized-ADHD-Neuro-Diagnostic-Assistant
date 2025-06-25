"use client";

import {
  ContentType,
  Chat,
  Preset,
  Prompt,
  Assistant,
  Tool,
  Model,
} from "@/types";
import { FC } from "react";
import { ChatItem } from "./items/chat/chat-item";
import { motion, AnimatePresence } from "framer-motion";

interface SidebarDataListProps {
  contentType: ContentType;
  data: unknown[];
  folders: unknown[];
}

export const SidebarDataList: FC<SidebarDataListProps> = ({
  contentType,
  data,
}) => {
  const getDataListComponent = (
    contentType: ContentType,
    item: unknown,
    index: number
  ) => {
    const baseMotionProps = {
      initial: { opacity: 0, x: -20 },
      animate: { opacity: 1, x: 0 },
      exit: { opacity: 0, x: -20 },
      transition: {
        duration: 0.3,
        delay: index * 0.05,
        ease: "easeOut",
      },
      whileHover: { x: 4 },
      layout: true,
    };

    switch (contentType) {
      case "chats":
        return (
          <motion.div key={(item as Chat)._id} {...baseMotionProps}>
            <ChatItem chat={item as Chat} />
          </motion.div>
        );
      case "presets": {
        const preset = item as Preset;
        return (
          <motion.div
            key={preset.id}
            className="p-3 hover:bg-white/50 rounded-lg cursor-pointer backdrop-blur-sm border border-white/20 transition-colors duration-200"
            {...baseMotionProps}
          >
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full"></div>
              <span className="text-sm font-medium text-gray-800">
                Preset: {preset.name}
              </span>
            </div>
          </motion.div>
        );
      }
      case "prompts": {
        const prompt = item as Prompt;
        return (
          <motion.div
            key={prompt.id}
            className="p-3 hover:bg-white/50 rounded-lg cursor-pointer backdrop-blur-sm border border-white/20 transition-colors duration-200"
            {...baseMotionProps}
          >
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full"></div>
              <span className="text-sm font-medium text-gray-800">
                Prompt: {prompt.name}
              </span>
            </div>
          </motion.div>
        );
      }
      case "assistants": {
        const assistant = item as Assistant;
        return (
          <motion.div
            key={assistant.id}
            className="p-3 hover:bg-white/50 rounded-lg cursor-pointer backdrop-blur-sm border border-white/20 transition-colors duration-200"
            {...baseMotionProps}
          >
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-gradient-to-r from-green-400 to-emerald-400 rounded-full"></div>
              <span className="text-sm font-medium text-gray-800">
                Assistant: {assistant.name}
              </span>
            </div>
          </motion.div>
        );
      }
      case "tools": {
        const tool = item as Tool;
        return (
          <motion.div
            key={tool._id}
            className="p-3 hover:bg-white/50 rounded-lg cursor-pointer backdrop-blur-sm border border-white/20 transition-colors duration-200"
            {...baseMotionProps}
          >
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-gradient-to-r from-orange-400 to-red-400 rounded-full"></div>
              <span className="text-sm font-medium text-gray-800">
                Tool: {tool.name}
              </span>
            </div>
          </motion.div>
        );
      }
      case "models": {
        const model = item as Model;
        return (
          <motion.div
            key={model.id}
            className="p-3 hover:bg-white/50 rounded-lg cursor-pointer backdrop-blur-sm border border-white/20 transition-colors duration-200"
            {...baseMotionProps}
          >
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-gradient-to-r from-indigo-400 to-purple-400 rounded-full"></div>
              <span className="text-sm font-medium text-gray-800">
                Model: {model.name}
              </span>
            </div>
          </motion.div>
        );
      }
      default:
        return null;
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
        delayChildren: 0.1,
      },
    },
  };

  return (
    <motion.div
      className="flex flex-col space-y-2 overflow-auto p-1"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <AnimatePresence mode="popLayout">
        {data.map((item, index) =>
          getDataListComponent(contentType, item, index)
        )}
      </AnimatePresence>
    </motion.div>
  );
};
