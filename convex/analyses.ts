import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Get analysis for a specific chat
export const getChatAnalysis = query({
  args: { chatId: v.string() },
  handler: async (ctx, args) => {
    const analysis = await ctx.db
      .query("chatAnalyses")
      .withIndex("by_chat", (q) => q.eq("chatId", args.chatId))
      .order("desc")
      .first();
    return analysis;
  },
});

// Save analysis result
export const saveAnalysis = mutation({
  args: {
    chatId: v.string(),
    promptId: v.string(),
    promptName: v.string(),
    promptContent: v.string(),
    modelName: v.string(),
    temperature: v.number(),
    result: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Delete any existing analysis for this chat
    const existingAnalysis = await ctx.db
      .query("chatAnalyses")
      .withIndex("by_chat", (q) => q.eq("chatId", args.chatId))
      .first();

    if (existingAnalysis) {
      await ctx.db.delete(existingAnalysis._id);
    }

    // Create new analysis record
    const analysisId = await ctx.db.insert("chatAnalyses", {
      chatId: args.chatId,
      promptId: args.promptId,
      promptName: args.promptName,
      promptContent: args.promptContent,
      modelName: args.modelName,
      temperature: args.temperature,
      result: args.result,
      createdAt: now,
    });

    return analysisId;
  },
});

// Delete analysis for a chat
export const deleteAnalysis = mutation({
  args: { chatId: v.string() },
  handler: async (ctx, args) => {
    const analysis = await ctx.db
      .query("chatAnalyses")
      .withIndex("by_chat", (q) => q.eq("chatId", args.chatId))
      .first();

    if (analysis) {
      await ctx.db.delete(analysis._id);
    }
  },
});
