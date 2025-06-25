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

  const { cleanContent, reminderContent } = getAssistantData(message.content);

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
              ? "bg-emerald-50/60"
              : "bg-blue-50/40"
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
                    : "bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 text-white shadow-lg border-blue-300/50"
            )}
          >
            {" "}
            {isAssistant ? (
              <IconBrain size={18} className="drop-shadow-sm" />
            ) : isMentor ? (
              <IconCompass size={18} className="drop-shadow-sm" />
            ) : isAI ? (
              <IconFileTextAi size={18} className="drop-shadow-sm" />
            ) : (
              <IconUser size={18} className="drop-shadow-sm" />
            )}
          </div>
        </div>{" "}
        {/* Content */}
        <div className="flex-1 space-y-2">
          {" "}
          {/* Assistant Reminder - Always shown for assistant messages with overflow handling */}
          {isAssistant && reminderContent && (
            <div className="mb-3 p-3 bg-amber-50 border-l-4 border-amber-400 rounded-r-lg">
              <div className="flex items-start space-x-2">
                <div className="flex-shrink-0 mt-0.5">
                  <svg
                    className="w-4 h-4 text-amber-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="flex-1 overflow-hidden">
                  <p className="text-sm font-medium text-amber-800">
                    Assistant Reminder
                  </p>{" "}
                  <div className="text-sm text-amber-700 mt-1 prose prose-sm max-w-none overflow-auto max-h-60">
                    <ReactMarkdown
                      components={{
                        pre: (props) => (
                          <pre
                            className="overflow-auto max-w-full whitespace-pre-wrap bg-amber-100 p-2 rounded text-sm"
                            {...props}
                          />
                        ),
                        code: (props) => (
                          <code
                            className="break-all bg-amber-100 px-1 py-0.5 rounded text-sm"
                            {...props}
                          />
                        ),
                        p: (props) => (
                          <p
                            className="mb-2 last:mb-0 leading-relaxed"
                            {...props}
                          />
                        ),
                      }}
                    >
                      {reminderContent}
                    </ReactMarkdown>
                  </div>
                </div>
              </div>{" "}
            </div>
          )}
          {/* Mentor Reminder - Always shown for mentor messages with overflow handling */}
          {isMentor && (
            <div className="mb-3 p-3 bg-red-50 border-l-4 border-red-400 rounded-r-lg">
              <div className="flex items-start space-x-2">
                <div className="flex-shrink-0 mt-0.5">
                  <IconCompass className="w-4 h-4 text-red-600" />
                </div>
                <div className="flex-1 overflow-hidden">
                  <p className="text-sm font-medium text-red-800">
                    Mentor Reminder
                  </p>{" "}
                  <div className="text-sm text-red-700 mt-1 prose prose-sm max-w-none overflow-auto max-h-60">
                    <ReactMarkdown
                      components={{
                        pre: (props) => (
                          <pre
                            className="overflow-auto max-w-full whitespace-pre-wrap bg-red-100 p-2 rounded text-sm"
                            {...props}
                          />
                        ),
                        code: (props) => (
                          <code
                            className="break-all bg-red-100 px-1 py-0.5 rounded text-sm"
                            {...props}
                          />
                        ),
                        p: (props) => (
                          <p
                            className="mb-2 last:mb-0 leading-relaxed"
                            {...props}
                          />
                        ),
                      }}
                    >
                      {message.content}
                    </ReactMarkdown>
                  </div>
                </div>
              </div>{" "}
            </div>
          )}{" "}
          {/* AI Response Content with left border styling */}
          {isAI && (
            <div className="border-l-4 border-emerald-400 pl-4  prose prose-sm max-w-none text-gray-900">
              <ReactMarkdown
                components={{
                  pre: (props) => (
                    <pre
                      className="overflow-auto max-w-full  p-3 rounded text-sm  whitespace-pre-wrap"
                      {...props}
                    />
                  ),
                  code: (props) => (
                    <code
                      className="break-words bg-gray-200 px-1.5 py-0.5 rounded text-sm "
                      {...props}
                    />
                  ),
                  p: (props) => (
                    <p
                      className="mb-3 last:mb-0 leading-7 text-gray-800"
                      {...props}
                    />
                  ),
                  h1: (props) => (
                    <h1
                      className="text-xl font-bold mb-4 mt-6 first:mt-0 text-gray-900"
                      {...props}
                    />
                  ),
                  h2: (props) => (
                    <h2
                      className="text-lg font-semibold mb-3 mt-5 first:mt-0 text-gray-900"
                      {...props}
                    />
                  ),
                  h3: (props) => (
                    <h3
                      className="text-base font-semibold mb-2 mt-4 first:mt-0 text-gray-900"
                      {...props}
                    />
                  ),
                  ul: (props) => (
                    <ul className="list-disc pl-6 mb-4 space-y-2" {...props} />
                  ),
                  ol: (props) => (
                    <ol
                      className="list-decimal pl-6 mb-4 space-y-2"
                      {...props}
                    />
                  ),
                  li: (props) => (
                    <li className="leading-7 text-gray-800" {...props} />
                  ),
                  blockquote: (props) => (
                    <blockquote
                      className="border-l-4 border-gray-300 pl-4 italic mb-4 text-gray-700"
                      {...props}
                    />
                  ),
                  strong: (props) => (
                    <strong
                      className="font-semibold text-gray-900"
                      {...props}
                    />
                  ),
                  em: (props) => (
                    <em className="italic text-gray-800" {...props} />
                  ),
                }}
              >
                {message.content}
              </ReactMarkdown>
            </div>
          )}
          {((cleanContent && !isMentor && !isAI) ||
            (!isAssistant && !isMentor && !isAI)) && (
            <div className="prose prose-sm max-w-none text-gray-900">
              <ReactMarkdown
                components={{
                  pre: (props) => (
                    <pre
                      className="overflow-auto max-w-full whitespace-pre-wrap bg-gray-100 p-2 rounded text-sm"
                      {...props}
                    />
                  ),
                  code: (props) => (
                    <code
                      className="break-all bg-gray-100 px-1 py-0.5 rounded text-sm"
                      {...props}
                    />
                  ),
                  p: (props) => (
                    <p className="mb-3 last:mb-0 leading-relaxed" {...props} />
                  ),
                  h1: (props) => (
                    <h1
                      className="text-lg font-bold mb-3 mt-4 first:mt-0"
                      {...props}
                    />
                  ),
                  h2: (props) => (
                    <h2
                      className="text-base font-bold mb-2 mt-3 first:mt-0"
                      {...props}
                    />
                  ),
                  h3: (props) => (
                    <h3
                      className="text-sm font-bold mb-2 mt-3 first:mt-0"
                      {...props}
                    />
                  ),
                  ul: (props) => (
                    <ul className="list-disc pl-5 mb-3 space-y-1" {...props} />
                  ),
                  ol: (props) => (
                    <ol
                      className="list-decimal pl-5 mb-3 space-y-1"
                      {...props}
                    />
                  ),
                  li: (props) => <li className="leading-relaxed" {...props} />,
                  blockquote: (props) => (
                    <blockquote
                      className="border-l-4 border-gray-300 pl-4 italic mb-3"
                      {...props}
                    />
                  ),
                }}
              >
                {!isAssistant && !isMentor && !isAI
                  ? message.content
                  : cleanContent}
              </ReactMarkdown>
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
          />{" "}
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
