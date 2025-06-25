"use client";

import { FC, useState, useCallback, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { IconKey, IconDeviceFloppy } from "@tabler/icons-react";

export const ApiSettings: FC = () => {
  const [apiKey, setApiKey] = useState("");
  const [provider, setProvider] = useState("OpenRouter");
  const [modelName, setModelName] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const apiSettings = useQuery(api.settings.getApiSettings);
  const saveApiSettings = useMutation(api.settings.saveApiSettings); // Set initial values when data loads
  useEffect(() => {
    if (apiSettings) {
      setApiKey(apiSettings.apiKey || "");
      setProvider(apiSettings.provider || "OpenRouter");
      setModelName(apiSettings.modelName || "");
    }
  }, [apiSettings]);
  const handleSave = useCallback(async () => {
    try {
      await saveApiSettings({
        apiKey: apiKey.trim(),
        provider: provider.trim(),
        modelName: modelName.trim() || undefined,
      });
      setIsEditing(false);
      // Show success message (you can add a toast here)
    } catch (error) {
      console.error("Failed to save API settings:", error);
      // Show error message (you can add a toast here)
    }
  }, [apiKey, provider, modelName, saveApiSettings]);

  const handleEdit = useCallback(() => {
    setIsEditing(true);
  }, []);
  const handleCancel = useCallback(() => {
    // Reset to original values
    if (apiSettings) {
      setApiKey(apiSettings.apiKey || "");
      setProvider(apiSettings.provider || "OpenRouter");
      setModelName(apiSettings.modelName || "");
    }
    setIsEditing(false);
  }, [apiSettings]);

  return (
    <div className="p-4 space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <IconKey size={20} className="text-gray-600" />
        <h3 className="text-lg font-semibold text-gray-900">API Settings</h3>
      </div>

      <div className="space-y-4">
        {/* Provider Selection */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            AI Provider
          </label>
          <select
            value={provider}
            onChange={(e) => setProvider(e.target.value)}
            disabled={!isEditing}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
          >
            <option value="OpenRouter">OpenRouter</option>
            <option value="OpenAI">OpenAI</option>
            <option value="Anthropic">Anthropic</option>
            <option value="Google">Google AI</option>
          </select>
        </div>{" "}
        {/* API Key Input */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            API Key
          </label>
          <Input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Enter your API key..."
            disabled={!isEditing}
            className="w-full"
          />
          <p className="text-xs text-gray-500">
            Your API key is stored securely and used only for making requests to
            the AI provider.
          </p>
        </div>{" "}
        {/* Model Name Input */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Model Name (Optional)
          </label>
          <Input
            type="text"
            value={modelName}
            onChange={(e) => setModelName(e.target.value)}
            placeholder="e.g., gpt-4, claude-3-sonnet, etc."
            disabled={!isEditing}
            className="w-full"
          />
          <p className="text-xs text-gray-500">
            Specify a custom model name. If left empty, the default model for
            your provider will be used.
          </p>
        </div>
        {/* Action Buttons */}
        <div className="flex gap-2 pt-4">
          {isEditing ? (
            <>
              {" "}
              <Button
                onClick={handleSave}
                disabled={!apiKey.trim()}
                className="flex items-center gap-2 bg-black text-white hover:bg-gray-800"
              >
                <IconDeviceFloppy size={16} />
                Save
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
              Edit Settings
            </Button>
          )}
        </div>{" "}
        {/* Current Status */}
        <div className="pt-4 border-t border-gray-200">
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Status:</span>
              <span
                className={`font-medium ${apiKey ? "text-green-600" : "text-orange-600"}`}
              >
                {apiKey ? "API Key Configured" : "No API Key Set"}
              </span>
            </div>
            {modelName && (
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Model:</span>
                <span className="font-medium text-blue-600">{modelName}</span>
              </div>
            )}
          </div>{" "}
        </div>
      </div>
    </div>
  );
};
