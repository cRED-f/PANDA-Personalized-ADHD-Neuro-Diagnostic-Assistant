import { query } from "./_generated/server";

// Debug query to check what settings exist
export const debugSettings = query({
  args: {},
  handler: async (ctx) => {
    const allSettings = await ctx.db.query("settings").collect();
    console.log("🔍 All settings in database:", allSettings);
    return {
      count: allSettings.length,
      settings: allSettings,
      firstSetting: allSettings[0] || null,
    };
  },
});

// Debug query to check if any data exists
export const debugDatabase = query({
  args: {},
  handler: async (ctx) => {
    const settingsCount = await ctx.db.query("settings").collect();
    const chatsCount = await ctx.db.query("chats").collect();
    const messagesCount = await ctx.db.query("messages").collect();

    return {
      settingsCount: settingsCount.length,
      chatsCount: chatsCount.length,
      messagesCount: messagesCount.length,
      firstSetting: settingsCount[0] || null,
    };
  },
});
