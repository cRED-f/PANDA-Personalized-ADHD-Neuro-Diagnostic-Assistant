export type ContentType =
  | "chats"
  | "presets"
  | "prompts"
  | "assistants"
  | "tools"
  | "settings"
  | "models"
  | "calculate-score"
  | "calculation-settings";

export interface ChatMessage {
  _id: string;
  content: string;
  role: "user" | "ai" | "assistant" | "mentor" | "system";
  timestamp: number;
  chatId: string;
}

export interface Chat {
  _id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
}

export interface MessageImage {
  messageId: string;
  path: string;
  base64: string;
  url: string;
  file: File | null;
}

export interface ChatSettings {
  model: string;
  prompt: string;
  temperature: number;
  contextLength: number;
  includeProfileContext: boolean;
  includeWorkspaceInstructions: boolean;
  embeddingsProvider: "openai" | "local";
}

export interface ChatFile {
  id: string;
  name: string;
  type: string;
  size: number;
  content?: string;
}

export interface Preset {
  id: string;
  name: string;
  description?: string;
  settings: ChatSettings;
  createdAt: number;
  updatedAt: number;
}

export interface Prompt {
  id: string;
  name: string;
  content: string;
  createdAt: number;
  updatedAt: number;
}

export interface FileItem {
  id: string;
  name: string;
  type: string;
  size: number;
  content?: string;
  path?: string;
  createdAt: number;
  updatedAt: number;
}

export interface Collection {
  id: string;
  name: string;
  description?: string;
  items: string[]; // Array of item IDs
  createdAt: number;
  updatedAt: number;
}

export interface Assistant {
  id: string;
  name: string;
  description?: string;
  instructions: string;
  model: string;
  createdAt: number;
  updatedAt: number;
}

export interface Tool {
  _id: string;
  name: string;
  description: string;
  createdAt: number;
  updatedAt: number;
}

export interface Model {
  id: string;
  name: string;
  provider: string;
  description?: string;
  contextLength: number;
  available: boolean;
}

export interface ApiSettings {
  _id: string;
  apiKey: string;
  provider: string;
  createdAt: number;
  updatedAt: number;
}
