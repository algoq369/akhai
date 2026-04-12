'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import type { NatalChart } from '@/lib/esoteric/natal-engine';

const EXAMPLES = [
  'What does my North Node mean?',
  'Career guidance from my chart',
  'How do current transits affect me?',
  'What should I focus on this year?',
];

interface ChatMsg {
  role: 'user' | 'assistant';
  content: string;
  ts: number;
}

interface Props {
  chart: NatalChart;
  mode: string;
}

export default function NatalChat({ chart, mode }: Props) {
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [totalCost, setTotalCost] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const submit = useCallback(
    async (question: string) => {
      const q = question.trim();
      if (!q || loading) return;
      setInput('');
      const userMsg: ChatMsg = { role: 'user', content: q, ts: Date.now() };
      setMessages((prev) => [...prev, userMsg]);
      setLoading(true);
      try {
        const history = messages.map((m) => ({ role: m.role, content: m.content }));
        const res = await fetch('/api/esoteric/natal-chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ question: q, chart, mode, messages: history }),
        });
        const data = await res.json();
        const aiMsg: ChatMsg = {
          role: 'assistant',
          content: data.response ?? 'No response',
          ts: Date.now(),
        };
        setMessages((prev) => [...prev, aiMsg]);
        if (data.cost) setTotalCost((prev) => prev + data.cost);
      } catch {
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: 'Connection error \u2014 try again', ts: Date.now() },
        ]);
      } finally {
        setLoading(false);
      }
    },
    [chart, mode, messages, loading]
  );

  return (
    <div>
      <div className="text-[11px] uppercase tracking-widest text-zinc-500 mb-2">
        {'\u260A'} Ask about your chart
      </div>

      {/* Examples */}
      {messages.length === 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {EXAMPLES.map((eq) => (
            <button
              key={eq}
              onClick={() => submit(eq)}
              className="text-[9px] px-2 py-0.5 rounded-full border border-zinc-200 text-zinc-400 hover:text-zinc-600 hover:border-zinc-400 transition-colors"
            >
              {eq}
            </button>
          ))}
        </div>
      )}

      {/* Messages */}
      <div ref={scrollRef} className="max-h-[400px] overflow-y-auto space-y-2 mb-3">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[85%] rounded-lg p-2 ${
                msg.role === 'user'
                  ? 'bg-zinc-100 text-zinc-700'
                  : 'border border-zinc-200 bg-white text-zinc-600'
              }`}
            >
              <div className="text-[11px] font-mono leading-[1.7] whitespace-pre-line">
                {msg.content}
              </div>
              <div className="text-[8px] text-zinc-300 mt-1">
                {new Date(msg.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="border border-zinc-200 bg-white rounded-lg p-2">
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 bg-zinc-300 rounded-full animate-pulse" />
                <span className="w-1.5 h-1.5 bg-zinc-300 rounded-full animate-pulse [animation-delay:150ms]" />
                <span className="w-1.5 h-1.5 bg-zinc-300 rounded-full animate-pulse [animation-delay:300ms]" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              submit(input);
            }
          }}
          placeholder="Ask about your natal chart\u2026"
          className="flex-1 bg-white border border-zinc-200 rounded-lg px-3 py-2 text-[11px] font-mono text-zinc-700 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-400"
        />
        <button
          onClick={() => submit(input)}
          disabled={!input.trim() || loading}
          className="px-3 py-2 text-[12px] bg-zinc-800 text-zinc-200 rounded-lg border border-zinc-700 hover:bg-zinc-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {'\u2192'}
        </button>
      </div>

      {/* Cost */}
      {totalCost > 0 && (
        <div className="text-right text-[9px] text-zinc-300 mt-1">
          ${totalCost.toFixed(4)} session cost
        </div>
      )}
    </div>
  );
}
