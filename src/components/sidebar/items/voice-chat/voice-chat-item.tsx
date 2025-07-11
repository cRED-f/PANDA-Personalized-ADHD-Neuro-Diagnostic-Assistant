"use client";

import { FC, useState } from "react";
import { motion } from "framer-motion";
import { VoiceChat } from "@/types";
import {
  IconMicrophone,
  IconTrash,
  IconPlayerPlay,
  IconClock,
  IconMessageCircle,
  IconDots,
} from "@tabler/icons-react";
import { useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";

interface VoiceChatItemProps {
  voiceChat: VoiceChat;
  onSelect?: (sessionId: string) => void;
  isSelected?: boolean;
}

export const VoiceChatItem: FC<VoiceChatItemProps> = ({
  voiceChat,
  onSelect,
  isSelected = false,
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showOptions, setShowOptions] = useState(false);

  const deleteVoiceChat = useMutation(api.voiceChats.deleteVoiceChat);

  const handleSelect = () => {
    if (onSelect) {
      onSelect(voiceChat.sessionId);
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isDeleting) return;

    setIsDeleting(true);
    try {
      await deleteVoiceChat({ sessionId: voiceChat.sessionId });
    } catch (error) {
      console.error("Failed to delete voice chat:", error);
    } finally {
      setIsDeleting(false);
      setShowOptions(false);
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else if (diffDays === 1) {
      return "Yesterday";
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const formatDuration = (startTime: number, endTime?: number) => {
    const duration = (endTime || Date.now()) - startTime;
    const minutes = Math.floor(duration / (1000 * 60));
    const seconds = Math.floor((duration % (1000 * 60)) / 1000);

    if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    }
    return `${seconds}s`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500";
      case "paused":
        return "bg-yellow-500";
      case "completed":
        return "bg-blue-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "active":
        return "Active";
      case "paused":
        return "Paused";
      case "completed":
        return "Completed";
      default:
        return "Unknown";
    }
  };

  return (
    <motion.div
      className={`group relative p-4 rounded-2xl cursor-pointer border transition-all duration-300 overflow-hidden ${
        isSelected
          ? "border-blue-400/60 shadow-2xl shadow-blue-500/30"
          : "border-white/30 hover:border-white/50 hover:shadow-xl hover:shadow-white/20"
      }`}
      style={{
        backdropFilter: "blur(24px) saturate(180%)",
        WebkitBackdropFilter: "blur(24px) saturate(180%)",
        background: isSelected
          ? "linear-gradient(135deg, rgba(59, 130, 246, 0.25) 0%, rgba(99, 102, 241, 0.15) 50%, rgba(139, 92, 246, 0.1) 100%)"
          : "linear-gradient(135deg, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.08) 50%, rgba(255, 255, 255, 0.12) 100%)",
      }}
      onClick={handleSelect}
      whileHover={{ scale: 1.02, y: -3 }}
      whileTap={{ scale: 0.98 }}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      layout
    >
      {/* Subtle glass shine effect */}
      <div
        className="absolute inset-0 rounded-2xl opacity-30"
        style={{
          background:
            "linear-gradient(135deg, rgba(255, 255, 255, 0.4) 0%, transparent 50%, rgba(255, 255, 255, 0.1) 100%)",
        }}
      />

      {/* Content container with relative positioning */}
      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <motion.div
              className={`w-2 h-2 rounded-full ${getStatusColor(voiceChat.status)}`}
              animate={{
                scale: voiceChat.status === "active" ? [1, 1.2, 1] : 1,
                opacity: voiceChat.status === "active" ? [1, 0.7, 1] : 1,
              }}
              transition={{
                duration: 2,
                repeat: voiceChat.status === "active" ? Infinity : 0,
              }}
            />
            <span className="text-xs font-medium text-gray-800 drop-shadow-sm">
              {getStatusText(voiceChat.status)}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <motion.button
              className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-white/25 transition-all duration-200 backdrop-blur-sm"
              onClick={(e) => {
                e.stopPropagation();
                setShowOptions(!showOptions);
              }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <IconDots size={14} className="text-gray-700 drop-shadow-sm" />
            </motion.button>
          </div>
        </div>

        {/* Title */}
        <div className="flex items-center gap-2 mb-3">
          <IconMicrophone
            size={16}
            className="text-blue-600 flex-shrink-0 drop-shadow-sm"
          />
          <h3 className="text-sm font-medium text-gray-900 truncate flex-1 drop-shadow-sm">
            {voiceChat.title}
          </h3>
        </div>

        {/* Metadata */}
        <div className="flex items-center justify-between text-xs text-gray-600">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <IconMessageCircle size={12} className="drop-shadow-sm" />
              <span className="drop-shadow-sm">{voiceChat.totalMessages}</span>
            </div>
            <div className="flex items-center gap-1">
              <IconClock size={12} className="drop-shadow-sm" />
              <span className="drop-shadow-sm">
                {formatDuration(voiceChat.startTime, voiceChat.endTime)}
              </span>
            </div>
          </div>
          <span className="drop-shadow-sm">
            {formatDate(voiceChat.createdAt)}
          </span>
        </div>

        {/* Quick Actions */}
        <motion.div
          className="flex items-center gap-1 mt-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
          initial={false}
        >
          <motion.button
            className="flex items-center gap-1 px-3 py-1.5 text-xs bg-blue-600/80 text-white rounded-lg hover:bg-blue-600/90 transition-colors duration-200 backdrop-blur-md border border-blue-500/50 shadow-lg"
            onClick={handleSelect}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <IconPlayerPlay size={12} />
            Resume
          </motion.button>
        </motion.div>
      </div>

      {/* Options Menu */}
      {showOptions && (
        <motion.div
          className="absolute top-8 right-8 bg-white/95 backdrop-blur-2xl rounded-2xl shadow-2xl border border-white/30 z-10 min-w-[120px] overflow-hidden"
          initial={{ opacity: 0, scale: 0.95, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -10 }}
          transition={{ duration: 0.15 }}
          style={{
            backdropFilter: "blur(24px) saturate(180%)",
            WebkitBackdropFilter: "blur(24px) saturate(180%)",
          }}
        >
          <motion.button
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50/90 rounded-2xl transition-colors duration-200"
            onClick={handleDelete}
            disabled={isDeleting}
            whileHover={{ x: 2 }}
          >
            <IconTrash size={14} />
            {isDeleting ? "Deleting..." : "Delete"}
          </motion.button>
        </motion.div>
      )}

      {/* Overlay to close options */}
      {showOptions && (
        <div
          className="fixed inset-0 z-5"
          onClick={() => setShowOptions(false)}
        />
      )}
    </motion.div>
  );
};
