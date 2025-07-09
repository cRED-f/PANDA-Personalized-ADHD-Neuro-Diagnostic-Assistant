import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  messages: defineTable({
    content: v.string(),
    role: v.union(
      v.literal("user"),
      v.literal("ai"),
      v.literal("assistant"),
      v.literal("system"),
      v.literal("mentor")
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
        v.literal("calculate-1"),
        v.literal("calculate-2"),
        v.literal("calculate-3"),
        v.literal("calculate-4"),
        v.literal("single-model"),
        v.literal("assistant"),
        v.literal("mentor")
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

  voiceSessions: defineTable({
    sessionId: v.string(),
    userId: v.optional(v.string()),
    title: v.string(),
    startTime: v.number(),
    endTime: v.optional(v.number()),
    totalMessages: v.number(),
    status: v.union(
      v.literal("active"),
      v.literal("paused"),
      v.literal("completed")
    ),
    metadata: v.optional(
      v.object({
        totalDuration: v.optional(v.number()),
        averageResponseTime: v.optional(v.number()),
        mood: v.optional(v.string()),
        topics: v.optional(v.array(v.string())),
      })
    ),
  }).index("by_session", ["sessionId"]),

  voiceMessages: defineTable({
    sessionId: v.string(),
    messageId: v.string(),
    role: v.union(
      v.literal("user"),
      v.literal("assistant"),
      v.literal("system")
    ),
    content: v.string(),
    audioUrl: v.optional(v.string()),
    transcription: v.optional(v.string()),
    timestamp: v.number(),
    duration: v.optional(v.number()),
    metadata: v.optional(
      v.object({
        confidence: v.optional(v.number()),
        language: v.optional(v.string()),
        emotion: v.optional(v.string()),
        processingTime: v.optional(v.number()),
      })
    ),
  })
    .index("by_session", ["sessionId"])
    .index("by_timestamp", ["timestamp"]),
});
