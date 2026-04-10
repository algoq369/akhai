'use client';

import { useState, useCallback, useRef, useEffect } from 'react';

interface SandboxSubmitData {
  seed: string;
  url: string;
  question: string;
  domain: 'financial' | 'geopolitical' | 'creative' | 'auto';
}

interface SandboxInputProps {
  onSubmit: (data: SandboxSubmitData) => void;
  isLoading: boolean;
}

const DOMAINS = ['auto', 'financial', 'geopolitical', 'creative'] as const;

export default function SandboxInput({ onSubmit, isLoading }: SandboxInputProps) {
  const [seed, setSeed] = useState('');
  const [url, setUrl] = useState('');
  const [question, setQuestion] = useState('');
  const [domain, setDomain] = useState<SandboxSubmitData['domain']>('auto');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const canSubmit = seed.trim().length > 0 && question.trim().length > 0 && !isLoading;

  // Auto-expand textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    const rows = Math.min(Math.max(4, Math.ceil(el.scrollHeight / 24)), 12);
    el.style.height = `${rows * 24}px`;
  }, [seed]);

  const handleSubmit = useCallback(() => {
    if (!canSubmit) return;
    onSubmit({ seed: seed.trim(), url: url.trim(), question: question.trim(), domain });
  }, [canSubmit, seed, url, question, domain, onSubmit]);

  return (
    <div className="space-y-4">
      {/* Seed Input */}
      <div>
        <label className="block text-[10px] font-mono uppercase tracking-widest text-slate-500 dark:text-relic-ghost mb-1.5">
          Seed Material
        </label>
        <textarea
          ref={textareaRef}
          value={seed}
          onChange={(e) => setSeed(e.target.value)}
          placeholder="Paste article, report, tweet, or any text..."
          disabled={isLoading}
          className="w-full min-h-[96px] bg-white dark:bg-relic-void border border-slate-200 dark:border-relic-slate/30 rounded px-3 py-2 font-mono text-sm text-slate-800 dark:text-relic-white placeholder:text-slate-400 dark:placeholder:text-relic-ghost/50 focus:outline-none focus:border-slate-400 dark:focus:border-relic-ghost/50 resize-none transition-colors disabled:opacity-50"
        />
      </div>

      {/* URL Input */}
      <div>
        <label className="block text-[10px] font-mono uppercase tracking-widest text-slate-500 dark:text-relic-ghost mb-1.5">
          Paste URL (optional)
        </label>
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://..."
          disabled={isLoading}
          className="w-full bg-white dark:bg-relic-void border border-slate-200 dark:border-relic-slate/30 rounded px-3 py-2 font-mono text-sm text-slate-800 dark:text-relic-white placeholder:text-slate-400 dark:placeholder:text-relic-ghost/50 focus:outline-none focus:border-slate-400 dark:focus:border-relic-ghost/50 transition-colors disabled:opacity-50"
        />
      </div>

      {/* Question Input */}
      <div>
        <label className="block text-[10px] font-mono uppercase tracking-widest text-slate-500 dark:text-relic-ghost mb-1.5">
          What if...?
        </label>
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="...the Fed cuts rates to zero?"
          disabled={isLoading}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSubmit();
          }}
          className="w-full bg-white dark:bg-relic-void border border-slate-200 dark:border-relic-slate/30 rounded px-3 py-2 font-mono text-sm text-slate-800 dark:text-relic-white placeholder:text-slate-400 dark:placeholder:text-relic-ghost/50 focus:outline-none focus:border-slate-400 dark:focus:border-relic-ghost/50 transition-colors disabled:opacity-50"
        />
      </div>

      {/* Domain Selector + Run Button */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500 dark:text-relic-ghost">
            Domain
          </span>
          {DOMAINS.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDomain(d)}
              disabled={isLoading}
              className={`text-[11px] font-mono px-2 py-0.5 rounded transition-all ${
                domain === d
                  ? 'bg-slate-200 dark:bg-relic-slate/40 text-slate-800 dark:text-white'
                  : 'text-slate-400 dark:text-relic-ghost hover:text-slate-600 dark:hover:text-white'
              } disabled:opacity-50`}
            >
              {d === 'auto' ? 'Auto-detect' : d.charAt(0).toUpperCase() + d.slice(1)}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="font-mono text-xs uppercase tracking-widest px-5 py-2 border border-slate-300 dark:border-relic-slate/40 rounded transition-all hover:bg-slate-100 dark:hover:bg-relic-slate/20 text-slate-700 dark:text-relic-white disabled:opacity-30 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <span className="inline-block w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
              Processing...
            </span>
          ) : (
            'RUN PREDICTION'
          )}
        </button>
      </div>
    </div>
  );
}
