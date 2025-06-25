import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Get all messages for a specific chat
export const getMessages = query({
  args: { chatId: v.string() },
  handler: async (ctx, args) => {
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_chat", (q) => q.eq("chatId", args.chatId))
      .order("asc")
      .collect();
    return messages.map((msg) => ({
      ...msg,
    }));
  },
});

// Send a new message
export const sendMessage = mutation({
  args: {
    content: v.string(),
    role: v.union(
      v.literal("user"),
      v.literal("ai"),
      v.literal("assistant"),
      v.literal("mentor"),
      v.literal("system")
    ),
    chatId: v.string(),
  },
  handler: async (ctx, args) => {
    const messageId = await ctx.db.insert("messages", {
      content: args.content,
      role: args.role,
      chatId: args.chatId,
      timestamp: Date.now(),
    });

    // Update chat's updatedAt timestamp
    const chat = await ctx.db
      .query("chats")
      .filter((q) => q.eq(q.field("_id"), args.chatId))
      .first();

    if (chat) {
      await ctx.db.patch(chat._id, { updatedAt: Date.now() });
    }

    return messageId;
  },
});

// Create a new chat
export const createChat = mutation({
  args: { title: v.string() },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("chats", {
      title: args.title,
      createdAt: now,
      updatedAt: now,
    });
  },
});

// Get all chats
export const getChats = query({
  handler: async (ctx) => {
    return await ctx.db.query("chats").order("desc").collect();
  },
});

// Delete a chat and all its messages
export const deleteChat = mutation({
  args: { chatId: v.id("chats") },
  handler: async (ctx, args) => {
    // Delete all messages in the chat
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_chat", (q) => q.eq("chatId", args.chatId))
      .collect();

    for (const message of messages) {
      await ctx.db.delete(message._id);
    }

    // Delete the chat
    await ctx.db.delete(args.chatId);
  },
});

// Update chat title
export const updateChatTitle = mutation({
  args: { chatId: v.string(), title: v.string() },
  handler: async (ctx, args) => {
    const chat = await ctx.db
      .query("chats")
      .filter((q) => q.eq(q.field("_id"), args.chatId))
      .first();

    if (chat) {
      await ctx.db.patch(chat._id, {
        title: args.title,
        updatedAt: Date.now(),
      });
    }
  },
});

// Get messages for UI display (excludes only system messages)
export const getMessagesForUI = query({
  args: { chatId: v.string() },
  handler: async (ctx, args) => {
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_chat", (q) => q.eq("chatId", args.chatId))
      .order("asc")
      .collect();

    return messages
      .filter((msg) => msg.role !== "system") // Only filter out system messages
      .map((msg) => ({
        ...msg,
      }));
  },
});

// Get conversation history for analysis (excluding assistant and mentor messages)
export const getConversationHistory = query({
  args: { chatId: v.string() },
  handler: async (ctx, args) => {
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_chat", (q) => q.eq("chatId", args.chatId))
      .order("asc")
      .collect();

    // Filter out assistant and mentor messages, only keep user and ai messages
    const conversationMessages = messages.filter(
      (msg) => msg.role === "user" || msg.role === "ai"
    );

    return conversationMessages.map((msg) => ({
      ...msg,
    }));
  },
});
