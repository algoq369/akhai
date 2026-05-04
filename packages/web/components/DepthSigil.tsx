'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getLayerColorForAnnotation } from '@/lib/layer-colors';

interface DepthSigilProps {
  content: string;
  term: string;
}

function splitTermAndRest(content: string): { term: string; rest: string } {
  const sep = content.match(/ — | · /);
  if (sep && sep.index !== undefined) {
    return { term: content.slice(0, sep.index), rest: content.slice(sep.index) };
  }
  const words = content.split(/\s+/);
  const n = Math.min(3, words.length);
  return {
    term: words.slice(0, n).join(' '),
    rest: words.length > n ? ' ' + words.slice(n).join(' ') : '',
  };
}

export function DepthSigil({ content, term }: DepthSigilProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const layers = getLayerColorForAnnotation(content, term);
  const { term: termPart, rest: restPart } = splitTermAndRest(content);

  return (
    <span className="inline-flex flex-col items-start">
      <span className="inline-flex items-baseline">
        {/* Clickable Colored Sigil */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsExpanded(!isExpanded);
          }}
          className="depth-sigil inline-flex items-center justify-center ml-0.5 cursor-help transition-all hover:scale-110 hover:brightness-125"
          style={{
            color: layers.color,
            fontSize: '13px',
            fontWeight: 700,
            verticalAlign: 'super',
            textShadow: `0 0 8px ${layers.color}50`,
            lineHeight: '1',
          }}
          title={`${layers.name} - ${layers.meaning}. Click to ${isExpanded ? 'collapse' : 'expand'}`}
        >
          {layers.shape}
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
            className="block ml-4 mt-0.5 text-[11px] text-slate-500 leading-relaxed max-w-[850px] font-normal"
            style={{ color: '#64748b' }}
          >
            └─{' '}
            <span className="text-[11px]" style={{ color: layers.color }}>
              {layers.shape}
            </span>{' '}
            <span className="text-slate-500">
              <u className="underline decoration-dotted decoration-slate-400 underline-offset-2">
                {termPart}
              </u>
              {restPart}
            </span>
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  );
}
