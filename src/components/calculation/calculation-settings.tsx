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

  // State to hold model names and temperatures
  const [modelNames, setModelNames] = useState([
    "anthropic/claude-3.5-sonnet",
    "gpt-3.5-turbo",
    "gpt-4",
    "bert-base-uncased",
  ]);

  const [temperatures, setTemperatures] = useState([0.7, 0.7, 0.7, 0.7]);

  // Single model state
  const [singleModelName, setSingleModelName] = useState(
    "anthropic/claude-3.5-sonnet"
  );
  const [singleModelTemperature, setSingleModelTemperature] = useState(0.7);

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
      const {
        modelNames: savedModelNames,
        temperatures: savedTemperatures,
        singleModelName: savedSingleModelName,
        singleModelTemperature: savedSingleModelTemperature,
      } = calculationSettings;

      if (savedModelNames) setModelNames(savedModelNames);
      if (savedTemperatures) setTemperatures(savedTemperatures);
      if (savedSingleModelName) setSingleModelName(savedSingleModelName);
      if (savedSingleModelTemperature !== undefined)
        setSingleModelTemperature(savedSingleModelTemperature);
    }
  }, [calculationSettings]);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = async () => {
    try {
      await saveCalculationSettings({
        modelNames,
        temperatures,
        singleModelName,
        singleModelTemperature,
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
        <h3 className="text-md font-medium text-gray-800 border-b pb-2 mb-4">
          Multi-Model Settings
        </h3>
        {modelNames.map((modelName, index) => (
          <div key={index}>
            <Label htmlFor={`model-name-${index}`}>
              Model Name {index + 1}
            </Label>
            <Input
              id={`model-name-${index}`}
              value={modelName}
              onChange={(e) => {
                const newModelNames = [...modelNames];
                newModelNames[index] = e.target.value;
                setModelNames(newModelNames);
              }}
              disabled={!isEditing}
              className="mt-1"
            />
            <Label htmlFor={`temperature-${index}`} className="mt-2">
              Temperature {index + 1}
            </Label>
            <Input
              id={`temperature-${index}`}
              type="number"
              min="0"
              max="2"
              step="0.1"
              value={temperatures[index]}
              onChange={(e) => {
                const newTemperatures = [...temperatures];
                newTemperatures[index] = parseFloat(e.target.value);
                setTemperatures(newTemperatures);
              }}
              disabled={!isEditing}
              className="mt-1"
            />
          </div>
        ))}

        <h3 className="text-md font-medium text-gray-800 border-b pb-2 mb-4 mt-8">
          Single Model Settings
        </h3>
        <div>
          <Label htmlFor="single-model-name">Single Model Name</Label>
          <Input
            id="single-model-name"
            value={singleModelName}
            onChange={(e) => setSingleModelName(e.target.value)}
            disabled={!isEditing}
            className="mt-1"
            placeholder="e.g., anthropic/claude-3.5-sonnet"
          />
        </div>
        <div>
          <Label htmlFor="single-model-temperature">
            Single Model Temperature
          </Label>
          <Input
            id="single-model-temperature"
            type="number"
            min="0"
            max="2"
            step="0.1"
            value={singleModelTemperature}
            onChange={(e) =>
              setSingleModelTemperature(parseFloat(e.target.value))
            }
            disabled={!isEditing}
            className="mt-1"
          />
        </div>

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
