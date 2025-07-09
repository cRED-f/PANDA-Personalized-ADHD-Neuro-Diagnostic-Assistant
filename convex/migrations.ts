import { internalMutation } from "./_generated/server";

// Migration to update message roles from "assistant" to "ai" - now supports both
export const migrateAssistantToAi = internalMutation({
  handler: async (ctx) => {
    const messages = await ctx.db.query("messages").collect();

    let updateCount = 0;
    for (const message of messages) {
      // No longer need to migrate since we support both "assistant" and "ai" roles
      if (message.role === "mentor") {
        // Convert old "mentor" role to "assistant" if any exist
        await ctx.db.patch(message._id, { role: "assistant" });
        updateCount++;
      }
    }

    console.log(
      `Migration completed: Updated ${updateCount} messages from "mentor" to "assistant"`
    );
    return { updatedCount: updateCount };
  },
});
