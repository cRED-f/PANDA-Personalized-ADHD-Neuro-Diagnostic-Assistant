"use client";

import { FC, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  IconEdit,
  IconTrash,
  IconCheck,
  IconX,
  IconPlus,
} from "@tabler/icons-react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { WithTooltip } from "@/components/ui/with-tooltip";

interface PromptData {
  _id: Id<"prompts">;
  name: string;
  content: string;
  targetModel?: "main" | "assistant" | "mentor" | "calculate-main-model";
  createdAt: number;
  updatedAt: number;
}

interface PromptItemProps {
  prompt: PromptData;
  onEdit: (prompt: PromptData) => void;
  onDelete: (id: Id<"prompts">) => void;
}

const PromptItem: FC<PromptItemProps> = ({ prompt, onEdit, onDelete }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  return (
    <motion.div
      className="p-3 rounded-xl backdrop-blur-md border border-white/30 bg-white/20 hover:bg-white/30 transition-all duration-300 shadow-lg hover:shadow-xl"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02, y: -2 }}
      layout
    >
      <div className="flex items-start justify-between">
        <div
          className="flex-1 cursor-pointer"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {" "}
          <div className="flex items-center space-x-2 mb-1">
            {" "}
            <div
              className={`w-2 h-2 rounded-full shadow-sm ${
                (prompt.targetModel || "main") === "main"
                  ? "bg-blue-500"
                  : (prompt.targetModel || "main") === "assistant"
                    ? "bg-purple-500"
                    : (prompt.targetModel || "main") === "mentor"
                      ? "bg-orange-500"
                      : "bg-green-500"
              }`}
            ></div>
            <h3 className="text-sm font-medium text-gray-800">{prompt.name}</h3>{" "}
            <span
              className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                (prompt.targetModel || "main") === "main"
                  ? "bg-blue-100 text-blue-700 border border-blue-200"
                  : (prompt.targetModel || "main") === "assistant"
                    ? "bg-purple-100 text-purple-700 border border-purple-200"
                    : (prompt.targetModel || "main") === "mentor"
                      ? "bg-orange-100 text-orange-700 border border-orange-200"
                      : "bg-green-100 text-green-700 border border-green-200"
              }`}
            >
              {(prompt.targetModel || "main") === "main"
                ? "Main Model"
                : (prompt.targetModel || "main") === "assistant"
                  ? "Assistant"
                  : (prompt.targetModel || "main") === "mentor"
                    ? "Mentor"
                    : "Calculate Main"}
            </span>
          </div>
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                {" "}
                <div className="mt-2 p-2 bg-white/40 backdrop-blur-sm rounded border border-white/30 shadow-inner">
                  <p className="text-xs text-gray-700 whitespace-pre-wrap">
                    {prompt.content}
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>{" "}
        <div className="flex items-center space-x-1 ml-2">
          <WithTooltip
            delayDuration={500}
            side="top"
            display="Edit prompt"
            trigger={
              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 text-gray-500 hover:text-gray-700 hover:bg-white/50"
                  onClick={() => onEdit(prompt)}
                >
                  <IconEdit size={14} />
                </Button>
              </motion.div>
            }
          />
          <WithTooltip
            delayDuration={500}
            side="top"
            display="Delete prompt"
            trigger={
              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                  onClick={() => onDelete(prompt._id)}
                >
                  <IconTrash size={14} />
                </Button>
              </motion.div>
            }
          />
        </div>
      </div>
    </motion.div>
  );
};

interface PromptFormProps {
  prompt?: PromptData;
  onSave: (data: {
    name: string;
    content: string;
    targetModel?: "main" | "assistant" | "mentor" | "calculate-main-model";
  }) => void;
  onCancel: () => void;
  isLoading: boolean;
}

const PromptForm: FC<PromptFormProps> = ({
  prompt,
  onSave,
  onCancel,
  isLoading,
}) => {
  const [name, setName] = useState(prompt?.name || "");
  const [content, setContent] = useState(prompt?.content || "");
  const [targetModel, setTargetModel] = useState<
    "main" | "assistant" | "mentor" | "calculate-main-model"
  >(prompt?.targetModel || "main");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && content.trim()) {
      onSave({
        name: name.trim(),
        content: content.trim(),
        targetModel: targetModel,
      });
    }
  };

  return (
    <motion.div
      className="space-y-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {" "}
        <div className="space-y-2">
          <Label htmlFor="prompt-name">Name</Label>
          <Input
            id="prompt-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter prompt name..."
            className="bg-white/50 backdrop-blur-sm"
            required
          />
        </div>{" "}
        {/* Target Model Selection */}
        <div className="space-y-2">
          <Label>Target Model</Label>
          <div className="flex flex-wrap items-center gap-3">
            <motion.button
              type="button"
              onClick={() => setTargetModel("main")}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg border transition-all duration-200 text-sm ${
                targetModel === "main"
                  ? "bg-blue-100 border-blue-300 text-blue-700"
                  : "bg-white/50 border-gray-200 text-gray-600 hover:bg-white/70"
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="font-medium">Main</span>
            </motion.button>
            <motion.button
              type="button"
              onClick={() => setTargetModel("assistant")}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg border transition-all duration-200 text-sm ${
                targetModel === "assistant"
                  ? "bg-purple-100 border-purple-300 text-purple-700"
                  : "bg-white/50 border-gray-200 text-gray-600 hover:bg-white/70"
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <span className="font-medium">Assistant</span>
            </motion.button>{" "}
            <motion.button
              type="button"
              onClick={() => setTargetModel("mentor")}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg border transition-all duration-200 text-sm ${
                targetModel === "mentor"
                  ? "bg-orange-100 border-orange-300 text-orange-700"
                  : "bg-white/50 border-gray-200 text-gray-600 hover:bg-white/70"
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
              <span className="font-medium">Mentor</span>
            </motion.button>
            <motion.button
              type="button"
              onClick={() => setTargetModel("calculate-main-model")}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg border transition-all duration-200 text-sm ${
                targetModel === "calculate-main-model"
                  ? "bg-green-100 border-green-300 text-green-700"
                  : "bg-white/50 border-gray-200 text-gray-600 hover:bg-white/70"
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="font-medium">Calculate Main</span>
            </motion.button>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="prompt-content">Content</Label>
          <Textarea
            id="prompt-content"
            value={content}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
              setContent(e.target.value)
            }
            placeholder="Enter your prompt content here..."
            className="bg-white/50 backdrop-blur-sm min-h-[120px] resize-y"
            required
          />
        </div>
        <div className="flex items-center justify-end space-x-2">
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              type="button"
              variant="ghost"
              onClick={onCancel}
              disabled={isLoading}
              className="h-8 px-3 text-gray-600 hover:text-gray-800"
            >
              <IconX size={16} className="mr-1" />
              Cancel
            </Button>
          </motion.div>{" "}
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              type="submit"
              disabled={!name.trim() || !content.trim() || isLoading}
              className="h-8 px-3 bg-white/90 hover:bg-white text-gray-800 border border-gray-200 shadow-sm"
            >
              <IconCheck size={16} className="mr-1" />
              {isLoading ? "Saving..." : "Save"}
            </Button>
          </motion.div>
        </div>
      </form>
    </motion.div>
  );
};

export const PromptsManager: FC = () => {
  const [editingPrompt, setEditingPrompt] = useState<PromptData | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const prompts = useQuery(api.prompts.getPrompts) || [];
  const createPrompt = useMutation(api.prompts.createPrompt);
  const updatePrompt = useMutation(api.prompts.updatePrompt);
  const deletePrompt = useMutation(api.prompts.deletePrompt);

  const [isLoading, setIsLoading] = useState(false);

  const handleCreate = useCallback(() => {
    setIsCreating(true);
    setEditingPrompt(null);
  }, []);

  const handleEdit = useCallback((prompt: PromptData) => {
    setEditingPrompt(prompt);
    setIsCreating(false);
  }, []);
  const handleSave = useCallback(
    async (data: {
      name: string;
      content: string;
      targetModel?: "main" | "assistant" | "mentor" | "calculate-main-model";
    }) => {
      setIsLoading(true);
      try {
        if (editingPrompt) {
          await updatePrompt({
            id: editingPrompt._id,
            ...data,
          });
        } else {
          await createPrompt(data);
        }
        setEditingPrompt(null);
        setIsCreating(false);
      } catch (error) {
        console.error("Failed to save prompt:", error);
      } finally {
        setIsLoading(false);
      }
    },
    [editingPrompt, createPrompt, updatePrompt]
  );

  const handleCancel = useCallback(() => {
    setEditingPrompt(null);
    setIsCreating(false);
  }, []);

  const handleDelete = useCallback(
    async (id: Id<"prompts">) => {
      if (confirm("Are you sure you want to delete this prompt?")) {
        try {
          await deletePrompt({ id });
        } catch (error) {
          console.error("Failed to delete prompt:", error);
        }
      }
    },
    [deletePrompt]
  );

  const showForm = isCreating || editingPrompt;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800">Prompts</h2>{" "}
        {!showForm && (
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              onClick={handleCreate}
              size="sm"
              className="h-8 bg-white/90 hover:bg-white text-gray-800 border border-gray-200 shadow-sm"
            >
              <IconPlus size={16} className="mr-1" />
              Create
            </Button>
          </motion.div>
        )}
      </div>

      {/* Form */}
      <AnimatePresence>
        {" "}
        {showForm && (
          <motion.div
            className="p-4 rounded-xl backdrop-blur-lg border border-white/40 bg-white/25 shadow-xl"
            layout
          >
            <PromptForm
              prompt={editingPrompt || undefined}
              onSave={handleSave}
              onCancel={handleCancel}
              isLoading={isLoading}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Prompts List */}
      <motion.div className="space-y-2" layout>
        <AnimatePresence>
          {prompts.map((prompt) => (
            <PromptItem
              key={prompt._id}
              prompt={prompt}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </AnimatePresence>

        {prompts.length === 0 && !showForm && (
          <motion.div
            className="flex items-center text-center justify-center h-32 text-sm text-gray-500 border border-dashed border-gray-300 rounded-lg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            No prompts yet. Create your first prompt to get started.
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};
