'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import type { ScenarioBranch } from '@/lib/god-view/scenario-engine';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ScenarioChatProps {
  branch: ScenarioBranch;
  onClose: () => void;
}

export default function ScenarioChat({ branch, onClose }: ScenarioChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const sendMessage = useCallback(async () => {
    const q = input.trim();
    if (!q || isLoading) return;

    const userMsg: ChatMessage = { role: 'user', content: q };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/god-view/scenario-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          branchId: branch.id,
          branchSummary: branch.summary,
          keyEvents: branch.keyEvents,
          question: q,
          messages: updated,
        }),
      });

      const data = await res.json();
      if (data.response) {
        setMessages((prev) => [...prev, { role: 'assistant', content: data.response }]);
      }
    } catch {
      setMessages((prev) => [...prev, { role: 'assistant', content: 'Connection failed.' }]);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, messages, branch]);

  return (
    <div className="border border-slate-200 dark:border-relic-slate/30 rounded-lg bg-white/50 dark:bg-relic-void/50 backdrop-blur-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-slate-100 dark:border-relic-slate/20">
        <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-400">
          ◊ Chatting with {branch.title}
        </span>
        <button
          type="button"
          onClick={onClose}
          className="font-mono text-[10px] text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
        >
          ✕
        </button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="max-h-[240px] overflow-y-auto px-4 py-3 space-y-3">
        {messages.length === 0 && (
          <p className="font-mono text-[10px] text-zinc-400 italic">
            Ask questions from inside this predicted future...
          </p>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={msg.role === 'user' ? 'text-right' : ''}>
            <span className="font-mono text-[9px] uppercase tracking-widest text-zinc-400 mb-0.5 block">
              {msg.role === 'user' ? 'You' : 'Analyst'}
            </span>
            <p
              className={`font-mono text-[11px] leading-relaxed ${
                msg.role === 'user'
                  ? 'text-zinc-600 dark:text-zinc-300'
                  : 'text-zinc-500 dark:text-zinc-400'
              }`}
            >
              {msg.content}
            </p>
          </div>
        ))}
        {isLoading && (
          <div className="flex items-center gap-1.5">
            <span className="inline-block w-1.5 h-1.5 bg-zinc-400 rounded-full animate-pulse" />
            <span className="font-mono text-[10px] text-zinc-400">Analyzing...</span>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-slate-100 dark:border-relic-slate/20 px-4 py-2 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') sendMessage();
          }}
          placeholder="Ask about this world..."
          disabled={isLoading}
          className="flex-1 bg-transparent font-mono text-[11px] text-zinc-700 dark:text-zinc-300 placeholder:text-zinc-400 focus:outline-none disabled:opacity-50"
        />
        <button
          type="button"
          onClick={sendMessage}
          disabled={!input.trim() || isLoading}
          className="font-mono text-[10px] uppercase tracking-widest text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 disabled:opacity-30 transition-colors"
        >
          Send
        </button>
      </div>
    </div>
  );
}
