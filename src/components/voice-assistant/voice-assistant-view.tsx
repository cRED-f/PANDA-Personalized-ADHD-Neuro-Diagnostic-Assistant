"use client";

import { FC, useEffect, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { IconX, IconMicrophone } from "@tabler/icons-react";
import { useChainedVoiceAssistant } from "../../hooks/useChainedVoiceAssistant";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";

interface VoiceAssistantViewProps {
  onBack?: () => void;
  onClose?: () => void;
  existingSessionId?: string;
}

export const VoiceAssistantView: FC<VoiceAssistantViewProps> = ({
  onBack,
  onClose,
  existingSessionId,
}) => {
  const [userClosed, setUserClosed] = useState(false);
  const [isButtonPressed, setIsButtonPressed] = useState(false);
  const [recordingStartTime, setRecordingStartTime] = useState<number | null>(
    null
  );
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const {
    isSessionActive,
    isLoadingSettings,
    status,
    transcript,
    response,
    error,
    isRecording,
    currentSessionId,
    startSession,
    endSession,
    startRecording,
    stopRecording,
    clearError,
  } = useChainedVoiceAssistant();

  // Fetch current session messages from database
  const sessionMessages = useQuery(
    api.voiceChats.getVoiceMessages,
    currentSessionId ? { sessionId: currentSessionId } : "skip"
  );

  // Status helpers
  const isTranscribing = status === "transcribing";
  const isThinking = status === "thinking";
  const isSpeaking = status === "speaking";

  // Sync button state with recording state
  useEffect(() => {
    if (!isRecording) {
      setIsButtonPressed(false);
    }
  }, [isRecording]);

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [sessionMessages?.length, transcript, response]);

  // Stable function references to prevent useEffect loops
  const stableStartSession = useCallback(() => {
    if (!isLoadingSettings && !isSessionActive && !error && !userClosed) {
      startSession(existingSessionId).catch(console.error);
    }
  }, [
    isLoadingSettings,
    isSessionActive,
    error,
    userClosed,
    startSession,
    existingSessionId,
  ]);

  // Auto-start session when component mounts and settings are loaded
  useEffect(() => {
    stableStartSession();
  }, [stableStartSession]);

  // Cleanup on unmount only
  useEffect(() => {
    return () => {
      if (isSessionActive) {
        endSession().catch(console.error);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle push-to-talk button press with stable functions
  const handlePushToTalkStart = useCallback(() => {
    // Clear any existing errors first
    if (error) {
      clearError();
    }

    // Prevent interaction during AI processing states
    if (isTranscribing || isThinking || isSpeaking) {
      return;
    }

    if (isSessionActive && !isButtonPressed) {
      setIsButtonPressed(true);
      setRecordingStartTime(Date.now());
      startRecording().catch((recordingError) => {
        console.error("Failed to start recording:", recordingError);
        setIsButtonPressed(false);
        setRecordingStartTime(null);
      });
    }
  }, [
    error,
    clearError,
    isSessionActive,
    isButtonPressed,
    isTranscribing,
    isThinking,
    isSpeaking,
    startRecording,
  ]);

  const handlePushToTalkEnd = useCallback(() => {
    // Check minimum recording duration to prevent mistouches (500ms minimum)
    const minimumRecordingDuration = 500;
    const currentTime = Date.now();

    if (
      recordingStartTime &&
      currentTime - recordingStartTime < minimumRecordingDuration
    ) {
      // Too short, ignore this release - keep recording
      return;
    }

    // Always stop when button is released after minimum duration
    if (isButtonPressed) {
      setIsButtonPressed(false);
      setRecordingStartTime(null);
    }
    // Always try to stop recording if it's active
    if (isRecording) {
      stopRecording().catch(console.error);
    }
  }, [isRecording, isButtonPressed, recordingStartTime, stopRecording]);

  // Safety cleanup for stuck recording state
  useEffect(() => {
    if (!isButtonPressed && isRecording) {
      stopRecording().catch(console.error);
      setRecordingStartTime(null);
    }
  }, [isButtonPressed, isRecording, stopRecording]);

  // Prevent recording during AI processing
  useEffect(() => {
    if ((isTranscribing || isThinking || isSpeaking) && isRecording) {
      stopRecording().catch(console.error);
      setIsButtonPressed(false);
      setRecordingStartTime(null);
    }
  }, [isTranscribing, isThinking, isSpeaking, isRecording, stopRecording]);

  const handleClose = () => {
    setUserClosed(true);
    if (isSessionActive) {
      endSession().catch(console.error);
    }
    if (onClose) onClose();
    if (onBack) onBack();
  };

  // Auto-clear errors after 5 seconds and allow retry
  useEffect(() => {
    if (error) {
      const errorTimer = setTimeout(() => {
        clearError();
      }, 5000);

      return () => clearTimeout(errorTimer);
    }
  }, [error, clearError]);

  return (
    <div className="h-full bg-gradient-to-br  from-slate-900 via-blue-950 to-indigo-950 overflow-hidden relative">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute top-20 left-20 w-96 h-96 bg-gradient-to-r from-blue-600/15 to-indigo-600/15 rounded-full blur-3xl"
          animate={{
            x: [0, 100, 0],
            y: [0, -50, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute bottom-20 right-20 w-80 h-80 bg-gradient-to-r from-indigo-600/15 to-blue-700/15 rounded-full blur-3xl"
          animate={{
            x: [0, -80, 0],
            y: [0, 30, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </div>

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between p-3 sm:p-6">
        {/* Back Button */}
        <motion.button
          onClick={handleClose}
          className="flex items-center gap-1 sm:gap-2 text-blue-200 hover:text-white transition-colors duration-200 bg-white/10 backdrop-blur-sm rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 border border-white/20"
          whileHover={{ scale: 1.05, x: -2 }}
          whileTap={{ scale: 0.95 }}
        ></motion.button>

        {/* Title */}
        <motion.div
          className="absolute left-1/2 transform -translate-x-1/2"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-200 to-indigo-200 text-center px-2">
            PANDA - Voice Session
          </h1>
        </motion.div>

        {/* Close Button */}
        <motion.button
          onClick={handleClose}
          className="text-blue-200 hover:text-white transition-colors duration-200 bg-white/10 backdrop-blur-sm rounded-lg p-1.5 sm:p-2 border border-white/20"
          whileHover={{ scale: 1.1, rotate: 90 }}
          whileTap={{ scale: 0.9 }}
        >
          <IconX size={16} className="sm:hidden" />
          <IconX size={20} className="hidden sm:block" />
        </motion.button>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-[calc(100vh-120px)] px-3 sm:px-6">
        {/* Error Display */}
        <AnimatePresence>
          {error && (
            <motion.div
              className="mb-3 sm:mb-6 p-3 sm:p-4 bg-red-500/20 border border-red-500/50 rounded-2xl backdrop-blur-xl max-w-2xl w-full"
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ duration: 0.4 }}
            >
              <div className="flex items-center gap-2 mb-1 sm:mb-2">
                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-red-400 rounded-full"></div>
                <p className="text-red-200 text-xs sm:text-sm font-medium">
                  Error:
                </p>
              </div>
              <p className="text-white text-sm sm:text-base mb-3">{error}</p>

              {/* Retry Button */}
              <motion.button
                onClick={clearError}
                className="w-full sm:w-auto px-4 py-2 bg-red-500/80 hover:bg-red-500 text-white text-sm rounded-lg transition-colors duration-200"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Try Again
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Loading State */}
        <AnimatePresence>
          {isLoadingSettings && (
            <motion.div
              className="mb-3 sm:mb-6 p-4 sm:p-6 bg-gradient-to-r from-blue-600/15 to-indigo-600/15 rounded-2xl border border-blue-300/30 backdrop-blur-xl max-w-2xl w-full"
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ duration: 0.4 }}
            >
              <div className="flex items-center gap-2 sm:gap-3">
                <motion.div
                  className="w-4 h-4 sm:w-6 sm:h-6 border-2 border-blue-400/30 border-t-blue-400 rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                />
                <p className="text-blue-200 text-sm sm:text-lg">
                  Loading voice settings...
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Chat History Display */}
        <motion.div
          className={`flex-1 w-full max-w-4xl mb-3 sm:mb-6 relative transition-all duration-500 ${
            isButtonPressed ? "blur-sm" : ""
          }`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          <div className="h-[24rem] sm:h-[32rem] overflow-y-auto px-2 sm:px-6 scrollbar-hide">
            <div className="space-y-2 sm:space-y-4">
              {/* Messages from database */}
              {sessionMessages?.map((message, index) => (
                <motion.div
                  key={message._id || index}
                  className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <div
                    className={`${
                      message.role === "user"
                        ? "bg-gradient-to-r from-lime-500/20 to-green-500/20 border-lime-300/30"
                        : "bg-gradient-to-r from-blue-600/20 to-indigo-600/20 border-blue-300/30"
                    } rounded-2xl border p-3 sm:p-4 max-w-xs sm:max-w-md backdrop-blur-sm`}
                  >
                    <div className="flex items-center gap-1 sm:gap-2 mb-1">
                      <div
                        className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${
                          message.role === "user"
                            ? "bg-lime-400"
                            : "bg-blue-400"
                        }`}
                      ></div>
                      <span className="text-lime-200 text-xs font-medium">
                        {message.role === "user" ? "You" : "PANDA"}
                      </span>
                    </div>
                    <p className="text-white text-xs sm:text-sm leading-relaxed">
                      {message.content}
                    </p>
                  </div>
                </motion.div>
              ))}

              {/* Empty state */}
              {!sessionMessages?.length && (
                <div className="text-center text-white/80 py-16">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="space-y-1"
                  >
                    <div className="text-4xl sm:text-6xl mb-2 sm:mb-4">🐼</div>
                    <h2 className="text-lg sm:text-2xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-blue-200 to-indigo-200 px-2">
                      Welcome to Your PANDA Companion
                    </h2>
                    <p className="text-xs sm:text-sm text-blue-200/80 max-w-md mx-auto px-2">
                      I&apos;m here to listen and support you. Press and hold
                      the button below to start our conversation.
                    </p>
                  </motion.div>
                </div>
              )}

              {/* Scroll anchor */}
              <div ref={messagesEndRef} />
            </div>
          </div>
        </motion.div>

        {/* Ocean Wave Animation Overlay */}
        <AnimatePresence>
          {isRecording && (
            <motion.div
              className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              {/* Ocean Wave Container */}
              <div className="relative w-60 h-60">
                {/* Ocean waves - multiple layers for depth */}
                {[...Array(6)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute rounded-full border-2"
                    style={{
                      width: 40 + i * 25,
                      height: 40 + i * 25,
                      left: `calc(50% - ${20 + i * 12.5}px)`,
                      top: `calc(50% - ${20 + i * 12.5}px)`,
                      borderColor: `rgba(52, 211, 153, ${0.5 - i * 0.05})`, // Emerald green like ocean
                    }}
                    animate={{
                      scale: [1, 1.1, 0.95, 1.05, 1],
                      opacity: [0.3, 0.7, 0.4, 0.8, 0.3],
                      rotate: [0, 10, -10, 5, 0],
                    }}
                    transition={{
                      duration: 3 + i * 0.3,
                      repeat: Infinity,
                      delay: i * 0.2,
                      ease: "easeInOut",
                    }}
                  />
                ))}

                {/* Inner water ripples */}
                {[...Array(8)].map((_, i) => (
                  <motion.div
                    key={`ripple-${i}`}
                    className="absolute rounded-full"
                    style={{
                      width: 15 + i * 10,
                      height: 15 + i * 10,
                      left: `calc(50% - ${7.5 + i * 5}px)`,
                      top: `calc(50% - ${7.5 + i * 5}px)`,
                      background: `radial-gradient(circle, rgba(52, 211, 153, ${0.3 - i * 0.025}) 0%, transparent 70%)`,
                    }}
                    animate={{
                      scale: [0.8, 1.2, 0.9, 1.1, 0.8],
                      opacity: [0.8, 0.3, 0.6, 0.2, 0.8],
                      x: [0, Math.sin(i * 0.5) * 10, 0],
                      y: [0, Math.cos(i * 0.5) * 8, 0],
                    }}
                    transition={{
                      duration: 2.5 + i * 0.1,
                      repeat: Infinity,
                      delay: i * 0.15,
                      ease: "easeInOut",
                    }}
                  />
                ))}

                {/* Central water surface */}
                <motion.div
                  className="absolute w-12 h-12 left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 rounded-full"
                  style={{
                    background:
                      "radial-gradient(circle, rgba(16, 185, 129, 0.8) 0%, rgba(52, 211, 153, 0.6) 40%, rgba(79, 70, 229, 0.4) 100%)",
                    boxShadow:
                      "0 0 40px rgba(52, 211, 153, 0.6), inset 0 0 20px rgba(16, 185, 129, 0.3)",
                  }}
                  animate={{
                    scale: [1, 1.3, 1.1, 1.4, 1],
                    opacity: [0.8, 1, 0.9, 1, 0.8],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                >
                  {/* Water surface reflections */}
                  <motion.div
                    className="absolute inset-0 rounded-full"
                    style={{
                      background:
                        "conic-gradient(from 0deg, transparent 0%, rgba(255, 255, 255, 0.3) 10%, transparent 20%, rgba(255, 255, 255, 0.2) 30%, transparent 40%, rgba(255, 255, 255, 0.3) 50%, transparent 60%, rgba(255, 255, 255, 0.1) 70%, transparent 80%, rgba(255, 255, 255, 0.3) 90%, transparent 100%)",
                    }}
                    animate={{
                      rotate: [0, 360],
                    }}
                    transition={{
                      duration: 8,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                  />

                  {/* Microphone icon floating on water */}
                  <motion.div
                    className="absolute inset-0 flex items-center justify-center text-white text-xl"
                    animate={{
                      scale: [1, 1.1, 1],
                      y: [0, -2, 0],
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  >
                    🐼
                  </motion.div>
                </motion.div>

                {/* Floating water particles */}
                {[...Array(15)].map((_, i) => (
                  <motion.div
                    key={`particle-${i}`}
                    className="absolute w-1 h-1 bg-emerald-300/60 rounded-full"
                    style={{
                      left: `${Math.random() * 100}%`,
                      top: `${Math.random() * 100}%`,
                    }}
                    animate={{
                      y: [0, -20, 0],
                      x: [0, Math.random() * 20 - 10, 0],
                      opacity: [0, 1, 0],
                      scale: [0, 1.5, 0],
                    }}
                    transition={{
                      duration: 3 + Math.random() * 2,
                      repeat: Infinity,
                      delay: i * 0.1,
                      ease: "easeOut",
                    }}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Enhanced AI Avatar Voice Recording Button */}
        <motion.div
          className="flex items-center justify-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.6 }}
        >
          {/* Enhanced AI Avatar with psychiatrist theme */}
          <motion.button
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handlePushToTalkStart();
            }}
            onMouseUp={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handlePushToTalkEnd();
            }}
            onMouseLeave={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handlePushToTalkEnd(); // Always stop when mouse leaves
            }}
            onTouchStart={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handlePushToTalkStart();
            }}
            onTouchEnd={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handlePushToTalkEnd();
            }}
            onTouchCancel={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handlePushToTalkEnd(); // Always stop when touch is cancelled
            }}
            disabled={
              !isSessionActive || isTranscribing || isThinking || isSpeaking
            }
            className={`relative w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 mx-auto transition-all duration-200 ${
              !isSessionActive || isTranscribing || isThinking || isSpeaking
                ? "cursor-not-allowed opacity-60"
                : "cursor-pointer"
            }`}
            whileHover={
              isSessionActive && !isTranscribing && !isThinking && !isSpeaking
                ? {
                    scale: 1.03,
                    y: -1,
                  }
                : {}
            }
            whileTap={
              isSessionActive && !isTranscribing && !isThinking && !isSpeaking
                ? { scale: 0.95 }
                : {}
            }
          >
            {/* Outer orbital rings */}
            <motion.div
              className="absolute inset-0 rounded-full border border-blue-400/20"
              animate={{
                rotate: [0, 360],
                scale: [1, 1.1, 1],
              }}
              transition={{
                rotate: {
                  duration: 20,
                  repeat: Infinity,
                  ease: "linear",
                },
                scale: {
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut",
                },
              }}
            />
            <motion.div
              className="absolute inset-0 rounded-full border border-indigo-400/20"
              animate={{
                rotate: [360, 0],
                scale: [1, 1.15, 1],
              }}
              transition={{
                rotate: {
                  duration: 25,
                  repeat: Infinity,
                  ease: "linear",
                },
                scale: {
                  duration: 5,
                  repeat: Infinity,
                  ease: "easeInOut",
                },
              }}
            />

            {/* Main avatar circle with enhanced breathing */}
            <motion.div
              className={`w-full h-full rounded-full flex items-center justify-center shadow-2xl relative overflow-hidden ${
                !isSessionActive
                  ? "bg-gradient-to-br from-gray-500 via-gray-600 to-gray-700 cursor-not-allowed opacity-50"
                  : isTranscribing || isThinking || isSpeaking
                    ? "bg-gradient-to-br from-orange-500 via-red-500 to-orange-600"
                    : isRecording
                      ? "bg-gradient-to-br from-blue-400 via-indigo-500 to-blue-500"
                      : "bg-gradient-to-br from-blue-500 via-indigo-600 to-slate-600"
              }`}
              animate={{
                scale: isButtonPressed ? [1, 1.05, 1] : [1, 1.04, 1],
                boxShadow:
                  isTranscribing || isThinking || isSpeaking
                    ? [
                        "0 20px 40px -8px rgb(234 88 12 / 0.7), 0 25px 50px -12px rgb(239 68 68 / 0.8), 0 0 25px rgb(251 146 60 / 0.6)",
                        "0 25px 50px -8px rgb(234 88 12 / 0.9), 0 30px 60px -12px rgb(239 68 68 / 0.9), 0 0 35px rgb(251 146 60 / 0.8)",
                        "0 20px 40px -8px rgb(234 88 12 / 0.7), 0 25px 50px -12px rgb(239 68 68 / 0.8), 0 0 25px rgb(251 146 60 / 0.6)",
                      ]
                    : isRecording
                      ? [
                          "0 20px 40px -8px rgb(59 130 246 / 0.7), 0 25px 50px -12px rgb(99 102 241 / 0.8), 0 0 25px rgb(147 197 253 / 0.6)",
                          "0 25px 50px -8px rgb(59 130 246 / 0.9), 0 30px 60px -12px rgb(99 102 241 / 0.9), 0 0 35px rgb(147 197 253 / 0.8)",
                          "0 20px 40px -8px rgb(59 130 246 / 0.7), 0 25px 50px -12px rgb(99 102 241 / 0.8), 0 0 25px rgb(147 197 253 / 0.6)",
                        ]
                      : [
                          "0 15px 20px -3px rgb(0 0 0 / 0.1), 0 6px 8px -4px rgb(0 0 0 / 0.1)",
                          "0 18px 35px -8px rgb(59 130 246 / 0.3), 0 18px 35px -8px rgb(99 102 241 / 0.3)",
                          "0 15px 20px -3px rgb(0 0 0 / 0.1), 0 6px 8px -4px rgb(0 0 0 / 0.1)",
                        ],
              }}
              transition={{
                duration: isButtonPressed ? 1.5 : 3,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              {/* Inner glow effect */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-full"
                animate={{
                  opacity: [0.3, 0.7, 0.3],
                  rotate: [0, 360],
                }}
                transition={{
                  opacity: { duration: 2, repeat: Infinity },
                  rotate: {
                    duration: 10,
                    repeat: Infinity,
                    ease: "linear",
                  },
                }}
              />

              {/* Psychiatrist-themed icons */}
              <motion.div className="relative z-10 flex items-center justify-center">
                <motion.div
                  animate={{
                    scale: isRecording ? [1, 1.15, 1] : [1, 1.08, 1],
                    filter: [
                      "brightness(1) hue-rotate(0deg)",
                      "brightness(1.1) hue-rotate(5deg)",
                      "brightness(1) hue-rotate(0deg)",
                    ],
                  }}
                  transition={{
                    duration: isRecording ? 0.8 : 1.5,
                    repeat: Infinity,
                  }}
                >
                  <IconMicrophone
                    size={isRecording ? 32 : 28}
                    className="text-white sm:w-8 sm:h-8 md:w-9 md:h-9"
                  />
                </motion.div>
              </motion.div>

              {/* Overlay pattern */}
              <motion.div
                className="absolute inset-0 rounded-full"
                style={{
                  background:
                    "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.2) 0%, transparent 50%)",
                }}
                animate={{
                  background: [
                    "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.2) 0%, transparent 50%)",
                    "radial-gradient(circle at 70% 70%, rgba(255,255,255,0.2) 0%, transparent 50%)",
                    "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.2) 0%, transparent 50%)",
                  ],
                }}
                transition={{ duration: 6, repeat: Infinity }}
              />
            </motion.div>

            {/* Enhanced floating particles with psychiatric symbols */}
            {[
              {
                symbol: "",
                angle: 0,
                radius: 25,
                color: "text-blue-300",
              },
              {
                symbol: "",
                angle: 60,
                radius: 25,
                color: "text-indigo-300",
              },
              {
                symbol: "",
                angle: 120,
                radius: 25,
                color: "text-blue-300",
              },
              {
                symbol: "",
                angle: 180,
                radius: 25,
                color: "text-yellow-300",
              },
              {
                symbol: "",
                angle: 240,
                radius: 25,
                color: "text-green-300",
              },
              {
                symbol: "",
                angle: 300,
                radius: 25,
                color: "text-cyan-300",
              },
            ].map((particle, i) => (
              <motion.div
                key={i}
                className={`absolute w-4 h-4 ${particle.color} rounded-full flex items-center justify-center text-xs font-bold shadow-md`}
                style={{
                  top: `${50 + Math.cos((particle.angle * Math.PI) / 180) * (particle.radius * 0.8)}%`,
                  left: `${50 + Math.sin((particle.angle * Math.PI) / 180) * (particle.radius * 0.8)}%`,
                  transform: "translate(-50%, -50%)",
                }}
                animate={{
                  y: [0, -6, 0],
                  rotate: [0, 360],
                  scale: [1, 1.2, 1],
                  opacity: [0.6, 1, 0.6],
                }}
                transition={{
                  duration: 3 + i * 0.2,
                  repeat: Infinity,
                  delay: i * 0.3,
                  ease: "easeInOut",
                }}
              >
                {particle.symbol}
              </motion.div>
            ))}

            {/* Enhanced pulsing rings with different speeds */}
            <motion.div
              className={`absolute inset-0 rounded-full border-2 ${
                isRecording ? "border-blue-300/60" : "border-blue-400/30"
              }`}
              animate={{
                scale: [1, 1.2, 1],
                opacity: isRecording ? [0.8, 0.2, 0.8] : [0.6, 0, 0.6],
                rotate: [0, 180, 360],
              }}
              transition={{ duration: 3, repeat: Infinity }}
            />
            <motion.div
              className={`absolute inset-0 rounded-full border-2 ${
                isRecording ? "border-indigo-300/60" : "border-indigo-400/30"
              }`}
              animate={{
                scale: [1, 1.3, 1],
                opacity: isRecording ? [0.6, 0.1, 0.6] : [0.4, 0, 0.4],
                rotate: [360, 180, 0],
              }}
              transition={{ duration: 3, repeat: Infinity, delay: 0.4 }}
            />
            <motion.div
              className={`absolute inset-0 rounded-full border-2 ${
                isRecording ? "border-sky-300/60" : "border-slate-400/30"
              }`}
              animate={{
                scale: [1, 1.4, 1],
                opacity: isRecording ? [0.5, 0.1, 0.5] : [0.3, 0, 0.3],
                rotate: [0, 360],
              }}
              transition={{ duration: 3, repeat: Infinity, delay: 0.8 }}
            />

            {/* Recording pulse indicator */}
            {isRecording && (
              <motion.div
                className="absolute -top-1 -right-1 w-5 h-5 bg-blue-400 rounded-full border-2 border-white flex items-center justify-center shadow-md"
                style={{
                  boxShadow:
                    "0 0 15px rgba(59, 130, 246, 0.7), 0 0 25px rgba(147, 197, 253, 0.5)",
                }}
                animate={{
                  scale: [1, 1.3, 1],
                  opacity: [1, 0.8, 1],
                  boxShadow: [
                    "0 0 15px rgba(59, 130, 246, 0.7), 0 0 25px rgba(147, 197, 253, 0.5)",
                    "0 0 20px rgba(59, 130, 246, 0.9), 0 0 35px rgba(147, 197, 253, 0.8)",
                    "0 0 15px rgba(59, 130, 246, 0.7), 0 0 25px rgba(147, 197, 253, 0.5)",
                  ],
                }}
                transition={{
                  duration: 0.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                <div className="w-1.5 h-1.5 bg-white rounded-full" />
              </motion.div>
            )}

            {/* Processing overlay indicator */}
            {(isTranscribing || isThinking || isSpeaking) && (
              <motion.div
                className="absolute inset-0 bg-black/30 rounded-full flex items-center justify-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <motion.div
                  className="text-white text-lg"
                  animate={{
                    rotate: isTranscribing ? [0, 360] : 0,
                    scale: [1, 1.1, 1],
                  }}
                  transition={{
                    rotate: { duration: 2, repeat: Infinity, ease: "linear" },
                    scale: { duration: 1.5, repeat: Infinity },
                  }}
                >
                  {isTranscribing ? "⏳" : isThinking ? "🤔" : "🔊"}
                </motion.div>
              </motion.div>
            )}
          </motion.button>
        </motion.div>

        {/* Helper Text */}
        <motion.div
          className="flex flex-col items-center mt-1 sm:mt-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.6 }}
        >
          <p className="text-red-300/60 text-xs text-center px-4">
            {!isSessionActive
              ? "Connecting..."
              : error
                ? "Error occurred. Try recording again or check the retry button above."
                : isTranscribing || isThinking || isSpeaking
                  ? "Please wait for PANDA to finish..."
                  : "Speak clearly for best results"}
          </p>
        </motion.div>
      </div>
    </div>
  );
};
