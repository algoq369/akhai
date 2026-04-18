'use client';

/**
 * CognitivePanel — parent wrapper for MetadataMirror (Zone 1) + ConversationSynthesis (Zone 2).
 * Derives exchange data from messages + cognitive signatures.
 * Manages synthesis fetch and chapter-click highlight state.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import MetadataMirror, { type MirrorExchange } from './MetadataMirror';
import ConversationSynthesis from './ConversationSynthesis';
import type { CognitiveSignature, SynthesisChapter } from '@/lib/cognitive/llm-extractor';

interface CognitivePanelMessage {
  id: string;
  role: 'user' | 'assistant' | string;
  content: string;
  queryId?: string;
}

interface CognitivePanelProps {
  messages: CognitivePanelMessage[];
  messageCognitiveSignatures: Record<string, CognitiveSignature | null>;
  chatId: string | undefined;
}

export default function CognitivePanel({
  messages,
  messageCognitiveSignatures,
  chatId,
}: CognitivePanelProps) {
  const [chapters, setChapters] = useState<SynthesisChapter[]>([]);
  const [highlightedExchangeId, setHighlightedExchangeId] = useState<string | null>(null);
  const synthFetchingRef = useRef(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Derive exchanges from messages + signatures
  const exchanges: MirrorExchange[] = [];
  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    if (msg.role !== 'assistant') continue;
    const sig = messageCognitiveSignatures[msg.id];
    const prevUser = i > 0 && messages[i - 1].role === 'user' ? messages[i - 1] : null;
    exchanges.push({
      queryId: msg.queryId || msg.id,
      query: prevUser?.content || '',
      shortMetadataSummary: sig?.short_metadata_summary || '',
      shortOutputSummary: sig?.short_output_summary || '',
      fullDialogue: sig || null,
    });
  }

  // Fetch synthesis when exchanges change (debounced 1s)
  const fetchSynthesis = useCallback(async () => {
    if (!chatId || exchanges.length === 0 || synthFetchingRef.current) return;
    // Only fetch when all signatures are loaded
    const allLoaded = exchanges.every((e) => e.fullDialogue !== null);
    if (!allLoaded) return;

    synthFetchingRef.current = true;
    try {
      const body = {
        chatId,
        exchanges: exchanges.map((e) => ({
          queryId: e.queryId,
          query: e.query,
          responseSummary: e.shortOutputSummary || e.query,
          metadataSummary: e.shortMetadataSummary || '',
        })),
      };
      const res = await fetch('/api/conversation-synthesis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.chapters && data.chapters.length > 0) {
        setChapters(data.chapters);
      }
    } catch (err) {
      console.warn('[CognitivePanel] Synthesis fetch failed:', err);
    } finally {
      synthFetchingRef.current = false;
    }
  }, [chatId, exchanges.length, Object.keys(messageCognitiveSignatures).length]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(fetchSynthesis, 1000);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [fetchSynthesis]);

  // Handle chapter click → highlight exchanges
  const handleChapterClick = useCallback((exchangeIds: string[]) => {
    if (exchangeIds.length > 0) {
      setHighlightedExchangeId(exchangeIds[0]);
      setTimeout(() => setHighlightedExchangeId(null), 2000);
    }
  }, []);

  if (exchanges.length === 0) {
    return (
      <div className="px-4 py-16 text-center text-[9px] text-relic-silver/20 font-mono">
        <div className="text-[18px] mb-3 opacity-15">◇</div>
        no cognitive data yet
      </div>
    );
  }

  return (
    <div>
      <MetadataMirror exchanges={exchanges} highlightedExchangeId={highlightedExchangeId} />
      {chapters.length > 0 && (
        <div className="border-t border-relic-mist/15 dark:border-relic-slate/10">
          <ConversationSynthesis chapters={chapters} onChapterClick={handleChapterClick} />
        </div>
      )}
    </div>
  );
}
