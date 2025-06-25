"use client";

import { FC, useState, useCallback } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { IconPencil, IconChevronDown, IconX } from "@tabler/icons-react";
import { motion, AnimatePresence } from "framer-motion";
import { WithTooltip } from "@/components/ui/with-tooltip";

interface PromptSelectorProps {
  onPromptSelect: (promptContent: string) => void;
}

export const PromptSelector: FC<PromptSelectorProps> = ({ onPromptSelect }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedPrompt, setSelectedPrompt] = useState<string | null>(null);

  const allPrompts = useQuery(api.prompts.getPrompts) || [];

  // Filter prompts to show only "main model" prompts
  const prompts = allPrompts.filter(
    (prompt) => (prompt.targetModel || "main") === "main"
  );

  const handlePromptSelect = useCallback(
    (promptId: string, promptContent: string) => {
      setSelectedPrompt(promptId);
      onPromptSelect(promptContent);
      setIsOpen(false);
    },
    [onPromptSelect]
  );

  const handleClearPrompt = useCallback(() => {
    setSelectedPrompt(null);
    onPromptSelect("");
  }, [onPromptSelect]);

  const selectedPromptData = prompts.find((p) => p._id === selectedPrompt);

  return (
    <div className="relative">
      <div className="flex items-center space-x-2">
        <WithTooltip
          delayDuration={500}
          side="top"
          display="Select a prompt to use"
          trigger={
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-3 text-gray-600 hover:text-gray-800 hover:bg-white/50 backdrop-blur-xl transition-colors duration-200"
                onClick={() => setIsOpen(!isOpen)}
              >
                <IconPencil size={14} className="mr-1" />
                {selectedPromptData ? selectedPromptData.name : "Prompt"}
                <IconChevronDown
                  size={14}
                  className={`ml-1 transition-transform duration-200 ${
                    isOpen ? "rotate-180" : ""
                  }`}
                />
              </Button>
            </motion.div>
          }
        />

        {selectedPromptData && (
          <WithTooltip
            delayDuration={500}
            side="top"
            display="Clear selected prompt"
            trigger={
              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 text-gray-500 hover:text-red-500 hover:bg-red-50"
                  onClick={handleClearPrompt}
                >
                  <IconX size={12} />
                </Button>
              </motion.div>
            }
          />
        )}
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="absolute bottom-full left-0 mb-2 w-80 max-h-64 overflow-y-auto bg-white/95 backdrop-blur-xl border border-white/30 rounded-lg shadow-xl z-[9999]"
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            {prompts.length > 0 ? (
              <div className="p-2 space-y-1">
                {prompts.map((prompt) => (
                  <motion.div
                    key={prompt._id}
                    className="p-3 rounded-lg hover:bg-white/50 cursor-pointer transition-colors duration-200"
                    onClick={() =>
                      handlePromptSelect(prompt._id, prompt.content)
                    }
                    whileHover={{ x: 4 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="text-sm font-medium text-gray-800">
                        {prompt.name}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                      {prompt.content.substring(0, 80)}
                      {prompt.content.length > 80 ? "..." : ""}
                    </p>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="p-4 text-center text-sm text-gray-500">
                No prompts available. Create prompts in the sidebar.
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 z-[9998]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};
