'use client';

import { useState, useRef, useEffect } from 'react';
import { COUNCIL_AGENTS } from '@/lib/god-view/agents';
import { useCouncilStore } from '@/lib/stores/council-store';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

const AGENT_BORDER: Record<string, string> = {
  visionary: 'border-indigo-400',
  analyst: 'border-emerald-400',
  advocate: 'border-amber-400',
  skeptic: 'border-red-400',
  synthesizer: 'border-purple-400',
};

export default function AgentChat() {
  const { drillAgentId, drillQueryId, results, setDrillAgent } = useCouncilStore();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const agent = drillAgentId ? COUNCIL_AGENTS.find((a) => a.id === drillAgentId) : null;
  const result = drillQueryId ? results.find((r) => r.queryId === drillQueryId) : null;
  const perspective = result?.perspectives.find((p) => p.agentId === drillAgentId);

  // Reset messages when agent changes
  useEffect(() => {
    if (perspective) {
      setMessages([{ role: 'assistant', content: perspective.text }]);
    } else {
      setMessages([]);
    }
    setInput('');
  }, [drillAgentId, drillQueryId]);

  // Auto-scroll
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  if (!agent || !drillAgentId) return null;

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    const userMsg: ChatMessage = { role: 'user', content: input.trim() };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/god-view/agent-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId: drillAgentId,
          messages: updatedMessages,
          originalQuery: result?.query || '',
          originalResponse: perspective?.text || '',
        }),
      });
      if (!res.ok) throw new Error(`${res.status}`);
      const data = await res.json();
      setMessages((prev) => [...prev, { role: 'assistant', content: data.response }]);
    } catch (err) {
      console.error('AgentChat error:', err);
      setMessages((prev) => [...prev, { role: 'assistant', content: 'Response unavailable.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const borderColor = AGENT_BORDER[agent.id] || 'border-zinc-400';

  return (
    <div className={`mt-2 border ${borderColor} rounded-lg overflow-hidden font-mono bg-white dark:bg-zinc-900/80`}>
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 bg-zinc-50 dark:bg-zinc-900/50 border-b border-zinc-200 dark:border-zinc-700">
        <span className="text-[11px]">{agent.sigil}</span>
        <span className="text-[9px] uppercase tracking-wider text-zinc-500">{agent.name}</span>
        <span className="text-[7px] text-zinc-400">{agent.role}</span>
        <button onClick={() => setDrillAgent(null)} className="ml-auto text-[10px] text-zinc-400 hover:text-zinc-600">✕</button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="max-h-[200px] overflow-auto p-2 space-y-2">
        {messages.map((msg, i) => (
          <div key={i} className={`text-[9px] leading-relaxed px-2 py-1 rounded ${
            msg.role === 'user'
              ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
              : 'text-zinc-600 dark:text-zinc-400'
          }`}>
            {msg.content}
          </div>
        ))}
        {isLoading && (
          <div className="text-[9px] text-zinc-400 animate-pulse px-2">Thinking...</div>
        )}
      </div>

      {/* Input */}
      <div className="flex items-center gap-1 px-2 py-1.5 border-t border-zinc-200 dark:border-zinc-700">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder={`Ask ${agent.name}...`}
          className="flex-1 text-[9px] bg-transparent outline-none text-zinc-700 dark:text-zinc-300 placeholder-zinc-400"
          disabled={isLoading}
        />
        <button onClick={handleSend} disabled={isLoading || !input.trim()}
          className="text-[8px] uppercase tracking-wider text-zinc-400 hover:text-zinc-600 disabled:opacity-30">
          Send
        </button>
      </div>
    </div>
  );
}
