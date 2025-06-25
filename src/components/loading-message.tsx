"use client";

import { FC } from "react";
import { IconRobotFace } from "@tabler/icons-react";
import { motion, AnimatePresence } from "framer-motion";

interface LoadingMessageProps {
  show: boolean;
}

export const LoadingMessage: FC<LoadingMessageProps> = ({ show }) => {
  const dots = [0, 1, 2];

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="group relative border-b border-white/20 bg-gradient-to-r from-emerald-50/60 via-green-50/50 to-teal-50/40 backdrop-blur-sm px-4 py-6"
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.95 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
          <div className="mx-auto flex max-w-3xl space-x-4">
            {/* Avatar */}
            <motion.div
              className="flex-shrink-0"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{
                delay: 0.1,
                duration: 0.5,
                type: "spring",
                bounce: 0.3,
              }}
            >
              <motion.div
                className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-lg backdrop-blur-xl border border-white/30"
                animate={{
                  boxShadow: [
                    "0 4px 6px -1px rgba(16, 185, 129, 0.1)",
                    "0 10px 15px -3px rgba(16, 185, 129, 0.3)",
                    "0 4px 6px -1px rgba(16, 185, 129, 0.1)",
                  ],
                }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                >
                  <IconRobotFace size={16} />
                </motion.div>
              </motion.div>
            </motion.div>

            {/* Content */}
            <motion.div
              className="flex-1 space-y-2"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.4 }}
            >
              <div className="flex items-center space-x-3 text-sm text-gray-600">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                ></motion.div>
                <span className="font-medium">AI is thinking</span>
                <div className="flex space-x-1">
                  {dots.map((dot) => (
                    <motion.div
                      key={dot}
                      className="w-1 h-1 bg-gray-400 rounded-full"
                      animate={{
                        scale: [1, 1.5, 1],
                        opacity: [0.4, 1, 0.4],
                      }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        delay: dot * 0.2,
                        ease: "easeInOut",
                      }}
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
