"use client";

import { FC } from "react";
import {
  IconKey,
  IconBrandOpenai,
  IconExternalLink,
} from "@tabler/icons-react";
import { motion, AnimatePresence } from "framer-motion";

interface SetupInstructionsProps {
  show: boolean;
}

export const SetupInstructions: FC<SetupInstructionsProps> = ({ show }) => {
  const steps = [
    {
      number: "1",
      content: (
        <span>
          Get your API key from{" "}
          <motion.a
            href="https://openrouter.ai/keys"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 underline inline-flex items-center gap-1 hover:text-blue-700 transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            OpenRouter
            <IconExternalLink size={12} />
          </motion.a>
        </span>
      ),
    },
    {
      number: "2",
      content: (
        <span>
          Update{" "}
          <motion.code
            className="bg-gradient-to-r from-yellow-100 to-orange-100 px-2 py-1 rounded font-mono text-xs border border-yellow-200"
            whileHover={{ scale: 1.05 }}
          >
            .env.local
          </motion.code>{" "}
          with your key
        </span>
      ),
    },
    {
      number: "3",
      content: "Restart the development server",
    },
  ];

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="mx-auto max-w-md rounded-xl border border-yellow-200/50 bg-gradient-to-br from-yellow-50/90 to-orange-50/90 backdrop-blur-xl p-6 text-sm shadow-lg"
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          <motion.div
            className="flex items-center space-x-3 mb-4"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.3 }}
          >
            <motion.div
              className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 text-white shadow-lg"
              whileHover={{ scale: 1.1, rotate: 5 }}
              animate={{
                boxShadow: [
                  "0 4px 6px -1px rgba(245, 158, 11, 0.1)",
                  "0 10px 15px -3px rgba(245, 158, 11, 0.3)",
                  "0 4px 6px -1px rgba(245, 158, 11, 0.1)",
                ],
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <IconKey className="h-5 w-5" />
            </motion.div>
            <div>
              <motion.h3
                className="font-semibold text-yellow-800 text-lg"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.3 }}
              >
                Setup Required
              </motion.h3>
              <motion.p
                className="text-yellow-600 text-xs"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.3 }}
              >
                Almost there! Just need your API key
              </motion.p>
            </div>
          </motion.div>

          <motion.p
            className="text-yellow-700 mb-4 leading-relaxed"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.3 }}
          >
            To enable AI responses, please add your OpenRouter API key to the
            environment variables.
          </motion.p>

          <motion.div
            className="space-y-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.4 }}
          >
            {steps.map((step, index) => (
              <motion.div
                key={step.number}
                className="flex items-start space-x-3 p-3 rounded-lg bg-white/50 backdrop-blur-sm border border-white/30"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 + index * 0.1, duration: 0.3 }}
                whileHover={{
                  scale: 1.02,
                  backgroundColor: "rgba(255, 255, 255, 0.7)",
                  transition: { duration: 0.2 },
                }}
              >
                <motion.span
                  className="flex items-center justify-center w-6 h-6 font-mono bg-gradient-to-br from-yellow-400 to-orange-500 text-white text-xs rounded-full font-bold shadow-sm"
                  whileHover={{ scale: 1.1, rotate: 5 }}
                >
                  {step.number}
                </motion.span>
                <span className="text-yellow-800 flex-1 leading-relaxed">
                  {step.content}
                </span>
              </motion.div>
            ))}
          </motion.div>

          <motion.div
            className="mt-4 pt-4 border-t border-yellow-200/50"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.0, duration: 0.3 }}
          >
            <div className="flex items-center space-x-2 text-xs text-yellow-600">
              <IconBrandOpenai size={14} />
              <span>Powered by OpenRouter - Access to multiple AI models</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
