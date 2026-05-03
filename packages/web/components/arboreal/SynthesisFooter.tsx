'use client';

import { useState, useEffect, useMemo } from 'react';

interface SynthesisFooterProps {
  responseText: string;
  query: string;
}

export default function SynthesisFooter({ responseText, query }: SynthesisFooterProps) {
  const [autoSynthesis, setAutoSynthesis] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const inlineSynthesis = useMemo(() => {
    const match = responseText.match(
      /## SYNTHESIS\s*\n([\s\S]*?)(?=\n##|\n\[RELATED\]|\n\[NEXT\]|$)/i
    );
    return match?.[1]?.trim() || null;
  }, [responseText]);

  useEffect(() => {
    if (inlineSynthesis || autoSynthesis || loading) return;
    if (!responseText || responseText.length < 200) return;
    setLoading(true);
    fetch('/api/arboreal-chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query,
        queryId: 'synthesis-gen',
        layer: 0,
        paragraphBody: responseText.slice(0, 3000),
        paragraphTitle: 'Full Response',
        siblingTitles: [],
        userQuestion:
          'Write exactly 5 sentences summarizing the core insights from this analysis. Each sentence captures one key finding or recommendation. No bullet points, no numbering. Just 5 plain sentences, each on its own line.',
      }),
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.content) setAutoSynthesis(data.content);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [inlineSynthesis, autoSynthesis, loading, responseText, query]);

  const synthesisText = inlineSynthesis || autoSynthesis;
  const lines = synthesisText
    ? synthesisText
        .split('\n')
        .map((l) => l.trim())
        .filter((l) => l.length > 0)
        .slice(0, 5)
    : [];

  if (responseText.length < 200 || (!synthesisText && !loading)) return null;

  return (
    <div className="max-w-3xl mx-auto px-4 py-4 border-t border-relic-mist/20 dark:border-relic-slate/20">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-[12px] text-amber-500 dark:text-amber-400">◇◇</span>
        <span className="text-[9px] uppercase tracking-[0.25em] text-relic-silver/50 dark:text-relic-silver/60 font-mono">
          synthesis
        </span>
        {!inlineSynthesis && autoSynthesis && (
          <span className="text-[8px] text-relic-silver/30 font-mono">auto-generated</span>
        )}
      </div>
      {loading ? (
        <div className="text-[10px] font-mono text-relic-silver/40 animate-pulse">
          generating synthesis...
        </div>
      ) : (
        <div className="space-y-1.5">
          {lines.map((line, i) => (
            <p
              key={i}
              className="text-[12px] leading-relaxed text-relic-slate dark:text-relic-ghost/90 font-mono"
            >
              {line}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
