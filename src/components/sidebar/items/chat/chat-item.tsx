"use client";

import { Chat } from "@/types";
import { IconMessage, IconEdit, IconTrash } from "@tabler/icons-react";
import { FC, useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { useChatContext } from "@/contexts/chat-context";
import { motion, AnimatePresence } from "framer-motion";

interface ChatItemProps {
  chat: Chat;
}

export const ChatItem: FC<ChatItemProps> = ({ chat }) => {
  const [isHovering, setIsHovering] = useState(false);
  const deleteChat = useMutation(api.messages.deleteChat);
  const { currentChatId, setCurrentChatId } = useChatContext();

  const handleClick = () => {
    setCurrentChatId(chat._id);
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await deleteChat({ chatId: chat._id });
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Handle edit - will be implemented later
    console.log("Edit chat:", chat._id);
  };

  const isSelected = currentChatId === chat._id;

  return (
    <motion.div
      className={cn(
        "group mx-2 flex cursor-pointer items-center rounded-lg p-3 text-sm transition-all duration-200 backdrop-blur-sm border border-white/20",
        isSelected
          ? "bg-gray-100 border-blue-300/50 shadow-lg"
          : "hover:bg-white/50 hover:border-white/40"
      )}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      onClick={handleClick}
      whileHover={{
        scale: 1.02,
        x: 4,
        transition: { duration: 0.2 },
      }}
      whileTap={{ scale: 0.98 }}
      layout
    >
      <motion.div
        className="mr-3"
        animate={isSelected ? { rotate: [0, -10, 0] } : {}}
        transition={{ duration: 0.5 }}
      >
        <IconMessage
          className={cn(
            "transition-colors duration-200",
            isSelected ? "text-blue-600" : "text-gray-500"
          )}
          size={16}
        />
      </motion.div>

      <div
        className={cn(
          "flex-1 truncate font-medium transition-colors duration-200",
          isSelected ? "text-blue-900" : "text-gray-900"
        )}
      >
        {chat.title}
      </div>

      <AnimatePresence>
        {isHovering && (
          <motion.div
            className="ml-2 flex space-x-1"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-gray-500 hover:text-gray-700 hover:bg-white/50 backdrop-blur-xl transition-colors duration-200"
                onClick={handleEdit}
              >
                <IconEdit size={12} />
              </Button>
            </motion.div>

            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-gray-500 hover:text-red-500 hover:bg-red-50/50 backdrop-blur-xl transition-colors duration-200"
                onClick={handleDelete}
              >
                <IconTrash size={12} />
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
