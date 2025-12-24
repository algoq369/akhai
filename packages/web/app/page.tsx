'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { generateId, Message } from '@/lib/chat-store'
import { trackQuery } from '@/lib/analytics'
import GuardWarning from '@/components/GuardWarning'
import MethodologyExplorer from '@/components/MethodologyExplorer'
import AuthModal from '@/components/AuthModal'
import UserProfile from '@/components/UserProfile'
import SuggestionToast from '@/components/SuggestionToast'

const METHODOLOGIES = [
  { id: 'auto', symbol: '◎', name: 'auto', tooltip: 'Smart routing', tokens: '500-5k', latency: '2-30s', savings: 'varies' },
  { id: 'direct', symbol: '→', name: 'direct', tooltip: 'Single AI, instant', tokens: '200-500', latency: '~2s', savings: '0%' },
  { id: 'cod', symbol: '⋯', name: 'cod', tooltip: 'Iterative draft', tokens: '~400', latency: '~8s', savings: '92%' },
  { id: 'bot', symbol: '◇', name: 'bot', tooltip: 'Template reasoning', tokens: '~600', latency: '~12s', savings: '88%' },
  { id: 'react', symbol: '⟳', name: 'react', tooltip: 'Tools: search, calc', tokens: '2k-8k', latency: '~20s', savings: '0%' },
  { id: 'pot', symbol: '△', name: 'pot', tooltip: 'Code computation', tokens: '3k-6k', latency: '~15s', savings: '+24%' },
  { id: 'gtp', symbol: '◯', name: 'gtp', tooltip: 'Multi-AI consensus', tokens: '8k-15k', latency: '~30s', savings: '0%' },
]

