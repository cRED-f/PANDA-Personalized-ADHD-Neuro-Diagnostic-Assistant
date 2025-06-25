import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getDefaultMentor = query({
  args: {},
  handler: async (ctx) => {
    const mentor = await ctx.db
      .query("mentors")
      .filter((q) => q.eq(q.field("isDefault"), true))
      .first();

    return mentor;
  },
});

export const createMentor = mutation({
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

    // If this is being set as default, clear other defaults
    if (args.isDefault) {
      const existingMentors = await ctx.db.query("mentors").collect();
      for (const mentor of existingMentors) {
        if (mentor.isDefault) {
          await ctx.db.patch(mentor._id, { isDefault: false });
        }
      }
    }

    return await ctx.db.insert("mentors", {
      ...args,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const updateMentor = mutation({
  args: {
    id: v.id("mentors"),
    name: v.optional(v.string()),
    modelName: v.optional(v.string()),
    temperature: v.optional(v.number()),
    activeAfterQuestions: v.optional(v.number()),
    systemPrompt: v.optional(v.string()),
    isDefault: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;

    // If this is being set as default, clear other defaults
    if (updates.isDefault) {
      const existingMentors = await ctx.db.query("mentors").collect();
      for (const mentor of existingMentors) {
        if (mentor.isDefault && mentor._id !== id) {
          await ctx.db.patch(mentor._id, { isDefault: false });
        }
      }
    }

    return await ctx.db.patch(id, {
      ...updates,
      updatedAt: Date.now(),
    });
  },
});

export const deleteMentor = mutation({
  args: { id: v.id("mentors") },
  handler: async (ctx, args) => {
    return await ctx.db.delete(args.id);
  },
});

export const getMentors = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("mentors").collect();
  },
});
