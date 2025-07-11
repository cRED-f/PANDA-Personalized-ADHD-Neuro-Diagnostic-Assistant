import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Create a new voice chat session
export const createVoiceChat = mutation({
  args: {
    title: v.string(),
    sessionId: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("voiceChats", {
      title: args.title,
      sessionId: args.sessionId,
      status: "active",
      startTime: now,
      totalMessages: 0,
      createdAt: now,
      updatedAt: now,
    });
  },
});

// Get voice chat by session ID
export const getVoiceChatBySession = query({
  args: { sessionId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("voiceChats")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .first();
  },
});

// Get all voice messages for a session
export const getVoiceMessages = query({
  args: { sessionId: v.string() },
  handler: async (ctx, args) => {
    const messages = await ctx.db
      .query("voiceMessages")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .order("asc")
      .collect();
    return messages.map((msg) => ({
      ...msg,
    }));
  },
});

// Add a message to a voice chat session
export const addVoiceMessage = mutation({
  args: {
    sessionId: v.string(),
    messageId: v.string(),
    role: v.union(v.literal("user"), v.literal("assistant")),
    content: v.string(),
    audioUrl: v.optional(v.string()),
    transcription: v.optional(v.string()),
    duration: v.optional(v.number()),
    metadata: v.optional(
      v.object({
        confidence: v.optional(v.number()),
        language: v.optional(v.string()),
        emotion: v.optional(v.string()),
        processingTime: v.optional(v.number()),
      })
    ),
  },
  handler: async (ctx, args) => {
    // Insert the message
    const messageId = await ctx.db.insert("voiceMessages", {
      sessionId: args.sessionId,
      messageId: args.messageId,
      role: args.role,
      content: args.content,
      audioUrl: args.audioUrl,
      transcription: args.transcription,
      timestamp: Date.now(),
      duration: args.duration,
      metadata: args.metadata,
    });

    // Update voice chat message count and timestamp
    const voiceChat = await ctx.db
      .query("voiceChats")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .first();

    if (voiceChat) {
      await ctx.db.patch(voiceChat._id, {
        totalMessages: voiceChat.totalMessages + 1,
        updatedAt: Date.now(),
      });
    }

    return messageId;
  },
});

// Update voice chat status
export const updateVoiceChatStatus = mutation({
  args: {
    sessionId: v.string(),
    status: v.union(
      v.literal("active"),
      v.literal("paused"),
      v.literal("completed")
    ),
    endTime: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const voiceChat = await ctx.db
      .query("voiceChats")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .first();

    if (voiceChat) {
      const updates: {
        status: "active" | "paused" | "completed";
        updatedAt: number;
        endTime?: number;
      } = {
        status: args.status,
        updatedAt: Date.now(),
      };

      if (args.endTime !== undefined) {
        updates.endTime = args.endTime;
      }

      await ctx.db.patch(voiceChat._id, updates);
    }
  },
});

// Get all voice chats
export const getAllVoiceChats = query({
  handler: async (ctx) => {
    return await ctx.db.query("voiceChats").order("desc").collect();
  },
});

// Delete a voice chat and all its messages
export const deleteVoiceChat = mutation({
  args: { sessionId: v.string() },
  handler: async (ctx, args) => {
    // Delete all messages in the session
    const messages = await ctx.db
      .query("voiceMessages")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .collect();

    for (const message of messages) {
      await ctx.db.delete(message._id);
    }

    // Delete the voice chat
    const voiceChat = await ctx.db
      .query("voiceChats")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .first();

    if (voiceChat) {
      await ctx.db.delete(voiceChat._id);
    }

    return { success: true };
  },
});

// Voice Analysis Operations (similar to text analysis)

// Save voice chat analysis
export const saveVoiceAnalysis = mutation({
  args: {
    sessionId: v.string(),
    promptId: v.string(),
    promptName: v.string(),
    promptContent: v.string(),
    modelName: v.string(),
    temperature: v.number(),
    result: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Check if analysis already exists for this session/model
    const existing = await ctx.db
      .query("voiceChatAnalyses")
      .withIndex("by_session_and_model", (q) =>
        q.eq("sessionId", args.sessionId).eq("modelName", args.modelName)
      )
      .first();

    if (existing) {
      // Update existing analysis
      return await ctx.db.patch(existing._id, {
        promptId: args.promptId,
        promptName: args.promptName,
        promptContent: args.promptContent,
        temperature: args.temperature,
        result: args.result,
        updatedAt: now,
      });
    } else {
      // Create new analysis
      return await ctx.db.insert("voiceChatAnalyses", {
        sessionId: args.sessionId,
        promptId: args.promptId,
        promptName: args.promptName,
        promptContent: args.promptContent,
        modelName: args.modelName,
        temperature: args.temperature,
        result: args.result,
        createdAt: now,
        updatedAt: now,
      });
    }
  },
});

// Get voice chat analysis
export const getVoiceAnalysis = query({
  args: { sessionId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("voiceChatAnalyses")
      .withIndex("by_session_and_model", (q) =>
        q.eq("sessionId", args.sessionId)
      )
      .collect();
  },
});

// Delete voice chat analysis
export const deleteVoiceAnalysis = mutation({
  args: { sessionId: v.string() },
  handler: async (ctx, args) => {
    const analyses = await ctx.db
      .query("voiceChatAnalyses")
      .withIndex("by_session_and_model", (q) =>
        q.eq("sessionId", args.sessionId)
      )
      .collect();

    for (const analysis of analyses) {
      await ctx.db.delete(analysis._id);
    }

    return { success: true };
  },
});

// Save voice make text analysis (combined text + results)
export const saveVoiceMakeTextAnalysis = mutation({
  args: {
    sessionId: v.string(),
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
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Check if make text analysis already exists
    const existing = await ctx.db
      .query("voiceMakeTextAnalyses")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .first();

    if (existing) {
      // Update existing
      return await ctx.db.patch(existing._id, {
        combinedText: args.combinedText,
        analysisResults: args.analysisResults,
        updatedAt: now,
      });
    } else {
      // Create new
      return await ctx.db.insert("voiceMakeTextAnalyses", {
        sessionId: args.sessionId,
        combinedText: args.combinedText,
        analysisResults: args.analysisResults,
        createdAt: now,
        updatedAt: now,
      });
    }
  },
});

// Get voice make text analysis
export const getVoiceMakeTextAnalysis = query({
  args: { sessionId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("voiceMakeTextAnalyses")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .first();
  },
});

// Delete voice make text analysis
export const deleteVoiceMakeTextAnalysis = mutation({
  args: { sessionId: v.string() },
  handler: async (ctx, args) => {
    const analysis = await ctx.db
      .query("voiceMakeTextAnalyses")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .first();

    if (analysis) {
      await ctx.db.delete(analysis._id);
    }

    return { success: true };
  },
});

// Save voice combined text (for make text functionality)
export const saveVoiceCombinedText = mutation({
  args: {
    sessionId: v.string(),
    combinedText: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Check if make text analysis already exists
    const existing = await ctx.db
      .query("voiceMakeTextAnalyses")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .first();

    if (existing) {
      // Update existing with new combined text
      return await ctx.db.patch(existing._id, {
        combinedText: args.combinedText,
        updatedAt: now,
      });
    } else {
      // Create new with empty analysis results
      return await ctx.db.insert("voiceMakeTextAnalyses", {
        sessionId: args.sessionId,
        combinedText: args.combinedText,
        analysisResults: [],
        createdAt: now,
        updatedAt: now,
      });
    }
  },
});
