'use client'

/**
 * Sefirah Configuration Popup
 *
 * Small popup modal for configuring individual Sefirah weight.
 * Displays slider + number input for precise control.
 * Saves to Zustand store for persistence across components.
 */

import { motion, AnimatePresence } from 'framer-motion'
import { useSefirotStore } from '@/lib/stores/sefirot-store'
import { SEPHIROTH_METADATA, Sefirah } from '@/lib/ascent-tracker'
import { useState, useEffect } from 'react'

interface SefirahConfigPopupProps {
  sefirahLevel: number | null
  isOpen: boolean
  onClose: () => void
}

export function SefirahConfigPopup({
  sefirahLevel,
  isOpen,
  onClose
}: SefirahConfigPopupProps) {
  const { weights, setWeight } = useSefirotStore()
  const [tempValue, setTempValue] = useState(50)

  // Load current weight when popup opens
  useEffect(() => {
    if (sefirahLevel && weights[sefirahLevel] !== undefined) {
      setTempValue(Math.round(weights[sefirahLevel] * 100))
    }
  }, [sefirahLevel, weights])

  if (!sefirahLevel) return null
  const meta = SEPHIROTH_METADATA[sefirahLevel as Sefirah]
  if (!meta) return null

  const handleSave = () => {
    setWeight(sefirahLevel, tempValue / 100)
    onClose()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-[60]"
            onClick={onClose}
          />

          {/* Popup */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[70] bg-white dark:bg-[#0a0a0a] border border-slate-200 dark:border-[#3a3a3a] rounded-lg p-6 w-96"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="mb-4">
              <h3 className="text-lg font-mono font-semibold text-slate-900 dark:text-[#e0e0e0]">
                {meta.name}
              </h3>
              <p className="text-sm font-mono text-slate-600 dark:text-[#999]">
                {meta.aiRole.split('•')[0].trim()}
              </p>
            </div>

            {/* Slider */}
            <div className="mb-6">
              <label className="block text-xs font-mono text-slate-600 dark:text-[#999] mb-2">
                Configuration Weight
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={tempValue}
                onChange={(e) => setTempValue(parseInt(e.target.value))}
                className="w-full h-2 bg-slate-50 dark:bg-[#1a1a1a] rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs font-mono text-slate-400 dark:text-[#666] mt-1">
                <span>0%</span>
                <span className="text-slate-900 dark:text-[#e0e0e0] font-semibold">{tempValue}%</span>
                <span>100%</span>
              </div>
            </div>

            {/* Number Input */}
            <div className="mb-6">
              <input
                type="number"
                min="0"
                max="100"
                value={tempValue}
                onChange={(e) => {
                  const val = parseInt(e.target.value)
                  if (!isNaN(val) && val >= 0 && val <= 100) {
                    setTempValue(val)
                  }
                }}
                className="w-full bg-slate-50 dark:bg-[#1a1a1a] border border-slate-200 dark:border-[#3a3a3a] rounded px-3 py-2 font-mono text-slate-900 dark:text-[#e0e0e0] text-center"
              />
            </div>

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 bg-slate-50 dark:bg-[#1a1a1a] hover:bg-slate-100 dark:hover:bg-[#2a2a2a] border border-slate-200 dark:border-[#3a3a3a] rounded font-mono text-sm text-slate-900 dark:text-[#e0e0e0] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="flex-1 px-4 py-2 bg-slate-100 dark:bg-[#2a2a2a] hover:bg-slate-200 dark:hover:bg-[#3a3a3a] border border-slate-300 dark:border-[#4a4a4a] rounded font-mono text-sm text-slate-900 dark:text-[#e0e0e0] transition-colors"
              >
                Save
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
