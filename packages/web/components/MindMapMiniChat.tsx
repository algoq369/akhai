'use client'

import { useState, useCallback, useRef, useEffect, useMemo } from 'react'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  query?: string // original query for "expand to chat" link
}

interface MindMapMiniChatNode {
  id: string
  name: string
  category: string | null
  queryCount: number
}

interface MindMapMiniChatLink {
  source: string
  target: string
}

interface MindMapMiniChatProps {
  selectedTopic?: {
    id: string
    label: string
    category?: string
  } | null
  connectionsCount?: number
  prefillQuery?: string
  isOpen?: boolean
  onOpenChange?: (open: boolean) => void
  nodes?: MindMapMiniChatNode[]
  topicLinks?: MindMapMiniChatLink[]
}

export function MindMapMiniChat({
  selectedTopic,
  connectionsCount = 0,
  prefillQuery,
  isOpen: controlledOpen,
  onOpenChange,
  nodes,
  topicLinks,
}: MindMapMiniChatProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen
  const setIsOpen = (v: boolean) => { onOpenChange ? onOpenChange(v) : setInternalOpen(v) }

  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [lastPrefill, setLastPrefill] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Prefill + auto-send
  useEffect(() => {
    if (prefillQuery && prefillQuery !== lastPrefill) {
      setLastPrefill(prefillQuery)
      setInput('')
      sendMessage(prefillQuery)
    }
  }, [prefillQuery]) // eslint-disable-line react-hooks/exhaustive-deps

  // Smart suggestions from live mindmap data
  const suggestions = useMemo(() => {
    if (!nodes || nodes.length === 0) return ['explore topics', 'find patterns', 'suggest research']
    const sorted = [...nodes].sort((a, b) => (b.queryCount || 0) - (a.queryCount || 0))

    const top = sorted[0]

    const catMap: Record<string, Set<string>> = {}
    nodes.forEach(n => { catMap[n.id] = new Set([n.category || 'other']) })
    topicLinks?.forEach(l => {
      const sn = nodes.find(n => n.id === l.source)
      const tn = nodes.find(n => n.id === l.target)
      if (sn && tn) {
        catMap[l.source]?.add(tn.category || 'other')
        catMap[l.target]?.add(sn.category || 'other')
      }
    })
    const bridge = nodes.reduce((best, n) => (catMap[n.id]?.size || 0) > (catMap[best.id]?.size || 0) ? n : best, nodes[0])

    const clusterCounts: Record<string, number> = {}
    nodes.forEach(n => { clusterCounts[n.category || 'other'] = (clusterCounts[n.category || 'other'] || 0) + (n.queryCount || 0) })
    const leastExplored = Object.entries(clusterCounts).sort((a, b) => a[1] - b[1])[0]?.[0] || 'other'

    return [
      `deep dive ${top?.name?.slice(0, 20) || 'top topic'}`,
      `bridge: ${bridge?.name?.slice(0, 20) || 'connections'}`,
      `explore ${leastExplored}`,
    ]
  }, [nodes, topicLinks])

  const sendMessage = useCallback(async (messageText?: string) => {
    const text = messageText || input.trim()
    if (!text || isLoading) return

    setMessages(prev => [...prev, { role: 'user', content: text }])
    setInput('')
    setIsLoading(true)

    try {
      const context = selectedTopic
        ? `User is viewing Mind Map topic "${selectedTopic.label}" (${selectedTopic.category || 'uncategorized'}). ${connectionsCount} connections.`
        : `User is viewing their Mind Map knowledge graph.`

      const response = await fetch('/api/quick-query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: text, context }),
      })

      if (!response.ok) {
        setMessages(prev => [...prev, { role: 'assistant', content: `Error (${response.status}). Try again.` }])
        return
      }

      const data = await response.json()
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.content || data.response || 'No response.',
        query: text,
      }])
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Connection error.' }])
    } finally {
      setIsLoading(false)
    }
  }, [input, isLoading, selectedTopic, connectionsCount])

  return (
    <>
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="w-8 h-8 flex items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-400 hover:text-neutral-600 shadow-sm transition-colors"
          title="Open mini chat"
        >
          <span style={{ fontSize: 12, fontFamily: "'JetBrains Mono', monospace" }}>&#x25C7;</span>
        </button>
      )}

      {isOpen && (
        <div
          className="bg-white border border-neutral-200 rounded-lg shadow-lg overflow-hidden"
          style={{ width: 260, maxHeight: 280 }}
        >
          {/* Header */}
          <div className="px-2.5 py-1 border-b border-neutral-100 flex justify-between items-center">
            <div className="flex items-center gap-1.5">
              <span className="text-neutral-400 text-[10px]">&#x25C7;</span>
              <span className="text-[10px] text-neutral-500">mini chat</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-neutral-400 hover:text-neutral-600 text-xs transition-colors"
            >
              &#x2212;
            </button>
          </div>

          {/* Smart suggestions */}
          <div className="px-2 py-1 border-b border-neutral-100 flex gap-1 overflow-x-auto">
            {suggestions.map((s, i) => (
              <button
                key={i}
                onClick={() => sendMessage(s)}
                disabled={isLoading}
                className="flex-shrink-0 px-1.5 py-0.5 text-[8px] font-medium text-slate-500 bg-slate-50 rounded hover:bg-slate-100 transition-colors whitespace-nowrap disabled:opacity-50"
              >
                {s}
              </button>
            ))}
          </div>

          {/* Context */}
          {selectedTopic && (
            <div className="px-2.5 py-0.5 border-b border-neutral-100 text-[8px] text-neutral-400 truncate">
              {selectedTopic.label} &middot; {connectionsCount} links
            </div>
          )}

          {/* Messages */}
          <div className="overflow-y-auto px-2.5 py-1" style={{ maxHeight: 120 }}>
            {messages.map((msg, i) => (
              <div key={`msg-${i}`} className="mb-1.5">
                <div className={`text-[9px] leading-relaxed ${
                  msg.role === 'user'
                    ? 'text-neutral-700 bg-neutral-50 px-1.5 py-0.5 rounded'
                    : 'text-neutral-500'
                }`}>
                  {msg.content}
                </div>
                {msg.role === 'assistant' && msg.query && (
                  <a
                    href={`/?q=${encodeURIComponent(msg.query)}`}
                    className="text-[7px] text-indigo-500 hover:text-indigo-600 mt-0.5 inline-block"
                  >
                    expand to full chat &#x2192;
                  </a>
                )}
              </div>
            ))}
            {isLoading && <div className="text-[9px] text-neutral-400">...</div>}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="px-2 py-1 border-t border-neutral-100">
            <form onSubmit={(e) => { e.preventDefault(); sendMessage() }} className="flex gap-1">
              <input
                type="text"
                placeholder="ask..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={isLoading}
                className="flex-1 px-1.5 py-0.5 text-[9px] bg-slate-50 rounded border border-neutral-200 text-neutral-600 focus:outline-none focus:border-neutral-400 placeholder-neutral-400"
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="w-5 h-5 flex items-center justify-center bg-slate-700 text-white rounded disabled:opacity-40 hover:bg-slate-600 transition-colors"
              >
                <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}

export default MindMapMiniChat
