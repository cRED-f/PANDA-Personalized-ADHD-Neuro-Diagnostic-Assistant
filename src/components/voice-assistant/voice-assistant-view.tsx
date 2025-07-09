"use client";

import { FC, useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { IconMicrophone, IconX, IconArrowLeft } from "@tabler/icons-react";

interface VoiceAssistantViewProps {
  onBack?: () => void;
  onClose?: () => void;
}

export const VoiceAssistantView: FC<VoiceAssistantViewProps> = ({
  onBack,
  onClose,
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

    // Simple response logic
    let aiResponse = "I'm sorry, I didn't understand that. Please try again.";

    const lowerCommand = command.toLowerCase();
    if (lowerCommand.includes("hello") || lowerCommand.includes("hi")) {
      aiResponse = "Hello! How can I help you today?";
    } else if (lowerCommand.includes("weather")) {
      aiResponse =
        "I can help you with weather information, but I need access to weather services.";
    } else if (lowerCommand.includes("time")) {
      aiResponse = `The current time is ${new Date().toLocaleTimeString()}.`;
    } else if (lowerCommand.includes("date")) {
      aiResponse = `Today is ${new Date().toDateString()}.`;
    } else if (lowerCommand.includes("help")) {
      aiResponse =
        "I'm your voice assistant. You can ask me about time, date, or just have a conversation!";
    }

    setResponse(aiResponse);
    setIsProcessing(false);

    // Speak the response
    if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(aiResponse);
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.volume = 0.8;
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

  return (
    <div className="h-full bg-gradient-to-br from-gray-900 via-purple-900 to-black overflow-hidden relative">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute top-20 left-20 w-96 h-96 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full blur-3xl"
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
          className="absolute bottom-20 right-20 w-80 h-80 bg-gradient-to-r from-pink-500/20 to-orange-500/20 rounded-full blur-3xl"
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

      {/* Main Content */}
      <div className="relative z-10 h-full flex flex-col items-center justify-center p-8">
        {/* Header */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <motion.h1
            className="text-6xl font-bold text-white mb-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            Voice Assistant
          </motion.h1>
          <motion.p
            className="text-xl text-gray-300 max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
          >
            Speak naturally and get intelligent AI responses
          </motion.p>
        </motion.div>

        {/* Siri-like Visualization */}
        <motion.div
          className="relative mb-12"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6, duration: 0.8 }}
        >
          <motion.div
            className="w-48 h-48 mx-auto rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-2xl"
            animate={
              isListening
                ? { scale: [1, 1.1, 1] }
                : isProcessing
                  ? { rotate: [0, 360] }
                  : { scale: 1 }
            }
            transition={{
              duration: isListening ? 1.5 : isProcessing ? 2 : 0.3,
              repeat: isListening || isProcessing ? Infinity : 0,
              ease: "easeInOut",
            }}
          >
            <IconMicrophone size={64} className="text-white" />
          </motion.div>

          {/* Animated Rings */}
          {isListening && (
            <>
              <motion.div
                className="absolute inset-0 rounded-full border-4 border-blue-400/30"
                animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <motion.div
                className="absolute inset-0 rounded-full border-4 border-purple-400/30"
                animate={{ scale: [1, 1.8, 1], opacity: [0.5, 0, 0.5] }}
                transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}
              />
              <motion.div
                className="absolute inset-0 rounded-full border-4 border-pink-400/30"
                animate={{ scale: [1, 2.2, 1], opacity: [0.5, 0, 0.5] }}
                transition={{ duration: 2, repeat: Infinity, delay: 0.6 }}
              />
            </>
          )}

          {/* Audio Bars Animation */}
          {isListening && (
            <div className="absolute -bottom-20 left-1/2 transform -translate-x-1/2 flex space-x-2">
              {[...Array(9)].map((_, i) => (
                <motion.div
                  key={i}
                  className="w-3 bg-gradient-to-t from-blue-500 to-purple-500 rounded-full"
                  animate={{
                    height: [12, 48, 12],
                    opacity: [0.3, 1, 0.3],
                  }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    delay: i * 0.1,
                  }}
                />
              ))}
            </div>
          )}
        </motion.div>

        {/* Status Text */}
        <motion.div
          className="mb-8 min-h-[80px] flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.6 }}
        >
          <motion.p
            className="text-white text-2xl font-medium"
            key={
              isListening ? "listening" : isProcessing ? "processing" : "ready"
            }
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            {isListening
              ? "I'm listening..."
              : isProcessing
                ? "Processing your request..."
                : "Click to speak"}
          </motion.p>
        </motion.div>

        {/* Transcript */}
        <AnimatePresence>
          {transcript && (
            <motion.div
              className="mb-6 p-6 bg-gray-800/50 rounded-3xl backdrop-blur-sm max-w-2xl w-full"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <p className="text-gray-300 text-sm mb-2">You said:</p>
              <p className="text-white text-lg">{transcript}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Response */}
        <AnimatePresence>
          {response && (
            <motion.div
              className="mb-8 p-6 bg-gradient-to-r from-blue-900/50 to-purple-900/50 rounded-3xl border border-blue-500/30 backdrop-blur-sm max-w-2xl w-full"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <p className="text-blue-300 text-sm mb-2">Assistant:</p>
              <p className="text-white text-lg">{response}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Control Button */}
        <motion.button
          onClick={toggleListening}
          className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 text-white font-medium shadow-2xl ${
            isListening
              ? "bg-red-600 hover:bg-red-700"
              : "bg-blue-600 hover:bg-blue-700"
          }`}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          disabled={isProcessing}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.6 }}
        >
          <IconMicrophone size={32} />
        </motion.button>

        <motion.p
          className="text-gray-400 text-lg mt-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.6 }}
        >
          {isListening ? "Click to stop" : "Click to start speaking"}
        </motion.p>
      </div>
    </div>
  );
};