export default function HomePage() {
  const [query, setQuery] = useState('')
  const [methodology, setMethodology] = useState('auto')
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [hoveredMethod, setHoveredMethod] = useState<string | null>(null)
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 })
  const [loadingSuggestions, setLoadingSuggestions] = useState<string | null>(null)
  const [guardSuggestions, setGuardSuggestions] = useState<Record<string, { refine?: string[], pivot?: string[] }>>({})
  const [showMethodologyExplorer, setShowMethodologyExplorer] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [topicSuggestions, setTopicSuggestions] = useState<Array<{ topicId: string; topicName: string; reason: string; relevance: number }>>([])

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const diamondRef = useRef<HTMLDivElement>(null)

  // Check user session on mount
  useEffect(() => {
    checkSession()
  }, [])

  const checkSession = async () => {
    try {
      const response = await fetch('/api/auth/session')
      const data = await response.json()
      setUser(data.user)
    } catch (error) {
      console.error('Session check error:', error)
    }
  }

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Check for topic suggestions after messages update
  useEffect(() => {
    if (messages.length > 0) {
      // Get current topics from recent queries
      fetch('/api/side-canal/suggestions?topics=')
        .then(res => res.json())
        .then(data => {
          if (data.suggestions && data.suggestions.length > 0) {
            setTopicSuggestions(data.suggestions)
          }
        })
        .catch(console.error)
    }
  }, [messages])

  // Memoize close handler to prevent unnecessary re-renders
  const handleCloseExplorer = useCallback(() => {
    setShowMethodologyExplorer(false)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/3a942698-b8f2-4482-824a-ac082ba88036',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/page.tsx:41',message:'handleSubmit called',data:{query:query.trim(),methodology,isLoading,queryLength:query.trim().length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H'})}).catch(()=>{});
    // #endregion
    
    if (!query.trim() || isLoading) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/3a942698-b8f2-4482-824a-ac082ba88036',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/page.tsx:43',message:'handleSubmit early return',data:{reason:!query.trim()?'empty query':'isLoading'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H'})}).catch(()=>{});
      // #endregion
      return
    }

    const userMessage: Message = {
      id: generateId(),
      role: 'user',
      content: query.trim(),
      timestamp: new Date()
    }

    // Add user message and expand interface
    setMessages(prev => [...prev, userMessage])
    setIsExpanded(true)
    setQuery('')
    setIsLoading(true)

    const startTime = Date.now()

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/3a942698-b8f2-4482-824a-ac082ba88036',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/page.tsx:60',message:'Calling API',data:{query:userMessage.content,methodology},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'I'})}).catch(()=>{});
    // #endregion

    try {
      const res = await fetch('/api/simple-query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: userMessage.content,
          methodology,
          conversationHistory: messages.map(m => ({
            role: m.role,
            content: m.content
          }))
        })
      })

      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/3a942698-b8f2-4482-824a-ac082ba88036',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/page.tsx:74',message:'API response received',data:{ok:res.ok,status:res.status},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'I'})}).catch(()=>{});
      // #endregion

      if (!res.ok) throw new Error('Failed to get response')

      const data = await res.json()
      
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/3a942698-b8f2-4482-824a-ac082ba88036',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/page.tsx:76',message:'Response parsed',data:{hasQueryId:!!data.queryId,hasResponse:!!data.response,methodologyUsed:data.methodologyUsed},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'I'})}).catch(()=>{});
      // #endregion

      // Poll for the result if we got a queryId
      if (data.queryId) {
        await pollForResult(data.queryId, startTime)
      } else {
        // Check for grounding guard failures
        const guardFailed = data.guardResult && !data.guardResult.passed

        // Immediate response (store guard result, hide if failed)
        const assistantMessage: Message = {
          id: generateId(),
          role: 'assistant',
          content: data.response || data.finalDecision || 'No response',
          methodology: data.methodology || methodology,
          metrics: data.metrics,
          timestamp: new Date(),
          guardResult: guardFailed ? data.guardResult : undefined,
          guardAction: guardFailed ? 'pending' : undefined,
          isHidden: guardFailed,
        }
        setMessages(prev => [...prev, assistantMessage])

        // Track analytics
        const responseTime = Date.now() - startTime
        trackQuery({
          query: userMessage.content,
          methodology: methodology,
          methodologySelected: methodology,
          methodologyUsed: data.methodology || methodology,
          responseTime,
          tokens: data.metrics?.tokens || 0,
          cost: data.metrics?.cost || 0,
          groundingGuardTriggered: guardFailed,
          success: true,
        })
      }
    } catch (error) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/3a942698-b8f2-4482-824a-ac082ba88036',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/page.tsx:113',message:'Error caught',data:{error:error instanceof Error?error.message:String(error)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'J'})}).catch(()=>{});
      // #endregion
      console.error('Query error:', error)
      const errorMessage: Message = {
        id: generateId(),
        role: 'assistant',
        content: 'Sorry, there was an error processing your query. Please try again.',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])

      // Track failed query
      const responseTime = Date.now() - startTime
      trackQuery({
        query: userMessage.content,
        methodology: methodology,
        methodologySelected: methodology,
        methodologyUsed: methodology,
        responseTime,
        tokens: 0,
        cost: 0,
        groundingGuardTriggered: false,
        success: false,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      })
    } finally {
      setIsLoading(false)
      inputRef.current?.focus()
    }
  }

  const pollForResult = async (queryId: string, startTime: number) => {
    const maxAttempts = 30
    let attempts = 0

    const poll = async () => {
      try {
        const res = await fetch(`/api/query/${queryId}`)
        if (!res.ok) return

        const data = await res.json()

        if (data.status === 'complete') {
          // Check for grounding guard failures
          const guardFailed = data.guardResult && !data.guardResult.passed

          const assistantMessage: Message = {
            id: generateId(),
            role: 'assistant',
            content: data.response || data.finalDecision || 'No response',
            methodology: data.methodology,
            metrics: data.metrics,
            timestamp: new Date(),
            guardResult: guardFailed ? data.guardResult : undefined,
            guardAction: guardFailed ? 'pending' : undefined,
            isHidden: guardFailed,
          }
          setMessages(prev => [...prev, assistantMessage])
          setIsLoading(false)

          // Track analytics
          const responseTime = Date.now() - startTime
          trackQuery({
            query: messages[messages.length - 1]?.content || '',
            methodology: methodology,
            methodologySelected: methodology,
            methodologyUsed: data.methodology || methodology,
            responseTime,
            tokens: data.metrics?.tokens || 0,
            cost: data.metrics?.cost || 0,
            groundingGuardTriggered: guardFailed,
            success: true,
          })

          return
        }

        if (data.status === 'error') {
          const errorMessage: Message = {
            id: generateId(),
            role: 'assistant',
            content: data.error || 'An error occurred',
            timestamp: new Date()
          }
          setMessages(prev => [...prev, errorMessage])
          setIsLoading(false)

          // Track failed query
          const responseTime = Date.now() - startTime
          trackQuery({
            query: messages[messages.length - 1]?.content || '',
            methodology: methodology,
            methodologySelected: methodology,
            methodologyUsed: methodology,
            responseTime,
            tokens: 0,
            cost: 0,
            groundingGuardTriggered: false,
            success: false,
            errorMessage: data.error || 'Unknown error',
          })

          return
        }

        // Continue polling
        if (attempts < maxAttempts) {
          attempts++
          setTimeout(poll, 1000)
        } else {
          setIsLoading(false)
        }
      } catch (error) {
        console.error('Polling error:', error)
        setIsLoading(false)
      }
    }

    poll()
  }

  // Guard action handlers
  const handleGuardContinue = (messageId: string) => {
    setMessages(prev => prev.map(m =>
      m.id === messageId
        ? { ...m, guardAction: 'accepted', isHidden: false }
        : m
    ))
  }

  const handleGuardRefine = async (messageId: string, refinedQuery?: string) => {
    if (refinedQuery) {
      // User selected a suggestion - submit it directly
      // Don't use setQuery + handleSubmit (async state issue)
      
      // First, show the original flagged message (un-hide it with refine indicator)
      setMessages(prev => prev.map(m =>
        m.id === messageId ? { ...m, isHidden: false, guardAction: 'refined' } : m
      ))

      // Add refined query as new user message
      const userMessage: Message = {
        id: generateId(),
        role: 'user',
        content: `🔄 Refined: ${refinedQuery}`,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, userMessage])
      setIsLoading(true)

      // Submit the refined query
      try {
        const res = await fetch('/api/simple-query', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: refinedQuery,
            methodology,
            conversationHistory: messages.map(m => ({
              role: m.role,
              content: m.content
            }))
          })
        })

        const data = await res.json()
        
        const assistantMessage: Message = {
          id: generateId(),
          role: 'assistant',
          content: data.response || data.finalDecision || 'No response',
          methodology: data.methodology || methodology,
          metrics: data.metrics,
          timestamp: new Date(),
          guardResult: data.guardResult?.passed === false ? data.guardResult : undefined,
          guardAction: data.guardResult?.passed === false ? 'pending' : undefined,
          isHidden: data.guardResult?.passed === false,
        }
        setMessages(prev => [...prev, assistantMessage])
      } catch (error) {
        console.error('Refine query error:', error)
        const errorMessage: Message = {
          id: generateId(),
          role: 'assistant',
          content: 'Sorry, there was an error processing your refined query.',
          timestamp: new Date()
        }
        setMessages(prev => [...prev, errorMessage])
      } finally {
        setIsLoading(false)
      }
    } else {
      // Generate refinement suggestions
      setLoadingSuggestions(messageId)

      const message = messages.find(m => m.id === messageId)
      const messageIndex = messages.findIndex(m => m.id === messageId)
      const originalQuery = messageIndex > 0 ? messages[messageIndex - 1]?.content : ''

      // Get conversation context (last few messages for context)
      const recentMessages = messages.slice(Math.max(0, messageIndex - 4), messageIndex + 1)
        .map(m => ({ role: m.role, content: m.content }))

      try {
        const res = await fetch('/api/guard-suggestions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            originalQuery,
            guardResult: message?.guardResult,
            action: 'refine',
            conversationContext: recentMessages,
            aiResponse: message?.content
          })
        })

        const data = await res.json()
        setGuardSuggestions(prev => ({
          ...prev,
          [messageId]: { ...prev[messageId], refine: data.suggestions }
        }))
      } catch (error) {
        console.error('Failed to generate refine suggestions:', error)
        setGuardSuggestions(prev => ({
          ...prev,
          [messageId]: { ...prev[messageId], refine: [] }
        }))
      } finally {
        setLoadingSuggestions(null)
      }
    }
  }

  const handleGuardPivot = async (messageId: string, pivotQuery?: string) => {
    if (pivotQuery) {
      // User selected a suggestion - submit it directly
      // Don't use setQuery + handleSubmit (async state issue)
      // Instead, directly submit with the pivot query
      
      // First, show the original flagged message (un-hide it with pivot indicator)
      setMessages(prev => prev.map(m =>
        m.id === messageId ? { ...m, isHidden: false, guardAction: 'pivoted' } : m
      ))

      // Add pivot query as new user message
      const userMessage: Message = {
        id: generateId(),
        role: 'user',
        content: `📍 Pivoted: ${pivotQuery}`,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, userMessage])
      setIsLoading(true)

      // Submit the pivot query
      try {
        const res = await fetch('/api/simple-query', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: pivotQuery,
            methodology,
            conversationHistory: messages.map(m => ({
              role: m.role,
              content: m.content
            }))
          })
        })

        const data = await res.json()
        
        const assistantMessage: Message = {
          id: generateId(),
          role: 'assistant',
          content: data.response || data.finalDecision || 'No response',
          methodology: data.methodology || methodology,
          metrics: data.metrics,
          timestamp: new Date(),
          guardResult: data.guardResult?.passed === false ? data.guardResult : undefined,
          guardAction: data.guardResult?.passed === false ? 'pending' : undefined,
          isHidden: data.guardResult?.passed === false,
        }
        setMessages(prev => [...prev, assistantMessage])
      } catch (error) {
        console.error('Pivot query error:', error)
        const errorMessage: Message = {
          id: generateId(),
          role: 'assistant',
          content: 'Sorry, there was an error processing your pivot query.',
          timestamp: new Date()
        }
        setMessages(prev => [...prev, errorMessage])
      } finally {
        setIsLoading(false)
      }
    } else {
      // Generate pivot suggestions
      setLoadingSuggestions(messageId)

      const message = messages.find(m => m.id === messageId)
      const messageIndex = messages.findIndex(m => m.id === messageId)
      const originalQuery = messageIndex > 0 ? messages[messageIndex - 1]?.content : ''

      // Get conversation context (last few messages for context)
      const recentMessages = messages.slice(Math.max(0, messageIndex - 4), messageIndex + 1)
        .map(m => ({ role: m.role, content: m.content }))

      try {
        const res = await fetch('/api/guard-suggestions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            originalQuery,
            guardResult: message?.guardResult,
            action: 'pivot',
            conversationContext: recentMessages,
            aiResponse: message?.content
          })
        })

        const data = await res.json()
        setGuardSuggestions(prev => ({
          ...prev,
          [messageId]: { ...prev[messageId], pivot: data.suggestions }
        }))
      } catch (error) {
        console.error('Failed to generate pivot suggestions:', error)
        setGuardSuggestions(prev => ({
          ...prev,
          [messageId]: { ...prev[messageId], pivot: [] }
        }))
      } finally {
        setLoadingSuggestions(null)
      }
    }
  }

  const handleMethodHover = (m: typeof METHODOLOGIES[0], e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const containerRect = containerRef.current?.getBoundingClientRect()
    if (containerRect) {
      setTooltipPos({
        x: rect.left + rect.width / 2 - containerRect.left,
        y: rect.bottom - containerRect.top + 8
      })
    }
    setHoveredMethod(m.id)
  }

  const handleNewChat = () => {
    setMessages([])
    setIsExpanded(false)
    setQuery('')
  }

  return (
    <div className="min-h-screen bg-relic-white flex flex-col">
      {/* Header - Only show when expanded */}
      {isExpanded && (
        <header className="border-b border-relic-mist/50 bg-relic-white/80 backdrop-blur-sm sticky top-0 z-20 animate-fade-in">
          <div className="max-w-3xl mx-auto px-6 py-3">
            <div className="flex items-center justify-between">
              <button
                onClick={handleNewChat}
                className="text-[10px] uppercase tracking-[0.3em] text-relic-silver hover:text-relic-slate transition-colors"
              >
                ◊ akhai
              </button>
              <div className="flex items-center gap-3">
                <span className="text-[10px] text-relic-silver">{methodology}</span>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse-slow" />
                  <span className="text-[9px] uppercase tracking-wider text-green-600/80 font-medium">guard active</span>
                </div>
              </div>
            </div>
          </div>
        </header>
      )}

      {/* Main Content */}
      <main className={`flex-1 flex flex-col transition-all duration-500 ease-out ${isExpanded ? 'justify-start' : 'justify-center'}`}>

        {/* Logo Section - Collapses when expanded */}
        <div className={`text-center transition-all duration-500 ease-out ${isExpanded ? 'py-0 h-0 opacity-0 overflow-hidden' : 'pt-0 pb-8'}`}>
          <h1 className="text-[11px] uppercase tracking-[0.5em] text-relic-silver mb-4">
            akhai
          </h1>
          <p className="text-3xl font-light text-relic-slate tracking-wider">
            sovereign intelligence
          </p>
        </div>

        {/* Diamond - Shrinks when expanded */}
        <div
          ref={diamondRef}
          data-diamond-logo
          className={`text-center transition-all duration-500 ease-out ${isExpanded ? 'py-3 mb-2' : 'mb-16'}`}
          onMouseEnter={() => {
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/3a942698-b8f2-4482-824a-ac082ba88036',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/page.tsx:425',message:'Mouse enter diamond',data:{isExpanded},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'N'})}).catch(()=>{});
            // #endregion
            if (!isExpanded) setShowMethodologyExplorer(true)
          }}
          onMouseLeave={(e) => {
            // #region agent log
            try {
              const relatedTarget = e.relatedTarget as Element | null
              const isElement = relatedTarget instanceof Element
              let isMovingToCircle = false
              if (isElement) {
                try {
                  isMovingToCircle = !!relatedTarget.closest('[data-methodology-circle]')
                } catch (err) {
                  // Ignore errors from closest()
                }
              }
              // Only log safe, serializable data (not DOM elements)
              const logData = {
                location: 'app/page.tsx:426',
                message: 'Mouse leave diamond',
                data: {
                  isMovingToCircle,
                  relatedTargetTag: isElement ? relatedTarget.tagName : null,
                },
                timestamp: Date.now(),
                sessionId: 'debug-session',
                runId: 'run1',
                hypothesisId: 'N'
              }
              fetch('http://127.0.0.1:7242/ingest/3a942698-b8f2-4482-824a-ac082ba88036',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(logData)}).catch(()=>{});
            } catch (err) {
              // Silently ignore instrumentation errors
            }
            // #endregion
            // Only hide if not moving to circle
            try {
              const relatedTarget = e.relatedTarget as Element | null
              const isElement = relatedTarget instanceof Element
              const isMovingToCircle = isElement && relatedTarget.closest('[data-methodology-circle]')
              if (!isMovingToCircle) {
                setShowMethodologyExplorer(false)
              }
            } catch (err) {
              // If we can't determine, default to hiding
              setShowMethodologyExplorer(false)
            }
          }}
        >
          <span
            className={`
              font-extralight transition-all duration-500 cursor-pointer
              ${isExpanded ? 'text-2xl opacity-50 text-relic-mist' : 'text-7xl text-relic-mist hover:text-relic-silver hover:scale-110'}
            `}
          >
            ◊
          </span>
          {!isExpanded && (
            <p className="text-[9px] uppercase tracking-widest text-relic-silver/40 mt-3">
              hover to explore
            </p>
          )}
        </div>

        {/* Messages Area - Appears when expanded */}
        {isExpanded && (
          <div className="flex-1 overflow-y-auto px-6 pb-4">
            <div className="max-w-3xl mx-auto space-y-6">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`animate-fade-in ${message.role === 'user' ? 'text-right' : ''}`}
                >
                  {message.role === 'user' ? (
                    // User message
                    <div className="inline-block max-w-[80%] text-left">
                      <p className="text-relic-slate bg-relic-ghost/50 px-4 py-3 rounded-sm text-sm">
                        {message.content}
                      </p>
                    </div>
                  ) : (
                    // Assistant message
                    <div className="max-w-[90%]">
                      {/* Guard Warning - Shows if guard failed and pending */}
                      {message.guardResult && message.guardAction === 'pending' && (
                        <GuardWarning
                          guardResult={message.guardResult}
                          originalQuery={messages[messages.indexOf(message) - 1]?.content || ''}
                          onRefine={(query) => handleGuardRefine(message.id, query)}
                          onPivot={(query) => handleGuardPivot(message.id, query)}
                          onContinue={() => handleGuardContinue(message.id)}
                          isLoadingSuggestions={loadingSuggestions === message.id}
                          refineSuggestions={guardSuggestions[message.id]?.refine}
                          pivotSuggestions={guardSuggestions[message.id]?.pivot}
                        />
                      )}

                      {/* Actual Response - Shows if not hidden */}
                      {!message.isHidden && (
                        <div className="border-l-2 border-relic-slate/30 pl-4">
                          {/* Warning badge if accepted */}
                          {message.guardAction === 'accepted' && (
                            <div className="inline-flex items-center gap-2 text-xs text-relic-silver mb-2">
                              <span>⚠️</span>
                              <span>Flagged by Reality Check</span>
                            </div>
                          )}

                          <p className="text-relic-slate leading-relaxed whitespace-pre-wrap text-sm">
                            {message.content}
                          </p>

                          {/* Metrics */}
                          {message.metrics && (
                            <div className="flex gap-4 mt-3 text-[10px] text-relic-silver">
                            <span>
                              {message.metrics.tokens !== undefined ? (
                                message.metrics.tokens === 0 ? (
                                  <span className="text-green-600">0 tok (free)</span>
                                ) : (
                                  `${message.metrics.tokens} tok`
                                )
                              ) : '—'}
                            </span>
                            <span>
                              {message.metrics.latency && message.metrics.latency > 0
                                ? `${(message.metrics.latency / 1000).toFixed(2)}s`
                                : '—'}
                            </span>
                            <span>
                              {message.metrics.cost !== undefined ? (
                                message.metrics.cost === 0 ? (
                                  <span className="text-green-600">$0 (free)</span>
                                ) : (
                                  `$${message.metrics.cost.toFixed(4)}`
                                )
                              ) : '—'}
                            </span>
                            {message.metrics.source && (
                              <span className="text-green-600">{message.metrics.source}</span>
                            )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}

              {/* Loading indicator */}
              {isLoading && (
                <div className="animate-fade-in">
                  <div className="border-l-2 border-relic-slate/30 pl-4">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border border-relic-mist border-t-relic-slate rounded-full animate-spin" />
                      <span className="text-xs text-relic-silver">thinking...</span>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </div>
        )}

        {/* Input Section */}
        <div className={`px-6 transition-all duration-500 ease-out ${isExpanded ? 'pb-4 pt-2 border-t border-relic-mist/30 bg-relic-white/80 backdrop-blur-sm sticky bottom-0' : 'pb-8'}`}>
          <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
            {/* Input Box with Smooth Expansion */}
            <div className={`relative transition-all duration-300 ${isExpanded ? '' : ''}`}>
              <input
                ref={inputRef}
                id="query-input"
                name="query"
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={isExpanded ? "continue conversation..." : ""}
                className={`
                  relic-input text-base transition-all duration-300
                  ${isExpanded
                    ? 'text-left py-3 px-4'
                    : 'text-center py-4'
                  }
                `}
                autoFocus
                disabled={isLoading}
              />

              {/* Guard indicator */}
              {!isExpanded && (
                <div className="absolute -bottom-6 right-2 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.5)] animate-pulse-slow" />
                  <span className="text-[9px] uppercase tracking-widest text-green-600/70 font-medium">guard active</span>
                </div>
              )}
            </div>

            {/* Methodology Selection - Only when not expanded */}
            {!isExpanded && (
              <div className="mt-20 relative" ref={containerRef}>
                <p className="text-[10px] uppercase tracking-widest text-relic-silver text-center mb-5">
                  methodology
                </p>

                <div className="flex flex-wrap justify-center gap-1.5">
                  {METHODOLOGIES.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setMethodology(m.id)}
                      onMouseEnter={(e) => handleMethodHover(m, e)}
                      onMouseLeave={() => setHoveredMethod(null)}
                      className={`
                        px-3 py-1.5 text-xs font-mono transition-all duration-200
                        ${methodology === m.id
                          ? 'border-2 border-relic-slate text-relic-slate bg-transparent'
                          : 'text-relic-silver hover:text-relic-slate hover:bg-relic-ghost/50 border-2 border-transparent'
                        }
                      `}
                    >
                      <span className="mr-1.5 opacity-70">{m.symbol}</span>
                      {m.name}
                    </button>
                  ))}
                </div>

                {/* Tooltip */}
                {hoveredMethod && (
                  <div
                    className="absolute w-44 animate-fade-in z-50"
                    style={{
                      left: tooltipPos.x,
                      top: tooltipPos.y,
                      transform: 'translateX(-50%)'
                    }}
                  >
                    <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-relic-slate/30" />
                    <div className="backdrop-blur-md bg-relic-white/95 border border-relic-slate/30 text-relic-slate p-2.5 text-[10px] shadow-lg">
                      {(() => {
                        const m = METHODOLOGIES.find(x => x.id === hoveredMethod)
                        if (!m) return null
                        return (
                          <>
                            <p className="text-relic-slate mb-2">{m.tooltip}</p>
                            <div className="grid grid-cols-3 gap-1 text-[9px] border-t border-relic-mist/50 pt-2">
                              <div>
                                <span className="text-relic-silver uppercase">tok</span>
                                <p className="text-relic-slate">{m.tokens}</p>
                              </div>
                              <div>
                                <span className="text-relic-silver uppercase">lat</span>
                                <p className="text-relic-slate">{m.latency}</p>
                              </div>
                              <div>
                                <span className="text-relic-silver uppercase">sav</span>
                                <p className="text-relic-slate">{m.savings}</p>
                              </div>
                            </div>
                          </>
                        )
                      })()}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Submit button - Only when not expanded */}
            {!isExpanded && (
              <div className="mt-10 text-center">
                <button
                  type="submit"
                  id="submit-button"
                  name="submit"
                  className="px-8 py-2.5 text-xs font-mono border-2 border-relic-slate text-relic-slate bg-transparent hover:bg-relic-ghost/50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isLoading}
                >
                  transmit
                </button>
              </div>
            )}

          </form>
        </div>
      </main>

      {/* Footer - Only when not expanded */}
      {!isExpanded && (
        <footer className="border-t border-relic-mist/50 bg-relic-white/60 backdrop-blur-sm">
          <div className="max-w-4xl mx-auto px-6 py-3">
            <div className="flex items-center justify-between text-[10px] text-relic-silver">
              <span>7 methodologies · auto-routing · multi-ai consensus · grounding guard active</span>
              <div className="flex gap-5">
                {user ? (
                  <>
                    <a href="/dashboard" className="hover:text-relic-slate transition-colors">dashboard</a>
                    <a href="/history" className="hover:text-relic-slate transition-colors">history</a>
                    <span className="text-relic-silver/50 cursor-not-allowed" title="Coming in Session 3">mindmap</span>
                    <a href="/settings" className="hover:text-relic-slate transition-colors">settings</a>
                  </>
                ) : (
                  <button
                    onClick={() => setShowAuthModal(true)}
                    className="hover:text-relic-slate transition-colors"
                  >
                    create profile
                  </button>
                )}
              </div>
            </div>
          </div>
        </footer>
      )}

      {/* Methodology Explorer Modal */}
      <MethodologyExplorer
        isVisible={showMethodologyExplorer}
        onClose={handleCloseExplorer}
      />

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={() => {
          checkSession()
          setShowAuthModal(false)
        }}
      />

      {/* User Profile - Show when logged in */}
      {user && (
        <div className="fixed top-4 right-4 z-30">
          <UserProfile />
        </div>
      )}

      {/* Create Profile Button - Show when not logged in and expanded */}
      {!user && isExpanded && (
        <div className="fixed top-4 right-4 z-30">
          <button
            onClick={() => setShowAuthModal(true)}
            className="px-4 py-2 text-xs font-mono border-2 border-relic-slate/30 text-relic-slate bg-transparent hover:bg-relic-ghost/50 transition-all duration-200"
          >
            create profile
          </button>
        </div>
      )}

      {/* Topic Suggestions Toast */}
      <SuggestionToast
        suggestions={topicSuggestions}
        onSuggestionClick={(suggestion) => {
          // Inject topic context into next query
          setQuery(`[${suggestion.topicName}] `)
          setTopicSuggestions([])
        }}
        onDismiss={() => setTopicSuggestions([])}
      />
    </div>
  )
}
