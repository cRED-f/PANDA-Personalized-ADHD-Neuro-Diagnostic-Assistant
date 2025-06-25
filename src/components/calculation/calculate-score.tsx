"use client";

import { FC } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import {
  IconCalculator,
  IconMessageCircle,
  IconCalendar,
  IconArrowRight,
} from "@tabler/icons-react";

interface CalculateScoreProps {
  onToggleSidebar?: () => void;
  onSelectCalculationChat?: (chatId: string) => void;
}

const CalculateScore: FC<CalculateScoreProps> = ({
  onSelectCalculationChat,
}) => {
  const chats = useQuery(api.messages.getChats) || [];
  const handleCalculateScore = (chatId: string, chatTitle: string) => {
    // Select the chat for calculation and let parent know
    onSelectCalculationChat?.(chatId);
    console.log("Selected chat for calculation:", chatId, chatTitle);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200/60 p-6 flex-shrink-0 bg-white">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-slate-600 rounded-lg flex items-center justify-center">
            <IconCalculator size={20} className="text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">
              Calculate Score
            </h2>
            <p className="text-sm text-slate-500">Analyze your conversations</p>
          </div>
        </div>
        <div className="bg-slate-100 px-3 py-1.5 rounded-full">
          <span className="text-sm font-medium text-slate-600">
            {chats.length} chat{chats.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>
      {/* Content */}
      <div className="flex-1 overflow-y-auto bg-white">
        {chats.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-6">
            <div className="w-20 h-20 bg-slate-100 rounded-2xl flex items-center justify-center mb-6">
              <IconMessageCircle size={40} className="text-slate-500" />
            </div>
            <h3 className="text-xl font-semibold text-slate-800 mb-3">
              No Chats Found
            </h3>
            <p className="text-slate-500 max-w-sm leading-relaxed">
              Start a conversation to calculate scores and analyze your chat
              interactions.
            </p>
          </div>
        ) : (
          <div className="p-4 space-y-3">
            {chats.map((chat) => (
              <div
                key={chat._id}
                className="group bg-white border border-slate-200 rounded-lg p-3 hover:shadow-md hover:border-slate-300 transition-all duration-200 cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    {" "}
                    <div className="flex items-center space-x-2 mb-1">
                      <div className="w-6 h-6 bg-slate-500 rounded flex items-center justify-center flex-shrink-0">
                        <IconMessageCircle size={12} className="text-white" />
                      </div>
                      <h3 className="text-sm font-medium text-slate-800 truncate">
                        {chat.title}
                      </h3>
                    </div>
                    <div className="flex items-center text-xs text-slate-500 ml-8">
                      <IconCalendar size={10} className="mr-1 text-slate-400" />
                      <span>{formatDate(chat.createdAt)}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleCalculateScore(chat._id, chat.title)}
                    className="ml-3 w-8 h-8 bg-slate-600 hover:bg-slate-700 text-white rounded-full flex items-center justify-center shadow-sm hover:shadow-md transition-all duration-200"
                  >
                    <IconArrowRight size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>{" "}
      {/* Footer Info */}
      {chats.length > 0 && (
        <div className="border-t border-slate-200/60 p-6 flex-shrink-0 bg-white">
          <div className="flex items-center justify-center space-x-2 text-sm text-slate-500">
            <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse"></div>
            <span>Click on any chat to analyze its conversation score</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalculateScore;
