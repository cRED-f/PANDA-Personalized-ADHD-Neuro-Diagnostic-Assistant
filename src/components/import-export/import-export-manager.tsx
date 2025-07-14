"use client";

import { FC, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import {
  IconDownload,
  IconUpload,
  IconFileExport,
  IconFileImport,
  IconCheck,
  IconX,
} from "@tabler/icons-react";
import { motion } from "framer-motion";

interface ImportExportManagerProps {
  onToggleSidebar?: () => void;
}

interface ExportedChat {
  chat: {
    title: string;
    createdAt: number;
    updatedAt: number;
    type: "text" | "voice";
  };
  messages: {
    content: string;
    role: "user" | "ai" | "assistant" | "mentor" | "system";
    timestamp: number;
  }[];
}

interface ExportChatButtonProps {
  chatId: string;
  chatTitle: string;
  chatType: "text" | "voice";
  onExportSuccess: (message: string) => void;
  onExportError: (message: string) => void;
  disabled: boolean;
}

const ExportChatButton: FC<ExportChatButtonProps> = ({
  chatId,
  chatTitle,
  chatType,
  onExportSuccess,
  onExportError,
  disabled,
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const messages = useQuery(api.messages.getMessages, { chatId });
  const voiceMessages = useQuery(
    api.voiceChats.getVoiceMessages,
    chatType === "voice" ? { sessionId: chatId } : "skip"
  );
  const chats = useQuery(api.messages.getChats) || [];
  const voiceChats = useQuery(api.voiceChats.getAllVoiceChats) || [];

  const handleExport = async () => {
    if (chatType === "text" && !messages) return;
    if (chatType === "voice" && !voiceMessages) return;

    setIsExporting(true);

    try {
      let exportData: ExportedChat;

      if (chatType === "text") {
        const selectedChat = chats.find((chat) => chat._id === chatId);
        if (!selectedChat) {
          throw new Error("Text chat not found");
        }

        exportData = {
          chat: {
            title: selectedChat.title,
            createdAt: selectedChat.createdAt,
            updatedAt: selectedChat.updatedAt,
            type: "text",
          },
          messages: messages!.map((msg) => ({
            content: msg.content,
            role: msg.role,
            timestamp: msg.timestamp,
          })),
        };
      } else {
        // Voice chat
        const selectedVoiceChat = voiceChats.find(
          (chat) => chat.sessionId === chatId
        );
        if (!selectedVoiceChat) {
          throw new Error("Voice chat not found");
        }

        exportData = {
          chat: {
            title: selectedVoiceChat.title,
            createdAt: selectedVoiceChat.startTime,
            updatedAt: selectedVoiceChat.updatedAt,
            type: "voice",
          },
          messages: voiceMessages!.map((msg) => ({
            content: msg.content,
            role: msg.role as "user" | "ai" | "assistant" | "mentor" | "system",
            timestamp: msg.timestamp,
          })),
        };
      }

      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${chatType}-chat-${chatTitle.replace(/[^a-z0-9]/gi, "_").toLowerCase()}-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      onExportSuccess(
        `${chatType === "voice" ? "Voice" : "Text"} chat exported successfully!`
      );
    } catch (error) {
      console.error("Export error:", error);
      onExportError("Failed to export chat");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button
      size="sm"
      variant="ghost"
      onClick={handleExport}
      disabled={
        disabled ||
        isExporting ||
        (chatType === "text" ? !messages : !voiceMessages)
      }
      className="h-7 px-2 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
    >
      <IconDownload size={14} />
    </Button>
  );
};

export const ImportExportManager: FC<ImportExportManagerProps> = ({
  onToggleSidebar,
}) => {
  const [exportStatus, setExportStatus] = useState<string | null>(null);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const chats = useQuery(api.messages.getChats) || [];
  const voiceChats = useQuery(api.voiceChats.getAllVoiceChats) || [];
  const importChat = useMutation(api.messages.importChat);
  const importVoiceChat = useMutation(api.voiceChats.importVoiceChat);

  const handleExportSuccess = (message: string) => {
    setExportStatus(message);
    setTimeout(() => setExportStatus(null), 3000);
  };

  const handleExportError = (message: string) => {
    setExportStatus(message);
    setTimeout(() => setExportStatus(null), 3000);
  };

  const exportAllChats = async () => {
    setExportStatus("Exporting all chats...");

    try {
      // Create a simplified export for all text chats (basic info only)
      const allTextChatsData = chats.map((chat) => ({
        chat: {
          title: chat.title,
          createdAt: chat.createdAt,
          updatedAt: chat.updatedAt,
          type: "text" as const,
        },
        messages: [], // For bulk export, we'll export chat info only
      }));

      // Create a simplified export for all voice chats (basic info only)
      const allVoiceChatsData = voiceChats.map((chat) => ({
        chat: {
          title: chat.title,
          createdAt: chat.startTime,
          updatedAt: chat.updatedAt,
          type: "voice" as const,
        },
        messages: [], // For bulk export, we'll export chat info only
      }));

      const allChatsData = [...allTextChatsData, ...allVoiceChatsData];

      const blob = new Blob([JSON.stringify(allChatsData, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `all-chats-info-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setExportStatus(
        `All ${allChatsData.length} chats info exported successfully!`
      );
    } catch (error) {
      console.error("Export all error:", error);
      setExportStatus("Failed to export all chats");
    } finally {
      setTimeout(() => setExportStatus(null), 3000);
    }
  };

  const handleFileImport = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setImportStatus(null);

    try {
      const text = await file.text();
      const importData: ExportedChat = JSON.parse(text);

      if (!importData.chat || !importData.messages) {
        throw new Error("Invalid chat file format");
      }

      // Validate that all messages have only content, role, and timestamp
      const validatedMessages = importData.messages.map((msg) => ({
        content: msg.content,
        role: msg.role,
        timestamp: msg.timestamp,
      }));

      // Remove the type field from chat object as the backend doesn't expect it
      const { type, ...chatWithoutType } = importData.chat;

      const validatedImportData = {
        chat: chatWithoutType,
        messages: validatedMessages,
      };

      // Use appropriate import function based on chat type
      if (type === "voice") {
        await importVoiceChat({ chatData: validatedImportData });
      } else {
        await importChat({ chatData: validatedImportData });
      }

      const chatType = type || "text";
      setImportStatus(
        `${chatType === "voice" ? "Voice" : "Text"} chat "${importData.chat.title}" imported successfully!`
      );
    } catch (error) {
      console.error("Import error:", error);
      setImportStatus("Failed to import chat. Please check the file format.");
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      setTimeout(() => setImportStatus(null), 5000);
    }
  };

  return (
    <motion.div
      className="flex h-full flex-col bg-white/90 backdrop-blur-xl"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Header */}
      <motion.div
        className="flex items-center justify-between border-b border-white/20 p-3"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.1 }}
      >
        <h2 className="text-lg font-semibold text-gray-800">Import/Export</h2>
        {onToggleSidebar && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleSidebar}
            className="h-8 w-8 p-0 text-gray-600 hover:bg-white/60 hover:text-gray-800"
          >
            <IconX size={16} />
          </Button>
        )}
      </motion.div>

      {/* Content */}
      <motion.div
        className="flex-1 space-y-6 p-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        {/* Export Section */}
        <div className="space-y-3">
          <h3 className="flex items-center gap-2 text-md font-medium text-gray-700">
            <IconFileExport size={18} />
            Export Chats
          </h3>

          <div className="space-y-2">
            <Button
              onClick={exportAllChats}
              disabled={chats.length === 0 && voiceChats.length === 0}
              className="w-full justify-start gap-2 bg-blue-500 text-white hover:bg-blue-600 disabled:bg-gray-300"
            >
              <IconDownload size={16} />
              Export All Chats
            </Button>

            <div className="text-sm text-gray-600">
              Export individual chats with full messages:
            </div>

            {/* Text Chats */}
            {chats.length > 0 && (
              <div className="space-y-1">
                <div className="text-xs font-medium text-gray-500 px-1">
                  💬 Text Chats
                </div>
                <div className="max-h-32 space-y-1 overflow-y-auto">
                  {chats.map((chat) => (
                    <motion.div
                      key={chat._id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center justify-between rounded-lg bg-white/50 p-2 text-sm"
                    >
                      <span className="flex-1 truncate text-gray-700">
                        {chat.title}
                      </span>
                      <ExportChatButton
                        chatId={chat._id}
                        chatTitle={chat.title}
                        chatType="text"
                        onExportSuccess={handleExportSuccess}
                        onExportError={handleExportError}
                        disabled={false}
                      />
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Voice Chats */}
            {voiceChats.length > 0 && (
              <div className="space-y-1">
                <div className="text-xs font-medium text-gray-500 px-1">
                  🎤 Voice Chats
                </div>
                <div className="max-h-32 space-y-1 overflow-y-auto">
                  {voiceChats.map((chat) => (
                    <motion.div
                      key={chat._id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center justify-between rounded-lg bg-white/50 p-2 text-sm"
                    >
                      <span className="flex-1 truncate text-gray-700">
                        {chat.title}
                      </span>
                      <ExportChatButton
                        chatId={chat.sessionId}
                        chatTitle={chat.title}
                        chatType="voice"
                        onExportSuccess={handleExportSuccess}
                        onExportError={handleExportError}
                        disabled={false}
                      />
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Import Section */}
        <div className="space-y-3">
          <h3 className="flex items-center gap-2 text-md font-medium text-gray-700">
            <IconFileImport size={18} />
            Import Chats
          </h3>

          <div className="space-y-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileImport}
              className="hidden"
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={isImporting}
              className="w-full justify-start gap-2 bg-green-500 text-white hover:bg-green-600 disabled:bg-gray-300"
            >
              <IconUpload size={16} />
              {isImporting ? "Importing..." : "Import Chat File"}
            </Button>
          </div>
        </div>

        {/* Status Messages */}
        {exportStatus && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`flex items-center gap-2 rounded-lg p-3 text-sm ${
              exportStatus.includes("successfully")
                ? "bg-green-50 text-green-800"
                : "bg-red-50 text-red-800"
            }`}
          >
            {exportStatus.includes("successfully") ? (
              <IconCheck size={16} />
            ) : (
              <IconX size={16} />
            )}
            {exportStatus}
          </motion.div>
        )}

        {importStatus && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`flex items-center gap-2 rounded-lg p-3 text-sm ${
              importStatus.includes("successfully")
                ? "bg-green-50 text-green-800"
                : "bg-red-50 text-red-800"
            }`}
          >
            {importStatus.includes("successfully") ? (
              <IconCheck size={16} />
            ) : (
              <IconX size={16} />
            )}
            {importStatus}
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
};
