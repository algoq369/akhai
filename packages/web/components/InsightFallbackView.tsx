'use client';

import { motion } from 'framer-motion';
import { SparklesIcon } from '@heroicons/react/24/outline';

interface InsightFallbackViewProps {
  content: string;
}

export default function InsightFallbackView({ content }: InsightFallbackViewProps) {
  const sentences = content
    .split(/[.!?]+/)
    .map((s) => s.replace(/[#*`\-]/g, '').trim())
    .filter((s) => s.length > 20 && s.length < 300)
    .slice(0, 5);

  return (
    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-4">
      <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
        <div className="flex items-center gap-2 px-3 py-2 border-b border-slate-100 dark:border-slate-800">
          <SparklesIcon className="w-4 h-4 text-purple-500" />
          <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-200">
            Insight View
          </span>
          <span className="text-[9px] text-slate-400 dark:text-slate-500">
            {sentences.length} key points
          </span>
        </div>
        <div className="p-3">
          <div className="text-[8px] text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
            Key points from response
          </div>
          {sentences.length > 0 ? (
            <ul className="space-y-1.5">
              {sentences.map((s, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 text-[10px] text-slate-600 dark:text-slate-400 leading-relaxed"
                >
                  <span className="text-purple-400 mt-0.5 flex-shrink-0">·</span>
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-[10px] text-slate-500 dark:text-slate-400 italic">
              Response content is being analyzed
            </p>
          )}
          <p className="text-[9px] text-slate-400 dark:text-slate-500 italic mt-3">
            Insight view — key points from response
          </p>
        </div>
      </div>
    </motion.div>
  );
}
