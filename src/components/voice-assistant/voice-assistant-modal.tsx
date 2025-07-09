"use client";

import { FC, useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { IconX, IconMicrophone } from "@tabler/icons-react";
import { VoiceAssistantView } from "./voice-assistant-view";

interface VoiceAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const VoiceAssistantModal: FC<VoiceAssistantModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [showInterface, setShowInterface] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [visibleMessages, setVisibleMessages] = useState(0);
  const conversationRef = useRef<HTMLDivElement>(null);

  const conversationMessages = [
    {
      speaker: "Patient",
      text: "I've been feeling overwhelmed lately...",
      isUser: true,
    },
    {
      speaker: "AI Psychiatrist",
      text: "I hear you. Can you tell me more about what's contributing to this feeling?",
      isUser: false,
    },
    {
      speaker: "Patient",
      text: "It's work, deadlines, and I can't seem to focus.",
      isUser: true,
    },
    {
      speaker: "AI Psychiatrist",
      text: "Work stress can be challenging. Let's explore some mindfulness techniques that might help.",
      isUser: false,
    },
    {
      speaker: "Patient",
      text: "I'd like that. I feel like I'm losing control.",
      isUser: true,
    },
    {
      speaker: "AI Psychiatrist",
      text: "You're taking a positive step by reaching out. Let's work on this together.",
      isUser: false,
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
            setTimeout(showNextMessage, 2000); // Show next message after 2 seconds
          } else {
            // Reset after a pause to create infinite loop
            setTimeout(() => {
              currentMessage = 0;
              setVisibleMessages(0);
              setTimeout(showNextMessage, 500); // Small delay before restarting
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

  if (showInterface) {
    return <VoiceAssistantView onBack={handleBack} onClose={onClose} />;
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="h-full w-full bg-gradient-to-br from-gray-900 via-blue-900 to-slate-900 overflow-hidden relative">
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
            {/* Primary floating orbs */}
            <motion.div
              className="absolute top-20 left-20 w-96 h-96 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 rounded-full blur-3xl"
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
              className="absolute bottom-20 right-20 w-80 h-80 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 rounded-full blur-3xl"
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

            {/* Additional psychiatric-themed floating elements */}
            <motion.div
              className="absolute top-1/3 right-1/4 w-64 h-64 bg-gradient-to-r from-cyan-500/15 to-teal-500/15 rounded-full blur-2xl"
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

            {/* Brain-wave like patterns */}
            <motion.div
              className="absolute top-1/2 left-1/3 w-32 h-32 bg-gradient-to-r from-indigo-500/20 to-blue-500/20 rounded-full blur-xl"
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

            {/* Floating particles throughout */}
            {[...Array(12)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-3 h-3 bg-white/10 rounded-full blur-sm"
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
            className="absolute top-4 right-4 z-50 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-all duration-200 shadow-lg backdrop-blur-sm border border-white/20"
            onClick={onClose}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
          >
            <IconX size={18} className="text-white" />
          </motion.button>

          {/* Main Content with tear-down animation */}
          <AnimatePresence mode="wait">
            {!isTransitioning && (
              <motion.div
                className="relative z-10 h-full flex flex-col items-center justify-center p-3 overflow-y-auto"
                initial={{ opacity: 1, scale: 1 }}
                exit={{
                  opacity: 0,
                  scale: 0.8,
                  y: -50,
                  filter: "blur(10px)",
                  transition: { duration: 1.2, ease: "easeInOut" },
                }}
              >
                {/* Header */}
                <motion.div
                  className="text-center mb-4"
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.8 }}
                >
                  {/* Enhanced AI Avatar with psychiatrist theme */}
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{
                      delay: 0.4,
                      duration: 0.8,
                      type: "spring",
                      bounce: 0.3,
                    }}
                    className="relative w-28 h-28 mx-auto mb-6"
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
                      className="w-full h-full bg-gradient-to-br from-blue-500 via-indigo-600 to-slate-600 rounded-full flex items-center justify-center shadow-2xl relative overflow-hidden"
                      animate={{
                        scale: [1, 1.08, 1],
                        boxShadow: [
                          "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
                          "0 25px 50px -12px rgb(59 130 246 / 0.4), 0 25px 50px -12px rgb(99 102 241 / 0.4)",
                          "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
                        ],
                      }}
                      transition={{
                        duration: 3,
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

                      {/* Psychiatrist-themed icons - removed rotation */}
                      <motion.div className="relative z-10 flex items-center justify-center">
                        <motion.div
                          animate={{
                            scale: [1, 1.1, 1],
                            filter: [
                              "brightness(1) hue-rotate(0deg)",
                              "brightness(1.2) hue-rotate(10deg)",
                              "brightness(1) hue-rotate(0deg)",
                            ],
                          }}
                          transition={{ duration: 2, repeat: Infinity }}
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

                    {/* Enhanced pulsing rings with different speeds - updated colors */}
                    <motion.div
                      className="absolute inset-0 rounded-full border-2 border-blue-400/30"
                      animate={{
                        scale: [1, 1.3, 1],
                        opacity: [0.6, 0, 0.6],
                        rotate: [0, 180, 360],
                      }}
                      transition={{ duration: 4, repeat: Infinity }}
                    />
                    <motion.div
                      className="absolute inset-0 rounded-full border-2 border-indigo-400/30"
                      animate={{
                        scale: [1, 1.5, 1],
                        opacity: [0.4, 0, 0.4],
                        rotate: [360, 180, 0],
                      }}
                      transition={{ duration: 4, repeat: Infinity, delay: 0.5 }}
                    />
                    <motion.div
                      className="absolute inset-0 rounded-full border-2 border-slate-400/30"
                      animate={{
                        scale: [1, 1.7, 1],
                        opacity: [0.3, 0, 0.3],
                        rotate: [0, 360],
                      }}
                      transition={{ duration: 4, repeat: Infinity, delay: 1 }}
                    />
                  </motion.div>

                  {/* Enhanced Voice visualization bars with realistic patterns */}

                  {/* Voice activity indicator */}
                  <motion.div
                    className="flex justify-center items-center gap-2 mb-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.5, duration: 0.5 }}
                  >
                    <motion.div
                      className="w-2 h-2 bg-gradient-to-r from-green-400 to-emerald-400 rounded-full"
                      animate={{
                        scale: [1, 1.4, 1],
                        boxShadow: [
                          "0 0 0 0 rgba(34, 197, 94, 0.7)",
                          "0 0 0 6px rgba(34, 197, 94, 0)",
                          "0 0 0 0 rgba(34, 197, 94, 0.7)",
                        ],
                      }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                    <motion.span
                      className="text-green-300 text-xs font-medium"
                      initial={{ opacity: 1 }}
                      animate={{ opacity: 1 }}
                    >
                      AI Voice Ready
                    </motion.span>
                  </motion.div>

                  <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6, duration: 0.6 }}
                    className="text-2xl font-bold text-white mb-1"
                  >
                    AI Psychiatrist
                  </motion.h1>

                  {/* Fixed subtitle without shaking */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.2, duration: 0.6 }}
                    className="h-5 flex items-center justify-center mb-3"
                  >
                    <p className="text-base text-gray-300 max-w-2xl mx-auto">
                      I&apos;m here to listen. Let&apos;s talk about what&apos;s
                      on your mind.
                    </p>
                  </motion.div>
                </motion.div>

                {/* Features List - Therapy Session Preview */}
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8, duration: 0.5 }}
                  className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-3 max-w-3xl"
                >
                  {[
                    {
                      icon: "�",
                      title: "Active Listening",
                      desc: "Empathetic AI that truly understands",
                      color: "from-blue-500/20 to-cyan-500/20",
                      delay: 0.9,
                    },
                    {
                      icon: "🧠",
                      title: "Cognitive Support",
                      desc: "Evidence-based therapeutic techniques",
                      color: "from-indigo-500/20 to-blue-500/20",
                      delay: 1.0,
                    },
                    {
                      icon: "💭",
                      title: "Mindful Conversations",
                      desc: "Safe space for self-expression",
                      color: "from-green-500/20 to-emerald-500/20",
                      delay: 1.1,
                    },
                  ].map((feature, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: feature.delay, duration: 0.6 }}
                      whileHover={{ scale: 1.02 }}
                      className={`relative text-center p-3 bg-gradient-to-br ${feature.color} backdrop-blur-sm border border-white/30 rounded-xl overflow-hidden group cursor-pointer`}
                    >
                      <div className="text-xl mb-1">{feature.icon}</div>
                      <h3 className="font-bold text-white mb-1 text-xs">
                        {feature.title}
                      </h3>
                      <p className="text-xs text-gray-300 leading-relaxed">
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
                  className="mb-4 max-w-2xl mx-auto"
                >
                  <div className="bg-white/5 backdrop-blur-xl rounded-xl p-3 border border-white/20 relative overflow-hidden">
                    <div className="relative z-10">
                      <motion.h3
                        className="text-base font-bold text-white mb-3 text-center"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.7, duration: 0.6 }}
                      >
                        AI Psychiatrist in Action
                      </motion.h3>

                      {/* Smooth sequential conversation preview */}
                      <div
                        ref={conversationRef}
                        className="max-h-32 overflow-y-auto scrollbar-hide"
                      >
                        <div className="space-y-2 pr-1">
                          <AnimatePresence mode="wait">
                            {conversationMessages
                              .slice(0, visibleMessages)
                              .map((message, index) => (
                                <motion.div
                                  key={`${index}-${visibleMessages}`}
                                  initial={{
                                    opacity: 0,
                                    x: message.isUser ? -30 : 30,
                                    y: 20,
                                  }}
                                  animate={{ opacity: 1, x: 0, y: 0 }}
                                  exit={{
                                    opacity: 0,
                                    scale: 0.9,
                                    transition: { duration: 0.3 },
                                  }}
                                  transition={{
                                    duration: 0.8,
                                    delay: 0.3,
                                    type: "spring",
                                    bounce: 0.3,
                                  }}
                                  className={`flex items-start gap-2 ${message.isUser ? "justify-start" : "justify-end"}`}
                                >
                                  {" "}
                                  {/* User avatar */}
                                  {message.isUser && (
                                    <motion.div
                                      className="flex-shrink-0 w-6 h-6 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-xs shadow-lg"
                                      initial={{ scale: 0 }}
                                      animate={{ scale: 1 }}
                                      transition={{
                                        delay: 0.5,
                                        type: "spring",
                                        bounce: 0.4,
                                      }}
                                    >
                                      😟
                                    </motion.div>
                                  )}
                                  <motion.div
                                    className={`max-w-xs px-2 py-1 rounded-lg text-xs relative ${
                                      message.isUser
                                        ? "bg-gradient-to-br from-blue-600/30 to-cyan-600/30 text-blue-100"
                                        : "bg-gradient-to-br from-indigo-600/30 to-blue-600/30 text-blue-100"
                                    } border border-white/20 shadow-lg`}
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{
                                      delay: 0.4,
                                      duration: 0.5,
                                      type: "spring",
                                    }}
                                    whileHover={{ scale: 1.02 }}
                                  >
                                    {/* Speaking animation indicator */}
                                    <motion.div
                                      className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-green-500 rounded-full"
                                      initial={{ scale: 0 }}
                                      animate={{
                                        scale: [0, 1, 1.2, 1],
                                        opacity: [0, 0.7, 1, 0.7],
                                      }}
                                      transition={{
                                        duration: 2,
                                        repeat: Infinity,
                                        delay: 0.6,
                                      }}
                                    />

                                    <div className="text-xs font-semibold mb-0.5 opacity-80 flex items-center gap-1">
                                      <motion.span
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 0.7 }}
                                      >
                                        {message.speaker}
                                      </motion.span>
                                      {/* Voice wave animation */}
                                      <div className="flex items-center gap-px">
                                        {[...Array(3)].map((_, i) => (
                                          <motion.div
                                            key={i}
                                            className="w-0.5 h-0.5 bg-current rounded-full"
                                            initial={{ scale: 0 }}
                                            animate={{
                                              scale: [0, 1, 1.5, 1],
                                              opacity: [0, 0.5, 1, 0.5],
                                            }}
                                            transition={{
                                              duration: 1.5,
                                              repeat: Infinity,
                                              delay: 0.8 + i * 0.1,
                                            }}
                                          />
                                        ))}
                                      </div>
                                    </div>

                                    <motion.div
                                      className="text-xs"
                                      initial={{ opacity: 0 }}
                                      animate={{ opacity: 1 }}
                                      transition={{ delay: 0.9, duration: 0.6 }}
                                    >
                                      {message.text}
                                    </motion.div>

                                    {/* Subtle glow effect */}
                                    <motion.div
                                      className="absolute inset-0 rounded-lg bg-gradient-to-br from-white/5 to-transparent"
                                      initial={{ opacity: 0 }}
                                      animate={{ opacity: [0, 0.3, 0] }}
                                      transition={{
                                        duration: 3,
                                        repeat: Infinity,
                                        delay: 1.2,
                                      }}
                                    />
                                  </motion.div>
                                  {/* AI avatar */}
                                  {!message.isUser && (
                                    <motion.div
                                      className="flex-shrink-0 w-6 h-6 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-xs shadow-lg"
                                      initial={{ scale: 0 }}
                                      animate={{ scale: 1 }}
                                      transition={{
                                        delay: 0.5,
                                        type: "spring",
                                        bounce: 0.4,
                                      }}
                                    >
                                      🤖
                                    </motion.div>
                                  )}
                                </motion.div>
                              ))}
                          </AnimatePresence>
                        </div>
                      </div>

                      {/* Session indicators */}
                      <motion.div
                        className="mt-3 flex justify-center items-center gap-3 text-gray-400"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 3, duration: 0.5 }}
                      >
                        <motion.div
                          className="flex items-center gap-1"
                          animate={{ opacity: [0.5, 1, 0.5] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        >
                          <div className="w-1 h-1 bg-green-500 rounded-full"></div>
                          <span className="text-xs">Active Listening</span>
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
                          <div className="w-1 h-1 bg-blue-500 rounded-full"></div>
                          <span className="text-xs">Empathy Mode</span>
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
                          <div className="w-1 h-1 bg-blue-500 rounded-full"></div>
                          <span className="text-xs">Therapeutic Guidance</span>
                        </motion.div>
                      </motion.div>
                    </div>
                  </div>
                </motion.div>

                {/* Enhanced Start Button */}
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.5, duration: 0.6 }}
                  className="text-center relative"
                >
                  <motion.button
                    onClick={handleStart}
                    className="relative px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-full shadow-2xl transition-all duration-300 text-sm overflow-hidden group"
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
                      🎤 Begin Your Session
                    </span>
                  </motion.button>

                  <motion.p
                    className="mt-2 text-gray-400 text-xs"
                    initial={{ opacity: 1 }}
                    animate={{ opacity: 1 }}
                  >
                    Click to start your therapeutic conversation
                  </motion.p>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </AnimatePresence>
  );
};
