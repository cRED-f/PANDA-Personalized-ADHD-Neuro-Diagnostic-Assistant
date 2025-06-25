// OpenRouter API configuration
export const OPENROUTER_CONFIG = {
  apiUrl: "https://openrouter.ai/api/v1",
  defaultModel: "anthropic/claude-3.5-sonnet:beta",
  fallbackModel: "meta-llama/llama-3.1-8b-instruct:free",
};

export interface OpenRouterMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface OpenRouterRequest {
  model: string;
  messages: OpenRouterMessage[];
  temperature?: number;
  stream?: boolean;
}

export interface OpenRouterResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: {
    index: number;
    message: {
      role: "assistant";
      content: string;
    };
    finish_reason: string;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}
