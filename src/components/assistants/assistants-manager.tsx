"use client";

import { FC, useState, useCallback, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { IconDeviceFloppy, IconEdit } from "@tabler/icons-react";
import { motion } from "framer-motion";

export const AssistantsManager: FC = () => {
  const [name, setName] = useState("Default Assistant");
  const [modelName, setModelName] = useState("");
  const [temperature, setTemperature] = useState(0.7);
  const [activeAfterQuestions, setActiveAfterQuestions] = useState(1);
  const [isEditing, setIsEditing] = useState(false);

  // Use the new assistants database functions
  const defaultAssistant = useQuery(api.assistants.getDefaultAssistant);
  const createAssistant = useMutation(api.assistants.createAssistant);
  const updateAssistant = useMutation(api.assistants.updateAssistant);

  useEffect(() => {
    if (defaultAssistant) {
      setName(defaultAssistant.name || "Default Assistant");
      setModelName(defaultAssistant.modelName || "");
      setTemperature(defaultAssistant.temperature ?? 0.7);
      setActiveAfterQuestions(defaultAssistant.activeAfterQuestions ?? 1);
    }
  }, [defaultAssistant]);
  const handleSave = useCallback(async () => {
    try {
      if (defaultAssistant && "_id" in defaultAssistant) {
        // Update existing default assistant
        await updateAssistant({
          id: defaultAssistant._id,
          name: name.trim() || "Default Assistant",
          modelName: modelName.trim() || undefined,
          temperature: temperature,
          activeAfterQuestions: activeAfterQuestions,
        });
      } else {
        // Create new default assistant
        await createAssistant({
          name: name.trim() || "Default Assistant",
          modelName: modelName.trim() || undefined,
          temperature: temperature,
          activeAfterQuestions: activeAfterQuestions,
          isDefault: true,
        });
      }
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to save assistant settings:", error);
    }
  }, [
    name,
    modelName,
    temperature,
    activeAfterQuestions,
    defaultAssistant,
    updateAssistant,
    createAssistant,
  ]);

  const handleEdit = useCallback(() => {
    setIsEditing(true);
  }, []);

  const handleCancel = useCallback(() => {
    if (defaultAssistant) {
      setName(defaultAssistant.name || "Default Assistant");
      setModelName(defaultAssistant.modelName || "");
      setTemperature(defaultAssistant.temperature ?? 0.7);
      setActiveAfterQuestions(defaultAssistant.activeAfterQuestions ?? 1);
    }
    setIsEditing(false);
  }, [defaultAssistant]);

  return (
    <div className="p-4 space-y-6">
      {/* Assistant Configuration Header */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-gray-800">
          Assistant Configuration
        </h3>
      </div>

      {/* Assistant Name */}
      <motion.div
        className="space-y-3"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Label
          htmlFor="assistant-name"
          className="text-sm font-medium text-gray-700"
        >
          Assistant Name
        </Label>
        <Input
          id="assistant-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., My AI Assistant"
          disabled={!isEditing}
          className="w-full bg-white/50 backdrop-blur-sm border border-gray-200 rounded-lg"
        />
      </motion.div>

      {/* Model Name Box */}
      <motion.div
        className="space-y-3"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Label
          htmlFor="assistant-model"
          className="text-sm font-medium text-gray-700"
        >
          Model Name
        </Label>
        <Input
          id="assistant-model"
          type="text"
          value={modelName}
          onChange={(e) => setModelName(e.target.value)}
          placeholder="e.g., anthropic/claude-3.5-sonnet"
          disabled={!isEditing}
          className="w-full bg-white/50 backdrop-blur-sm border border-gray-200 rounded-lg"
        />
      </motion.div>

      {/* Temperature Slider */}
      <motion.div
        className="space-y-3"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium text-gray-700">
            Temperature
          </Label>
          <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
            {temperature}
          </span>
        </div>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={temperature}
          onChange={(e) => setTemperature(parseFloat(e.target.value))}
          disabled={!isEditing}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
        />
      </motion.div>

      {/* Active After Questions - Horizontal Scrollbar */}
      <motion.div
        className="space-y-3"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium text-gray-700">
            Active After Questions
          </Label>
          <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
            {activeAfterQuestions} question
            {activeAfterQuestions !== 1 ? "s" : ""}
          </span>
        </div>
        <input
          type="range"
          min="1"
          max="20"
          step="1"
          value={activeAfterQuestions}
          onChange={(e) => setActiveAfterQuestions(parseInt(e.target.value))}
          disabled={!isEditing}
          className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
          style={{
            background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${((activeAfterQuestions - 1) / 19) * 100}%, #e5e7eb ${((activeAfterQuestions - 1) / 19) * 100}%, #e5e7eb 100%)`,
          }}
        />
      </motion.div>

      {/* Action Buttons */}
      <motion.div
        className="flex gap-2 pt-4"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        {isEditing ? (
          <>
            <Button
              onClick={handleSave}
              className="flex items-center gap-2 bg-black text-white hover:bg-gray-800"
            >
              <IconDeviceFloppy size={16} />
              Save Settings
            </Button>
            <Button
              onClick={handleCancel}
              variant="outline"
              className="text-gray-600 border-gray-300 hover:bg-gray-50"
            >
              Cancel
            </Button>
          </>
        ) : (
          <Button
            onClick={handleEdit}
            className="flex items-center gap-2 bg-black text-white hover:bg-gray-800"
          >
            <IconEdit size={16} />
            Edit Settings
          </Button>
        )}
      </motion.div>

      {/* Current Settings Display */}
      <motion.div
        className="pt-4 border-t border-gray-200"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Current Assistant:</span>
            <span className="font-medium text-gray-800">
              {name || "Default Assistant"}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Model:</span>
            <span className="font-medium text-gray-800">
              {modelName || "No model specified"}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Temperature:</span>
            <span className="font-medium text-gray-800">
              {defaultAssistant?.temperature ?? 0.7}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Active After:</span>
            <span className="font-medium text-gray-800">
              {activeAfterQuestions} question
              {activeAfterQuestions !== 1 ? "s" : ""}
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
