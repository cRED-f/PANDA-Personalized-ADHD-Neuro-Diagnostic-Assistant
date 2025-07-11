"use client";

import { FC, useEffect, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { IconX, IconArrowLeft, IconMicrophone } from "@tabler/icons-react";
import { useChainedVoiceAssistant } from "../../hooks/useChainedVoiceAssistant";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";

interface VoiceAssistantViewProps {
  onBack?: () => void;
  onClose?: () => void;
}

export const VoiceAssistantView: FC<VoiceAssistantViewProps> = ({
  onBack,
  onClose,
}) => {
  const [userClosed, setUserClosed] = useState(false);
  const [isButtonPressed, setIsButtonPressed] = useState(false);
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
      startSession().catch(console.error);
    }
  }, [isLoadingSettings, isSessionActive, error, userClosed, startSession]);

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
    if (isSessionActive && !isButtonPressed) {
      setIsButtonPressed(true);
      startRecording().catch(console.error);
    }
  }, [isSessionActive, isButtonPressed, startRecording]);

  const handlePushToTalkEnd = useCallback(() => {
    // Always stop when button is released, regardless of other conditions
    if (isButtonPressed) {
      setIsButtonPressed(false);
    }
    // Always try to stop recording if it's active
    if (isRecording) {
      stopRecording().catch(console.error);
    }
  }, [isRecording, isButtonPressed, stopRecording]);

  // Safety cleanup for stuck recording state
  useEffect(() => {
    if (!isButtonPressed && isRecording) {
      stopRecording().catch(console.error);
    }
  }, [isButtonPressed, isRecording, stopRecording]);

  const handleClose = () => {
    setUserClosed(true);
    if (isSessionActive) {
      endSession().catch(console.error);
    }
    if (onClose) onClose();
    if (onBack) onBack();
  };

  return (
    <div className="h-full bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 overflow-hidden relative">
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
      <div className="relative z-10 flex items-center justify-between p-6">
        {/* Back Button */}
        <motion.button
          onClick={handleClose}
          className="flex items-center gap-2 text-blue-200 hover:text-white transition-colors duration-200 bg-white/10 backdrop-blur-sm rounded-lg px-3 py-2 border border-white/20"
          whileHover={{ scale: 1.05, x: -2 }}
          whileTap={{ scale: 0.95 }}
        >
          <IconArrowLeft size={20} />
          <span className="text-sm font-medium">Back</span>
        </motion.button>

        {/* Title */}
        <motion.div
          className="absolute left-1/2 transform -translate-x-1/2"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-200 to-indigo-200">
            AI Psychiatrist - Voice Session
          </h1>
        </motion.div>

        {/* Close Button */}
        <motion.button
          onClick={handleClose}
          className="text-blue-200 hover:text-white transition-colors duration-200 bg-white/10 backdrop-blur-sm rounded-lg p-2 border border-white/20"
          whileHover={{ scale: 1.1, rotate: 90 }}
          whileTap={{ scale: 0.9 }}
        >
          <IconX size={20} />
        </motion.button>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-[calc(100vh-120px)] px-6">
        {/* Error Display */}
        <AnimatePresence>
          {error && (
            <motion.div
              className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-2xl backdrop-blur-xl max-w-2xl w-full"
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ duration: 0.4 }}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                <p className="text-red-200 text-sm font-medium">Error:</p>
              </div>
              <p className="text-white text-base">{error}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Loading State */}
        <AnimatePresence>
          {isLoadingSettings && (
            <motion.div
              className="mb-6 p-6 bg-gradient-to-r from-blue-600/15 to-indigo-600/15 rounded-2xl border border-blue-300/30 backdrop-blur-xl max-w-2xl w-full"
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ duration: 0.4 }}
            >
              <div className="flex items-center gap-3">
                <motion.div
                  className="w-6 h-6 border-2 border-blue-400/30 border-t-blue-400 rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                />
                <p className="text-blue-200 text-lg">
                  Loading voice settings...
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Chat History Display */}
        <motion.div
          className={`flex-1 w-full max-w-4xl mb-6 relative transition-all duration-500 ${
            isButtonPressed ? "blur-sm" : ""
          }`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          <div className="h-[32rem] overflow-y-auto px-6 scrollbar-hide">
            <div className="space-y-4">
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
                    } rounded-2xl border p-4 max-w-md backdrop-blur-sm`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          message.role === "user"
                            ? "bg-lime-400"
                            : "bg-blue-400"
                        }`}
                      ></div>
                      <p
                        className={`text-xs font-medium ${
                          message.role === "user"
                            ? "text-lime-200"
                            : "text-blue-200"
                        }`}
                      >
                        {message.role === "user" ? "You" : "AI Psychiatrist"}
                      </p>
                    </div>
                    <p className="text-white text-sm leading-relaxed">
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
                    className="space-y-4"
                  >
                    <div className="text-6xl mb-4">💫</div>
                    <h2 className="text-2xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-blue-200 to-indigo-200">
                      Welcome to Your AI Companion
                    </h2>
                    <p className="text-lg text-blue-200/80 max-w-md mx-auto">
                      I&apos;m here to listen and support you. Press and hold
                      the button below to start our conversation.
                    </p>
                    <div className="flex items-center justify-center gap-2 text-blue-300/60 text-sm mt-6">
                      <div className="w-2 h-2 bg-lime-400 rounded-full animate-pulse"></div>
                      <span>Ready to listen</span>
                    </div>
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
              <div className="relative w-80 h-80">
                {/* Ocean waves - multiple layers for depth */}
                {[...Array(8)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute rounded-full border-2"
                    style={{
                      width: 60 + i * 35,
                      height: 60 + i * 35,
                      left: `calc(50% - ${30 + i * 17.5}px)`,
                      top: `calc(50% - ${30 + i * 17.5}px)`,
                      borderColor: `rgba(52, 211, 153, ${0.6 - i * 0.06})`, // Emerald green like ocean
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
                {[...Array(12)].map((_, i) => (
                  <motion.div
                    key={`ripple-${i}`}
                    className="absolute rounded-full"
                    style={{
                      width: 20 + i * 15,
                      height: 20 + i * 15,
                      left: `calc(50% - ${10 + i * 7.5}px)`,
                      top: `calc(50% - ${10 + i * 7.5}px)`,
                      background: `radial-gradient(circle, rgba(52, 211, 153, ${0.4 - i * 0.03}) 0%, transparent 70%)`,
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
                  className="absolute w-16 h-16 left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 rounded-full"
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
                    🎤
                  </motion.div>
                </motion.div>

                {/* Floating water particles */}
                {[...Array(20)].map((_, i) => (
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
            disabled={!isSessionActive}
            className="relative w-28 h-28 mx-auto"
            whileHover={
              isSessionActive
                ? {
                    scale: 1.05,
                    y: -2,
                  }
                : {}
            }
            whileTap={isSessionActive ? { scale: 0.95 } : {}}
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
                  : isRecording
                    ? "bg-gradient-to-br from-blue-400 via-indigo-500 to-blue-500"
                    : "bg-gradient-to-br from-blue-500 via-indigo-600 to-slate-600"
              }`}
              animate={{
                scale: isButtonPressed ? [1, 1.1, 1] : [1, 1.08, 1],
                boxShadow: isRecording
                  ? [
                      "0 30px 60px -12px rgb(59 130 246 / 0.8), 0 40px 80px -20px rgb(99 102 241 / 0.9), 0 0 40px rgb(147 197 253 / 0.7)",
                      "0 40px 80px -12px rgb(59 130 246 / 1), 0 50px 100px -20px rgb(99 102 241 / 1), 0 0 60px rgb(147 197 253 / 0.9)",
                      "0 30px 60px -12px rgb(59 130 246 / 0.8), 0 40px 80px -20px rgb(99 102 241 / 0.9), 0 0 40px rgb(147 197 253 / 0.7)",
                    ]
                  : [
                      "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
                      "0 25px 50px -12px rgb(59 130 246 / 0.4), 0 25px 50px -12px rgb(99 102 241 / 0.4)",
                      "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
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
                    scale: isRecording ? [1, 1.2, 1] : [1, 1.1, 1],
                    filter: [
                      "brightness(1) hue-rotate(0deg)",
                      "brightness(1.2) hue-rotate(10deg)",
                      "brightness(1) hue-rotate(0deg)",
                    ],
                  }}
                  transition={{
                    duration: isRecording ? 1 : 2,
                    repeat: Infinity,
                  }}
                >
                  <IconMicrophone size={28} className="text-white" />
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
                className={`absolute w-6 h-6 ${particle.color} rounded-full flex items-center justify-center text-xs font-bold shadow-lg`}
                style={{
                  top: `${50 + Math.cos((particle.angle * Math.PI) / 180) * particle.radius}%`,
                  left: `${50 + Math.sin((particle.angle * Math.PI) / 180) * particle.radius}%`,
                  transform: "translate(-50%, -50%)",
                }}
                animate={{
                  y: [0, -10, 0],
                  rotate: [0, 360],
                  scale: [1, 1.3, 1],
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
                scale: [1, 1.3, 1],
                opacity: isRecording ? [0.8, 0.2, 0.8] : [0.6, 0, 0.6],
                rotate: [0, 180, 360],
              }}
              transition={{ duration: 4, repeat: Infinity }}
            />
            <motion.div
              className={`absolute inset-0 rounded-full border-2 ${
                isRecording ? "border-indigo-300/60" : "border-indigo-400/30"
              }`}
              animate={{
                scale: [1, 1.5, 1],
                opacity: isRecording ? [0.6, 0.1, 0.6] : [0.4, 0, 0.4],
                rotate: [360, 180, 0],
              }}
              transition={{ duration: 4, repeat: Infinity, delay: 0.5 }}
            />
            <motion.div
              className={`absolute inset-0 rounded-full border-2 ${
                isRecording ? "border-sky-300/60" : "border-slate-400/30"
              }`}
              animate={{
                scale: [1, 1.7, 1],
                opacity: isRecording ? [0.5, 0.1, 0.5] : [0.3, 0, 0.3],
                rotate: [0, 360],
              }}
              transition={{ duration: 4, repeat: Infinity, delay: 1 }}
            />

            {/* Recording pulse indicator */}
            {isRecording && (
              <motion.div
                className="absolute -top-2 -right-2 w-6 h-6 bg-blue-400 rounded-full border-2 border-white flex items-center justify-center shadow-lg"
                style={{
                  boxShadow:
                    "0 0 20px rgba(59, 130, 246, 0.8), 0 0 40px rgba(147, 197, 253, 0.6)",
                }}
                animate={{
                  scale: [1, 1.4, 1],
                  opacity: [1, 0.8, 1],
                  boxShadow: [
                    "0 0 20px rgba(59, 130, 246, 0.8), 0 0 40px rgba(147, 197, 253, 0.6)",
                    "0 0 30px rgba(59, 130, 246, 1), 0 0 60px rgba(147, 197, 253, 0.9)",
                    "0 0 20px rgba(59, 130, 246, 0.8), 0 0 40px rgba(147, 197, 253, 0.6)",
                  ],
                }}
                transition={{
                  duration: 0.6,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                <div className="w-2 h-2 bg-white rounded-full" />
              </motion.div>
            )}
          </motion.button>
        </motion.div>

        {/* Helper Text */}
        <motion.div
          className="flex flex-col items-center mt-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.6 }}
        >
          <p className="text-red-200 text-base mb-1">
            {isRecording
              ? "🔴 Listening..."
              : isTranscribing
                ? "Processing..."
                : isThinking
                  ? "Thinking..."
                  : isSpeaking
                    ? "Speaking..."
                    : "Hold to talk"}
          </p>
          <p className="text-red-300/60 text-sm">
            {isSessionActive
              ? "Speak clearly for best results"
              : "Connecting..."}
          </p>
        </motion.div>
      </div>
    </div>
  );
};
