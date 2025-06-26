import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Get analysis for a specific chat
export const getChatAnalysis = query({
  args: { chatId: v.string() },
  handler: async (ctx, args) => {
    const analysis = await ctx.db
      .query("chatAnalyses")
      .withIndex("by_chat_and_model", (q) => q.eq("chatId", args.chatId))
      .order("desc")
      .collect(); // Changed to collect to return all the analyses
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

    // We will store separate records for each model's result
    const analysisData = {
      chatId: args.chatId,
      promptId: args.promptId,
      promptName: args.promptName,
      promptContent: args.promptContent,
      modelName: args.modelName,
      temperature: args.temperature,
      result: args.result,
      createdAt: now,
      updatedAt: now, // Add updatedAt for tracking
    };

    // Create new analysis record for each model's result
    const analysisId = await ctx.db.insert("chatAnalyses", analysisData);

    return analysisId;
  },
});

// Delete analysis for a chat (this will delete all analysis results for the chat)
export const deleteAnalysis = mutation({
  args: { chatId: v.string() },
  handler: async (ctx, args) => {
    const analyses = await ctx.db
      .query("chatAnalyses")
      .withIndex("by_chat_and_model", (q) => q.eq("chatId", args.chatId))
      .collect(); // Collect all the analyses for this chat

    // Delete all analysis records related to this chat
    for (const analysis of analyses) {
      await ctx.db.delete(analysis._id);
    }
  },
});
