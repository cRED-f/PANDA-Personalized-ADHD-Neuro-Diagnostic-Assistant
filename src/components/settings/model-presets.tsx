"use client";

import { FC, useState, useCallback, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { IconDeviceFloppy } from "@tabler/icons-react";

export const ModelPresets: FC = () => {
  const [temperature, setTemperature] = useState(0.7);
  const [isEditing, setIsEditing] = useState(false);

  const apiSettings = useQuery(api.settings.getApiSettings);
  const saveApiSettings = useMutation(api.settings.saveApiSettings);

  useEffect(() => {
    if (apiSettings) {
      setTemperature(apiSettings.temperature ?? 0.7);
    }
  }, [apiSettings]);

  const handleSave = useCallback(async () => {
    try {
      await saveApiSettings({
        temperature: temperature,
      });
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to save preset settings:", error);
    }
  }, [temperature, saveApiSettings]);

  const handleEdit = useCallback(() => {
    setIsEditing(true);
  }, []);

  const handleCancel = useCallback(() => {
    if (apiSettings) {
      setTemperature(apiSettings.temperature ?? 0.7);
    }
    setIsEditing(false);
  }, [apiSettings]);

  return (
    <div className="p-4 space-y-6">
      <div className="space-y-6">
        <label className="block text-sm font-medium text-gray-700">
          Model Parameters
        </label>{" "}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-600">
              Temperature
            </label>
            <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
              {temperature.toFixed(2)}
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
          <p className="text-xs text-gray-400">
            Controls randomness (0 = deterministic, 1 = very random)
          </p>
        </div>
      </div>
      <div className="flex gap-2 pt-4">
        {isEditing ? (
          <>
            <Button
              onClick={handleSave}
              className="flex items-center gap-2 bg-black text-white hover:bg-gray-800"
            >
              <IconDeviceFloppy size={16} />
              Save Presets
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
            className="text-gray-600 border-gray-300 hover:bg-gray-50"
          >
            Edit Presets
          </Button>
        )}
      </div>{" "}
      <div className="pt-4 border-t border-gray-200">
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Current Temperature:</span>
            <span className="font-medium text-gray-700">
              {temperature.toFixed(2)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
