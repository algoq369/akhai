'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface MethodologyFrameProps {
  currentMethodology: string
  onMethodologyChange: (methodId: string) => void
  isSubmitting: boolean
  inputRef?: React.RefObject<HTMLInputElement>
}

interface Methodology {
  id: string
  name: string
  fullName: string
  symbol: string
  color: string
  tokens: string
  latency: string
  cost: string
}

const METHODOLOGIES: Methodology[] = [
  { id: 'auto', name: 'AUTO', fullName: 'Automatic', symbol: '◎', color: '#94a3b8', tokens: 'varies', latency: 'varies', cost: 'varies' },
  { id: 'direct', name: 'DIR', fullName: 'Direct', symbol: '→', color: '#ef4444', tokens: '200-500', latency: '~2s', cost: '$0.006' },
  { id: 'cod', name: 'COD', fullName: 'Chain of Draft', symbol: '⋯', color: '#f97316', tokens: '~600', latency: '~8s', cost: '$0.012' },
  { id: 'bot', name: 'BOT', fullName: 'Bag of Thoughts', symbol: '◇', color: '#eab308', tokens: '~600', latency: '~12s', cost: '$0.018' },
  { id: 'react', name: 'REACT', fullName: 'ReAct Agent', symbol: '⟳', color: '#22c55e', tokens: '2k-8k', latency: '~20s', cost: '$0.024' },
  { id: 'pot', name: 'POT', fullName: 'Plan of Thought', symbol: '△', color: '#3b82f6', tokens: '3k-6k', latency: '~15s', cost: '$0.018' },
  { id: 'gtp', name: 'GTP', fullName: 'Multi-AI Consensus', symbol: '◯', color: '#8b5cf6', tokens: '8k-15k', latency: '~30s', cost: '$0.042' },
]

export default function MethodologyFrame({
  currentMethodology,
  onMethodologyChange,
  isSubmitting,
}: MethodologyFrameProps) {
  const [hoveredMethod, setHoveredMethod] = useState<string | null>(null)
  
  const currentMethod = METHODOLOGIES.find(m => m.id === currentMethodology) || METHODOLOGIES[0]

  return (
    <div className="flex flex-col items-center">
      {/* Methodology dots row */}
      <div className="flex items-center gap-3">
        {METHODOLOGIES.map((method) => {
          const isSelected = currentMethodology === method.id
          const isHovered = hoveredMethod === method.id
          
          return (
            <div
              key={method.id}
              className="relative"
              onMouseEnter={() => setHoveredMethod(method.id)}
              onMouseLeave={() => setHoveredMethod(null)}
            >
              {/* Dot */}
              <motion.button
                onClick={() => onMethodologyChange(method.id)}
                className="w-2.5 h-2.5 rounded-full transition-all duration-200"
                style={{
                  backgroundColor: isSelected ? method.color : '#cbd5e1',
                  boxShadow: isSelected ? `0 0 8px ${method.color}` : 'none',
                }}
                whileHover={{ scale: 1.4 }}
                whileTap={{ scale: 0.9 }}
              />

              {/* Tooltip on hover - Full name + abbreviation */}
              <AnimatePresence>
                {isHovered && (
                  <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 4 }}
                    className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 whitespace-nowrap pointer-events-none"
                  >
                    <div className="flex flex-col items-center">
                      <span 
                        className="text-[10px] font-medium"
                        style={{ color: method.color }}
                      >
                        {method.fullName}
                      </span>
                      <span 
                        className="text-[8px] font-mono opacity-60"
                        style={{ color: method.color }}
                      >
                        {method.symbol} {method.name}
                      </span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )
        })}
        
        {/* Guard indicator */}
        <div className="flex items-center gap-1 ml-4">
          <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[8px] uppercase tracking-widest text-slate-400">guard active</span>
        </div>
      </div>

      {/* Selected methodology info - Full name + abbrev */}
      <AnimatePresence mode="wait">
        {currentMethodology !== 'auto' && (
          <motion.div
            key={currentMethodology}
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="mt-3 text-center"
          >
            {/* Symbol + Full Name + Abbrev */}
            <div className="flex items-center justify-center gap-2 mb-1">
              <span className="text-sm" style={{ color: currentMethod.color }}>
                {currentMethod.symbol}
              </span>
              <span 
                className="text-[11px] font-medium"
                style={{ color: currentMethod.color }}
              >
                {currentMethod.fullName}
              </span>
              <span 
                className="text-[9px] font-mono opacity-60 px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800"
                style={{ color: currentMethod.color }}
              >
                {currentMethod.name}
              </span>
            </div>

            {/* Metrics */}
            <div className="flex items-center justify-center gap-3 text-[9px]">
              <span>
                <span className="text-slate-300 uppercase tracking-wider">tokens:</span>{' '}
                <span className="text-slate-500 font-mono">{currentMethod.tokens}</span>
              </span>
              <span className="text-slate-200">·</span>
              <span>
                <span className="text-slate-300 uppercase tracking-wider">latency:</span>{' '}
                <span className="text-slate-500 font-mono">{currentMethod.latency}</span>
              </span>
              <span className="text-slate-200">·</span>
              <span>
                <span className="text-slate-300 uppercase tracking-wider">cost:</span>{' '}
                <span className="text-slate-500 font-mono">{currentMethod.cost}</span>
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading overlay */}
      <AnimatePresence>
        {isSubmitting && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-white/95 dark:bg-slate-900/95"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div className="flex flex-col items-center">
              <motion.div
                className="text-3xl mb-4"
                style={{ color: currentMethod.color }}
                animate={{ scale: [1, 1.1, 1], opacity: [1, 0.6, 1] }}
                transition={{ duration: 0.5, repeat: Infinity }}
              >
                {currentMethod.symbol}
              </motion.div>
              
              <div className="w-32 h-0.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{ backgroundColor: currentMethod.color }}
                  initial={{ width: '0%' }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 1, ease: 'easeInOut' }}
                />
              </div>
              
              <span className="mt-3 text-[10px] font-mono uppercase tracking-wider text-slate-400">
                {currentMethod.fullName} processing
              </span>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
