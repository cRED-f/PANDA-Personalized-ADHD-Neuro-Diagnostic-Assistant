import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const getApiSettings = query({
  args: {},
  handler: async (ctx) => {
    // Get the first (and should be only) settings record
    const settings = await ctx.db.query("settings").first();
    return settings;
  },
});

export const saveApiSettings = mutation({
  args: {
    apiKey: v.optional(v.string()),
    provider: v.optional(v.string()),
    modelName: v.optional(v.string()),
    temperature: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Check if settings already exist
    const existingSettings = await ctx.db.query("settings").first();

    if (existingSettings) {
      // Prepare update object, only including fields that are provided
      const updateData: Record<string, unknown> = { updatedAt: now };
      if (args.apiKey !== undefined) updateData.apiKey = args.apiKey;
      if (args.provider !== undefined) updateData.provider = args.provider;
      if (args.modelName !== undefined) updateData.modelName = args.modelName;
      if (args.temperature !== undefined)
        updateData.temperature = args.temperature;

      // Update existing settings
      await ctx.db.patch(existingSettings._id, updateData);
      return existingSettings._id;
    } else {
      // Create new settings with defaults
      const settingsId = await ctx.db.insert("settings", {
        apiKey: args.apiKey || "",
        provider: args.provider || "OpenRouter",
        modelName: args.modelName,
        temperature: args.temperature ?? 0.0,
        createdAt: now,
        updatedAt: now,
      });
      return settingsId;
    }
  },
});
