'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { getSefirotForAnnotation } from '@/lib/sefirot-colors'

interface DepthSigilProps {
  content: string
  term: string
}

export function DepthSigil({ content, term }: DepthSigilProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const sefirot = getSefirotForAnnotation(content)

  return (
    <span className="inline-flex flex-col items-start">
      <span className="inline-flex items-baseline">
        {/* Clickable Colored Sigil */}
        <button
          onClick={(e) => {
            e.stopPropagation()
            setIsExpanded(!isExpanded)
          }}
          className="depth-sigil inline-flex items-center justify-center w-3 h-3 mx-0.5 cursor-pointer transition-all hover:scale-125"
          style={{ color: sefirot.color }}
          title={`${sefirot.name} - ${sefirot.meaning}. Click to ${isExpanded ? 'collapse' : 'expand'}`}
        >
          {sefirot.shape}
        </button>
      </span>

      {/* Expanded Grey Text - Beneath, inline style - ALWAYS GREY, NEVER BLACK */}
      <AnimatePresence>
        {isExpanded && (
          <motion.span
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.15 }}
            className="block ml-4 mt-0.5 text-[8px] text-slate-500 leading-relaxed max-w-[850px] font-normal"
            style={{ color: '#64748b' }}
          >
            └─ <span className="text-[8px]" style={{ color: sefirot.color }}>{sefirot.shape}</span>{' '}
            <span className="text-slate-500">{content}</span>
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  )
}
