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
    modelNames: v.array(v.string()), // Accept an array of model names
    temperatures: v.array(v.number()), // Accept an array of temperatures
    singleModelName: v.optional(v.string()), // Single model name
    singleModelTemperature: v.optional(v.number()), // Single model temperature
    calculationApiKey: v.optional(v.string()), // API key for calculations
    calculationProvider: v.optional(v.string()), // AI provider ("OpenRouter" or "OpenAI")
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Check if calculation settings already exist
    const existingSettings = await ctx.db.query("calculationSettings").first();

    if (existingSettings) {
      // Update existing settings with the new model names and temperatures
      await ctx.db.patch(existingSettings._id, {
        modelNames: args.modelNames,
        temperatures: args.temperatures,
        singleModelName: args.singleModelName,
        singleModelTemperature: args.singleModelTemperature,
        calculationApiKey: args.calculationApiKey,
        calculationProvider: args.calculationProvider,
        updatedAt: now,
      });
      return existingSettings._id;
    } else {
      // Create new calculation settings record with model names and temperatures
      const settingsId = await ctx.db.insert("calculationSettings", {
        modelNames: args.modelNames,
        temperatures: args.temperatures,
        singleModelName: args.singleModelName,
        singleModelTemperature: args.singleModelTemperature,
        calculationApiKey: args.calculationApiKey,
        calculationProvider: args.calculationProvider,
        createdAt: now,
        updatedAt: now,
      });
      return settingsId;
    }
  },
});
