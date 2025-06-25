"use client";

import { FC, useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { IconEdit, IconCheck } from "@tabler/icons-react";

interface CalculationSettingsProps {
  onToggleSidebar?: () => void;
}

const CalculationSettings: FC<CalculationSettingsProps> = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [modelName, setModelName] = useState("anthropic/claude-3.5-sonnet");
  const [temperature, setTemperature] = useState(0.7);

  // Query to get calculation settings from database
  const calculationSettings = useQuery(
    api.calculationSettings.getCalculationSettings
  );

  // Mutation to save calculation settings to database
  const saveCalculationSettings = useMutation(
    api.calculationSettings.saveCalculationSettings
  );

  // Load settings from database when component mounts or settings change
  useEffect(() => {
    if (calculationSettings) {
      setModelName(calculationSettings.modelName);
      setTemperature(calculationSettings.temperature);
    }
  }, [calculationSettings]);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = async () => {
    try {
      await saveCalculationSettings({
        modelName,
        temperature,
      });
      setIsEditing(false);
      console.log("Settings saved successfully");
    } catch (error) {
      console.error("Failed to save settings:", error);
    }
  };

  return (
    <div className="flex h-full flex-col bg-white/90 backdrop-blur-xl p-4">
      <h2 className="text-lg font-semibold text-gray-900 mb-6">
        Calculation Settings
      </h2>

      <div className="space-y-4">
        <div>
          <Label htmlFor="model-name">Model Name</Label>
          <Input
            id="model-name"
            value={modelName}
            onChange={(e) => setModelName(e.target.value)}
            disabled={!isEditing}
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="temperature">Temperature</Label>
          <Input
            id="temperature"
            type="number"
            min="0"
            max="2"
            step="0.1"
            value={temperature}
            onChange={(e) => setTemperature(parseFloat(e.target.value))}
            disabled={!isEditing}
            className="mt-1"
          />
        </div>{" "}
        <div className="pt-4">
          {!isEditing ? (
            <Button
              onClick={handleEdit}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg transition-colors duration-200 shadow-sm hover:shadow-md"
            >
              <IconEdit size={16} className="mr-2" />
              Edit Settings
            </Button>
          ) : (
            <Button
              onClick={handleSave}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2.5 rounded-lg transition-colors duration-200 shadow-sm hover:shadow-md"
            >
              <IconCheck size={16} className="mr-2" />
              Save Changes
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CalculationSettings;
