"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

interface ChatContextType {
  currentChatId: string | null;
  setCurrentChatId: (chatId: string | null) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const useChatContext = () => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error("useChatContext must be used within a ChatProvider");
  }
  return context;
};

interface ChatProviderProps {
  children: ReactNode;
}

export const ChatProvider: React.FC<ChatProviderProps> = ({ children }) => {
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);

  // Load saved chat ID from localStorage on mount
  useEffect(() => {
    const savedChatId = localStorage.getItem("currentChatId");
    if (savedChatId) {
      setCurrentChatId(savedChatId);
    }
  }, []);

  // Save chat ID to localStorage whenever it changes
  const handleSetCurrentChatId = (chatId: string | null) => {
    setCurrentChatId(chatId);
    if (chatId) {
      localStorage.setItem("currentChatId", chatId);
    } else {
      localStorage.removeItem("currentChatId");
    }
  };

  return (
    <ChatContext.Provider
      value={{ currentChatId, setCurrentChatId: handleSetCurrentChatId }}
    >
      {children}
    </ChatContext.Provider>
  );
};
