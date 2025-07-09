import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  messages: defineTable({
    content: v.string(),
    role: v.union(v.literal("user"), v.literal("ai"), v.literal("system")),
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
        v.literal("calculate-1"),
        v.literal("calculate-2"),
        v.literal("calculate-3"),
        v.literal("calculate-4"),
        v.literal("single-model")
      )
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
  }),
  calculationSettings: defineTable({
    modelNames: v.array(v.string()),
    temperatures: v.array(v.number()),
    singleModelName: v.optional(v.string()),
    singleModelTemperature: v.optional(v.number()),
    calculationApiKey: v.optional(v.string()),
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
    updatedAt: v.number(),
  }).index("by_chat_and_model", ["chatId", "modelName"]),
  makeTextAnalyses: defineTable({
    chatId: v.string(),
    combinedText: v.string(),
    analysisResults: v.array(
      v.object({
        modelName: v.string(),
        promptId: v.string(),
        promptName: v.string(),
        promptContent: v.string(),
        temperature: v.number(),
        result: v.string(),
      })
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_chat", ["chatId"]),
});
