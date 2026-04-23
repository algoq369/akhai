'use client';

import { useEffect, useRef, useState } from 'react';

interface BlockChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface BlockChatProps {
  queryId: string;
  query: string;
  layer: number;
  sectionIndex: number;
  paragraphTitle: string | null;
  paragraphBody: string;
  paragraphSigil: string;
  siblingTitles: string[];
  color: string;
}

export default function BlockChat({
  queryId,
  query,
  layer,
  sectionIndex,
  paragraphTitle,
  paragraphBody,
  paragraphSigil,
  siblingTitles,
  color,
}: BlockChatProps) {
  const [messages, setMessages] = useState<BlockChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (loaded || !queryId) return;
    setLoaded(true);
    fetch(`/api/arboreal-chat?queryId=${encodeURIComponent(queryId)}&layer=${layer}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.messages) setMessages(data.messages);
      })
      .catch(() => {});
  }, [queryId, layer, loaded]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);
    try {
      const res = await fetch('/api/arboreal-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          queryId,
          layer,
          sectionIndex,
          paragraphTitle,
          paragraphBody,
          paragraphSigil,
          siblingTitles,
          userQuestion: userMsg,
        }),
      });
      const data = await res.json();
      const reply = data.content ?? (data.error ? `(error: ${data.error})` : null);
      if (reply) setMessages((prev) => [...prev, { role: 'assistant', content: reply }]);
    } catch {
      setMessages((prev) => [...prev, { role: 'assistant', content: '(error — try again)' }]);
    }
    setLoading(false);
  };

  return (
    <div
      className="mt-2 pt-2 border-t"
      style={{ borderColor: `${color}33` }}
      onClick={(e) => e.stopPropagation()}
    >
      <div ref={scrollRef} className="max-h-40 overflow-y-auto space-y-2 mb-2">
        {messages.length === 0 && !loading && (
          <div className="text-[9px] font-mono text-relic-silver/50 py-1">
            chat about this paragraph — scoped to this layer only
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className="flex gap-2 text-[10px]">
            <span
              className="font-mono text-relic-silver/50 flex-shrink-0 pt-0.5"
              style={{ minWidth: 28 }}
            >
              {msg.role === 'user' ? '→' : '←'}
            </span>
            <span className={msg.role === 'assistant' ? 'text-relic-ghost/80' : 'text-relic-ghost'}>
              {msg.content}
            </span>
          </div>
        ))}
        {loading && (
          <div className="text-[9px] font-mono animate-pulse" style={{ color }}>
            thinking...
          </div>
        )}
      </div>

      <div className="flex gap-1.5">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="ask about this..."
          disabled={loading}
          className="flex-1 px-2 py-1 text-[10px] bg-relic-void/80 dark:bg-relic-void/80 border rounded font-mono text-relic-ghost placeholder:text-relic-silver/30 focus:outline-none focus:border-relic-silver/40"
          style={{ borderColor: `${color}44` }}
        />
        <button
          onClick={sendMessage}
          disabled={loading || !input.trim()}
          className="px-2 py-1 text-[9px] font-mono rounded border transition-colors"
          style={{ borderColor: `${color}44`, color, opacity: loading || !input.trim() ? 0.4 : 1 }}
        >
          ↗
        </button>
      </div>
    </div>
  );
}
