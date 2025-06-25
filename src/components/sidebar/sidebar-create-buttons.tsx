"use client";

import { ContentType } from "@/types";
import { IconPlus } from "@tabler/icons-react";
import { FC } from "react";
import { Button } from "@/components/ui/button";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { motion } from "framer-motion";

interface SidebarCreateButtonsProps {
  contentType: ContentType;
  onCreateChat?: () => void;
}

export const SidebarCreateButtons: FC<SidebarCreateButtonsProps> = ({
  contentType,
  onCreateChat,
}) => {
  const createChat = useMutation(api.messages.createChat);

  const getCreateFunction = () => {
    switch (contentType) {
      case "chats":
        return (
          onCreateChat ||
          (async () => {
            await createChat({ title: "New Chat" });
          })
        );
      case "presets":
        return async () => {
          console.log("Create preset");
        };
      case "prompts":
        return async () => {
          console.log("Create prompt");
        };
      case "assistants":
        return async () => {
          console.log("Create assistant");
        };
      case "tools":
        return async () => {
          console.log("Create tool");
        };
      default:
        return async () => {};
    }
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Button
        className="flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-white/30 bg-gradient-to-r from-white/80 to-gray-50/80 backdrop-blur-xl text-sm font-medium text-gray-700 shadow-lg transition-all duration-200 hover:from-white/90 hover:to-gray-50/90 hover:shadow-xl hover:border-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-2"
        onClick={getCreateFunction()}
      >
        <motion.div whileHover={{ rotate: 180 }} transition={{ duration: 0.3 }}>
          <IconPlus size={16} />
        </motion.div>
        <span>
          New {contentType.charAt(0).toUpperCase() + contentType.slice(1, -1)}
        </span>
      </Button>
    </motion.div>
  );
};
