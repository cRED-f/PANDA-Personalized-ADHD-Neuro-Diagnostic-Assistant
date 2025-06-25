"use client";

import { ChatMessage } from "@/types";
import { FC } from "react";
import { Message } from "./message";
import { LoadingMessage } from "../loading-message";
import { motion, AnimatePresence } from "framer-motion";

interface ChatMessagesProps {
  messages: ChatMessage[];
  onEditMessage?: (messageId: string) => void;
  onRegenerateMessage?: (messageId: string) => void;
  isGenerating?: boolean;
}

export const ChatMessages: FC<ChatMessagesProps> = ({
  messages,
  onEditMessage,
  onRegenerateMessage,
  isGenerating = false,
}) => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  return (
    <motion.div
      className="flex flex-col"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <AnimatePresence mode="popLayout">
        {messages.map((message, index) => (
          <Message
            key={message._id}
            message={message}
            isLast={index === messages.length - 1}
            onEdit={onEditMessage}
            onRegenerate={onRegenerateMessage}
            index={index}
          />
        ))}
      </AnimatePresence>
      <LoadingMessage show={isGenerating} />
    </motion.div>
  );
};
