'use client'

import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import type { Message } from '@/lib/chat-store'

interface SideMiniChatProps {
  isVisible?: boolean
  messages: Message[]
  onSendQuery?: (query: string) => void
  externalQuery?: string  // NEW: For Deep Dive button to inject queries
  conversationId?: string  // NEW: For sharing conversation
  onPromoteToMain?: (query: string, response: string) => void  // NEW: Bidirectional sync
  draggable?: boolean  // When true (canvas mode), allows drag-to-move
  defaultPosition?: { left: number; top: number }  // Starting position when draggable
}

interface Insight {
  id: string
  type: 'suggestion' | 'link'
  content: string
  source?: string
  description?: string
  category?: 'research' | 'data' | 'news' | 'forum' | 'code' | 'media'
}

/**
 * Enhanced Side Mini Chat
 *
 * Shows for every query:
 * - Input field for direct queries
 * - 3-line synthetic explanation (topics + progress + insights)
 * - Pertinent links based on actual query content
 * - Context-aware suggestions
 */
export default function SideMiniChat({ isVisible = true, messages = [], onSendQuery, externalQuery, conversationId, onPromoteToMain, draggable = false, defaultPosition }: SideMiniChatProps) {
  const [insights, setInsights] = useState<Insight[]>([])
  const [inputText, setInputText] = useState('')
  const [miniChatMessages, setMiniChatMessages] = useState<{query: string, response: string}[]>([])
  const [isMiniLoading, setIsMiniLoading] = useState(false)
  const [showShareToast, setShowShareToast] = useState(false)

  // ── Drag logic (canvas mode) ──
  const [dragPos, setDragPos] = useState({ left: defaultPosition?.left ?? 10, top: defaultPosition?.top ?? (typeof window !== 'undefined' ? window.innerHeight - 280 : 500) })
  const [isDragging, setIsDragging] = useState(false)
  const dragOffset = useRef({ x: 0, y: 0 })
  // ── Resize logic (canvas mode) ──
  const [chatSize, setChatSize] = useState({ width: 200, height: 260 })
  const [isResizing, setIsResizing] = useState(false)
  const resizeStart = useRef({ x: 0, y: 0, w: 200, h: 260 })

  // Update default position when prop changes
  useEffect(() => {
    if (defaultPosition) {
      setDragPos({ left: defaultPosition.left, top: defaultPosition.top })
    }
  }, [defaultPosition?.left, defaultPosition?.top])

  const handleDragStart = useCallback((e: React.MouseEvent) => {
    if (!draggable) return
    e.preventDefault()
    setIsDragging(true)
    dragOffset.current = { x: e.clientX - dragPos.left, y: e.clientY - dragPos.top }

    const handleMove = (ev: MouseEvent) => {
      setDragPos({ left: ev.clientX - dragOffset.current.x, top: ev.clientY - dragOffset.current.y })
    }

    const cleanup = () => {
      setIsDragging(false)
      document.removeEventListener('mousemove', handleMove)
      document.removeEventListener('mouseup', cleanup)
      document.removeEventListener('mouseleave', cleanup)
    }

    // Handle normal mouseup
    document.addEventListener('mousemove', handleMove)
    document.addEventListener('mouseup', cleanup)
    // Also cleanup if mouse leaves the window (prevents stuck drag state)
    document.addEventListener('mouseleave', cleanup)
  }, [draggable, dragPos.left, dragPos.top])

  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    if (!draggable) return
    e.preventDefault()
    e.stopPropagation()
    setIsResizing(true)
    resizeStart.current = { x: e.clientX, y: e.clientY, w: chatSize.width, h: chatSize.height }

    const handleMove = (ev: MouseEvent) => {
      const dw = ev.clientX - resizeStart.current.x
      const dh = ev.clientY - resizeStart.current.y
      setChatSize({
        width: Math.min(400, Math.max(150, resizeStart.current.w + dw)),
        height: Math.min(500, Math.max(150, resizeStart.current.h + dh)),
      })
    }

    const cleanup = () => {
      setIsResizing(false)
      document.removeEventListener('mousemove', handleMove)
      document.removeEventListener('mouseup', cleanup)
      document.removeEventListener('mouseleave', cleanup)
    }

    document.addEventListener('mousemove', handleMove)
    document.addEventListener('mouseup', cleanup)
    // Also cleanup if mouse leaves the window (prevents stuck resize state)
    document.addEventListener('mouseleave', cleanup)
  }, [draggable, chatSize.width, chatSize.height])

  const [extractedTopics, setExtractedTopics] = useState<string[]>([])
  const [metacognition, setMetacognition] = useState<{ confidence: number; reasoning: string } | null>(null)
  const lastAnalyzedLength = useRef(0)
  const shownInsights = useRef<Set<string>>(new Set())

  // Handle external queries (from Deep Dive button)
  useEffect(() => {
    if (externalQuery && externalQuery.trim()) {
      // Set input text for user to review/edit
      setInputText(externalQuery)
      // Note: onSendQuery will be called when user manually submits
    }
  }, [externalQuery])

  // Extract key topics from conversation - ENHANCED for meaningful phrases
  useEffect(() => {
    if (messages.length === 0) {
      setExtractedTopics([])
      return
    }

    const userMessages = messages.filter(m => m.role === 'user')
    const aiMessages = messages.filter(m => m.role === 'assistant')

    // Known meaningful phrases to detect first
    const KNOWN_PHRASES = [
      'world economic forum', 'financial system', 'digital currency', 'digital currencies',
      'central bank', 'machine learning', 'artificial intelligence', 'deep learning',
      'neural network', 'climate change', 'economic growth', 'monetary policy',
      'fiscal policy', 'interest rate', 'global economy', 'blockchain technology'
    ]

    const foundPhrases: string[] = []
    const topicMap = new Map<string, number>()

    // Combine all messages
    const allMessages = userMessages.concat(aiMessages)
    const fullText = allMessages.map(m => m.content).join(' ').toLowerCase()

    // Priority 1: Find known phrases
    KNOWN_PHRASES.forEach(phrase => {
      if (fullText.includes(phrase)) {
        foundPhrases.push(phrase)
      }
    })

    // Priority 2: Extract multi-word proper noun phrases (2+ words capitalized)
    allMessages.forEach(msg => {
      const properNouns = msg.content.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3}/g) || []
      properNouns.forEach(phrase => {
        const normalized = phrase.toLowerCase()
        if (phrase.split(' ').length >= 2) { // Only 2+ word phrases
          topicMap.set(normalized, (topicMap.get(normalized) || 0) + 1)
        }
      })
    })

    // Get top phrases from proper nouns
    const phraseTopics = Array.from(topicMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([topic]) => topic)

    // Combine, deduplicate, and limit to 5
    const seen = new Set<string>()
    const finalTopics: string[] = []

    for (const topic of [...foundPhrases, ...phraseTopics]) {
      const lower = topic.toLowerCase()
      // Skip if we've seen this or a similar topic
      let isDuplicate = seen.has(lower)
      for (const s of seen) {
        if (s.includes(lower) || lower.includes(s)) {
          isDuplicate = true
          break
        }
      }
      if (!isDuplicate) {
        seen.add(lower)
        finalTopics.push(topic)
      }
      if (finalTopics.length >= 5) break
    }

    setExtractedTopics(finalTopics)
  }, [messages])

  // Enhanced synthetic explanation - TRACKS conversation progression
  const syntheticSummary = useMemo(() => {
    if (messages.length === 0) {
      return {
        summary: 'Awaiting first query to begin conversation',
        lines: 1
      }
    }

    // Get last 5 queries to track progression
    const userMessages = messages.filter(m => m.role === 'user')
    const aiMessages = messages.filter(m => m.role === 'assistant')

    const lastAiMessage = aiMessages[aiMessages.length - 1]
    const lastUserMessage = userMessages[userMessages.length - 1]

    if (!lastAiMessage) {
      return {
        summary: 'Processing your query...',
        lines: 1
      }
    }

    // Extract topics from last 3-5 exchanges to show progression
    const recentExchanges = Math.min(5, userMessages.length)
    const recentQueries = userMessages.slice(-recentExchanges)
    const recentResponses = aiMessages.slice(-recentExchanges)

    // Track topic evolution across conversation - ENHANCED for phrases
    const allTopics: string[] = []
    const MEANINGFUL_PHRASES = [
      'world economic forum', 'financial system', 'digital currency', 'central bank',
      'machine learning', 'artificial intelligence', 'global economy', 'monetary policy'
    ]

    // First check for known phrases
    const fullText = recentResponses.map(r => r.content).join(' ').toLowerCase()
    MEANINGFUL_PHRASES.forEach(phrase => {
      if (fullText.includes(phrase) && !allTopics.includes(phrase)) {
        allTopics.push(phrase)
      }
    })

    // Then extract multi-word proper nouns
    recentResponses.forEach(response => {
      const multiWordPhrases = response.content.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,2}/g) || []
      multiWordPhrases.forEach(phrase => {
        const normalized = phrase.toLowerCase()
        if (phrase.split(' ').length >= 2 && !allTopics.includes(normalized)) {
          allTopics.push(normalized)
        }
      })
    })

    // Current query analysis
    const currentQuery = lastUserMessage?.content || ''
    const currentResponse = lastAiMessage.content

    // Domain detection
    const queryLower = currentQuery.toLowerCase()
    const responseLower = currentResponse.toLowerCase()

    const isFinancial = /financ|econom|market|invest|stock|bond|asset|trading|gdp|inflation|monetary|fiscal/i.test(queryLower + ' ' + responseLower)
    const isCrypto = /crypto|bitcoin|ethereum|blockchain|defi|web3/i.test(queryLower + ' ' + responseLower)
    const isTech = /tech|software|hardware|computer|digital|ai|ml/i.test(queryLower + ' ' + responseLower)
    const isScience = /science|research|study|academ|peer.review/i.test(queryLower + ' ' + responseLower)

    // Determine primary domain
    let domain = 'general knowledge'
    if (isFinancial) domain = 'financial/economic analysis'
    else if (isCrypto) domain = 'cryptocurrency/blockchain'
    else if (isTech) domain = 'technology/software'
    else if (isScience) domain = 'scientific research'

    // Response characteristics
    const responseLength = currentResponse.length
    const hasData = /\d+%|\d+\.\d+|trillion|billion|million/i.test(currentResponse)
    const hasComparison = /versus|vs|compared to|better|worse|higher|lower/i.test(currentResponse)
    const hasTrends = /trend|forecast|predict|outlook|future|2025|2026/i.test(currentResponse)
    const hasWarnings = /risk|warning|caution|concern|challenge|threat/i.test(currentResponse)

    // Build comprehensive summary (can be 3-5 lines based on complexity)
    const lines: string[] = []

    // Line 1: Current topic focus with domain context
    const topicCount = allTopics.slice(0, 4).length
    const mainTopics = allTopics.slice(0, 3).join(', ')
    lines.push(`${domain} • ${recentExchanges} recent ${recentExchanges === 1 ? 'query' : 'queries'} • exploring: ${mainTopics}`)

    // Line 2: Conversation progression and depth
    const exchanges = Math.floor(messages.length / 2)
    const responseDepth = responseLength > 1000 ? 'comprehensive' : responseLength > 600 ? 'detailed' : responseLength > 300 ? 'focused' : 'concise'
    lines.push(`progression: ${exchanges} total exchanges • current response: ${responseDepth} (${responseLength} chars)`)

    // Line 3: Content characteristics and insights
    const characteristics: string[] = []
    if (hasData) characteristics.push('quantitative data')
    if (hasComparison) characteristics.push('comparative analysis')
    if (hasTrends) characteristics.push('forward-looking')
    if (hasWarnings) characteristics.push('risk-aware')

    if (characteristics.length > 0) {
      lines.push(`insights: ${characteristics.join(' • ')}`)
    }

    // Line 4 (optional): Topic evolution if conversation has progressed
    if (recentExchanges > 2) {
      const firstTopics = new Set(recentQueries[0].content.toLowerCase().match(/\b[a-z]{4,}\b/g) || [])
      const lastTopics = new Set(currentQuery.toLowerCase().match(/\b[a-z]{4,}\b/g) || [])
      const overlap = Array.from(firstTopics).filter(t => lastTopics.has(t)).length
      const evolution = overlap > 2 ? 'focused deepening' : 'exploratory branching'
      lines.push(`evolution: ${evolution} • ${topicCount} distinct topics tracked`)
    }

    return {
      summary: lines.join('\n'),
      lines: lines.length
    }
  }, [messages])

  // Generate insights when new messages arrive - ENHANCED WITH AI
  useEffect(() => {
    const generateInsightsForNewMessage = async () => {
      const newInsights: Insight[] = []
      const lastAiMessage = messages.filter(m => m.role === 'assistant').pop()
      const lastUserMessage = messages.filter(m => m.role === 'user').pop()

      if (!lastAiMessage || !lastUserMessage) return

      const userQuery = lastUserMessage.content
      const aiResponse = lastAiMessage.content

      // Build conversation context from recent messages
      const recentMessages = messages.slice(-6) // Last 3 exchanges
      const conversationContext = recentMessages
        .map(m => `${m.role === 'user' ? 'User' : 'AI'}: ${m.content.substring(0, 200)}`)
        .join('\n')

      // Use enhanced AI-powered link discovery
      let linkInsights: Insight[] = []

      try {
        console.log('[MiniChat] Using ENHANCED link discovery with AI analysis')

        const response = await fetch('/api/enhanced-links', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: userQuery,
            conversationContext,
            topics: extractedTopics
          })
        })

        if (response.ok) {
          const data = await response.json()

          if (data.success) {
            // MiniChat gets the "minichat" type links (practical/applied)
            const minichatLinks = data.minichatLinks || []

            // Convert to Insight format (only show MiniChat links here)
            linkInsights = minichatLinks
              .filter((link: any) => !shownInsights.current.has(link.url))
              .slice(0, 3) // Only 3 links for MiniChat
              .map((link: any) => ({
                id: link.id,
                type: 'link' as const,
                content: link.url,
                source: link.source,
                description: link.snippet,
                category: 'code' // MiniChat focuses on practical links
              }))

            console.log('[MiniChat] AI-powered links discovered with metacognition:', {
              query: userQuery.substring(0, 60),
              searchQueries: data.searchQueries?.minichat,
              linksFound: minichatLinks.length,
              linksShown: linkInsights.length,
              avgRelevance: minichatLinks.reduce((a: any, b: any) => a + b.relevance, 0) / minichatLinks.length,
              confidence: data.metacognition?.confidence ? `${(data.metacognition.confidence * 100).toFixed(0)}%` : 'unknown',
              reasoning: data.metacognition?.reasoning?.substring(0, 100) || 'none'
            })

            // Store metacognitive awareness
            if (data.metacognition) {
              setMetacognition(data.metacognition)
            }
          }
        } else {
          console.error('[MiniChat] Enhanced link discovery failed:', response.status)
        }
      } catch (error) {
        console.error('[MiniChat] Enhanced link discovery error:', error)
      }

      // Track shown links
      linkInsights.forEach(link => {
        shownInsights.current.add(link.content)
      })

      newInsights.push(...linkInsights)

      // Clean up old shown insights (keep last 30)
      if (shownInsights.current.size > 30) {
        const arr = Array.from(shownInsights.current)
        shownInsights.current = new Set(arr.slice(-30))
      }

      // MiniChat shows 3 high-quality links
      setInsights(newInsights.slice(0, 3))
    }

    if (messages.length > lastAnalyzedLength.current && messages.length > 0) {
      console.log('[MiniChat] New message detected - using AI to discover contextual links')
      generateInsightsForNewMessage()
      lastAnalyzedLength.current = messages.length
    }
  }, [messages, extractedTopics])


  /**
   * Handle insight click
   */
  const handleInsightClick = (insight: Insight) => {
    if (insight.type === 'link') {
      // Open link in new tab
      window.open(insight.content, '_blank', 'noopener,noreferrer')
    }
    // For suggestions, user can copy the text manually
  }

  /**
   * Share conversation summary
   */
  const handleShareSummary = async () => {
    if (messages.length === 0) return

    const userMessages = messages.filter(m => m.role === 'user')
    const aiMessages = messages.filter(m => m.role === 'assistant')

    // Build shareable summary
    const summary = {
      topics: extractedTopics,
      exchanges: Math.floor(messages.length / 2),
      queries: userMessages.map(m => m.content.substring(0, 100)),
      syntheticSummary: syntheticSummary.summary,
      conversationId: conversationId || 'none',
      timestamp: new Date().toISOString()
    }

    // Copy to clipboard
    const shareText = `
AkhAI Conversation Summary
━━━━━━━━━━━━━━━━━━━━━━━━
Topics: ${extractedTopics.join(', ')}
Exchanges: ${summary.exchanges}
━━━━━━━━━━━━━━━━━━━━━━━━

${syntheticSummary.summary}

━━━━━━━━━━━━━━━━━━━━━━━━
Recent Queries:
${userMessages.slice(-3).map((m, i) => `${i + 1}. ${m.content.substring(0, 80)}...`).join('\n')}

━━━━━━━━━━━━━━━━━━━━━━━━
Generated by AkhAI - Sovereign Research Engine
${conversationId ? `View: ${window.location.origin}?continue=${conversationId}` : ''}
`.trim()

    try {
      await navigator.clipboard.writeText(shareText)
      setShowShareToast(true)
      setTimeout(() => setShowShareToast(false), 2000)
    } catch (error) {
      console.error('Failed to copy summary:', error)
    }
  }

  /**
   * Handle query submission from Mini Chat input
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputText.trim() || isMiniLoading) return

    const currentQuery = inputText
    setInputText('')
    setIsMiniLoading(true)

    // Add query to mini chat messages
    setMiniChatMessages(prev => [...prev, { query: currentQuery, response: '...' }])

    try {
      // Call API directly from Mini Chat (not main chat)
      const res = await fetch('/api/simple-query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: currentQuery,
          methodology: 'direct',
          conversationHistory: [],
        })
      })

      const data = await res.json()

      // Update last message with response
      setMiniChatMessages(prev => {
        const updated = [...prev]
        updated[updated.length - 1] = {
          query: currentQuery,
          response: data.response || 'No response'
        }
        return updated
      })
    } catch (error) {
      console.error('Mini Chat error:', error)
      setMiniChatMessages(prev => {
        const updated = [...prev]
        updated[updated.length - 1] = {
          query: currentQuery,
          response: 'Error: Failed to get response'
        }
        return updated
      })
    } finally {
      setIsMiniLoading(false)
    }
  }

  if (!isVisible) return null

  // Canvas (draggable) mode: fixed position with drag handle + compact bg
  if (draggable) {
    return (
      <div
        className="fixed z-50 select-none"
        style={{ left: dragPos.left, top: dragPos.top, width: chatSize.width }}
      >
        {/* Drag handle */}
        <div
          className={`cursor-grab active:cursor-grabbing h-5 flex items-center justify-center rounded-t border border-b-0 border-relic-mist/40 bg-white/90 backdrop-blur-sm ${isDragging ? 'ring-1 ring-purple-300' : ''} ${isResizing ? 'ring-1 ring-blue-300' : ''}`}
          onMouseDown={handleDragStart}
        >
          <span className="text-[7px] text-relic-silver font-mono uppercase tracking-wider">≡ side canal</span>
        </div>
        {/* Content with bg for canvas visibility */}
        <div className="relative bg-white/85 backdrop-blur-sm rounded-b border border-relic-mist/40 p-1.5 overflow-y-auto overflow-x-hidden space-y-1.5 break-words" style={{ maxHeight: chatSize.height - 20 }}>
          {/* Topics */}
          {extractedTopics.length > 0 && (
            <div className="pb-1 border-b border-relic-mist/10">
              <div className="text-[6px] text-relic-silver/40 font-mono uppercase tracking-wider mb-0.5">topics</div>
              <div className="flex flex-wrap gap-0.5">
                {extractedTopics.map((topic, idx) => (
                  <span key={idx} className="text-[7px] text-relic-slate/70 font-mono">
                    {topic}{idx < extractedTopics.length - 1 ? ' ·' : ''}
                  </span>
                ))}
              </div>
            </div>
          )}
          {/* Synthetic summary */}
          {syntheticSummary.summary && (
            <div className="pb-1 border-b border-relic-mist/10">
              <div className="text-[7px] text-relic-slate/80 font-mono leading-snug">{syntheticSummary.summary}</div>
            </div>
          )}
          {/* Links */}
          {insights.filter(i => i.type === 'link').length > 0 && (
            <div className="pb-1">
              <div className="text-[6px] text-relic-silver/40 font-mono uppercase tracking-wider mb-0.5">links</div>
              {insights.filter(i => i.type === 'link').slice(0, 3).map((link) => (
                <button key={link.id} onClick={() => handleInsightClick(link)} className="block w-full text-left text-[7px] text-relic-slate/60 hover:text-relic-void font-mono truncate">
                  → {typeof link.source === 'string' ? link.source : String(link.source || 'Link')}
                </button>
              ))}
            </div>
          )}
          {/* Mini input */}
          <form onSubmit={(e) => { e.preventDefault(); if (inputText.trim() && onSendQuery) { onSendQuery(inputText.trim()); setInputText('') } }} className="flex gap-1">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="ask..."
              className="flex-1 text-[7px] font-mono bg-transparent border-b border-relic-mist/20 outline-none text-relic-slate placeholder:text-relic-silver/30 py-0.5"
            />
            <button type="submit" className="text-[7px] text-relic-silver hover:text-relic-void font-mono">→</button>
          </form>
          {/* Resize grip */}
          <div
            className="absolute bottom-0 right-0 w-5 h-5 cursor-se-resize flex items-center justify-center text-relic-silver/40 hover:text-relic-slate"
            onMouseDown={handleResizeStart}
          >
            <svg width="10" height="10" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1">
              <line x1="4" y1="14" x2="14" y2="4" />
              <line x1="8" y1="14" x2="14" y2="8" />
              <line x1="12" y1="14" x2="14" y2="12" />
            </svg>
          </div>
        </div>
      </div>
    )
  }

  // Classic mode: original fixed overlay
  return (
    <div className="fixed left-[5%] top-[35%] bottom-[15%] w-[15%] max-w-[220px] z-50 pointer-events-none">
      {/* Invisible console - no background, no border, just raw text */}
      <div className="pointer-events-auto space-y-2 overflow-y-auto max-h-full overflow-x-hidden break-words pr-6">

        {/* Topics & Share */}
        {extractedTopics.length > 0 && (
          <div className="mb-2 pb-2 border-b border-relic-mist/10 dark:border-relic-slate/20">
            <div className="flex items-center justify-between mb-1">
              <div className="text-[7px] text-relic-silver/40 dark:text-relic-ghost/50 font-mono uppercase tracking-wider">
                topics
              </div>
              {messages.length > 0 && (
                <button
                  onClick={handleShareSummary}
                  className="text-[7px] text-relic-slate/50 dark:text-relic-ghost/50 hover:text-relic-void dark:hover:text-white font-mono transition-colors"
                  title="Copy conversation summary"
                >
                  share
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-1">
              {extractedTopics.map((topic, idx) => (
                <span
                  key={idx}
                  className="text-[7px] text-relic-slate/60 dark:text-relic-ghost/60 font-mono"
                >
                  {topic}
                  {idx < extractedTopics.length - 1 && ' •'}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Share Toast */}
        {showShareToast && (
          <div className="mb-2 text-[7px] text-green-600 dark:text-green-400 font-mono animate-fade-in">
            ✓ copied to clipboard
          </div>
        )}

        {/* 3-line Synthetic Explanation */}
        {syntheticSummary.summary && (
          <div className="mb-3 pb-2 border-b border-relic-mist/10 dark:border-relic-slate/20">
            <div className="text-[8px] text-relic-slate/50 dark:text-relic-ghost/70 font-mono leading-relaxed whitespace-pre-line">
              {syntheticSummary.summary}
            </div>
          </div>
        )}

        {/* Compact Links - Raw list */}
        {insights.filter(i => i.type === 'link').length > 0 && (
          <div className="mb-2">
            <div className="space-y-0.5">
              {insights.filter(i => i.type === 'link').map((link) => (
                <button
                  key={link.id}
                  onClick={() => handleInsightClick(link)}
                  className="block w-full text-left text-[8px] text-relic-slate/60 dark:text-relic-ghost/60 hover:text-relic-void dark:hover:text-white transition-colors font-mono"
                  title={link.content}
                >
                  → {typeof link.source === 'string' ? link.source : String(link.source || 'Link')}
                </button>
              ))}
            </div>
            {/* Metacognitive Awareness */}
            {metacognition && (
              <div className="mt-2 pt-1.5 border-t border-relic-mist/10 dark:border-relic-slate/20">
                <div className="flex items-start gap-1.5">
                  <span className="text-[7px] text-relic-slate/40 dark:text-relic-ghost/50 font-mono">
                    {Math.round(metacognition.confidence * 100)}%
                  </span>
                  <p className="flex-1 text-[7px] text-relic-slate/50 dark:text-relic-ghost/60 italic font-mono leading-snug">
                    {metacognition.reasoning}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Compact Suggestion */}
        {insights.filter(i => i.type === 'suggestion').map((suggestion) => (
          <div key={suggestion.id} className="mb-2">
            <div className="text-[8px] text-relic-slate/50 dark:text-relic-ghost/60 font-mono leading-snug">
              {suggestion.content}
            </div>
          </div>
        ))}

        {/* Mini Chat Messages - Separate from main chat */}
        {miniChatMessages.length > 0 && (
          <div className="space-y-2 mb-3 max-h-[30vh] overflow-y-auto">
            {miniChatMessages.map((msg, idx) => (
              <div key={idx} className="space-y-1 group">
                <div className="flex items-center justify-between">
                  <div className="text-[7px] text-relic-void/70 dark:text-white/70 font-mono">
                    → {msg.query}
                  </div>
                  {onPromoteToMain && msg.response && msg.response !== '...' && (
                    <button
                      onClick={() => onPromoteToMain(msg.query, msg.response)}
                      className="text-[7px] text-relic-silver/30 dark:text-relic-ghost/30 hover:text-cyan-500 dark:hover:text-cyan-400 font-mono opacity-0 group-hover:opacity-100 transition-all"
                      title="Promote to main chat"
                    >
                      ↑main
                    </button>
                  )}
                </div>
                <div className="text-[7px] text-relic-slate/60 dark:text-relic-ghost/60 font-mono leading-snug pl-2">
                  {msg.response}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Minimal input */}
        <div className="mt-3 border-t border-relic-mist/10 dark:border-relic-slate/20 pt-2">
          <form onSubmit={handleSubmit} className="flex gap-1">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={isMiniLoading ? "loading..." : "query"}
              disabled={isMiniLoading}
              className="flex-1 px-2 py-1 text-[8px] font-mono bg-transparent text-relic-void dark:text-white placeholder:text-relic-silver/20 dark:placeholder:text-relic-ghost/30 focus:outline-none border-b border-relic-mist/10 dark:border-relic-slate/20 focus:border-relic-slate/20 dark:focus:border-relic-ghost/30 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!inputText.trim() || isMiniLoading}
              className="text-[8px] font-mono text-relic-silver/40 dark:text-relic-ghost/40 hover:text-relic-void dark:hover:text-white disabled:text-relic-silver/10 dark:disabled:text-relic-ghost/10"
            >
              →
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
