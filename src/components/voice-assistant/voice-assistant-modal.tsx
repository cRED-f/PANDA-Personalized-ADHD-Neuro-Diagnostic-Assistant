"use client";

import { FC, useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { IconX } from "@tabler/icons-react";
import { VoiceAssistantView } from "./voice-assistant-view";

interface VoiceAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingSessionId?: string;
}

export const VoiceAssistantModal: FC<VoiceAssistantModalProps> = ({
  isOpen,
  onClose,
  existingSessionId,
}) => {
  const [showInterface, setShowInterface] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [visibleMessages, setVisibleMessages] = useState(0);
  const conversationRef = useRef<HTMLDivElement>(null);

  const conversationMessages = [
    {
      speaker: "User",
      text: "hi",
      isUser: true,
    },
    {
      speaker: "PANDA",
      text: "Hello! I'm Dr. PANDA. How are you feeling today?",
      isUser: false,
    },
    {
      speaker: "User",
      text: "fine",
      isUser: true,
    },
    {
      speaker: "PANDA",
      text: "Glad you're feeling fine today. What brings you here - is there something specific you'd like to talk about?",
      isUser: false,
    },
    {
      speaker: "User",
      text: "i want to talk about my son",
      isUser: true,
    },
    {
      speaker: "PANDA",
      text: "Thanks for sharing about your son - I'd really like to understand him better. Could you tell me his name and how old he is?",
      isUser: false,
    },
    {
      speaker: "User",
      text: "He's Fahim and 12 years old",
      isUser: true,
    },
    {
      speaker: "PANDA",
      text: "Thank you for telling me about Fahim. Just two more quick things - what grade is he in, and could you share what specific concerns you have about him?",
      isUser: false,
    },
    {
      speaker: "User",
      text: "he is in 6th grade and he is having hard time focusing on study",
      isUser: true,
    },
    {
      speaker: "PANDA",
      text: "I hear how concerned you are about Fahim's focus during study time. When he's trying to do homework, what kinds of things tend to distract him the most?",
      isUser: false,
    },
    {
      speaker: "User",
      text: "When Fahim is doing homework, the things that tend to distract him the most are noises in the environment",
      isUser: true,
    },
  ];

  useEffect(() => {
    if (isOpen && !showInterface) {
      // Reset messages and transition state when modal opens
      setVisibleMessages(0);
      setIsTransitioning(false);

      // Start showing messages one by one after initial delay
      const timer = setTimeout(() => {
        let currentMessage = 0;

        const showNextMessage = () => {
          if (currentMessage < conversationMessages.length) {
            setVisibleMessages(currentMessage + 1);
            currentMessage++;
            setTimeout(showNextMessage, 2500); // Show next message after 2.5 seconds for better readability
          } else {
            // Reset after a pause to create infinite loop
            setTimeout(() => {
              setVisibleMessages(0); // Clear all messages first
              currentMessage = 0;
              setTimeout(() => {
                showNextMessage(); // Restart the sequence
              }, 500); // Small delay before restarting
            }, 3000); // 3 second pause before restarting
          }
        };

        showNextMessage();
      }, 1000); // Initial delay reduced to 1 second

      return () => clearTimeout(timer);
    }
  }, [isOpen, showInterface, conversationMessages.length]);

  useEffect(() => {
    // Auto-scroll to bottom when new message appears
    if (conversationRef.current) {
      conversationRef.current.scrollTop = conversationRef.current.scrollHeight;
    }
  }, [visibleMessages]);

  const handleStart = () => {
    setIsTransitioning(true);
    // Add a longer delay for the tear-down animation before showing interface
    setTimeout(() => {
      setShowInterface(true);
    }, 1500); // Increased from 800ms to 1500ms for slower animation
  };

  const handleBack = () => {
    setShowInterface(false);
    setIsTransitioning(false);
  };

  if (showInterface || existingSessionId) {
    return (
      <VoiceAssistantView
        onBack={existingSessionId ? onClose : handleBack}
        onClose={onClose}
        existingSessionId={existingSessionId}
      />
    );
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="h-full w-full bg-gradient-to-br  from-slate-900 via-blue-950 to-indigo-950 overflow-hidden relative">
          {/* Enhanced Animated Background Elements */}
          <motion.div
            className="absolute inset-0 overflow-hidden"
            animate={
              isTransitioning
                ? {
                    opacity: 0.3,
                    scale: 1.1,
                    filter: "blur(5px)",
                  }
                : {
                    opacity: 1,
                    scale: 1,
                    filter: "blur(0px)",
                  }
            }
            transition={{ duration: 1.2, ease: "easeInOut" }}
          >
            {/* Primary floating orbs with dark blue and subtle lime accents */}
            <motion.div
              className="absolute top-20 left-20 w-96 h-96 bg-gradient-to-r from-blue-600/15 to-indigo-600/15 rounded-full blur-3xl"
              animate={{
                x: [0, 100, 0],
                y: [0, -50, 0],
                scale: [1, 1.2, 1],
                rotate: [0, 180, 360],
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
                scale: [1, 0.8, 1],
                rotate: [360, 180, 0],
              }}
              transition={{
                duration: 25,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />

            {/* Additional dark blue floating elements */}
            <motion.div
              className="absolute top-1/3 right-1/4 w-64 h-64 bg-gradient-to-r from-slate-700/10 to-blue-800/10 rounded-full blur-2xl"
              animate={{
                x: [0, -60, 0],
                y: [0, 40, 0],
                scale: [1, 1.3, 1],
                opacity: [0.15, 0.3, 0.15],
              }}
              transition={{
                duration: 18,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />

            {/* Brain-wave like patterns with dark blue hints */}
            <motion.div
              className="absolute top-1/2 left-1/3 w-32 h-32 bg-gradient-to-r from-indigo-700/12 to-blue-800/12 rounded-full blur-xl"
              animate={{
                x: [0, 50, -30, 0],
                y: [0, -20, 20, 0],
                scale: [1, 1.1, 0.9, 1],
                rotate: [0, 90, 180, 270, 360],
              }}
              transition={{
                duration: 15,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />

            {/* Floating dark blue particles throughout */}
            {[...Array(12)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-3 h-3 bg-blue-400/10 rounded-full blur-sm"
                style={{
                  top: `${Math.random() * 100}%`,
                  left: `${Math.random() * 100}%`,
                }}
                animate={{
                  y: [0, -30, 0],
                  x: [0, Math.random() * 40 - 20, 0],
                  opacity: [0.2, 0.8, 0.2],
                  scale: [1, 1.5, 1],
                }}
                transition={{
                  duration: 8 + Math.random() * 4,
                  repeat: Infinity,
                  delay: i * 0.5,
                  ease: "easeInOut",
                }}
              />
            ))}
          </motion.div>

          {/* Close Button */}
          <motion.button
            className="absolute top-2 sm:top-4 right-2 sm:right-4 z-50 w-8 h-8 sm:w-10 sm:h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-all duration-200 shadow-lg backdrop-blur-sm border border-white/20"
            onClick={onClose}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
          >
            <IconX size={16} className="text-white sm:hidden" />
            <IconX size={18} className="text-white hidden sm:block" />
          </motion.button>

          {/* Main Content with tear-down animation */}
          <AnimatePresence mode="wait">
            {!isTransitioning && (
              <motion.div
                className="relative z-10 h-full flex flex-col justify-between items-center p-3 sm:p-6 overflow-y-auto"
                initial={{ opacity: 1, scale: 1 }}
                exit={{
                  opacity: 0,
                  scale: 0.8,
                  y: -50,
                  filter: "blur(10px)",
                  transition: { duration: 1.2, ease: "easeInOut" },
                }}
              >
                {/* Main content section - centered */}
                <div className="flex-1 flex flex-col items-center justify-center mx-auto w-full">
                  {/* Header */}
                  <motion.div
                    className="text-center mb-2 sm:mb-4"
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.8 }}
                  >
                    {/* Enhanced Voice visualization bars with realistic patterns */}

                    {/* Voice activity indicator */}
                    <motion.div
                      className="flex justify-center items-center gap-1 sm:gap-2 mb-2 sm:mb-4"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 1.5, duration: 0.5 }}
                    >
                      <motion.div
                        className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gradient-to-r from-lime-400 to-green-400 rounded-full"
                        animate={{
                          scale: [1, 1.4, 1],
                          boxShadow: [
                            "0 0 0 0 rgba(132, 204, 22, 0.7)",
                            "0 0 0 4px rgba(132, 204, 22, 0)",
                            "0 0 0 0 rgba(132, 204, 22, 0.7)",
                          ],
                        }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                      <motion.span
                        className="text-lime-300 text-xs sm:text-sm font-medium"
                        initial={{ opacity: 1 }}
                        animate={{ opacity: 1 }}
                      >
                        Voice Assistant Ready
                      </motion.span>
                    </motion.div>

                    <motion.h1
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.6, duration: 0.6 }}
                      className="text-lg sm:text-2xl md:text-3xl font-bold text-white px-2"
                    >
                      PANDA: Personalized ADHD Neuro Diagnostic Assessment{" "}
                    </motion.h1>

                    {/* Fixed subtitle without shaking */}
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 1.2, duration: 0.6 }}
                      className="h-4 sm:h-12 flex mt-1 sm:mt-2 items-center justify-center mb-1"
                    >
                      <p className="text-sm sm:text-base md:text-lg text-gray-300 max-w-3xl mx-auto text-center leading-relaxed px-2">
                        Real-time Conversation Analysis for ADHD Detection
                        through Evidence-Based Screening helps identify
                        ADHD-related symptoms during natural interactions,
                        ensuring accurate assessments
                      </p>
                    </motion.div>
                  </motion.div>

                  {/* Features List - Therapy Session Preview */}
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8, duration: 0.5 }}
                    className="mb-2 sm:mb-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-6 max-w-4xl w-full px-2"
                  >
                    {[
                      {
                        icon: "🔍",
                        title: "ADHD Screening",
                        desc: "Evidence-based assessment through conversation",
                        color: "from-blue-600/15 to-indigo-600/15",
                        delay: 0.9,
                      },
                      {
                        icon: "👶",
                        title: "Early Detection",
                        desc: "Recognizing early signs of behavioral patterns",
                        color: "from-indigo-600/15 to-blue-700/15",
                        delay: 1.0,
                      },
                      {
                        icon: "🗣️",
                        title: "Natural Conversation",
                        desc: "Analyzing real-time conversations for behavior insights",
                        color: "from-slate-700/15 to-blue-600/15",
                        delay: 1.1,
                      },
                    ].map((feature, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: feature.delay, duration: 0.6 }}
                        whileHover={{ scale: 1.02 }}
                        className={`relative text-center p-1 sm:p-2 bg-gradient-to-br ${feature.color} backdrop-blur-sm border border-white/30 rounded-xl overflow-hidden group cursor-pointer`}
                      >
                        <div className="text-2xl sm:text-3xl mb-2 sm:mb-2">
                          {feature.icon}
                        </div>
                        <h3 className="font-bold text-white mb-1 sm:mb-2 text-xs sm:text-sm">
                          {feature.title}
                        </h3>
                        <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
                          {feature.desc}
                        </p>
                      </motion.div>
                    ))}
                  </motion.div>

                  {/* Enhanced Conversation Preview with Animated Avatars */}
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5, duration: 0.6 }}
                    className="mb-2 sm:mb-2 max-w-4xl mx-auto w-full px-2"
                  >
                    <div className="bg-white/5 backdrop-blur-xl rounded-xl p-3 sm:p-4 border border-white/20 relative overflow-hidden">
                      <div className="relative z-10">
                        <motion.h3
                          className="text-lg sm:text-xl font-bold text-white mb-3 sm:mb-6 text-center"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.7, duration: 0.6 }}
                        >
                          PANDA Assessment in Action
                        </motion.h3>

                        {/* Voice Conversation Preview */}
                        <div
                          ref={conversationRef}
                          className="h-32 sm:h-40 md:h-48 overflow-y-auto scrollbar-hide"
                        >
                          <div className="space-y-2 sm:space-y-4 pr-1 sm:pr-2 min-h-full">
                            <AnimatePresence>
                              {conversationMessages
                                .slice(0, visibleMessages)
                                .map((message, index) => (
                                  <motion.div
                                    key={index}
                                    initial={{
                                      opacity: 0,
                                      y: 20,
                                      scale: 0.95,
                                    }}
                                    animate={{
                                      opacity: 1,
                                      y: 0,
                                      scale: 1,
                                    }}
                                    transition={{
                                      duration: 0.6,
                                      delay: 0.2,
                                      type: "spring",
                                      bounce: 0.2,
                                    }}
                                    className="flex items-start gap-2 sm:gap-3"
                                  >
                                    {/* Speaker avatar - always visible for voice chat */}
                                    <motion.div
                                      className={`flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-sm sm:text-lg shadow-lg relative ${
                                        message.isUser
                                          ? "bg-gradient-to-br from-green-500 to-emerald-500"
                                          : "bg-gradient-to-br from-blue-500 to-indigo-500"
                                      }`}
                                      initial={{ scale: 0 }}
                                      animate={{ scale: 1 }}
                                      transition={{
                                        delay: 0.3,
                                        type: "spring",
                                        bounce: 0.4,
                                      }}
                                    >
                                      {message.isUser ? "👱🏻‍♂️" : "🐼"}

                                      {/* Voice indicator for current speaker */}
                                      {index === visibleMessages - 1 && (
                                        <motion.div
                                          className="absolute -bottom-0.5 -right-0.5 sm:-bottom-1 sm:-right-1 w-3 h-3 sm:w-4 sm:h-4 bg-lime-500 rounded-full border-2 border-white"
                                          animate={{
                                            scale: [1, 1.2, 1],
                                            opacity: [0.7, 1, 0.7],
                                          }}
                                          transition={{
                                            duration: 1.5,
                                            repeat: Infinity,
                                          }}
                                        >
                                          <div className="w-full h-full bg-lime-400 rounded-full animate-pulse"></div>
                                        </motion.div>
                                      )}
                                    </motion.div>

                                    {/* Voice bubble with speech-like styling */}
                                    <motion.div
                                      className="flex-1 relative"
                                      initial={{ scale: 0.8, opacity: 0 }}
                                      animate={{ scale: 1, opacity: 1 }}
                                      transition={{
                                        delay: 0.4,
                                        duration: 0.5,
                                        type: "spring",
                                      }}
                                    >
                                      {/* Speech bubble tail */}
                                      <div
                                        className={`absolute top-3 -left-2 w-0 h-0 border-t-8 border-r-8 border-b-8 border-l-0 ${
                                          message.isUser
                                            ? "border-t-transparent border-r-green-500/20 border-b-transparent"
                                            : "border-t-transparent border-r-blue-500/20 border-b-transparent"
                                        }`}
                                      ></div>

                                      <div
                                        className={`px-3 sm:px-4 py-2 sm:py-3 rounded-2xl rounded-tl-sm text-xs sm:text-sm relative ${
                                          message.isUser
                                            ? "bg-gradient-to-br from-green-600/20 to-emerald-600/20 text-green-100 border border-green-500/30"
                                            : "bg-gradient-to-br from-blue-600/20 to-indigo-600/20 text-blue-100 border border-blue-500/30"
                                        } shadow-lg backdrop-blur-sm`}
                                      >
                                        {/* Speaker label with voice icon */}
                                        <div className="flex items-center gap-1 sm:gap-2 mb-1 sm:mb-2">
                                          <span className="text-xs font-semibold opacity-90">
                                            {message.speaker}
                                          </span>
                                          <motion.div
                                            className="flex items-center gap-1"
                                            animate={
                                              index === visibleMessages - 1
                                                ? {
                                                    opacity: [0.5, 1, 0.5],
                                                  }
                                                : {}
                                            }
                                            transition={{
                                              duration: 1.5,
                                              repeat: Infinity,
                                            }}
                                          >
                                            🎙️
                                            {/* Voice wave animation for current speaker */}
                                            {index === visibleMessages - 1 && (
                                              <div className="flex items-center gap-1 ml-1">
                                                {[...Array(3)].map((_, i) => (
                                                  <motion.div
                                                    key={i}
                                                    className="w-1 bg-white/60 rounded-full"
                                                    animate={{
                                                      height: [4, 12, 4],
                                                    }}
                                                    transition={{
                                                      duration: 0.8,
                                                      repeat: Infinity,
                                                      delay: i * 0.2,
                                                    }}
                                                  />
                                                ))}
                                              </div>
                                            )}
                                          </motion.div>
                                        </div>

                                        {/* Message text with quotes for voice feel */}
                                        <div className="text-xs sm:text-sm leading-relaxed">
                                          <motion.span
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{
                                              delay: 0.6,
                                              duration: 0.8,
                                            }}
                                          >
                                            &ldquo;{message.text}&rdquo;
                                          </motion.span>
                                        </div>
                                      </div>
                                    </motion.div>
                                  </motion.div>
                                ))}
                            </AnimatePresence>
                          </div>
                        </div>

                        {/* Session indicators */}
                        <motion.div
                          className="mt-2 sm:mt-3 flex justify-center items-center gap-2 sm:gap-3 text-gray-400"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 3, duration: 0.5 }}
                        >
                          <motion.div
                            className="flex items-center gap-1"
                            animate={{ opacity: [0.5, 1, 0.5] }}
                            transition={{ duration: 2, repeat: Infinity }}
                          >
                            <div className="w-1 h-1 bg-lime-500 rounded-full"></div>
                            <span className="text-xs">Active Assessment</span>
                          </motion.div>
                          <motion.div
                            className="flex items-center gap-1"
                            animate={{ opacity: [0.5, 1, 0.5] }}
                            transition={{
                              duration: 2,
                              repeat: Infinity,
                              delay: 0.5,
                            }}
                          >
                            <div className="w-1 h-1 bg-emerald-500 rounded-full"></div>
                            <span className="text-xs hidden sm:inline">
                              Pattern Recognition
                            </span>
                            <span className="text-xs sm:hidden">Patterns</span>
                          </motion.div>
                          <motion.div
                            className="flex items-center gap-1"
                            animate={{ opacity: [0.5, 1, 0.5] }}
                            transition={{
                              duration: 2,
                              repeat: Infinity,
                              delay: 1,
                            }}
                          >
                            <div className="w-1 h-1 bg-green-500 rounded-full"></div>
                            <span className="text-xs">ADHD Screening</span>
                          </motion.div>
                        </motion.div>
                      </div>
                    </div>
                  </motion.div>
                </div>

                {/* Button at the bottom */}
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.5, duration: 0.6 }}
                  className="text-center relative mt-auto px-2"
                >
                  <motion.button
                    onClick={handleStart}
                    className="relative px-6 sm:px-8 py-2.5 sm:py-3 bg-gradient-to-r from-sky-600 to-indigo-600 text-white font-bold rounded-full shadow-2xl transition-all duration-300 text-xs sm:text-sm overflow-hidden group"
                    whileHover={{
                      scale: 1.05,
                      y: -2,
                      boxShadow: "0 20px 40px -12px rgba(59, 130, 246, 0.5)",
                    }}
                    whileTap={{ scale: 0.95 }}
                    animate={
                      isTransitioning
                        ? {
                            scale: [1, 1.1, 0.9],
                            opacity: [1, 0.8, 0],
                            transition: { duration: 1.2, ease: "easeInOut" },
                          }
                        : {}
                    }
                  >
                    <span className="relative z-10 flex items-center gap-2">
                      Begin PANDA Assessment Session
                    </span>
                  </motion.button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </AnimatePresence>
  );
};
