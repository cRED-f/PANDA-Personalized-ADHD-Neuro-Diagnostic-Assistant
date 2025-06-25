import { internalMutation } from "./_generated/server";

// Migration to update message roles from "assistant" to "ai"
export const migrateAssistantToAi = internalMutation({
  handler: async (ctx) => {
    const messages = await ctx.db.query("messages").collect();

    let updateCount = 0;
    for (const message of messages) {
      if (message.role === "assistant") {
        await ctx.db.patch(message._id, { role: "ai" });
        updateCount++;
      }
    }

    console.log(
      `Migration completed: Updated ${updateCount} messages from "assistant" to "ai"`
    );
    return { updatedCount: updateCount };
  },
});
