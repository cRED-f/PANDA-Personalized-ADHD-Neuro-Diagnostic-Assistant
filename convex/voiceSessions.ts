import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Create a new voice session
export const createVoiceSession = mutation({
  args: {
    sessionId: v.string(),
    userId: v.optional(v.string()),
    title: v.string(),
  },
  handler: async (ctx, args) => {
    const sessionId = await ctx.db.insert("voiceSessions", {
      sessionId: args.sessionId,
      userId: args.userId,
      title: args.title,
      startTime: Date.now(),
      totalMessages: 0,
      status: "active",
    });
    return sessionId;
  },
});

// Update voice session
export const updateVoiceSession = mutation({
  args: {
    sessionId: v.string(),
    updates: v.object({
      title: v.optional(v.string()),
      status: v.optional(
        v.union(
          v.literal("active"),
          v.literal("paused"),
          v.literal("completed")
        )
      ),
      endTime: v.optional(v.number()),
      totalMessages: v.optional(v.number()),
      metadata: v.optional(
        v.object({
          totalDuration: v.optional(v.number()),
          averageResponseTime: v.optional(v.number()),
          mood: v.optional(v.string()),
          topics: v.optional(v.array(v.string())),
        })
      ),
    }),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("voiceSessions")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .first();

    if (!session) {
      throw new Error("Voice session not found");
    }

    await ctx.db.patch(session._id, args.updates);
    return session._id;
  },
});

// Add message to voice session
export const addVoiceMessage = mutation({
  args: {
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

    // Update session message count
    const session = await ctx.db
      .query("voiceSessions")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .first();

    if (session) {
      await ctx.db.patch(session._id, {
        totalMessages: session.totalMessages + 1,
      });
    }

    return messageId;
  },
});

// Get voice session with messages
export const getVoiceSession = query({
  args: { sessionId: v.string() },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("voiceSessions")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .first();

    if (!session) {
      return null;
    }

    const messages = await ctx.db
      .query("voiceMessages")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .order("asc")
      .collect();

    return {
      session,
      messages,
    };
  },
});

// Get all voice sessions
export const getVoiceSessions = query({
  args: { userId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const query = ctx.db.query("voiceSessions");

    if (args.userId) {
      // Filter by user when user management is implemented
    }

    const sessions = await query.order("desc").collect();

    // Get message count for each session
    const sessionsWithCounts = await Promise.all(
      sessions.map(async (session) => {
        const messageCount = await ctx.db
          .query("voiceMessages")
          .withIndex("by_session", (q) => q.eq("sessionId", session.sessionId))
          .collect()
          .then((messages) => messages.length);

        return {
          ...session,
          messageCount,
        };
      })
    );

    return sessionsWithCounts;
  },
});

// Delete voice session and all its messages
export const deleteVoiceSession = mutation({
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

    // Delete the session
    const session = await ctx.db
      .query("voiceSessions")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .first();

    if (session) {
      await ctx.db.delete(session._id);
    }

    return { success: true };
  },
});

// Get voice messages for a session
export const getVoiceMessages = query({
  args: {
    sessionId: v.string(),
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const query = ctx.db
      .query("voiceMessages")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .order("asc");

    if (args.offset) {
      // Skip messages for pagination
    }

    let messages = await query.collect();

    if (args.limit) {
      messages = messages.slice(0, args.limit);
    }

    return messages;
  },
});
