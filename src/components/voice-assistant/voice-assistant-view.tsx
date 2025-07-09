"use client";

import { FC, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { IconX, IconArrowLeft } from "@tabler/icons-react";
import { useRealtimeVoiceAssistant } from "../../hooks/useRealtimeVoiceAssistant";

interface VoiceAssistantViewProps {
  onBack?: () => void;
  onClose?: () => void;
}

export const VoiceAssistantView: FC<VoiceAssistantViewProps> = ({
  onBack,
  onClose,
}) => {
  const [userClosed, setUserClosed] = useState(false);
  const {
    isSessionActive,
    isLoadingSettings,
    status,
    transcript,
    response,
    error,
    startSession,
    endSession,
    interrupt,
  } = useRealtimeVoiceAssistant();

  // For proper typing, ensure status includes all expected values
  const isListening = status === "listening";
  const isThinking = status === "thinking";
  const isSpeaking = status === "speaking";

  // Auto-start session when component mounts and settings are loaded
  // but only if user hasn't manually closed
  useEffect(() => {
    if (!isLoadingSettings && !isSessionActive && !error && !userClosed) {
      startSession().catch(console.error);
    }

    // Cleanup on unmount
    return () => {
      if (isSessionActive) {
        endSession().catch(console.error);
      }
    };
  }, [
    isLoadingSettings,
    isSessionActive,
    error,
    userClosed,
    startSession,
    endSession,
  ]);

  const handleInterrupt = () => {
    interrupt();
  };

  const handleEndSession = () => {
    setUserClosed(true); // Mark that user intentionally ended session
    endSession().catch(console.error);
    
    // Navigate back to the modal/main page
    if (onClose) onClose();
    if (onBack) onBack();
  };

  const handleClose = () => {
    setUserClosed(true); // Mark that user intentionally closed
    if (isSessionActive) {
      endSession().catch(console.error);
    }
    if (onClose) onClose();
    if (onBack) onBack();
  };

  return (
    <div className="h-full bg-gradient-to-br from-gray-900 via-blue-900 to-slate-900 overflow-hidden relative">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute top-20 left-20 w-96 h-96 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 rounded-full blur-3xl"
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
          className="absolute bottom-20 right-20 w-80 h-80 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-full blur-3xl"
          animate={{
            x: [0, -80, 0],
            y: [0, 30, 0],
            scale: [1, 0.8, 1],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        {/* Additional floating elements */}
        <motion.div
          className="absolute top-1/3 right-1/4 w-64 h-64 bg-gradient-to-r from-indigo-500/15 to-blue-500/15 rounded-full blur-2xl"
          animate={{
            x: [0, -60, 0],
            y: [0, 40, 0],
            scale: [1, 1.3, 1],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 18,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </div>

      {/* Navigation Buttons */}
      <div className="absolute top-6 left-6 right-6 flex justify-between items-center z-50">
        {onBack && (
          <motion.button
            onClick={handleClose}
            className="w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-all duration-200 shadow-lg backdrop-blur-sm border border-white/20"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <IconArrowLeft size={20} className="text-white" />
          </motion.button>
        )}

        {onClose && (
          <motion.button
            onClick={handleClose}
            className="w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-all duration-200 shadow-lg backdrop-blur-sm border border-white/20"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <IconX size={20} className="text-white" />
          </motion.button>
        )}
      </div>

      {/* Loading/Error Display */}
      {(isLoadingSettings || error) && (
        <motion.div
          className="absolute top-20 left-6 right-6 z-50"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
        >
          <div
            className={`${isLoadingSettings ? "bg-blue-500/20 border-blue-500/30" : "bg-red-500/20 border-red-500/30"} border rounded-lg p-4 backdrop-blur-sm`}
          >
            <div className="flex items-center justify-center gap-3">
              {isLoadingSettings && (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-300 border-t-transparent"></div>
              )}
              <p
                className={`${isLoadingSettings ? "text-blue-200" : "text-red-200"} text-sm text-center`}
              >
                {isLoadingSettings ? "Connecting to database..." : error}
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Main Content */}
      <div className="relative z-10 h-full flex flex-col items-center justify-center p-8">
        {/* Header */}
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <motion.h1
            className="text-4xl font-bold text-white mb-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            AI Psychiatrist
          </motion.h1>
          <motion.p
            className="text-lg text-blue-200 max-w-2xl mx-auto mb-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
          >
            Speak freely, I&apos;m here to listen and support you
          </motion.p>

          {/* Status Indicator */}
          <motion.div
            className="flex items-center justify-center space-x-2 text-sm"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
          >
            <div
              className={`w-2 h-2 rounded-full ${
                status === "connected"
                  ? "bg-cyan-400"
                  : status === "listening"
                    ? "bg-green-400 animate-pulse"
                    : status === "thinking"
                      ? "bg-yellow-400 animate-pulse"
                      : status === "speaking"
                        ? "bg-blue-400 animate-pulse"
                        : status === "connecting"
                          ? "bg-orange-400 animate-pulse"
                          : "bg-gray-400"
              }`}
            />
            <span className="text-blue-200">
              {status === "disconnected"
                ? "Initializing..."
                : status === "connecting"
                  ? "Connecting..."
                  : status === "listening"
                    ? "Listening..."
                    : status === "thinking"
                      ? "Processing..."
                      : status === "speaking"
                        ? "Speaking..."
                        : "Ready to listen"}
            </span>
          </motion.div>
        </motion.div>

        {/* Siri-like Visualization */}
        <motion.div
          className="relative mb-8 flex items-center justify-center"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6, duration: 0.8 }}
        >
          {/* Main circular container */}
          <div className="relative w-80 h-80 flex items-center justify-center">
            {/* Animated Siri-like waves */}
            <div className="absolute inset-0 flex items-center justify-center">
              {isListening ? (
                // Active listening - Siri-like flowing waves
                <div className="flex items-center justify-center space-x-1">
                  {[...Array(60)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="w-1 bg-gradient-to-t from-blue-400 via-cyan-300 to-blue-200 rounded-full opacity-80"
                      animate={{
                        height: [
                          Math.random() * 20 + 10,
                          Math.random() * 80 + 20,
                          Math.random() * 40 + 15,
                          Math.random() * 100 + 30,
                          Math.random() * 20 + 10,
                        ],
                        opacity: [0.3, 1, 0.7, 1, 0.4],
                      }}
                      transition={{
                        duration: 1.5 + Math.random() * 1,
                        repeat: Infinity,
                        delay: i * 0.02,
                        ease: "easeInOut",
                      }}
                    />
                  ))}
                </div>
              ) : isThinking ? (
                // Processing - circular wave pattern
                <div className="relative">
                  {[...Array(3)].map((_, ringIndex) => (
                    <div key={ringIndex} className="absolute inset-0">
                      {[...Array(24)].map((_, i) => {
                        const angle = (i / 24) * 360;
                        const radius = 60 + ringIndex * 40;
                        return (
                          <motion.div
                            key={i}
                            className="absolute w-2 h-2 bg-gradient-to-r from-blue-400 to-cyan-300 rounded-full"
                            style={{
                              left: `calc(50% + ${Math.cos((angle * Math.PI) / 180) * radius}px)`,
                              top: `calc(50% + ${Math.sin((angle * Math.PI) / 180) * radius}px)`,
                              transformOrigin: "center",
                            }}
                            animate={{
                              scale: [0.5, 1.5, 0.5],
                              opacity: [0.3, 1, 0.3],
                            }}
                            transition={{
                              duration: 2,
                              repeat: Infinity,
                              delay: (i + ringIndex * 8) * 0.1,
                              ease: "easeInOut",
                            }}
                          />
                        );
                      })}
                    </div>
                  ))}
                </div>
              ) : (
                // Idle state - gentle pulsing circle
                <motion.div
                  className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-500/30 to-cyan-500/30 border border-blue-400/30 flex items-center justify-center"
                  animate={{
                    scale: [1, 1.1, 1],
                    opacity: [0.6, 1, 0.6],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                >
                  <motion.div
                    className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-cyan-400 flex items-center justify-center"
                    animate={
                      isListening
                        ? {
                            scale: [1, 1.2, 1],
                          }
                        : {
                            scale: [1, 1.1, 1],
                          }
                    }
                    transition={{
                      duration: isListening ? 1 : 2,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  >
                    {/* AI Assistant Avatar */}
                    <div className="relative">
                      {/* AI Bot Head with metallic look */}
                      <div className="w-8 h-8 bg-gradient-to-br from-cyan-200 to-blue-300 rounded-lg relative border border-cyan-300/50 shadow-lg">
                        {/* AI Eyes - glowing effect */}
                        <motion.div
                          className="absolute top-2 left-1.5 w-1.5 h-1.5 bg-blue-500 rounded-full shadow-lg"
                          animate={{
                            boxShadow: [
                              "0 0 4px rgba(59, 130, 246, 0.5)",
                              "0 0 8px rgba(59, 130, 246, 0.8)",
                              "0 0 4px rgba(59, 130, 246, 0.5)",
                            ],
                          }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: "easeInOut",
                          }}
                        />
                        <motion.div
                          className="absolute top-2 right-1.5 w-1.5 h-1.5 bg-blue-500 rounded-full shadow-lg"
                          animate={{
                            boxShadow: [
                              "0 0 4px rgba(59, 130, 246, 0.5)",
                              "0 0 8px rgba(59, 130, 246, 0.8)",
                              "0 0 4px rgba(59, 130, 246, 0.5)",
                            ],
                          }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            delay: 0.1,
                            ease: "easeInOut",
                          }}
                        />

                        {/* AI Mouth - voice indicator */}
                        <motion.div
                          className="absolute bottom-1.5 left-1/2 transform -translate-x-1/2 w-3 h-0.5 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-full"
                          animate={
                            isListening
                              ? {
                                  scaleX: [1, 1.5, 0.8, 1.3, 1],
                                  opacity: [0.7, 1, 0.5, 1, 0.7],
                                }
                              : {
                                  scaleX: 1,
                                  opacity: 0.7,
                                }
                          }
                          transition={{
                            duration: 0.8,
                            repeat: isListening ? Infinity : 0,
                            ease: "easeInOut",
                          }}
                        />

                        {/* Circuit pattern overlay */}
                        <div className="absolute inset-0 rounded-lg overflow-hidden">
                          <div className="absolute top-1 left-1 w-2 h-0.5 bg-cyan-400/30 rounded-full"></div>
                          <div className="absolute top-1 right-1 w-2 h-0.5 bg-cyan-400/30 rounded-full"></div>
                          <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-0.5 h-2 bg-cyan-400/30 rounded-full"></div>
                        </div>
                      </div>

                      {/* AI Sound waves when listening */}
                      {isListening && (
                        <>
                          <motion.div
                            className="absolute -right-3 top-1 w-1 h-1 bg-cyan-300 rounded-full"
                            animate={{
                              x: [0, 10, 20],
                              opacity: [0, 1, 0],
                              scale: [0.5, 1, 0.5],
                            }}
                            transition={{
                              duration: 1.5,
                              repeat: Infinity,
                              ease: "easeOut",
                            }}
                          />
                          <motion.div
                            className="absolute -right-3 top-3 w-1 h-1 bg-blue-300 rounded-full"
                            animate={{
                              x: [0, 8, 16],
                              opacity: [0, 0.8, 0],
                              scale: [0.3, 0.8, 0.3],
                            }}
                            transition={{
                              duration: 1.5,
                              repeat: Infinity,
                              delay: 0.3,
                              ease: "easeOut",
                            }}
                          />
                          <motion.div
                            className="absolute -right-3 top-5 w-1 h-1 bg-cyan-400 rounded-full"
                            animate={{
                              x: [0, 12, 24],
                              opacity: [0, 1, 0],
                              scale: [0.4, 1.2, 0.4],
                            }}
                            transition={{
                              duration: 1.5,
                              repeat: Infinity,
                              delay: 0.6,
                              ease: "easeOut",
                            }}
                          />

                          {/* Additional wave lines for more AI effect */}
                          <motion.div
                            className="absolute -right-2 top-0 w-0.5 h-0.5 bg-white rounded-full"
                            animate={{
                              x: [0, 6, 12],
                              y: [0, -2, -4],
                              opacity: [0, 0.6, 0],
                            }}
                            transition={{
                              duration: 1.2,
                              repeat: Infinity,
                              delay: 0.1,
                            }}
                          />
                          <motion.div
                            className="absolute -right-2 top-6 w-0.5 h-0.5 bg-white rounded-full"
                            animate={{
                              x: [0, 6, 12],
                              y: [0, 2, 4],
                              opacity: [0, 0.6, 0],
                            }}
                            transition={{
                              duration: 1.2,
                              repeat: Infinity,
                              delay: 0.4,
                            }}
                          />
                        </>
                      )}
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </div>

            {/* Outer decorative rings */}
            {isListening && (
              <>
                <motion.div
                  className="absolute inset-0 rounded-full border border-blue-400/20"
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.3, 0.6, 0.3],
                    rotate: [0, 360],
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                />
                <motion.div
                  className="absolute inset-0 rounded-full border border-cyan-400/20"
                  animate={{
                    scale: [1, 1.4, 1],
                    opacity: [0.2, 0.4, 0.2],
                    rotate: [360, 0],
                  }}
                  transition={{
                    duration: 6,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                />
              </>
            )}
          </div>
        </motion.div>

        {/* Status Text */}
        <motion.div
          className="mb-6 min-h-[60px] flex flex-col items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.6 }}
        >
          <motion.p
            className="text-white text-xl font-medium mb-1"
            key={
              isListening
                ? "listening"
                : isThinking
                  ? "thinking"
                  : isSpeaking
                    ? "speaking"
                    : "ready"
            }
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            {isListening
              ? "Listening to your thoughts..."
              : isThinking
                ? "Understanding and processing..."
                : isSpeaking
                  ? "AI is speaking..."
                  : "Ready to listen"}
          </motion.p>

          <motion.div
            className="flex items-center gap-2 text-blue-300 text-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 0.6 }}
          >
            <motion.div
              className="w-2 h-2 bg-green-400 rounded-full"
              animate={{
                scale: [1, 1.3, 1],
                opacity: [0.7, 1, 0.7],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
            <span>Voice AI Active</span>
          </motion.div>
        </motion.div>

        {/* Transcript */}
        <AnimatePresence>
          {transcript && (
            <motion.div
              className="mb-4 p-4 bg-white/10 rounded-2xl backdrop-blur-xl max-w-2xl w-full border border-blue-300/20 shadow-lg"
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ duration: 0.4, type: "spring", bounce: 0.3 }}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                <p className="text-blue-200 text-sm font-medium">Your words:</p>
              </div>
              <p className="text-white text-base leading-relaxed">
                {transcript}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Response */}
        <AnimatePresence>
          {response && (
            <motion.div
              className="mb-6 p-4 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-2xl border border-cyan-300/30 backdrop-blur-xl max-w-2xl w-full shadow-lg"
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ duration: 0.4, type: "spring", bounce: 0.3 }}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
                <p className="text-cyan-200 text-sm font-medium">
                  AI Psychiatrist:
                </p>
              </div>
              <p className="text-white text-base leading-relaxed">{response}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Control Buttons Container */}
        <motion.div
          className="flex items-center gap-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.6 }}
        >
          {/* Main Control Button */}
          <motion.button
            onClick={handleInterrupt}
            className={`relative w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 text-white font-medium shadow-2xl border-2 overflow-hidden ${
              !isSessionActive
                ? "bg-gradient-to-br from-gray-500 to-gray-600 border-gray-400/50 cursor-not-allowed opacity-50"
                : isSpeaking
                  ? "bg-gradient-to-br from-red-500 to-red-600 border-red-400/50 hover:from-red-600 hover:to-red-700"
                  : "bg-gradient-to-br from-blue-500 to-cyan-500 border-blue-400/50 hover:from-blue-600 hover:to-cyan-600"
            }`}
            whileHover={isSessionActive ? { scale: 1.1, y: -2 } : {}}
            whileTap={isSessionActive ? { scale: 0.95 } : {}}
            disabled={!isSessionActive}
          >
            {/* Button glow effect */}
            <motion.div
              className="absolute inset-0 rounded-full bg-gradient-to-br from-white/20 to-transparent"
              animate={
                isSpeaking
                  ? {
                      opacity: [0.3, 0.6, 0.3],
                      scale: [1, 1.1, 1],
                    }
                  : {
                      opacity: 0.3,
                      scale: 1,
                    }
              }
              transition={{
                duration: 2,
                repeat: isSpeaking ? Infinity : 0,
                ease: "easeInOut",
              }}
            />

            {/* Button content */}
            <motion.div
              className="relative z-10"
              animate={isListening ? { scale: [1, 1.1, 1] } : { scale: 1 }}
              transition={{
                duration: 1,
                repeat: isListening ? Infinity : 0,
                ease: "easeInOut",
              }}
            >
              {/* Human talking icon for button */}
              <div className="relative">
                {/* Head */}
                <div className="w-7 h-7 bg-white rounded-full relative">
                  {/* Eyes */}
                  <div className="absolute top-2 left-1.5 w-1 h-1 bg-blue-600 rounded-full"></div>
                  <div className="absolute top-2 right-1.5 w-1 h-1 bg-blue-600 rounded-full"></div>
                  {/* Mouth - animated when listening */}
                  <motion.div
                    className="absolute bottom-1.5 left-1/2 transform -translate-x-1/2 w-2 h-1 bg-blue-600 rounded-full"
                    animate={
                      isListening
                        ? {
                            scaleY: [1, 1.5, 1],
                            scaleX: [1, 0.8, 1],
                          }
                        : { scaleY: 1, scaleX: 1 }
                    }
                    transition={{
                      duration: 0.5,
                      repeat: isListening ? Infinity : 0,
                      ease: "easeInOut",
                    }}
                  />
                </div>

                {/* Speech lines when talking */}
                {isListening && (
                  <>
                    <motion.div
                      className="absolute -right-2 top-1 w-0.5 h-2 bg-white rounded-full"
                      animate={{
                        opacity: [0, 1, 0],
                        x: [0, 5],
                      }}
                      transition={{
                        duration: 0.8,
                        repeat: Infinity,
                        ease: "easeOut",
                      }}
                    />
                    <motion.div
                      className="absolute -right-2 top-3 w-0.5 h-1 bg-white rounded-full"
                      animate={{
                        opacity: [0, 0.8, 0],
                        x: [0, 3],
                      }}
                      transition={{
                        duration: 0.8,
                        repeat: Infinity,
                        delay: 0.2,
                        ease: "easeOut",
                      }}
                    />
                    <motion.div
                      className="absolute -right-2 top-5 w-0.5 h-1.5 bg-white rounded-full"
                      animate={{
                        opacity: [0, 1, 0],
                        x: [0, 4],
                      }}
                      transition={{
                        duration: 0.8,
                        repeat: Infinity,
                        delay: 0.4,
                        ease: "easeOut",
                      }}
                    />
                  </>
                )}
              </div>
            </motion.div>

            {/* Ripple effect */}
            <motion.div
              className="absolute inset-0 rounded-full border border-white/30"
              animate={
                isSpeaking
                  ? {
                      scale: [1, 1.5],
                      opacity: [0.6, 0],
                    }
                  : { scale: 1, opacity: 0 }
              }
              transition={{
                duration: 1.5,
                repeat: isSpeaking ? Infinity : 0,
                ease: "easeOut",
              }}
            />
          </motion.button>

          {/* End Session Button */}
          <motion.button
            onClick={handleEndSession}
            className="relative w-14 h-14 bg-gradient-to-br from-red-500 via-pink-500 to-red-600 rounded-full shadow-xl border-2 border-white/20 flex items-center justify-center group overflow-hidden"
            whileHover={{ scale: 1.1, rotate: -5 }}
            whileTap={{ scale: 0.95 }}
            disabled={!isSessionActive}
          >
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-full" />

            {/* Human emoji for end session */}
            <motion.div
              className="relative z-10 text-xl"
              whileHover={{ scale: 1.1 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              👋
            </motion.div>
          </motion.button>
        </motion.div>

        {/* Helper Text */}
        <motion.div
          className="flex flex-col items-center mt-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.6 }}
        >
          <p className="text-blue-200 text-base mb-1">
            {isSpeaking ? "Click to interrupt" : "Voice conversation is live"}
          </p>
          <p className="text-blue-300/60 text-sm">
            Just speak naturally - I&apos;m listening
          </p>
        </motion.div>
      </div>
    </div>
  );
};
