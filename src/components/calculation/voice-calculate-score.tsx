"use client";

import { FC } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import {
  IconMicrophone,
  IconCalendar,
  IconArrowRight,
} from "@tabler/icons-react";

interface VoiceCalculateScoreProps {
  onToggleSidebar?: () => void;
  onSelectVoiceCalculationSession?: (sessionId: string) => void;
}

const VoiceCalculateScore: FC<VoiceCalculateScoreProps> = ({
  onSelectVoiceCalculationSession,
}) => {
  const voiceChats = useQuery(api.voiceChats.getAllVoiceChats) || [];
  const debugData = useQuery(api.voiceChats.debugVoiceChats);
  const createVoiceChat = useMutation(api.voiceChats.createVoiceChat);

  // Debug logging
  console.log("🔍 VoiceCalculateScore Debug:", {
    voiceChatsCount: voiceChats.length,
    voiceChats: voiceChats,
    isLoading: voiceChats === undefined,
    debugData: debugData,
  });

  const handleCreateTestVoiceChat = async () => {
    try {
      await createVoiceChat({
        title: `Test Voice Chat ${Date.now()}`,
        sessionId: `test-session-${Date.now()}`,
      });
      console.log("✅ Test voice chat created!");
    } catch (error) {
      console.error("❌ Failed to create test voice chat:", error);
    }
  };

  const handleCalculateVoiceScore = (
    sessionId: string,
    sessionTitle: string
  ) => {
    // Select the voice session for calculation and let parent know
    onSelectVoiceCalculationSession?.(sessionId);
    console.log(
      "Selected voice session for voice calculation:",
      sessionId,
      sessionTitle
    );
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
        {voiceChats.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-6">
            <div className="w-20 h-20 bg-purple-100 rounded-2xl flex items-center justify-center mb-6">
              <IconMicrophone size={40} className="bg-slate-600" />
            </div>
            <h3 className="text-xl font-semibold text-slate-800 mb-3">
              No Voice Conversations Found
            </h3>
            <p className="text-slate-500 max-w-sm leading-relaxed">
              Start a voice conversation to calculate scores and analyze your
              voice interactions.
            </p>
            <div className="mt-4 text-xs text-gray-400">
              Debug: Found {voiceChats.length} voice chats
              {debugData && (
                <div className="mt-2 text-left">
                  <div>DB Voice Chats: {debugData.voiceChatsCount}</div>
                  <div>DB Voice Messages: {debugData.voiceMessagesCount}</div>
                  {debugData.voiceChats.length > 0 && (
                    <div className="mt-1">
                      Latest: {debugData.voiceChats[0]?.title || "No title"}
                    </div>
                  )}
                </div>
              )}
              <button
                onClick={handleCreateTestVoiceChat}
                className="mt-3 px-4 py-2 bg-slate-600 text-white text-sm rounded-lg hover:bg-purple-700 transition-colors"
              >
                Create Test Voice Chat
              </button>
            </div>
          </div>
        ) : (
          <div className="p-4 space-y-6">
            {/* Voice Sessions Section */}
            {voiceChats.length > 0 && (
              <div>
                <div className="flex items-center space-x-2 mb-3 px-1">
                  <IconMicrophone size={16} className="text-purple-600" />
                  <h4 className="text-sm font-medium text-slate-700">
                    Voice Conversations
                  </h4>
                  <span className="text-xs text-slate-500 bg-purple-100 px-2 py-1 rounded-full">
                    {voiceChats.length}
                  </span>
                </div>
                <div className="space-y-2">
                  {voiceChats.map((voiceChat) => (
                    <div
                      key={voiceChat._id}
                      className="group bg-white border border-purple-200 rounded-lg p-3 hover:shadow-md hover:border-purple-300 transition-all duration-200 cursor-pointer"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <div className="w-6 h-6 bg-purple-800/90 rounded flex items-center justify-center flex-shrink-0">
                              <IconMicrophone
                                size={12}
                                className="text-white"
                              />
                            </div>
                            <h3 className="text-sm font-medium text-slate-800 truncate">
                              {voiceChat.title}
                            </h3>
                          </div>
                          <div className="flex items-center text-xs text-slate-500 ml-8">
                            <IconCalendar
                              size={10}
                              className="mr-1 text-slate-400"
                            />
                            <span>{formatDate(voiceChat.createdAt)}</span>
                            <span className="ml-2 text-purple-600">
                              {voiceChat.totalMessages} messages
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={() =>
                            handleCalculateVoiceScore(
                              voiceChat.sessionId,
                              voiceChat.title
                            )
                          }
                          className="ml-3 w-8 h-8 bg-slate-600 hover:bg-purple-700 text-white rounded-full flex items-center justify-center shadow-sm hover:shadow-md transition-all duration-200"
                        >
                          <IconArrowRight size={14} />
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
      {voiceChats.length > 0 && (
        <div className="border-t border-white/20 p-6 flex-shrink-0 bg-white/90 backdrop-blur-xl">
          <div className="flex items-center justify-center space-x-2 text-sm text-slate-500">
            <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
            <span>Click on any voice conversation to analyze its score</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default VoiceCalculateScore;
