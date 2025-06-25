import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  messages: defineTable({
    content: v.string(),
    role: v.union(
      v.literal("user"),
      v.literal("ai"),
      v.literal("assistant"),
      v.literal("mentor"),
      v.literal("system")
    ),
    timestamp: v.number(),
    chatId: v.string(),
  }).index("by_chat", ["chatId"]),

  chats: defineTable({
    title: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }),
  settings: defineTable({
    apiKey: v.string(),
    provider: v.string(),
    modelName: v.optional(v.string()),
    temperature: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }),
  prompts: defineTable({
    name: v.string(),
    content: v.string(),
    targetModel: v.optional(
      v.union(
        v.literal("main"),
        v.literal("assistant"),
        v.literal("mentor"),
        v.literal("calculate-main-model")
      )
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
  }),
  assistants: defineTable({
    name: v.string(),
    modelName: v.optional(v.string()),
    temperature: v.optional(v.number()),
    activeAfterQuestions: v.optional(v.number()),
    systemPrompt: v.optional(v.string()),
    isDefault: v.optional(v.boolean()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }),
  mentors: defineTable({
    name: v.string(),
    modelName: v.optional(v.string()),
    temperature: v.optional(v.number()),
    activeAfterQuestions: v.optional(v.number()),
    systemPrompt: v.optional(v.string()),
    isDefault: v.optional(v.boolean()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }),
  calculationSettings: defineTable({
    modelName: v.string(),
    temperature: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }),
  chatAnalyses: defineTable({
    chatId: v.string(),
    promptId: v.string(),
    promptName: v.string(),
    promptContent: v.string(),
    modelName: v.string(),
    temperature: v.number(),
    result: v.string(),
    createdAt: v.number(),
  }).index("by_chat", ["chatId"]),
});
