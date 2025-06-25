"use client";

import { FC, useState, useRef, useCallback } from "react";
import { IconSend, IconPlayerStopFilled } from "@tabler/icons-react";
import { TextareaAutosize } from "@/components/ui/textarea-autosize";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { PromptSelector } from "@/components/prompts/prompt-selector";
import { AssistantPromptSelector } from "@/components/prompts/assistant-prompt-selector";
import { MentorPromptSelector } from "@/components/prompts/mentor-prompt-selector";

interface ChatInputProps {
  onSendMessage: (
    message: string,
    systemPrompt?: string,
    assistantPrompt?: string,
    mentorPrompt?: string
  ) => void;
  isGenerating?: boolean;
  isAssistantAnalyzing?: boolean;
  isMentorAnalyzing?: boolean;
  onStopGeneration?: () => void;
  isFirstMessage?: boolean;
}

export const ChatInput: FC<ChatInputProps> = ({
  onSendMessage,
  isGenerating = false,
  isAssistantAnalyzing = false,
  isMentorAnalyzing = false,
  onStopGeneration,
  isFirstMessage = true,
}) => {
  const [userInput, setUserInput] = useState("");
  const [selectedPrompt, setSelectedPrompt] = useState("");
  const [selectedAssistantPrompt, setSelectedAssistantPrompt] = useState("");
  const [selectedMentorPrompt, setSelectedMentorPrompt] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const chatInputRef = useRef<HTMLTextAreaElement>(null);

  const handleInputChange = useCallback((value: string) => {
    setUserInput(value);
  }, []);

  const handlePromptSelect = useCallback((promptContent: string) => {
    setSelectedPrompt(promptContent);
  }, []);
  const handleAssistantPromptSelect = useCallback((promptContent: string) => {
    setSelectedAssistantPrompt(promptContent);
  }, []);

  const handleMentorPromptSelect = useCallback((promptContent: string) => {
    setSelectedMentorPrompt(promptContent);
  }, []);
  const handleSendMessage = useCallback(() => {
    if (!userInput.trim() || isGenerating) return;

    // Send user input to display in chat, and selected prompts as system messages
    onSendMessage(
      userInput.trim(),
      selectedPrompt || undefined,
      selectedAssistantPrompt || undefined,
      selectedMentorPrompt || undefined
    );
    setUserInput("");

    // Keep prompts selected until manually cleared - do not auto-clear
  }, [
    userInput,
    selectedPrompt,
    selectedAssistantPrompt,
    selectedMentorPrompt,
    isGenerating,
    onSendMessage,
  ]);

  const handleClearPrompt = useCallback(() => {
    setSelectedPrompt("");
  }, []);
  const handleClearAssistantPrompt = useCallback(() => {
    setSelectedAssistantPrompt("");
  }, []);

  const handleClearMentorPrompt = useCallback(() => {
    setSelectedMentorPrompt("");
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey && !isTyping) {
        e.preventDefault();
        handleSendMessage();
      }
    },
    [handleSendMessage, isTyping]
  );

  const handleStopMessage = useCallback(() => {
    if (onStopGeneration) {
      onStopGeneration();
    }
  }, [onStopGeneration]);
  return (
    <div className="mx-auto max-w-3xl px-4 pb-4 space-y-2">
      {" "}
      {/* Prompt Selectors - Above the input */}
      <div className="flex justify-between gap-3">
        <PromptSelector onPromptSelect={handlePromptSelect} />
        <div className="flex gap-2">
          <AssistantPromptSelector
            onPromptSelect={handleAssistantPromptSelect}
          />
          <MentorPromptSelector onPromptSelect={handleMentorPromptSelect} />
        </div>
      </div>{" "}
      {/* Assistant Analyzing Indicator */}
      {isAssistantAnalyzing && (
        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-lg p-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
              <div
                className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"
                style={{ animationDelay: "0.2s" }}
              ></div>
              <div
                className="w-2 h-2 bg-purple-300 rounded-full animate-pulse"
                style={{ animationDelay: "0.4s" }}
              ></div>
            </div>
            <div className="text-sm font-medium text-purple-700">
              Assistant is analyzing the conversation...
            </div>
          </div>{" "}
        </div>
      )}
      {/* Mentor Analyzing Indicator */}
      {isMentorAnalyzing && (
        <div className="bg-gradient-to-r from-red-50 to-rose-50 border border-red-200 rounded-lg p-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              <div
                className="w-2 h-2 bg-red-400 rounded-full animate-pulse"
                style={{ animationDelay: "0.2s" }}
              ></div>
              <div
                className="w-2 h-2 bg-red-300 rounded-full animate-pulse"
                style={{ animationDelay: "0.4s" }}
              ></div>
            </div>
            <div className="text-sm font-medium text-red-700">
              Mentor is analyzing your input...
            </div>
          </div>{" "}
        </div>
      )}
      {/* Selected Prompt Indicators - Only show for first message */}
      {isFirstMessage && selectedAssistantPrompt && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="text-sm font-medium text-purple-700 mb-1">
                Selected Assistant Prompt:
              </div>
              <div className="text-sm text-purple-600 line-clamp-2">
                {selectedAssistantPrompt.length > 100
                  ? `${selectedAssistantPrompt.substring(0, 100)}...`
                  : selectedAssistantPrompt}
              </div>
            </div>
            <button
              onClick={handleClearAssistantPrompt}
              className="ml-2 text-purple-500 hover:text-purple-700 transition-colors"
            >
              ×
            </button>
          </div>{" "}
        </div>
      )}
      {/* Selected Mentor Prompt Indicator */}
      {isFirstMessage && selectedMentorPrompt && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="text-sm font-medium text-orange-700 mb-1">
                Selected Mentor Prompt:
              </div>
              <div className="text-sm text-orange-600 line-clamp-2">
                {selectedMentorPrompt.length > 100
                  ? `${selectedMentorPrompt.substring(0, 100)}...`
                  : selectedMentorPrompt}
              </div>
            </div>
            <button
              onClick={handleClearMentorPrompt}
              className="ml-2 text-orange-500 hover:text-orange-700 transition-colors"
            >
              ×
            </button>
          </div>
        </div>
      )}
      {isFirstMessage && selectedPrompt && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="text-sm font-medium text-blue-700 mb-1">
                Selected Main Prompt:
              </div>
              <div className="text-sm text-blue-600 line-clamp-2">
                {selectedPrompt.length > 100
                  ? `${selectedPrompt.substring(0, 100)}...`
                  : selectedPrompt}
              </div>
            </div>
            <button
              onClick={handleClearPrompt}
              className="ml-2 text-blue-500 hover:text-blue-700 transition-colors"
            >
              ×
            </button>
          </div>{" "}
        </div>
      )}
      {/* Chat Input */}
      <div
        className={cn(
          "relative rounded-2xl border bg-white/90 backdrop-blur-xl shadow-lg transition-all duration-300",
          isFocused
            ? "border-blue-300 shadow-xl ring-2 ring-blue-500/20"
            : "border-white/50 hover:border-white/70"
        )}
      >
        <TextareaAutosize
          textareaRef={chatInputRef as React.RefObject<HTMLTextAreaElement>}
          className="w-full resize-none border-none bg-transparent px-4 py-3 pr-12 text-base placeholder-gray-400 focus:outline-none"
          placeholder={
            selectedPrompt && selectedAssistantPrompt && selectedMentorPrompt
              ? "Add your message to all prompts..."
              : selectedPrompt && selectedAssistantPrompt
                ? "Add your message to main and assistant prompts..."
                : selectedPrompt && selectedMentorPrompt
                  ? "Add your message to main and mentor prompts..."
                  : selectedAssistantPrompt && selectedMentorPrompt
                    ? "Add your message to assistant and mentor prompts..."
                    : selectedPrompt
                      ? "Add your message to the main prompt..."
                      : selectedAssistantPrompt
                        ? "Add your message to the assistant prompt..."
                        : selectedMentorPrompt
                          ? "Add your message to the mentor prompt..."
                          : "Ask anything..."
          }
          onValueChange={handleInputChange}
          value={userInput}
          minRows={1}
          maxRows={10}
          onKeyDown={handleKeyDown}
          onCompositionStart={() => setIsTyping(true)}
          onCompositionEnd={() => setIsTyping(false)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
        />{" "}
        <div className="absolute bottom-2 right-2">
          {isGenerating ? (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 transition-colors duration-200"
              onClick={handleStopMessage}
            >
              <IconPlayerStopFilled size={16} />
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-8 w-8 rounded-lg transition-all duration-200",
                userInput.trim()
                  ? "bg-black text-white hover:bg-gray-800 shadow-lg"
                  : "bg-gray-100 text-gray-400 cursor-not-allowed hover:bg-gray-100"
              )}
              onClick={() => {
                if (!userInput.trim()) return;
                handleSendMessage();
              }}
              disabled={!userInput.trim()}
            >
              <IconSend size={16} />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
