'use client';

/**
 * RawThinkingView — live raw thinking stream display.
 * Shows flowing Opus reasoning text with auto-scroll and pulsing cursor.
 */

import { useState, useRef, useEffect } from 'react';

interface RawThinkingViewProps {
  rawThinking: string;
  isStreaming: boolean;
}

export default function RawThinkingView({ rawThinking, isStreaming }: RawThinkingViewProps) {
  const [expanded, setExpanded] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom while streaming
  useEffect(() => {
    if (isStreaming && expanded && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [rawThinking, isStreaming, expanded]);

  if (!rawThinking) return null;

  // Split into paragraphs for rendering
  const paragraphs = rawThinking.split(/\n\n+/).filter(Boolean);
  const previewText = rawThinking.slice(0, 200);
  const previewLines = previewText.split(/\n\n+/).filter(Boolean).slice(0, 3);

  return (
    <div>
      {/* Collapsed preview */}
      {!expanded && (
        <button type="button" onClick={() => setExpanded(true)} className="w-full text-left">
          <div className="space-y-1">
            {previewLines.map((line, i) => (
              <p
                key={i}
                className="text-[9px] leading-relaxed text-relic-slate/60 dark:text-relic-silver/45 line-clamp-1"
              >
                {line}
              </p>
            ))}
            <div className="text-[8px] text-indigo-400/40 font-mono">
              ▸ expand thinking
              {isStreaming && <span className="ml-1 animate-pulse">▌</span>}
            </div>
          </div>
        </button>
      )}

      {/* Expanded — full thinking stream */}
      {expanded && (
        <div>
          <button
            type="button"
            onClick={() => setExpanded(false)}
            className="text-[8px] text-indigo-400/40 font-mono mb-1"
          >
            ▾ collapse
          </button>
          <div ref={scrollRef} className="max-h-[400px] overflow-y-auto space-y-2 pr-1">
            {paragraphs.map((p, i) => (
              <p
                key={i}
                className="text-[9px] leading-relaxed text-relic-slate/70 dark:text-relic-silver/50"
              >
                {p}
              </p>
            ))}
            {isStreaming && <span className="text-indigo-400/60 animate-pulse">▌</span>}
          </div>
        </div>
      )}
    </div>
  );
}
