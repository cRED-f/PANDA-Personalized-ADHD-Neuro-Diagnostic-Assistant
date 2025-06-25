import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const getPrompts = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("prompts").order("desc").collect();
  },
});

export const getPromptsByTarget = query({
  args: {
    targetModel: v.union(
      v.literal("main"),
      v.literal("assistant"),
      v.literal("mentor"),
      v.literal("calculate-main-model")
    ),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("prompts")
      .filter((q) => q.eq(q.field("targetModel"), args.targetModel))
      .order("desc")
      .collect();
  },
});

export const createPrompt = mutation({
  args: {
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
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    return await ctx.db.insert("prompts", {
      name: args.name,
      content: args.content,
      targetModel: args.targetModel || "main", // Default to "main" if not specified
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const updatePrompt = mutation({
  args: {
    id: v.id("prompts"),
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
  },
  handler: async (ctx, args) => {
    const { id, ...updateData } = args;

    return await ctx.db.patch(id, {
      ...updateData,
      updatedAt: Date.now(),
    });
  },
});

export const deletePrompt = mutation({
  args: {
    id: v.id("prompts"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.delete(args.id);
  },
});
