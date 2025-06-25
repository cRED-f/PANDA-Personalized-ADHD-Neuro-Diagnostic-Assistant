import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const getAssistants = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("assistants").collect();
  },
});

export const getDefaultAssistant = query({
  args: {},
  handler: async (ctx) => {
    const defaultAssistant = await ctx.db
      .query("assistants")
      .filter((q) => q.eq(q.field("isDefault"), true))
      .first();
    if (!defaultAssistant) {
      // Return default values if no default assistant is set
      return {
        name: "Default Assistant",
        modelName: "gpt-4",
        temperature: 0.7,
        activeAfterQuestions: 1,
        systemPrompt: undefined,
        isDefault: true,
      };
    }

    return defaultAssistant;
  },
});

export const createAssistant = mutation({
  args: {
    name: v.string(),
    modelName: v.optional(v.string()),
    temperature: v.optional(v.number()),
    activeAfterQuestions: v.optional(v.number()),
    systemPrompt: v.optional(v.string()),
    isDefault: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    if (args.isDefault) {
      const existingDefaults = await ctx.db
        .query("assistants")
        .filter((q) => q.eq(q.field("isDefault"), true))
        .collect();

      for (const assistant of existingDefaults) {
        await ctx.db.patch(assistant._id, { isDefault: false });
      }
    }

    return await ctx.db.insert("assistants", {
      ...args,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const updateAssistant = mutation({
  args: {
    id: v.id("assistants"),
    name: v.optional(v.string()),
    modelName: v.optional(v.string()),
    temperature: v.optional(v.number()),
    activeAfterQuestions: v.optional(v.number()),
    systemPrompt: v.optional(v.string()),
    isDefault: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;

    if (updates.isDefault) {
      const existingDefaults = await ctx.db
        .query("assistants")
        .filter((q) => q.eq(q.field("isDefault"), true))
        .collect();

      for (const assistant of existingDefaults) {
        if (assistant._id !== id) {
          await ctx.db.patch(assistant._id, { isDefault: false });
        }
      }
    }

    return await ctx.db.patch(id, {
      ...updates,
      updatedAt: Date.now(),
    });
  },
});

export const deleteAssistant = mutation({
  args: { id: v.id("assistants") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

export const setDefaultAssistant = mutation({
  args: { id: v.id("assistants") },
  handler: async (ctx, args) => {
    // Unset all other defaults
    const existingDefaults = await ctx.db
      .query("assistants")
      .filter((q) => q.eq(q.field("isDefault"), true))
      .collect();

    for (const assistant of existingDefaults) {
      await ctx.db.patch(assistant._id, { isDefault: false });
    }

    // Set the new default
    await ctx.db.patch(args.id, {
      isDefault: true,
      updatedAt: Date.now(),
    });
  },
});
