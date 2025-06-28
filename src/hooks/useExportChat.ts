import { useState } from "react";

export const useExportChat = () => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportStatus, setExportStatus] = useState<string | null>(null);

  const exportChat = async (chatId: string, chatTitle: string) => {
    setIsExporting(true);
    setExportStatus(null);

    try {
      const chatData = {
        chat: { title: chatTitle },
        messages: [], // This would be populated by the actual query
      };

      const blob = new Blob([JSON.stringify(chatData, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `chat-${chatTitle.replace(/[^a-z0-9]/gi, "_").toLowerCase()}-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setExportStatus("Chat exported successfully!");
    } catch (error) {
      console.error("Export error:", error);
      setExportStatus("Failed to export chat");
    } finally {
      setIsExporting(false);
      setTimeout(() => setExportStatus(null), 3000);
    }
  };

  return { exportChat, isExporting, exportStatus };
};
