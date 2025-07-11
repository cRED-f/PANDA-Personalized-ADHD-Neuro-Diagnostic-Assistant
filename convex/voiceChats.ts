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
