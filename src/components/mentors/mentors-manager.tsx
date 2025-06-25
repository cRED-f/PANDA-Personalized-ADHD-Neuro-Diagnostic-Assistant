"use client";

import { FC, useState, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { IconEdit, IconDeviceFloppy } from "@tabler/icons-react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";

export const MentorsManager: FC = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState("");
  const [modelName, setModelName] = useState("");
  const [temperature, setTemperature] = useState(0.7);

  const [activeAfterQuestions, setActiveAfterQuestions] = useState(1);
  const defaultMentor = useQuery(api.mentors.getDefaultMentor);
  const createMentor = useMutation(api.mentors.createMentor);
  const updateMentor = useMutation(api.mentors.updateMentor);

  // Initialize form with default mentor data
  useEffect(() => {
    if (defaultMentor) {
      setName(defaultMentor.name || "Default Mentor");
      setModelName(defaultMentor.modelName || "");
      setTemperature(defaultMentor.temperature ?? 0.7);
      setActiveAfterQuestions(defaultMentor.activeAfterQuestions ?? 1);
    }
  }, [defaultMentor]);
  const handleSave = useCallback(async () => {
    try {
      if (defaultMentor) {
        await updateMentor({
          id: defaultMentor._id,
          name: name.trim() || undefined,
          modelName: modelName.trim() || undefined,
          temperature: temperature,
          activeAfterQuestions: activeAfterQuestions,
          isDefault: true,
        });
      } else {
        await createMentor({
          name: name.trim() || "Default Mentor",
          modelName: modelName.trim() || undefined,
          temperature: temperature,
          activeAfterQuestions: activeAfterQuestions,
          isDefault: true,
        });
      }
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to save mentor settings:", error);
    }
  }, [
    name,
    modelName,
    temperature,
    activeAfterQuestions,
    defaultMentor,
    updateMentor,
    createMentor,
  ]);

  const handleEdit = useCallback(() => {
    setIsEditing(true);
  }, []);
  const handleCancel = useCallback(() => {
    if (defaultMentor) {
      setName(defaultMentor.name || "Default Mentor");
      setModelName(defaultMentor.modelName || "");
      setTemperature(defaultMentor.temperature ?? 0.7);
      setActiveAfterQuestions(defaultMentor.activeAfterQuestions ?? 1);
    }
    setIsEditing(false);
  }, [defaultMentor]);

  return (
    <div className="p-4 space-y-6">
      {/* Mentor Configuration Header */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-gray-800">
          Mentor Configuration
        </h3>
      </div>
      {/* Mentor Name */}
      <motion.div
        className="space-y-3"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Label
          htmlFor="mentor-name"
          className="text-sm font-medium text-gray-700"
        >
          Mentor Name
        </Label>
        <Input
          id="mentor-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., My AI Mentor"
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
          htmlFor="mentor-model"
          className="text-sm font-medium text-gray-700"
        >
          Model Name
        </Label>
        <Input
          id="mentor-model"
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
        <Label className="text-sm font-medium text-gray-700">
          Temperature: {temperature}
        </Label>
        <div className="relative">
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={temperature}
            onChange={(e) => setTemperature(parseFloat(e.target.value))}
            disabled={!isEditing}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
            style={{
              background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${temperature * 100}%, #e5e7eb ${temperature * 100}%, #e5e7eb 100%)`,
            }}
          />
        </div>
      </motion.div>{" "}
      {/* Active After Questions Slider */}
      <motion.div
        className="space-y-3"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Label className="text-sm font-medium text-gray-700">
          Active After Questions: {activeAfterQuestions}
        </Label>
        <div className="text-xs text-gray-500 mb-2">
          Mentor activates after this many user questions
        </div>
        <div className="relative">
          <input
            type="range"
            min="1"
            max="20"
            step="1"
            value={activeAfterQuestions}
            onChange={(e) => setActiveAfterQuestions(parseInt(e.target.value))}
            disabled={!isEditing}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
            style={{
              background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${((activeAfterQuestions - 1) / 19) * 100}%, #e5e7eb ${((activeAfterQuestions - 1) / 19) * 100}%, #e5e7eb 100%)`,
            }}
          />
        </div>
      </motion.div>
      {/* Action Buttons */}
      <motion.div
        className="flex gap-2 pt-4 border-t border-gray-200"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        {isEditing ? (
          <>
            <Button
              onClick={handleSave}
              className="flex items-center gap-2 bg-black text-white hover:bg-gray-800"
            >
              <IconDeviceFloppy size={16} />
              Save Configuration
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
            variant="outline"
            className="flex items-center gap-2 text-gray-600 border-gray-300 hover:bg-gray-50"
          >
            <IconEdit size={16} />
            Edit Configuration
          </Button>
        )}
      </motion.div>
      {/* Current Status Display */}
      <motion.div
        className="pt-4 border-t border-gray-200"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
      >
        <h4 className="text-sm font-medium text-gray-700 mb-3">
          Current Configuration
        </h4>
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Name:</span>
            <span className="font-medium text-gray-800">
              {defaultMentor?.name || "Not configured"}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Model:</span>
            <span className="font-medium text-gray-800">
              {defaultMentor?.modelName || "Not set"}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Temperature:</span>{" "}
            <span className="font-medium text-gray-800">
              {defaultMentor?.temperature ?? 0.7}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Active After:</span>
            <span className="font-medium text-gray-800">
              {activeAfterQuestions !== 1 ? "s" : ""}
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
