import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const getCalculationSettings = query({
  args: {},
  handler: async (ctx) => {
    // Get the first (and should be only) calculation settings record
    const settings = await ctx.db.query("calculationSettings").first();
    return settings;
  },
});

export const saveCalculationSettings = mutation({
  args: {
    modelName: v.string(),
    temperature: v.number(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Check if calculation settings already exist
    const existingSettings = await ctx.db.query("calculationSettings").first();

    if (existingSettings) {
      // Update existing settings
      await ctx.db.patch(existingSettings._id, {
        modelName: args.modelName,
        temperature: args.temperature,
        updatedAt: now,
      });
      return existingSettings._id;
    } else {
      // Create new calculation settings
      const settingsId = await ctx.db.insert("calculationSettings", {
        modelName: args.modelName,
        temperature: args.temperature,
        createdAt: now,
        updatedAt: now,
      });
      return settingsId;
    }
  },
});
