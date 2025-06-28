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

// Export chat with all messages
export const exportChat = query({
  args: { chatId: v.string() },
  handler: async (ctx, args) => {
    const chat = await ctx.db
      .query("chats")
      .filter((q) => q.eq(q.field("_id"), args.chatId))
      .first();

    if (!chat) {
      throw new Error("Chat not found");
    }

    const messages = await ctx.db
      .query("messages")
      .withIndex("by_chat", (q) => q.eq("chatId", args.chatId))
      .order("asc")
      .collect();

    return {
      chat: {
        title: chat.title,
        createdAt: chat.createdAt,
        updatedAt: chat.updatedAt,
      },
      messages: messages.map((msg) => ({
        content: msg.content,
        role: msg.role,
        timestamp: msg.timestamp,
      })),
    };
  },
});

// Export all chats with their messages
export const exportAllChats = query({
  args: {},
  handler: async (ctx) => {
    const chats = await ctx.db.query("chats").order("desc").collect();
    const allChatsData = [];

    for (const chat of chats) {
      const messages = await ctx.db
        .query("messages")
        .withIndex("by_chat", (q) => q.eq("chatId", chat._id))
        .order("asc")
        .collect();

      allChatsData.push({
        chat: {
          title: chat.title,
          createdAt: chat.createdAt,
          updatedAt: chat.updatedAt,
        },
        messages: messages.map((msg) => ({
          content: msg.content,
          role: msg.role,
          timestamp: msg.timestamp,
        })),
      });
    }

    return allChatsData;
  },
});

// Import chat and messages
export const importChat = mutation({
  args: {
    chatData: v.object({
      chat: v.object({
        title: v.string(),
        createdAt: v.number(),
        updatedAt: v.number(),
      }),
      messages: v.array(
        v.object({
          content: v.string(),
          role: v.union(
            v.literal("user"),
            v.literal("ai"),
            v.literal("assistant"),
            v.literal("mentor"),
            v.literal("system")
          ),
          timestamp: v.number(),
        })
      ),
    }),
  },
  handler: async (ctx, args) => {
    // Create the chat
    const chatId = await ctx.db.insert("chats", {
      title: args.chatData.chat.title,
      createdAt: Date.now(), // Use current timestamp for import
      updatedAt: Date.now(),
    });

    // Insert all messages
    for (const message of args.chatData.messages) {
      await ctx.db.insert("messages", {
        content: message.content,
        role: message.role,
        chatId: chatId,
        timestamp: message.timestamp,
      });
    }

    return chatId;
  },
});
