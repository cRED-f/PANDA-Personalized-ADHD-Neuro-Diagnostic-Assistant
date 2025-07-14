"use client";

import { FC } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import {
  IconMessageCircle,
  IconCalendar,
  IconArrowRight,
} from "@tabler/icons-react";

interface CalculateScoreProps {
  onToggleSidebar?: () => void;
  onSelectCalculationChat?: (chatId: string) => void;
  onSelectCalculationSession?: (sessionId: string) => void;
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
      {/* Content */}
      <div className="flex-1 overflow-y-auto bg-white/90 backdrop-blur-xl">
        {chats.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-6">
            <div className="w-20 h-20 bg-slate-100 rounded-2xl flex items-center justify-center mb-6">
              <IconMessageCircle size={40} className="text-slate-500" />
            </div>
            <h3 className="text-xl font-semibold text-slate-800 mb-3">
              No Conversations Found
            </h3>
            <p className="text-slate-500 max-w-sm leading-relaxed">
              Start a text or voice conversation to calculate scores and analyze
              your interactions.
            </p>
          </div>
        ) : (
          <div className="p-2 space-y-3">
            {/* Text Chats Section */}
            {chats.length > 0 && (
              <div>
                <div className="flex items-center space-x-1 mb-2 px-1">
                  <IconMessageCircle size={14} className="text-slate-600" />
                  <h4 className="text-xs font-medium text-slate-700">
                    Text Conversations
                  </h4>
                  <span className="text-xs text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-full">
                    {chats.length}
                  </span>
                </div>
                <div className="space-y-1">
                  {chats.map((chat) => (
                    <div
                      key={chat._id}
                      className="group bg-white border border-slate-200 rounded-lg p-2 hover:shadow-md hover:border-slate-300 transition-all duration-200 cursor-pointer"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-1 mb-1">
                            <div className="w-4 h-4 bg-slate-500 rounded flex items-center justify-center flex-shrink-0">
                              <IconMessageCircle
                                size={8}
                                className="text-white"
                              />
                            </div>
                            <h3 className="text-xs font-medium text-slate-800 truncate">
                              {chat.title}
                            </h3>
                          </div>
                          <div className="flex items-center text-xs text-slate-500 ml-5">
                            <IconCalendar
                              size={8}
                              className="mr-1 text-slate-400"
                            />
                            <span>{formatDate(chat.createdAt)}</span>
                          </div>
                        </div>

                        <button
                          onClick={() =>
                            handleCalculateScore(chat._id, chat.title)
                          }
                          className="ml-2 w-6 h-6 bg-slate-600 hover:bg-slate-700 text-white rounded-full flex items-center justify-center shadow-sm hover:shadow-md transition-all duration-200"
                        >
                          <IconArrowRight size={10} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      {/* Footer Info */}
      {chats.length > 0 && (
        <div className="border-t border-white/20 p-2 flex-shrink-0 bg-white/90 backdrop-blur-xl">
          <div className="flex items-center justify-center space-x-1 text-xs text-slate-500">
            <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-pulse"></div>
            <span>Click conversation to analyze</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalculateScore;
