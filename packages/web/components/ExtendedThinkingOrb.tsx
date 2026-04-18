'use client';

/**
 * ExtendedThinkingOrb — inline toggle for Opus extended thinking.
 * Lives adjacent to the methodology orbs in MethodologyFrame.
 * ON: streams live Opus reasoning into InlineDialogue during generation.
 */

import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { useSettingsStore } from '@/lib/stores/settings-store';

export default function ExtendedThinkingOrb() {
  const extendedThinking = useSettingsStore((s) => s.settings.extendedThinking);
  const setExtendedThinking = useSettingsStore((s) => s.setExtendedThinking);
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className="relative"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <motion.button
        onClick={() => setExtendedThinking(!extendedThinking)}
        className="w-2 h-2 rounded-full transition-all duration-200"
        style={{
          backgroundColor: extendedThinking ? '#6366F1' : '#6b7280',
          boxShadow: extendedThinking ? '0 0 8px rgba(99, 102, 241, 0.4)' : 'none',
          opacity: extendedThinking ? 1 : 0.5,
        }}
        whileHover={{ scale: 1.4 }}
        whileTap={{ scale: 0.9 }}
      />

      <AnimatePresence>
        {hovered && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 whitespace-nowrap pointer-events-none"
          >
            <div className="flex flex-col items-center">
              <span
                className="text-[10px] font-medium"
                style={{ color: extendedThinking ? '#6366F1' : '#6b7280' }}
              >
                Extended Thinking
              </span>
              <span
                className="text-[8px] font-mono opacity-60"
                style={{ color: extendedThinking ? '#6366F1' : '#6b7280' }}
              >
                ◈ stream Opus reasoning live
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
