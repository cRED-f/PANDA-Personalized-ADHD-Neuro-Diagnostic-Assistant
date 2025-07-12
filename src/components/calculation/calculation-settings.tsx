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
    "gpt-4o-mini",
    "gpt-4o",
    "gpt-4",
    "gpt-3.5-turbo",
  ]);

  const [temperatures, setTemperatures] = useState([0.7, 0.7, 0.7, 0.7]);

  // Single model state
  const [singleModelName, setSingleModelName] = useState("gpt-4o");
  const [singleModelTemperature, setSingleModelTemperature] = useState(0.7);

  // Calculation API key state
  const [calculationApiKey, setCalculationApiKey] = useState("");

  // Calculation provider state
  const [calculationProvider, setCalculationProvider] = useState("OpenRouter");

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
        calculationApiKey: savedCalculationApiKey,
        calculationProvider: savedCalculationProvider,
      } = calculationSettings;

      if (savedModelNames) setModelNames(savedModelNames);
      if (savedTemperatures) setTemperatures(savedTemperatures);
      if (savedSingleModelName) setSingleModelName(savedSingleModelName);
      if (savedSingleModelTemperature !== undefined)
        setSingleModelTemperature(savedSingleModelTemperature);
      if (savedCalculationApiKey) setCalculationApiKey(savedCalculationApiKey);
      if (savedCalculationProvider)
        setCalculationProvider(savedCalculationProvider);
      else setCalculationProvider("OpenRouter"); // Default to OpenRouter for backward compatibility
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
        calculationApiKey,
        calculationProvider,
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
        <div className="mb-4 p-3 bg-blue-50 border-l-4 border-blue-400 rounded">
          <p className="text-sm text-blue-800">
            <strong>Provider: {calculationProvider}</strong>
            {calculationProvider === "OpenAI" ? (
              <span>
                {" "}
                - Use OpenAI model names like: gpt-4o, gpt-4, gpt-3.5-turbo
              </span>
            ) : (
              <span>
                {" "}
                - Use OpenRouter model names like: gpt-4o-mini,
                anthropic/claude-3.5-sonnet, meta-llama/llama-3.1-8b-instruct
              </span>
            )}
          </p>
        </div>
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
            placeholder={
              calculationProvider === "OpenAI"
                ? "e.g., gpt-4o, gpt-4, gpt-3.5-turbo"
                : "e.g., gpt-4o-mini, anthropic/claude-3.5-sonnet, meta-llama/llama-3.1-8b-instruct"
            }
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

        <h3 className="text-md font-medium text-gray-800 border-b pb-2 mb-4 mt-8">
          API Configuration
        </h3>
        <div>
          <Label htmlFor="calculation-provider">AI Provider</Label>
          <select
            id="calculation-provider"
            value={calculationProvider}
            onChange={(e) => setCalculationProvider(e.target.value)}
            disabled={!isEditing}
            className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
          >
            <option value="OpenRouter">OpenRouter</option>
            <option value="OpenAI">OpenAI</option>
          </select>
          <p className="text-xs text-gray-500 mt-1">
            Choose the AI provider for calculations. Different providers may
            have different available models.
          </p>
        </div>
        <div>
          <Label htmlFor="calculation-api-key">Calculation API Key</Label>
          <Input
            id="calculation-api-key"
            type="password"
            value={calculationApiKey}
            onChange={(e) => setCalculationApiKey(e.target.value)}
            disabled={!isEditing}
            className="mt-1"
            placeholder={`Enter ${calculationProvider} API key for calculations (optional)`}
          />
          <p className="text-xs text-gray-500 mt-1">
            Use a different API key specifically for calculations. Leave empty
            to use the main API key.
          </p>
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
