"use client";

import { ChatMessage } from "@/types";
import { FC, useState } from "react";
import {
  IconUser,
  IconFileTextAi,
  IconCopy,
  IconEdit,
  IconBrain,
  IconCompass,
} from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { WithTooltip } from "@/components/ui/with-tooltip";
import ReactMarkdown from "react-markdown";
import { motion } from "framer-motion";

interface MessageProps {
  message: ChatMessage;
  onEdit?: (messageId: string) => void;
  index?: number;
}

export const Message: FC<MessageProps> = ({ message, onEdit }) => {
  const [isHovering, setIsHovering] = useState(false);
  const [showCheckmark, setShowCheckmark] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setShowCheckmark(true);
    setTimeout(() => setShowCheckmark(false), 2000);
  };
  const isAI = message.role === "ai";
  const isAssistant = message.role === "assistant";
  const isMentor = message.role === "mentor";
  // Extract reminder content and clean content for assistant messages
  const getAssistantData = (content: string) => {
    if (!isAssistant) return { cleanContent: content, reminderContent: null };

    const reminderMatch = content.match(
      /\[ASSISTANT_GUIDANCE_START\]([\s\S]*?)\[ASSISTANT_GUIDANCE_END\]/
    );

    if (reminderMatch) {
      // If guidance tags exist, extract the content and remove the tags
      const reminderContent = reminderMatch[1].trim();
      const cleanContent = content
        .replace(
          /\[ASSISTANT_GUIDANCE_START\][\s\S]*?\[ASSISTANT_GUIDANCE_END\]/g,
          ""
        )
        .trim();

      return { cleanContent, reminderContent };
    } else {
      // For assistant messages without guidance tags, treat entire content as reminder
      return { cleanContent: "", reminderContent: content };
    }
  };

  const { reminderContent } = getAssistantData(message.content);

  // Simplified animation variants for better performance
  const messageVariants = {
    hidden: {
      opacity: 0,
      y: 10,
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.2,
        ease: "easeOut",
      },
    },
  };

  // Filter tracking info for frontend display only
  const filterTrackingInfo = (content: string) => {
    return content
      .replace(/```[\s\S]*?CONVERSATION STAGE:[\s\S]*?```/g, "")
      .replace(/\(.*?\)/g, "")
      .replace(/\*\*/g, "")
      .replace(/---[\s\S]*?\*\*Reminder\*\*[\s\S]*$/gm, "")
      .replace(/\*\*Reminder\*\*[\s\S]*$/gm, "")
      .replace(/\*\(.*?\)\*[\s\S]*$/gm, "")
      .replace(/---[\s\S]*$/gm, "")
      .trim();
  };

  return (
    <motion.div
      variants={messageVariants}
      initial="hidden"
      animate="visible"
      className={cn(
        "group relative border-b border-white/20 px-4 py-6 transition-colors duration-200",
        isAssistant
          ? "bg-slate-50/60"
          : isMentor
            ? "bg-red-50/60"
            : isAI
              ? "bg-emerald-50/60" // AI background color
              : "bg-blue-50/40" // User background color (set for the user message)
      )}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <div className="mx-auto flex max-w-3xl space-x-4">
        {/* Avatar */}
        <div className="flex-shrink-0">
          <div
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-full border transition-transform duration-200 hover:scale-110",
              isAssistant
                ? "bg-gradient-to-br from-gray-500 via-slate-500 to-zinc-600 text-white shadow-lg border-gray-300/50"
                : isMentor
                  ? "bg-gradient-to-br from-red-500 via-rose-500 to-pink-600 text-white shadow-lg border-red-300/50"
                  : isAI
                    ? "bg-gradient-to-br from-emerald-500 via-green-500 to-teal-600 text-white shadow-lg border-emerald-300/50"
                    : "bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 text-white shadow-lg border-blue-300/50" // User avatar
            )}
          >
            {isAssistant ? (
              <IconBrain size={18} className="drop-shadow-sm" />
            ) : isMentor ? (
              <IconCompass size={18} className="drop-shadow-sm" />
            ) : isAI ? (
              <IconFileTextAi size={18} className="drop-shadow-sm" />
            ) : (
              <IconUser size={18} className="drop-shadow-sm" /> // User icon
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 space-y-2">
          {/* AI Message */}
          {isAI && (
            <div className="border-l-4 border-emerald-400 pl-4 py-2 bg-emerald-50 rounded-lg shadow-sm max-w-full">
              <ReactMarkdown
                components={{
                  pre: (props) => (
                    <pre
                      className="overflow-auto max-w-full p-3 rounded text-sm whitespace-pre-wrap bg-emerald-100"
                      {...props}
                    />
                  ),
                  code: (props) => (
                    <code
                      className="break-words bg-emerald-100 px-2 py-1 rounded text-sm"
                      {...props}
                    />
                  ),
                  p: (props) => (
                    <p
                      className="mb-2 last:mb-0 leading-relaxed text-gray-800"
                      {...props}
                    />
                  ),
                }}
              >
                {filterTrackingInfo(message.content)}
              </ReactMarkdown>
            </div>
          )}

          {/* User Message */}
          {!isAssistant && !isMentor && !isAI && (
            <div className="border-l-4 border-blue-400 pl-4 py-2 bg-blue-50 rounded-lg shadow-sm max-w-full">
              <ReactMarkdown
                components={{
                  pre: (props) => (
                    <pre
                      className="overflow-auto max-w-full p-3 rounded text-sm whitespace-pre-wrap bg-blue-100"
                      {...props}
                    />
                  ),
                  code: (props) => (
                    <code
                      className="break-words bg-blue-100 px-2 py-1 rounded text-sm"
                      {...props}
                    />
                  ),
                  p: (props) => (
                    <p
                      className="mb-2 last:mb-0 leading-relaxed text-gray-800"
                      {...props}
                    />
                  ),
                }}
              >
                {message.content}
              </ReactMarkdown>
            </div>
          )}

          {/* Assistant and Mentor Messages */}
          {isAssistant && reminderContent && (
            <div className="mb-3 p-3 bg-amber-50 border-l-4 border-amber-400 rounded-r-lg">
              {/* Assistant Reminder Content */}
              <ReactMarkdown>{reminderContent}</ReactMarkdown>
            </div>
          )}

          {isMentor && reminderContent && (
            <div className="mb-3 p-3 bg-red-50 border-l-4 border-red-400 rounded-r-lg">
              {/* Mentor Reminder Content */}
              <ReactMarkdown>{reminderContent}</ReactMarkdown>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div
          className={cn(
            "flex items-start space-x-1 opacity-0 transition-opacity",
            (isHovering || showCheckmark) && "opacity-100"
          )}
        >
          <WithTooltip
            delayDuration={1000}
            side="bottom"
            display={<div>{showCheckmark ? "Copied!" : "Copy"}</div>}
            trigger={
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-gray-500 hover:text-gray-700 hover:bg-white/50 transition-colors duration-200 hover:scale-110"
                onClick={handleCopy}
              >
                <IconCopy size={14} />
              </Button>
            }
          />
          {message.role === "user" && onEdit && (
            <WithTooltip
              delayDuration={1000}
              side="bottom"
              display={<div>Edit</div>}
              trigger={
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-gray-500 hover:text-gray-700 hover:bg-white/50 transition-colors duration-200 hover:scale-110"
                  onClick={() => onEdit(message._id)}
                >
                  <IconEdit size={14} />
                </Button>
              }
            />
          )}
        </div>
      </div>
    </motion.div>
  );
};
