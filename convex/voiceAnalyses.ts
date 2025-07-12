import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Get voice chat analysis for a session
export const getVoiceChatAnalysis = query({
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

    // Check if analysis already exists for this session, model, and prompt
    const existingAnalysis = await ctx.db
      .query("voiceChatAnalyses")
      .withIndex("by_session_and_model", (q) =>
        q.eq("sessionId", args.sessionId)
      )
      .filter((q) =>
        q.and(
          q.eq(q.field("modelName"), args.modelName),
          q.eq(q.field("promptId"), args.promptId)
        )
      )
      .first();

    if (existingAnalysis) {
      // Update existing analysis
      await ctx.db.patch(existingAnalysis._id, {
        promptName: args.promptName,
        promptContent: args.promptContent,
        temperature: args.temperature,
        result: args.result,
        updatedAt: now,
      });
      return existingAnalysis._id;
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

// Delete voice chat analysis for a session
export const deleteVoiceAnalysis = mutation({
  args: { sessionId: v.string() },
  handler: async (ctx, args) => {
    // Get all analyses for this session
    const analyses = await ctx.db
      .query("voiceChatAnalyses")
      .withIndex("by_session_and_model", (q) =>
        q.eq("sessionId", args.sessionId)
      )
      .collect();

    // Delete all analyses
    for (const analysis of analyses) {
      await ctx.db.delete(analysis._id);
    }

    // Also delete make text analysis if it exists
    const makeTextAnalysis = await ctx.db
      .query("voiceMakeTextAnalyses")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .first();

    if (makeTextAnalysis) {
      await ctx.db.delete(makeTextAnalysis._id);
    }
  },
});

// Get voice make text analysis for a session
export const getVoiceMakeTextAnalysis = query({
  args: { sessionId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("voiceMakeTextAnalyses")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .first();
  },
});

// Save voice make text analysis
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

    // Check if make text analysis already exists for this session
    const existingAnalysis = await ctx.db
      .query("voiceMakeTextAnalyses")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .first();

    if (existingAnalysis) {
      // Update existing analysis
      await ctx.db.patch(existingAnalysis._id, {
        combinedText: args.combinedText,
        analysisResults: args.analysisResults,
        updatedAt: now,
      });
      return existingAnalysis._id;
    } else {
      // Create new analysis
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

// Save voice combined text only (for Make Text functionality)
export const saveVoiceCombinedText = mutation({
  args: {
    sessionId: v.string(),
    combinedText: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Check if make text analysis already exists for this session
    const existingAnalysis = await ctx.db
      .query("voiceMakeTextAnalyses")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .first();

    if (existingAnalysis) {
      // Update existing analysis with new combined text
      await ctx.db.patch(existingAnalysis._id, {
        combinedText: args.combinedText,
        updatedAt: now,
      });
      return existingAnalysis._id;
    } else {
      // Create new analysis with just combined text
      return await ctx.db.insert("voiceMakeTextAnalyses", {
        sessionId: args.sessionId,
        combinedText: args.combinedText,
        analysisResults: [], // Empty initially
        createdAt: now,
        updatedAt: now,
      });
    }
  },
});

// Delete voice make text analysis for a session
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
  },
});

// Get voice conversation history for analysis
export const getVoiceConversationHistory = query({
  args: { sessionId: v.string() },
  handler: async (ctx, args) => {
    const messages = await ctx.db
      .query("voiceMessages")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .order("asc")
      .collect();

    return messages.map((msg) => ({
      role: msg.role === "assistant" ? "ai" : msg.role, // Convert to match text chat format
      content: msg.transcription || msg.content, // Use transcription if available, otherwise content
      timestamp: msg.timestamp,
      duration: msg.duration,
      audioUrl: msg.audioUrl,
      metadata: msg.metadata,
    }));
  },
});
