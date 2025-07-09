"use client";

import { FC, useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { IconX, IconMicrophone, IconArrowLeft } from "@tabler/icons-react";

interface VoiceAssistantInterfaceProps {
  isOpen: boolean;
  onClose: () => void;
  onBack: () => void;
}

export const VoiceAssistantInterface: FC<VoiceAssistantInterfaceProps> = ({
  isOpen,
  onClose,
  onBack,
}) => {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [response, setResponse] = useState("");
  const recognitionRef = useRef<any>(null); // eslint-disable-line @typescript-eslint/no-explicit-any

  // Initialize speech recognition
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      ("webkitSpeechRecognition" in window || "SpeechRecognition" in window)
    ) {
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();

      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      recognition.onresult = (event) => {
        let finalTranscript = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        if (finalTranscript) {
          setTranscript(finalTranscript);
          processVoiceCommand(finalTranscript);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const startListening = () => {
    if (recognitionRef.current) {
      setIsListening(true);
      setTranscript("");
      setResponse("");
      recognitionRef.current.start();
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  const processVoiceCommand = async (command: string) => {
    setIsProcessing(true);

    // Simulate AI processing
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Psychiatrist-themed responses
    let aiResponse =
      "I'm here to listen. Could you tell me more about what's on your mind?";

    const lowerCommand = command.toLowerCase();
    if (lowerCommand.includes("hello") || lowerCommand.includes("hi")) {
      aiResponse =
        "Hello there. I'm glad you're here. How are you feeling today?";
    } else if (
      lowerCommand.includes("anxious") ||
      lowerCommand.includes("anxiety")
    ) {
      aiResponse =
        "I hear that you're feeling anxious. That's completely understandable. Can you tell me what's been triggering these feelings?";
    } else if (
      lowerCommand.includes("sad") ||
      lowerCommand.includes("depressed")
    ) {
      aiResponse =
        "I'm sorry you're going through a difficult time. Your feelings are valid. Would you like to talk about what's been making you feel this way?";
    } else if (
      lowerCommand.includes("stress") ||
      lowerCommand.includes("stressed")
    ) {
      aiResponse =
        "Stress can be overwhelming. Let's explore what's been causing you stress and some ways we might be able to manage it together.";
    } else if (lowerCommand.includes("overwhelmed")) {
      aiResponse =
        "Feeling overwhelmed is a very human experience. Let's take a moment to breathe together and break down what's contributing to these feelings.";
    } else if (lowerCommand.includes("work") || lowerCommand.includes("job")) {
      aiResponse =
        "Work-related challenges can significantly impact our wellbeing. Tell me more about what's happening at work that's affecting you.";
    } else if (
      lowerCommand.includes("relationship") ||
      lowerCommand.includes("family")
    ) {
      aiResponse =
        "Relationships can be complex and sometimes challenging. I'm here to listen without judgment. What's been on your mind about your relationships?";
    } else if (
      lowerCommand.includes("sleep") ||
      lowerCommand.includes("tired")
    ) {
      aiResponse =
        "Sleep difficulties often reflect what we're processing emotionally. How has your sleep been affected, and what might be keeping you up?";
    } else if (
      lowerCommand.includes("help") ||
      lowerCommand.includes("support")
    ) {
      aiResponse =
        "I'm here to support you. Remember, seeking help is a sign of strength, not weakness. What kind of support are you looking for today?";
    } else if (
      lowerCommand.includes("better") ||
      lowerCommand.includes("improve")
    ) {
      aiResponse =
        "It's wonderful that you're looking for ways to feel better. That takes courage. Let's explore some strategies that might help you on your journey.";
    } else if (
      lowerCommand.includes("thank") ||
      lowerCommand.includes("thanks")
    ) {
      aiResponse =
        "You're very welcome. I'm honored that you're sharing with me. How else can I support you today?";
    } else if (lowerCommand.includes("time")) {
      aiResponse = `It's ${new Date().toLocaleTimeString()}. How are you using your time for self-care today?`;
    } else if (lowerCommand.includes("date")) {
      aiResponse = `Today is ${new Date().toDateString()}. What are you hoping to accomplish for yourself today?`;
    } else {
      const empathicResponses = [
        "I'm listening. Please take your time to share what's important to you.",
        "Your feelings matter. Can you help me understand what you're experiencing?",
        "I want to understand your perspective better. Could you elaborate on that?",
        "That sounds significant. How is this affecting your daily life?",
        "I appreciate you sharing that with me. What would you like to explore further?",
      ];
      aiResponse =
        empathicResponses[Math.floor(Math.random() * empathicResponses.length)];
    }

    setResponse(aiResponse);
    setIsProcessing(false);

    // Speak the response with a calming voice
    if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(aiResponse);
      utterance.rate = 0.8; // Slower, more therapeutic pace
      utterance.pitch = 0.9; // Slightly lower, more calming
      utterance.volume = 0.8;

      // Try to use a more pleasant voice if available
      const voices = speechSynthesis.getVoices();
      const preferredVoice = voices.find(
        (voice) =>
          voice.name.includes("Google") ||
          voice.name.includes("Microsoft") ||
          voice.name.includes("Samantha") ||
          voice.lang.includes("en-US")
      );
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }

      speechSynthesis.speak(utterance);
    }
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-gradient-to-br from-gray-900 via-purple-900 to-black overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            zIndex: 9999,
          }}
        >
          {/* Animated Background Elements */}
          <div className="absolute inset-0 overflow-hidden">
            <motion.div
              className="absolute top-20 left-20 w-96 h-96 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-full blur-3xl"
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
              className="absolute bottom-20 right-20 w-80 h-80 bg-gradient-to-r from-pink-500/10 to-orange-500/10 rounded-full blur-3xl"
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
          </div>
          <motion.div
            className="relative w-full max-w-2xl mx-4 bg-gradient-to-br from-gray-900 to-black rounded-3xl shadow-2xl overflow-hidden"
            initial={{ scale: 0.8, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 50 }}
            transition={{ duration: 0.4, type: "spring", bounce: 0.2 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-800/50 backdrop-blur-sm">
              <motion.button
                onClick={onBack}
                className="w-12 h-12 bg-gradient-to-br from-gray-800 to-gray-900 hover:from-gray-700 hover:to-gray-800 rounded-full flex items-center justify-center transition-all duration-200 shadow-lg border border-gray-700"
                whileHover={{
                  scale: 1.1,
                  boxShadow: "0 8px 25px rgba(0,0,0,0.3)",
                }}
                whileTap={{ scale: 0.9 }}
              >
                <IconArrowLeft size={20} className="text-white" />
              </motion.button>

              <motion.div
                className="text-center"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <h2 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  AI Psychiatrist
                </h2>
                <p className="text-gray-400 text-sm mt-1">
                  Therapeutic Voice Assistant
                </p>
              </motion.div>

              <motion.button
                onClick={onClose}
                className="w-12 h-12 bg-gradient-to-br from-gray-800 to-gray-900 hover:from-gray-700 hover:to-gray-800 rounded-full flex items-center justify-center transition-all duration-200 shadow-lg border border-gray-700"
                whileHover={{
                  scale: 1.1,
                  boxShadow: "0 8px 25px rgba(0,0,0,0.3)",
                }}
                whileTap={{ scale: 0.9 }}
              >
                <IconX size={20} className="text-white" />
              </motion.button>
            </div>

            {/* Enhanced Main Interface */}
            <div className="p-8 text-center">
              {/* Enhanced Siri-like Visualization */}
              <div className="relative mb-12">
                <motion.div
                  className="w-40 h-40 mx-auto rounded-full bg-gradient-to-br from-blue-500 via-purple-600 to-pink-600 flex items-center justify-center shadow-2xl relative overflow-hidden"
                  animate={
                    isListening
                      ? {
                          scale: [1, 1.15, 1],
                          boxShadow: [
                            "0 20px 25px -5px rgba(0,0,0,0.1)",
                            "0 25px 50px -12px rgba(59,130,246,0.4)",
                            "0 20px 25px -5px rgba(0,0,0,0.1)",
                          ],
                        }
                      : isProcessing
                        ? {
                            rotate: [0, 360],
                            scale: [1, 1.05, 1],
                          }
                        : {
                            scale: [1, 1.02, 1],
                            boxShadow: [
                              "0 20px 25px -5px rgba(0,0,0,0.1)",
                              "0 25px 50px -12px rgba(147,51,234,0.2)",
                              "0 20px 25px -5px rgba(0,0,0,0.1)",
                            ],
                          }
                  }
                  transition={{
                    duration: isListening ? 1.5 : isProcessing ? 2 : 3,
                    repeat: isListening || isProcessing ? Infinity : Infinity,
                    ease: "easeInOut",
                  }}
                >
                  {/* Inner glow effect */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-full"
                    animate={{
                      opacity: [0.3, 0.6, 0.3],
                      rotate: [0, 360],
                    }}
                    transition={{
                      duration: 8,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                  />

                  {/* Psychiatrist-themed icon */}
                  <motion.div
                    className="relative z-10"
                    animate={
                      isListening
                        ? { scale: [1, 1.1, 1] }
                        : isProcessing
                          ? { rotate: [0, 15, -15, 0] }
                          : { scale: [1, 1.05, 1] }
                    }
                    transition={{
                      duration: isListening ? 1 : isProcessing ? 1.5 : 2,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  >
                    <IconMicrophone size={56} className="text-white" />
                  </motion.div>
                </motion.div>

                {/* Enhanced animated rings */}
                {isListening && (
                  <>
                    <motion.div
                      className="absolute inset-0 rounded-full border-4 border-blue-400/40"
                      animate={{
                        scale: [1, 1.6, 1],
                        opacity: [0.6, 0, 0.6],
                        rotate: [0, 360],
                      }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                    <motion.div
                      className="absolute inset-0 rounded-full border-4 border-purple-400/40"
                      animate={{
                        scale: [1, 1.9, 1],
                        opacity: [0.5, 0, 0.5],
                        rotate: [360, 0],
                      }}
                      transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}
                    />
                    <motion.div
                      className="absolute inset-0 rounded-full border-4 border-pink-400/40"
                      animate={{
                        scale: [1, 2.3, 1],
                        opacity: [0.4, 0, 0.4],
                        rotate: [0, 360],
                      }}
                      transition={{ duration: 2, repeat: Infinity, delay: 0.6 }}
                    />
                  </>
                )}

                {/* Enhanced audio bars animation */}
                {isListening && (
                  <div className="absolute -bottom-20 left-1/2 transform -translate-x-1/2 flex space-x-1">
                    {[...Array(15)].map((_, i) => {
                      const isCenter = i >= 6 && i <= 8;
                      const distance = Math.abs(i - 7);
                      const baseHeight = isCenter
                        ? 12
                        : Math.max(4, 10 - distance);
                      const maxHeight = isCenter
                        ? 36
                        : Math.max(8, 28 - distance * 2);

                      return (
                        <motion.div
                          key={i}
                          className={`w-1 bg-gradient-to-t rounded-full ${
                            isCenter
                              ? "from-blue-400 via-purple-400 to-pink-400"
                              : "from-blue-300 via-purple-300 to-pink-300"
                          } shadow-lg`}
                          animate={{
                            height: [baseHeight, maxHeight, baseHeight],
                            opacity: [0.4, 1, 0.4],
                            boxShadow: [
                              "0 0 0 rgba(147, 51, 234, 0)",
                              `0 0 ${isCenter ? 6 : 3}px rgba(147, 51, 234, 0.6)`,
                              "0 0 0 rgba(147, 51, 234, 0)",
                            ],
                          }}
                          transition={{
                            duration: 1 + Math.random() * 0.5,
                            repeat: Infinity,
                            delay: i * 0.05 + Math.random() * 0.1,
                            ease: "easeInOut",
                          }}
                        />
                      );
                    })}
                  </div>
                )}

                {/* Floating therapy symbols */}
                {!isListening && !isProcessing && (
                  <>
                    {[
                      { symbol: "🧠", x: -60, y: -30, delay: 0 },
                      { symbol: "💭", x: 60, y: -30, delay: 0.5 },
                      { symbol: "🤍", x: -60, y: 30, delay: 1 },
                      { symbol: "🌟", x: 60, y: 30, delay: 1.5 },
                    ].map((item, i) => (
                      <motion.div
                        key={i}
                        className="absolute text-2xl"
                        style={{
                          left: `calc(50% + ${item.x}px)`,
                          top: `calc(50% + ${item.y}px)`,
                          transform: "translate(-50%, -50%)",
                        }}
                        animate={{
                          y: [0, -8, 0],
                          rotate: [0, 10, -10, 0],
                          scale: [1, 1.1, 1],
                          opacity: [0.6, 1, 0.6],
                        }}
                        transition={{
                          duration: 3 + i * 0.3,
                          repeat: Infinity,
                          delay: item.delay,
                          ease: "easeInOut",
                        }}
                      >
                        {item.symbol}
                      </motion.div>
                    ))}
                  </>
                )}
              </div>

              {/* Enhanced Status Text */}
              <div className="mb-10 min-h-[80px] flex flex-col items-center justify-center">
                <motion.div
                  className="text-center"
                  key={
                    isListening
                      ? "listening"
                      : isProcessing
                        ? "processing"
                        : "ready"
                  }
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.4 }}
                >
                  <p className="text-white text-xl font-medium mb-2">
                    {isListening
                      ? "I'm listening to you..."
                      : isProcessing
                        ? "Processing your thoughts..."
                        : "I'm here to listen"}
                  </p>
                  <p className="text-gray-400 text-sm">
                    {isListening
                      ? "Take your time, I'm here for you"
                      : isProcessing
                        ? "Preparing my response with care"
                        : "Tap the microphone to begin our conversation"}
                  </p>
                </motion.div>

                {/* Therapy session indicator */}
                {!isListening && !isProcessing && (
                  <motion.div
                    className="mt-4 flex items-center gap-2 text-emerald-400"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                  >
                    <motion.div
                      className="w-2 h-2 bg-emerald-400 rounded-full"
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                    <span className="text-sm">Therapeutic session active</span>
                  </motion.div>
                )}
              </div>

              {/* Enhanced Transcript */}
              {transcript && (
                <motion.div
                  className="mb-6 p-6 bg-gradient-to-br from-gray-800/80 to-gray-900/80 rounded-3xl border border-gray-700/50 shadow-xl backdrop-blur-sm"
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.4, type: "spring" }}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <motion.div
                      className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center"
                      animate={{ rotate: [0, 360] }}
                      transition={{
                        duration: 20,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                    >
                      <span className="text-white text-sm">👤</span>
                    </motion.div>
                    <p className="text-blue-300 text-sm font-medium">
                      You shared:
                    </p>
                  </div>
                  <p className="text-white text-lg leading-relaxed">
                    {transcript}
                  </p>
                </motion.div>
              )}

              {/* Enhanced Response */}
              {response && (
                <motion.div
                  className="mb-6 p-6 bg-gradient-to-br from-purple-900/40 to-pink-900/40 rounded-3xl border border-purple-500/30 shadow-xl backdrop-blur-sm relative overflow-hidden"
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.4, type: "spring", delay: 0.2 }}
                >
                  {/* Subtle animated background */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5"
                    animate={{
                      background: [
                        "linear-gradient(to bottom right, rgba(147, 51, 234, 0.05), rgba(236, 72, 153, 0.05))",
                        "linear-gradient(to bottom right, rgba(236, 72, 153, 0.05), rgba(147, 51, 234, 0.05))",
                      ],
                    }}
                    transition={{ duration: 4, repeat: Infinity }}
                  />

                  <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-4">
                      <motion.div
                        className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center"
                        animate={{
                          scale: [1, 1.1, 1],
                          boxShadow: [
                            "0 0 0 0 rgba(147, 51, 234, 0.4)",
                            "0 0 0 8px rgba(147, 51, 234, 0)",
                            "0 0 0 0 rgba(147, 51, 234, 0.4)",
                          ],
                        }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        <span className="text-white text-sm">🤖</span>
                      </motion.div>
                      <p className="text-purple-300 text-sm font-medium">
                        AI Psychiatrist responds:
                      </p>
                    </div>
                    <p className="text-white text-lg leading-relaxed">
                      {response}
                    </p>
                  </div>
                </motion.div>
              )}

              {/* Enhanced Control Button */}
              <motion.button
                onClick={toggleListening}
                className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 relative overflow-hidden ${
                  isListening
                    ? "bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700"
                    : "bg-gradient-to-br from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                } shadow-2xl`}
                whileHover={{ scale: 1.1, y: -2 }}
                whileTap={{ scale: 0.9 }}
                disabled={isProcessing}
                animate={
                  isListening
                    ? {
                        boxShadow: [
                          "0 10px 25px -5px rgba(239, 68, 68, 0.4)",
                          "0 25px 50px -12px rgba(239, 68, 68, 0.6)",
                          "0 10px 25px -5px rgba(239, 68, 68, 0.4)",
                        ],
                      }
                    : {
                        boxShadow: [
                          "0 10px 25px -5px rgba(59, 130, 246, 0.4)",
                          "0 25px 50px -12px rgba(147, 51, 234, 0.6)",
                          "0 10px 25px -5px rgba(59, 130, 246, 0.4)",
                        ],
                      }
                }
                transition={{ duration: 2, repeat: Infinity }}
              >
                {/* Glowing effect */}
                <motion.div
                  className="absolute inset-0 bg-white/10 rounded-full"
                  animate={{ opacity: [0.2, 0.5, 0.2] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />

                <motion.div
                  className="relative z-10"
                  animate={
                    isListening
                      ? { scale: [1, 1.2, 1], rotate: [0, 360] }
                      : { scale: [1, 1.05, 1] }
                  }
                  transition={{
                    duration: isListening ? 1 : 3,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                >
                  <IconMicrophone size={32} className="text-white" />
                </motion.div>
              </motion.button>

              <motion.p
                className="text-gray-400 text-sm mt-6 font-medium"
                animate={{ opacity: [0.7, 1, 0.7] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                {isListening
                  ? "Tap to stop listening"
                  : isProcessing
                    ? "Processing your message..."
                    : "Tap to start our conversation"}
              </motion.p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};
