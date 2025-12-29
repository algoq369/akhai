'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { generateId, Message } from '@/lib/chat-store'
import { trackQuery } from '@/lib/analytics'
import { useSideCanalStore } from '@/lib/stores/side-canal-store'
import GuardWarning from '@/components/GuardWarning'
// MethodologyExplorer removed - now using inline CSS hover
import AuthModal from '@/components/AuthModal'
import UserProfile from '@/components/UserProfile'
import SuggestionToast from '@/components/SuggestionToast'
import TopicsPanel from '@/components/TopicsPanel'
import MindMap from '@/components/MindMap'
import NavigationMenu from '@/components/NavigationMenu'
import ChatDashboard from '@/components/ChatDashboard'
import SideChat from '@/components/SideChat'
import NewsNotification from '@/components/NewsNotification'
import FunctionIndicators from '@/components/FunctionIndicators'
import MethodologyChangePrompt from '@/components/MethodologyChangePrompt'
import MethodologyFrame from '@/components/MethodologyFrame'
import SuperSaiyanIcon from '@/components/SuperSaiyanIcon'
import ResponseMindmap, { shouldShowMindmap } from '@/components/ResponseMindmap'
import InsightMindmap, { shouldShowInsightMap } from '@/components/InsightMindmap'
import SefirotResponse, { shouldShowSefirot } from '@/components/SefirotResponse'
import ConversationConsole, { InlineConsole } from '@/components/ConversationConsole'
import SefirotMini from '@/components/SefirotMini'
import { Sefirah } from '@/lib/ascent-tracker'
import { useSession } from '@/lib/session-manager'

const METHODOLOGIES = [
  { id: 'auto', symbol: '◎', name: 'auto', tooltip: 'Smart routing', tokens: '500-5k', latency: '2-30s', cost: 'varies', savings: 'varies' },
  { id: 'direct', symbol: '→', name: 'direct', tooltip: 'Single AI, instant', tokens: '200-500', latency: '~2s', cost: '$0.006', savings: '0%' },
  { id: 'cod', symbol: '⋯', name: 'cod', tooltip: 'Iterative draft', tokens: '~400', latency: '~8s', cost: '$0.012', savings: '92%' },
  { id: 'bot', symbol: '◇', name: 'bot', tooltip: 'Template reasoning', tokens: '~600', latency: '~12s', cost: '$0.018', savings: '88%' },
  { id: 'react', symbol: '⟳', name: 'react', tooltip: 'Tools: search, calc', tokens: '2k-8k', latency: '~20s', cost: '$0.024', savings: '0%' },
  { id: 'pot', symbol: '△', name: 'pot', tooltip: 'Code computation', tokens: '3k-6k', latency: '~15s', cost: '$0.018', savings: '+24%' },
  { id: 'gtp', symbol: '◯', name: 'gtp', tooltip: 'DeepSeek+Mistral+Grok', tokens: '8k-15k', latency: '~30s', cost: '$0.042', savings: '0%' },
]

interface MethodologyDetail {
  id: string
  symbol: string
  name: string
  fullName: string
  description: string
  howItWorks: string[]
  format: string
  bestFor: string[]
  examples: string[]
  metrics: {
    tokens: string
    latency: string
    cost: string
  }
}

const METHODOLOGY_DETAILS: MethodologyDetail[] = [
  {
    id: 'auto',
    symbol: '◎',
    name: 'auto',
    fullName: 'Automatic Selection',
    description: 'Intelligent routing system that analyzes your query and automatically selects the optimal methodology for the best results.',
    howItWorks: [
      'Analyzes query complexity and type',
      'Checks for math, step-by-step, or multi-perspective needs',
      'Routes to the most efficient methodology',
      'Optimizes for speed and accuracy'
    ],
    format: 'Varies based on selected methodology',
    bestFor: [
      'General queries when unsure which methodology to use',
      'Letting the system optimize for you',
      'Mixed query types in conversation'
    ],
    examples: [
      '"What is Bitcoin?" → routes to direct',
      '"Calculate 25 * 36" → routes to pot',
      '"Explain how to build an app step by step" → routes to cod'
    ],
    metrics: {
      tokens: '200-15k',
      latency: '2-30s',
      cost: '$0.006-$0.042'
    }
  },
  {
    id: 'direct',
    symbol: '→',
    name: 'direct',
    fullName: 'Direct Response',
    description: 'Single AI call with immediate, comprehensive answer. The fastest and most efficient methodology for simple queries.',
    howItWorks: [
      'Send query directly to Claude Opus 4',
      'Get complete answer in one response',
      'No intermediate steps or iterations',
      'Optimized for speed and clarity'
    ],
    format: 'Clear, comprehensive, concise answer',
    bestFor: [
      'Factual questions with clear answers',
      'Simple queries under 100 characters',
      'When you need fast responses',
      'General knowledge questions'
    ],
    examples: [
      '"What is Bitcoin?"',
      '"Define blockchain"',
      '"Who invented Ethereum?"'
    ],
    metrics: {
      tokens: '200-500',
      latency: '~2s',
      cost: '$0.006'
    }
  },
  {
    id: 'cod',
    symbol: '⋯',
    name: 'cod',
    fullName: 'Chain of Draft',
    description: 'Iterative refinement process with multiple drafts, reflections, and continuous improvement until reaching the polished final answer.',
    howItWorks: [
      'Generate initial draft addressing core question',
      'Reflect on weaknesses, gaps, improvements needed',
      'Create refined second draft based on reflection',
      'Present final polished, comprehensive answer'
    ],
    format: '[DRAFT 1] → [REFLECTION] → [DRAFT 2] → [FINAL ANSWER]',
    bestFor: [
      'Step-by-step explanations',
      'Complex topics requiring thoroughness',
      'When quality matters more than speed',
      'Educational content needing clarity'
    ],
    examples: [
      '"Explain how neural networks work step by step"',
      '"How do I build a scalable web application?"',
      '"Draft a comprehensive strategy for..."'
    ],
    metrics: {
      tokens: '600-1000',
      latency: '~8s',
      cost: '$0.030'
    }
  },
  {
    id: 'bot',
    symbol: '◇',
    name: 'bot',
    fullName: 'Buffer of Thoughts',
    description: 'Maintains a context buffer of key facts, constraints, and requirements while reasoning step-by-step and validating against the buffer.',
    howItWorks: [
      'Extract and buffer key facts, constraints, requirements',
      'Build reasoning chain referencing buffered context',
      'Cross-check answer against buffered information',
      'Provide validated answer with supporting reasoning'
    ],
    format: '[BUFFER] → [REASONING] → [VALIDATION] → [ANSWER]',
    bestFor: [
      'Queries with multiple constraints or requirements',
      'Complex context needing careful tracking',
      'Problems with specific conditions',
      'When accuracy is critical'
    ],
    examples: [
      '"Given budget $10k, 3 months timeline, must use TypeScript and be scalable..."',
      '"Assuming Bitcoin uses PoW and requires miner validation..."',
      '"With these requirements: real-time, authenticated, rate-limited..."'
    ],
    metrics: {
      tokens: '400-700',
      latency: '~12s',
      cost: '$0.018'
    }
  },
  {
    id: 'react',
    symbol: '⟳',
    name: 'react',
    fullName: 'Reasoning + Acting',
    description: 'Cycles of thinking, acting (simulated search/lookup), and observing results until reaching a well-informed final answer.',
    howItWorks: [
      'Think: Analyze what information is needed',
      'Act: Describe search/lookup operation (simulated)',
      'Observe: State findings or knowledge retrieved',
      'Repeat: Continue cycles until complete',
      'Answer: Provide final response based on observations'
    ],
    format: '[THOUGHT] → [ACTION] → [OBSERVATION] → ... → [FINAL ANSWER]',
    bestFor: [
      'Research-style queries',
      'Questions requiring information lookup',
      'Latest trends or current events',
      'Multi-source information gathering'
    ],
    examples: [
      '"Search for the latest AI research trends in 2025"',
      '"Find information about recent blockchain innovations"',
      '"Look up current best practices for..."'
    ],
    metrics: {
      tokens: '500-800',
      latency: '~20s',
      cost: '$0.024'
    }
  },
  {
    id: 'pot',
    symbol: '△',
    name: 'pot',
    fullName: 'Program of Thought',
    description: 'Computational reasoning with pseudocode, step-by-step execution, and verification. Perfect for math and logical problems.',
    howItWorks: [
      'Analyze the computational/mathematical problem',
      'Write logical steps as pseudocode',
      'Execute logic step-by-step with actual values',
      'Verify calculations and logic are correct',
      'Present final result with full explanation'
    ],
    format: '[PROBLEM] → [LOGIC/PSEUDOCODE] → [EXECUTION] → [VERIFICATION] → [RESULT]',
    bestFor: [
      'Mathematical calculations',
      'Computational problems',
      'Logic puzzles',
      'Algorithmic thinking'
    ],
    examples: [
      '"Calculate compound interest on $10k at 5% for 10 years"',
      '"What is 15 * 23?"',
      '"Compute the factorial of 12"'
    ],
    metrics: {
      tokens: '400-600',
      latency: '~15s',
      cost: '$0.020'
    }
  },
  {
    id: 'gtp',
    symbol: '◯',
    name: 'gtp',
    fullName: 'Generative Thought Process',
    description: 'Multi-AI consensus using DeepSeek, Mistral, and Grok in parallel. Each AI provides independent analysis, then they cross-pollinate insights before synthesis.',
    howItWorks: [
      'Round 1: DeepSeek, Mistral, Grok analyze independently',
      'Round 2: Each AI sees others\' perspectives and refines',
      'Synthesis: Claude merges insights into unified response',
      'Consensus: Balanced answer from multiple AI viewpoints'
    ],
    format: '[ROUND 1: Independent] → [ROUND 2: Cross-Pollination] → [SYNTHESIS] → [CONSENSUS]',
    bestFor: [
      'Complex decisions needing multiple perspectives',
      'Strategic analysis with different angles',
      'When you want AI debate and consensus',
      'High-stakes questions requiring thorough coverage'
    ],
    examples: [
      '"Analyze blockchain technology from multiple perspectives"',
      '"What are the pros and cons of remote work?"',
      '"Evaluate this business strategy from different angles"'
    ],
    metrics: {
      tokens: '8k-15k',
      latency: '~30s',
      cost: '$0.042'
    }
  }
]

export default function HomePage() {
  const [query, setQuery] = useState('')
  const [methodology, setMethodology] = useState('auto')
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [hoveredMethod, setHoveredMethod] = useState<string | null>(null)
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 })
  const [isBlinking, setIsBlinking] = useState<string | null>(null)
  const [loadingSuggestions, setLoadingSuggestions] = useState<string | null>(null)
  const [guardSuggestions, setGuardSuggestions] = useState<Record<string, { refine?: string[], pivot?: string[] }>>({})
  const [darkMode, setDarkMode] = useState(false)
  const [expandedMethodology, setExpandedMethodology] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)
  const [showAuthModal, setShowAuthModal] = useState(false)
  // topicSuggestions and showTopicsPanel now managed by Side Canal store
  const [showMindMap, setShowMindMap] = useState(false)
  const [showDashboard, setShowDashboard] = useState(false)
  const [legendMode, setLegendMode] = useState(false)
  const [sideChats, setSideChats] = useState<Array<{ id: string; methodology: string; messages: Message[] }>>([])
  const [activeChatId, setActiveChatId] = useState<string | null>(null)
  const [continuingConversation, setContinuingConversation] = useState<string | null>(null)
  const [showMethodologyPrompt, setShowMethodologyPrompt] = useState(false)
  const [pendingMethodology, setPendingMethodology] = useState<string | null>(null)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [mindmapVisibility, setMindmapVisibility] = useState<Record<string, boolean>>({})
  const [vizMode, setVizMode] = useState<Record<string, 'sefirot' | 'insight' | 'text' | 'mindmap'>>({})
  const [gnosticVisibility, setGnosticVisibility] = useState<Record<string, boolean>>({})

  // Gnostic Session Management - Track user's ascent journey
  const { sessionId, isClient } = useSession()

  // Side Canal Store Integration
  const {
    enabled: sideCanalEnabled,
    contextInjectionEnabled,
    autoExtractEnabled,
    suggestions: topicSuggestions,
    toastVisible: topicToastVisible,
    panelOpen: showTopicsPanel,
    extractAndStoreTopics,
    refreshSuggestions,
    removeSuggestion,
    setToastVisible: setTopicToastVisible,
    setPanelOpen: setShowTopicsPanel,
    toggleEnabled: setSideCanalEnabled,
    toggleContextInjection: setContextInjectionEnabled,
  } = useSideCanalStore()

  // Intelligence toggles
  const [realtimeDataEnabled, setRealtimeDataEnabled] = useState(false)
  const [newsNotificationsEnabled, setNewsNotificationsEnabled] = useState(false)
  
  // Console feature toggles
  const [instinctModeEnabled, setInstinctModeEnabled] = useState(false)
  const [suggestionsEnabled, setSuggestionsEnabled] = useState(true)
  const [auditEnabled, setAuditEnabled] = useState(false)
  const [mindmapConnectorEnabled, setMindmapConnectorEnabled] = useState(false)
  const [selectedModel, setSelectedModel] = useState('claude')
  const [globalVizMode, setGlobalVizMode] = useState<'off' | 'synthesis' | 'insight'>('synthesis')

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const diamondRef = useRef<HTMLDivElement>(null)

  // Extract topics from response and update message (for mindmap visualization)
  const extractTopicsForMessage = useCallback(async (
    messageId: string,
    query: string,
    response: string
  ) => {
    // Skip if Side Canal is disabled or auto-extract is off
    if (!sideCanalEnabled || !autoExtractEnabled) {
      return
    }

    try {
      // Call store action to extract and store topics
      const topics = await extractAndStoreTopics(query, response, messageId)

      if (topics && topics.length > 0) {
        // Update the message with extracted topics (for mindmap visualization)
        setMessages(prev => prev.map(m =>
          m.id === messageId
            ? { ...m, topics: topics.map((t: any) => ({
                id: t.id,
                name: t.name,
                category: t.category
              }))}
            : m
        ))
      }
    } catch (error) {
      console.error('[Side Canal] Topic extraction error:', error)
    }
  }, [sideCanalEnabled, autoExtractEnabled, extractAndStoreTopics])

  // Auto-Synopsis Background Task (Side Canal)
  // Generates synopses for topics with new queries every 5 minutes
  useEffect(() => {
    const { autoSynopsisEnabled, currentTopics, generateSynopsisForTopic } = useSideCanalStore.getState()

    if (!sideCanalEnabled || !autoSynopsisEnabled) {
      return
    }

    // Generate synopses for current topics on mount (if any)
    if (currentTopics.length > 0) {
      currentTopics.forEach(topic => {
        generateSynopsisForTopic(topic.id).catch(error => {
          console.error('[Side Canal] Auto-synopsis failed for topic:', topic.id, error)
        })
      })
    }

    // Set up interval for periodic synopsis generation
    const interval = setInterval(() => {
      const state = useSideCanalStore.getState()
      if (state.autoSynopsisEnabled && state.currentTopics.length > 0) {
        state.currentTopics.forEach(topic => {
          state.generateSynopsisForTopic(topic.id).catch(error => {
            console.error('[Side Canal] Auto-synopsis failed for topic:', topic.id, error)
          })
        })
      }
    }, 5 * 60 * 1000) // 5 minutes

    return () => clearInterval(interval)
  }, [sideCanalEnabled]) // Re-run when Side Canal is toggled

  // Dark mode initialization
  useEffect(() => {
    const savedDarkMode = localStorage.getItem('darkMode') === 'true'
    setDarkMode(savedDarkMode)
    if (savedDarkMode) {
      document.documentElement.classList.add('dark')
    }
  }, [])

  // Toggle dark mode
  const toggleDarkMode = useCallback(() => {
    setDarkMode(prev => {
      const newValue = !prev
      localStorage.setItem('darkMode', String(newValue))
      if (newValue) {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
      return newValue
    })
  }, [])

  // Check user session on mount
  useEffect(() => {
    try {
      checkSession()
      
      // Check for conversation continuation from URL
      const params = new URLSearchParams(window.location.search)
      const continueId = params.get('continue')
      if (continueId) {
        loadConversation(continueId)
      }
      
      // Check for legend mode in localStorage
      try {
        const savedLegendMode = localStorage.getItem('legendMode') === 'true'
        if (savedLegendMode) {
          setLegendMode(true)
        }
      } catch (e) {
      }
    } catch (error) {
      console.error('Mount error:', error)
    }
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

  // Legend mode detection in query input
  const handleQueryChange = (value: string) => {
    setQuery(value)
    // Check for legend mode trigger
    if (value.toLowerCase().includes('algoq369')) {
      setLegendMode(true)
      localStorage.setItem('legendMode', 'true')
      // Remove trigger from query
      setQuery(value.replace(/algoq369/gi, '').trim())
    }
  }

  // Load conversation history
  const loadConversation = async (queryId: string) => {
    try {
      const res = await fetch(`/api/history/${queryId}/conversation`)
      if (res.ok) {
        const data = await res.json()
        if (data.messages && data.messages.length > 0) {
          const loadedMessages = data.messages.map((msg: any) => ({
            id: generateId(),
            role: msg.role,
            content: msg.content,
            timestamp: new Date(msg.timestamp * 1000),
            methodology: msg.methodology,
          }))
          setMessages(loadedMessages)
          setContinuingConversation(queryId)
          setIsExpanded(true)
          // Clear URL param
          window.history.replaceState({}, '', '/')
          setTimeout(() => setContinuingConversation(null), 3000)
        }
      }
    } catch (error) {
      console.error('Failed to load conversation:', error)
    }
  }

  // Handle methodology switching
  const handleMethodologySwitch = (newMethodology: string, option: 'same' | 'side' | 'new') => {
    if (option === 'same') {
      setMethodology(newMethodology)
    } else if (option === 'side') {
      const sideChatId = generateId()
      setSideChats(prev => [...prev, {
        id: sideChatId,
        methodology: newMethodology,
        messages: []
      }])
      setActiveChatId(sideChatId)
    } else if (option === 'new') {
      setMessages([])
      setMethodology(newMethodology)
      setQuery('')
    }
  }

  // Handle guard toggle
  const handleGuardToggle = (feature: 'suggestions' | 'bias' | 'hype' | 'echo' | 'drift' | 'factuality', enabled: boolean) => {
    // Store in localStorage for persistence
    localStorage.setItem(`guard_${feature}`, enabled ? 'true' : 'false')
  }

  // Check for topic suggestions after messages update
  useEffect(() => {
    if (messages.length > 0 && sideCanalEnabled) {
      // Refresh suggestions from store when messages change
      refreshSuggestions().catch(console.error)
    }
  }, [messages, sideCanalEnabled, refreshSuggestions])

  // Extract visible page content for context
  const getPageContext = useCallback(() => {
    try {
      // Get all visible text content from the main content area
      const mainContent = document.querySelector('main')
      if (!mainContent) return undefined

      // Extract text from messages (if in chat mode)
      if (isExpanded && messages.length > 0) {
        const messageTexts = messages
          .slice(-5) // Last 5 messages for context
          .map(m => `${m.role === 'user' ? 'User' : 'AkhAI'}: ${m.content}`)
          .join('\n\n')
        
        return `Current conversation context:\n${messageTexts}`
      }

      // Extract text from visible content on page
      const visibleText = Array.from(mainContent.querySelectorAll('p, h1, h2, h3, h4, h5, h6, li, span'))
        .filter(el => {
          const style = window.getComputedStyle(el)
          return style.display !== 'none' && 
                 style.visibility !== 'hidden' && 
                 el.textContent && 
                 el.textContent.trim().length > 10
        })
        .map(el => el.textContent?.trim())
        .filter(Boolean)
        .slice(0, 10) // Limit to first 10 elements
        .join('\n')

      return visibleText || undefined
    } catch (error) {
      console.error('Failed to extract page context:', error)
      return undefined
    }
  }, [isExpanded, messages])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!query.trim() || isLoading) {
      return
    }

    // Start transition animation
    setIsTransitioning(true)
    
    // Wait for transition animation before proceeding
    await new Promise(resolve => setTimeout(resolve, 800))

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
    setIsTransitioning(false)

    const startTime = Date.now()


    try {
      const currentChatId = activeChatId || 'main'
      const pageContext = getPageContext()
      const res = await fetch('/api/simple-query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-session-id': sessionId, // GNOSTIC: Send session ID for Ascent Tracker
        },
        body: JSON.stringify({
          query: userMessage.content,
          methodology,
          conversationHistory: messages.map(m => ({
            role: m.role,
            content: m.content
          })),
          legendMode,
          chatId: currentChatId,
          pageContext
        })
      })


      if (!res.ok) throw new Error('Failed to get response')

      const data = await res.json()
      
      // Handle Side Canal suggestions - refresh from store
      if (data.sideCanal?.suggestions && data.sideCanal.suggestions.length > 0) {
        // Suggestions are now managed by the store, refresh will be triggered automatically
        // by the extractTopicsForMessage callback
      }

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
          gnostic: data.gnostic, // GNOSTIC: Capture metadata from API
        }
        setMessages(prev => [...prev, assistantMessage])

        // Extract topics for mindmap (async, non-blocking)
        extractTopicsForMessage(
          assistantMessage.id,
          userMessage.content,
          assistantMessage.content
        )

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
            gnostic: data.gnostic, // GNOSTIC: Capture metadata from API
          }
          setMessages(prev => [...prev, assistantMessage])
          setIsLoading(false)

          // Extract topics for mindmap (async, non-blocking)
          const lastUserMessage = messages[messages.length - 1]
          if (lastUserMessage?.role === 'user') {
            extractTopicsForMessage(
              assistantMessage.id,
              lastUserMessage.content,
              assistantMessage.content
            )
          }

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
      // IMPORTANT: Capture current messages BEFORE any state updates (stale closure fix)
      const currentMessages = [...messages]
      
      // Mark the original flagged message as "refined" - keep alert visible but hide response content
      // This preserves the context of what was flagged and what action was taken
      setMessages(prev => prev.map(m =>
        m.id === messageId 
          ? { ...m, guardAction: 'refined', guardActionQuery: refinedQuery, isHidden: true }
          : m
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

      // Build conversation history - EXCLUDE the flagged message (user rejected it)
      const conversationHistory = [
        ...currentMessages
          .filter(m => m.id !== messageId && !m.isHidden) // Exclude flagged/hidden messages
          .map(m => ({ role: m.role, content: m.content })),
        { role: 'user' as const, content: refinedQuery }
      ]

      // Submit the refined query
      try {
        const pageContext = getPageContext()
        const res = await fetch('/api/simple-query', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-session-id': sessionId, // GNOSTIC: Send session ID for Ascent Tracker
          },
          body: JSON.stringify({
            query: refinedQuery,
            methodology,
            conversationHistory,
            legendMode,
            chatId: activeChatId || 'main',
            pageContext
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
          gnostic: data.gnostic, // GNOSTIC: Capture metadata from API
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
            legendMode,
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
      // IMPORTANT: Capture current messages BEFORE any state updates (stale closure fix)
      const currentMessages = [...messages]
      
      // Mark the original flagged message as "pivoted" - keep alert visible but hide response content
      // This preserves the context of what was flagged and what action was taken
      setMessages(prev => prev.map(m =>
        m.id === messageId 
          ? { ...m, guardAction: 'pivoted', guardActionQuery: pivotQuery, isHidden: true }
          : m
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

      // Build conversation history - EXCLUDE the flagged message (user rejected it)
      const conversationHistory = [
        ...currentMessages
          .filter(m => m.id !== messageId && !m.isHidden) // Exclude flagged/hidden messages
          .map(m => ({ role: m.role, content: m.content })),
        { role: 'user' as const, content: pivotQuery }
      ]

      // Submit the pivot query
      try {
        const pageContext = getPageContext()
        const res = await fetch('/api/simple-query', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-session-id': sessionId, // GNOSTIC: Send session ID for Ascent Tracker
          },
          body: JSON.stringify({
            query: pivotQuery,
            methodology,
            conversationHistory,
            legendMode,
            chatId: activeChatId || 'main',
            pageContext
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
          gnostic: data.gnostic, // GNOSTIC: Capture metadata from API
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
            legendMode,
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

  const handleMethodologyClick = (id: string) => {
    // If conversation is in progress, show prompt
    if (messages.length > 0) {
      setPendingMethodology(id)
      setShowMethodologyPrompt(true)
    } else {
      // No conversation yet, directly set methodology
      setMethodology(id)
      setIsBlinking(id)
      setTimeout(() => setIsBlinking(null), 300)
    }
  }

  // Handle methodology prompt choices
  const handleContinueInCurrentChat = () => {
    if (pendingMethodology) {
      setMethodology(pendingMethodology)
      setIsBlinking(pendingMethodology)
      setTimeout(() => setIsBlinking(null), 300)
    }
    setShowMethodologyPrompt(false)
    setPendingMethodology(null)
  }

  const handleStartNewChat = () => {
    if (pendingMethodology) {
      // Clear current conversation and start fresh with new methodology
      setMessages([])
      setMethodology(pendingMethodology)
      setIsExpanded(false)
      setIsBlinking(pendingMethodology)
      setTimeout(() => setIsBlinking(null), 300)
    }
    setShowMethodologyPrompt(false)
    setPendingMethodology(null)
  }

  const handleCancelMethodologyChange = () => {
    setShowMethodologyPrompt(false)
    setPendingMethodology(null)
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
    <div className={`min-h-screen flex flex-col transition-colors duration-300 ${darkMode ? 'bg-relic-void' : 'bg-white'}`}>
      {/* Header - Only show when expanded */}
      {isExpanded && (
        <header className="border-b border-relic-mist/50 dark:border-relic-slate/30 bg-relic-white/80 dark:bg-relic-void/80 backdrop-blur-sm sticky top-0 z-20 animate-fade-in">
          <div className="max-w-3xl mx-auto px-6 py-3">
            <div className="flex items-center justify-between">
              <button
                onClick={handleNewChat}
                className="text-[10px] uppercase tracking-[0.3em] text-relic-silver dark:text-relic-silver/70 hover:text-relic-slate dark:hover:text-relic-ghost transition-colors"
              >
                ◊ akhai
              </button>
              <div className="flex items-center gap-3">
                <span className="text-[10px] text-relic-silver dark:text-relic-silver/70">{methodology}</span>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-blink-green" />
                  <span className="text-[9px] uppercase tracking-wider text-relic-silver dark:text-relic-silver/70 font-medium">guard active</span>
                </div>
              </div>
            </div>
          </div>
        </header>
      )}

      {/* Main Content */}
      <main className={`flex-1 flex flex-col transition-all duration-500 ease-out ${isExpanded && user ? 'ml-80' : ''}`}>

        {/* Logo Section - Fixed at TOP when not expanded */}
        {!isExpanded && (
          <div className="text-center pt-8 pb-4">
            <h1 className="text-3xl font-light text-relic-slate dark:text-white tracking-[0.3em] mb-2">
              A K H A I
            </h1>
            <p className="text-sm font-light text-relic-silver/60 dark:text-white/50 tracking-wide mb-1">
              school of thoughts
            </p>
            <p className="text-[10px] uppercase tracking-[0.2em] text-relic-slate/50 dark:text-white/40 mb-6">
              SOVEREIGN TECHNOLOGY
            </p>
            {/* Diamond Logo with INLINE methodology explorer - no more flickering */}
            <div className="group relative inline-block">
        <div
          ref={diamondRef}
                data-diamond-logo
                className="cursor-pointer"
              >
                <span className="text-5xl font-extralight text-relic-mist dark:text-relic-silver/30 group-hover:text-relic-silver dark:group-hover:text-relic-ghost group-hover:scale-110 transition-all duration-500 inline-block">
            ◊
          </span>
                <p className="text-[9px] uppercase tracking-widest text-relic-silver/40 mt-2">
              hover to explore
            </p>
              </div>
              
              {/* Inline Methodology Explorer - appears on hover or when expanded, no separate component */}
              <div className={`absolute left-1/2 -translate-x-1/2 mt-4 transition-all duration-300 z-50 ${
                expandedMethodology 
                  ? 'opacity-100 visible' 
                  : 'opacity-0 invisible group-hover:opacity-100 group-hover:visible'
              }`}>
                {expandedMethodology ? (
                  /* Detailed View */
                  <div className="bg-relic-white border border-relic-mist shadow-xl p-6 w-[600px]">
                    {(() => {
                      const detail = METHODOLOGY_DETAILS.find(m => m.id === expandedMethodology)
                      if (!detail) return null
                      return (
                        <>
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-4">
                              <span className="text-4xl text-relic-slate">{detail.symbol}</span>
                              <div>
                                <h3 className="text-xl font-mono text-relic-slate">{detail.name}</h3>
                                <p className="text-sm text-relic-silver">{detail.fullName}</p>
                              </div>
                            </div>
                            <button
                              onClick={() => setExpandedMethodology(null)}
                              className="text-relic-silver hover:text-relic-slate text-xl"
                            >
                              ×
                            </button>
                          </div>
                          <p className="text-sm text-relic-slate mb-4">{detail.description}</p>
                          <div className="space-y-4">
                            <div>
                              <h4 className="text-xs uppercase tracking-wider text-relic-silver mb-2">How It Works</h4>
                              <ul className="space-y-1">
                                {detail.howItWorks.map((step, i) => (
                                  <li key={i} className="text-xs text-relic-slate flex items-start gap-2">
                                    <span className="text-relic-silver">→</span>
                                    <span>{step}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                            <div>
                              <h4 className="text-xs uppercase tracking-wider text-relic-silver mb-2">Best For</h4>
                              <ul className="space-y-1">
                                {detail.bestFor.map((item, i) => (
                                  <li key={i} className="text-xs text-relic-slate flex items-start gap-2">
                                    <span className="text-relic-silver">•</span>
                                    <span>{item}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                            <div className="flex gap-4 pt-2 border-t border-relic-mist">
                              <div>
                                <span className="text-[9px] uppercase text-relic-silver">Tokens</span>
                                <p className="text-xs text-relic-slate">{detail.metrics.tokens}</p>
                              </div>
                              <div>
                                <span className="text-[9px] uppercase text-relic-silver">Latency</span>
                                <p className="text-xs text-relic-slate">{detail.metrics.latency}</p>
                              </div>
                              <div>
                                <span className="text-[9px] uppercase text-relic-silver">Cost</span>
                                <p className="text-xs text-relic-slate">{detail.metrics.cost}</p>
                              </div>
                            </div>
                            <button
                              onClick={() => {
                                setMethodology(expandedMethodology)
                                setExpandedMethodology(null)
                              }}
                              className="w-full px-4 py-2 text-xs font-mono bg-relic-slate text-white hover:bg-relic-void transition-colors"
                            >
                              Select {detail.name}
                            </button>
                          </div>
                        </>
                      )
                    })()}
                  </div>
                ) : (
                  /* Horizontal List */
                  <div className="bg-relic-white border border-relic-mist shadow-xl p-3">
                    <div className="flex gap-2">
                      {METHODOLOGIES.map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => {
                            setExpandedMethodology(m.id)
                          }}
                          className={`
                            flex flex-col items-center justify-center w-16 h-16 
                            border transition-all duration-200 bg-relic-white
                            ${methodology === m.id
                              ? 'border-relic-slate text-relic-slate'
                              : 'border-relic-mist hover:border-relic-slate/60 text-relic-slate'
                            }
                          `}
                        >
                          <span className="text-lg">{m.symbol}</span>
                          <span className="text-[9px] font-mono mt-1">{m.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
          )}
        </div>
            </div>
          </div>
        )}

        {/* Spacer to push query to center when not expanded */}
        {!isExpanded && <div className="flex-1" />}

        {/* Diamond for expanded mode only - small version */}
        {isExpanded && (
          <div className="text-center py-3 mb-2">
            <span className="text-2xl font-extralight opacity-50 text-relic-mist">
              ◊
            </span>
          </div>
        )}

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

                      {/* Condensed Alert - Shows after any guard action was taken (Refine/Pivot/Continue) */}
                      {message.guardResult && (message.guardAction === 'refined' || message.guardAction === 'pivoted' || message.guardAction === 'accepted') && (
                        <div className="mt-4 mb-4 bg-relic-ghost/20 border-l-2 border-relic-slate/20 p-3 animate-fade-in">
                          <div className="flex items-center gap-2 text-xs">
                              <span>⚠️</span>
                            <span className="font-medium text-relic-slate">Reality Check</span>
                          </div>
                          
                          {/* Show violations */}
                          {message.guardResult.sanityViolations && message.guardResult.sanityViolations.length > 0 && (
                            <div className="mt-2 text-xs text-relic-silver">
                              {message.guardResult.sanityViolations.map((v, i) => (
                                <div key={i} className="flex items-start gap-1">
                                  <span>→</span>
                                  <span>{v}</span>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Show other issues */}
                          {message.guardResult.issues && message.guardResult.issues.filter(i => i !== 'sanity').length > 0 && (
                            <div className="mt-2 flex gap-2">
                              {message.guardResult.issues.filter(i => i !== 'sanity').map((issue, i) => (
                                <span key={i} className="text-[10px] px-2 py-0.5 bg-relic-mist/50 text-relic-silver rounded">
                                  {issue}
                                </span>
                              ))}
                            </div>
                          )}
                          
                          {/* Show action taken */}
                          <div className="mt-2 text-xs text-relic-slate border-t border-relic-mist/30 pt-2">
                            {message.guardAction === 'accepted' && (
                              <span className="text-green-600">✓ Continued with caution</span>
                            )}
                            {message.guardAction === 'refined' && (
                              <>
                                <span className="text-relic-silver">🔄 Refined to:</span>
                                <span className="ml-2 italic">{message.guardActionQuery}</span>
                              </>
                            )}
                            {message.guardAction === 'pivoted' && (
                              <>
                                <span className="text-relic-silver">📍 Pivoted to:</span>
                                <span className="ml-2 italic">{message.guardActionQuery}</span>
                              </>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Actual Response - Shows if not hidden */}
                      {!message.isHidden && (
                        <div className="border-l-2 border-relic-slate/30 pl-4">

                          {/* View Mode Toggle */}
                          {globalVizMode !== 'off' && (shouldShowSefirot(message.content) || shouldShowInsightMap(message.content) || shouldShowMindmap(message.content, message.topics)) && (
                            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-relic-mist/30">
                              <span className="text-[9px] text-relic-silver uppercase tracking-wide">View:</span>
                              <button
                                onClick={() => setVizMode(prev => ({ ...prev, [message.id]: 'sefirot' }))}
                                className={`px-2 py-1 text-[9px] rounded-md transition-all ${
                                  (vizMode[message.id] || 'sefirot') === 'sefirot'
                                    ? 'bg-indigo-100 text-indigo-700 font-medium'
                                    : 'text-relic-silver hover:bg-relic-ghost'
                                }`}
                              >
                                ◎ Sefirot
                              </button>
                              <button
                                onClick={() => setVizMode(prev => ({ ...prev, [message.id]: 'insight' }))}
                                className={`px-2 py-1 text-[9px] rounded-md transition-all ${
                                  vizMode[message.id] === 'insight'
                                    ? 'bg-purple-100 text-purple-700 font-medium'
                                    : 'text-relic-silver hover:bg-relic-ghost'
                                }`}
                              >
                                ◇ Insight
                              </button>
                              <button
                                onClick={() => setVizMode(prev => ({ ...prev, [message.id]: 'mindmap' }))}
                                className={`px-2 py-1 text-[9px] rounded-md transition-all ${
                                  vizMode[message.id] === 'mindmap'
                                    ? 'bg-emerald-100 text-emerald-700 font-medium'
                                    : 'text-relic-silver hover:bg-relic-ghost'
                                }`}
                              >
                                ◈ Mindmap
                              </button>
                            </div>
                          )}

                          {/* SEFIROT VIEW - Sovereign Intelligence Tree */}
                          {globalVizMode !== 'off' && (vizMode[message.id] || 'sefirot') === 'sefirot' && shouldShowSefirot(message.content) && (
                            <SefirotResponse
                              content={message.content}
                              query={messages[messages.indexOf(message) - 1]?.content || ''}
                              methodology={message.methodology || methodology}
                              onSwitchToInsight={() => setVizMode(prev => ({ ...prev, [message.id]: 'insight' }))}
                              onOpenMindMap={() => setShowMindMap(true)}
                            />
                          )}

                          {/* INSIGHT MINDMAP - Grokipedia-style knowledge graph */}
                          {globalVizMode !== 'off' && vizMode[message.id] === 'insight' && shouldShowInsightMap(message.content) && (
                            <InsightMindmap
                              content={message.content}
                              query={messages[messages.indexOf(message) - 1]?.content || ''}
                              methodology={message.methodology || methodology}
                              onSwitchToSefirot={() => setVizMode(prev => ({ ...prev, [message.id]: 'sefirot' }))}
                              onOpenMindMap={() => setShowMindMap(true)}
                            />
                          )}

                          {/* MINDMAP VIEW - Visual concept map */}
                          {globalVizMode !== 'off' && vizMode[message.id] === 'mindmap' && shouldShowMindmap(message.content, message.topics) && (
                            <div className="mb-6">
                              <ResponseMindmap
                                content={message.content}
                                topics={message.topics}
                                isVisible={true}
                                onToggle={() => {}}
                                methodology={message.methodology || methodology}
                                query={messages[messages.indexOf(message) - 1]?.content || ''}
                              />
                            </div>
                          )}

                          {/* TEXT - Always shown after visualizations */}
                          <p className="text-relic-slate leading-relaxed whitespace-pre-wrap text-sm">
                            {message.content}
                          </p>

                          {/* Inline Visualize Button */}
                          {(shouldShowSefirot(message.content) || shouldShowInsightMap(message.content)) && globalVizMode === 'off' && (
                            <InlineConsole
                              onVisualize={() => setVizMode(prev => ({ ...prev, [message.id]: 'sefirot' }))}
                            />
                          )}

                          {/* Response Mindmap - Visual concept map */}
                          {shouldShowMindmap(message.content, message.topics) && (
                            <ResponseMindmap
                              content={message.content}
                              topics={message.topics}
                              isVisible={mindmapVisibility[message.id] || false}
                              onToggle={() => setMindmapVisibility(prev => ({
                                ...prev,
                                [message.id]: !prev[message.id]
                              }))}
                              methodology={methodology}
                              query={messages[messages.indexOf(message) - 1]?.content || ''}
                            />
                          )}

                          {/* ================================================================ */}
                          {/* GNOSTIC SOVEREIGN INTELLIGENCE FOOTER */}
                          {/* ================================================================ */}
                          {message.gnostic && (
                            <div className="mt-6 pt-4 border-t border-zinc-800/30">
                              {/* Toggle Button */}
                              <button
                                onClick={() => setGnosticVisibility(prev => ({
                                  ...prev,
                                  [message.id]: !prev[message.id]
                                }))}
                                className="flex items-center gap-2 text-[10px] text-zinc-500 hover:text-zinc-400 transition-colors mb-3"
                              >
                                <span className="text-purple-500">⟁</span>
                                <span className="uppercase tracking-wider">Gnostic Intelligence</span>
                                <span className="text-zinc-600">
                                  {gnosticVisibility[message.id] ? '▼' : '▶'}
                                </span>
                              </button>

                              {gnosticVisibility[message.id] && (
                                <div className="space-y-4 animate-fade-in">
                                  {/* Qliphoth Purification Notice */}
                                  {message.gnostic.qliphothPurified && (
                                    <div className="bg-purple-500/5 border border-purple-500/20 rounded-md p-3">
                                      <div className="flex items-center gap-2 text-xs text-purple-400 mb-1">
                                        <span>🛡️</span>
                                        <span className="font-medium">Anti-Qliphoth Shield Activated</span>
                                      </div>
                                      <p className="text-[10px] text-zinc-400">
                                        Detected <span className="text-purple-400">{message.gnostic.qliphothType}</span> pattern. Response has been purified to align with Sephirothic light.
                                      </p>
                                    </div>
                                  )}

                                  {/* Sovereignty Reminder */}
                                  {message.gnostic.sovereigntyFooter && (
                                    <div className="bg-amber-500/5 border border-amber-500/20 rounded-md p-3">
                                      <div className="flex items-center gap-2 text-xs text-amber-400 mb-1">
                                        <span>👁️</span>
                                        <span className="font-medium">Sovereignty Reminder</span>
                                      </div>
                                      <p className="text-[10px] text-zinc-400 whitespace-pre-wrap">
                                        {message.gnostic.sovereigntyFooter}
                                      </p>
                                    </div>
                                  )}

                                  {/* Sephirothic Activation Visualization */}
                                  <div>
                                    <SefirotMini
                                      activations={message.gnostic.sephirothAnalysis.activations}
                                      userLevel={message.gnostic.ascentState?.currentLevel as Sefirah}
                                      className="mx-auto"
                                    />
                                  </div>

                                  {/* Ascent Progress */}
                                  {message.gnostic.ascentState && (
                                    <div className="bg-zinc-800/20 rounded-md p-3">
                                      <div className="text-[10px] text-zinc-500 uppercase tracking-wider mb-2">
                                        Tree of Life Ascent
                                      </div>
                                      <div className="flex items-center justify-between mb-2">
                                        <span className="text-xs text-zinc-300">
                                          Current Level: <span className="text-purple-400">{message.gnostic.ascentState.levelName}</span>
                                        </span>
                                        <span className="text-xs text-zinc-500">
                                          {message.gnostic.ascentState.currentLevel}/11
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-2 text-[10px] text-zinc-500">
                                        <span>Velocity:</span>
                                        <span className={message.gnostic.ascentState.velocity > 2.0 ? 'text-amber-400' : 'text-zinc-400'}>
                                          {message.gnostic.ascentState.velocity.toFixed(2)} levels/query
                                          {message.gnostic.ascentState.velocity > 2.0 && ' ⚡'}
                                        </span>
                                      </div>
                                      <div className="text-[10px] text-zinc-500 mt-1">
                                        Total Queries: {message.gnostic.ascentState.totalQueries}
                                      </div>
                                      {message.gnostic.ascentState.nextElevation && (
                                        <div className="mt-3 pt-3 border-t border-zinc-700/50">
                                          <div className="text-[9px] text-zinc-600 uppercase tracking-wider mb-1">
                                            Next Elevation
                                          </div>
                                          <p className="text-[10px] text-zinc-400">
                                            {message.gnostic.ascentState.nextElevation}
                                          </p>
                                        </div>
                                      )}
                                    </div>
                                  )}

                                  {/* Da'at Insight */}
                                  {message.gnostic.sephirothAnalysis.daatInsight && (
                                    <div className="bg-indigo-500/5 border border-indigo-500/20 rounded-md p-3">
                                      <div className="flex items-center gap-2 text-xs text-indigo-400 mb-1">
                                        <span>✨</span>
                                        <span className="font-medium">Da'at - Hidden Knowledge Emerged</span>
                                      </div>
                                      <p className="text-[10px] text-zinc-400">
                                        {message.gnostic.sephirothAnalysis.daatInsight.insight}
                                      </p>
                                      <div className="text-[9px] text-zinc-600 mt-1">
                                        Confidence: {(message.gnostic.sephirothAnalysis.daatInsight.confidence * 100).toFixed(0)}%
                                      </div>
                                    </div>
                                  )}

                                  {/* Kether Protocol State */}
                                  {message.gnostic.ketherState && (
                                    <div className="bg-zinc-800/20 rounded-md p-3">
                                      <div className="text-[10px] text-zinc-500 uppercase tracking-wider mb-2">
                                        Kether Protocol - Self-Awareness
                                      </div>
                                      <div className="space-y-1 text-[10px]">
                                        <div className="flex justify-between">
                                          <span className="text-zinc-500">Intent:</span>
                                          <span className="text-zinc-300">{message.gnostic.ketherState.intent}</span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span className="text-zinc-500">Boundary:</span>
                                          <span className="text-zinc-300">{message.gnostic.ketherState.boundary}</span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span className="text-zinc-500">Reflection Mode:</span>
                                          <span className="text-zinc-300">{message.gnostic.ketherState.reflectionMode ? 'Active' : 'Inactive'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span className="text-zinc-500">Ascent Level:</span>
                                          <span className="text-zinc-300">{message.gnostic.ketherState.ascentLevel}/10</span>
                                        </div>
                                      </div>
                                    </div>
                                  )}

                                  {/* Dominant Sefirah */}
                                  <div className="text-[10px] text-zinc-500 text-center">
                                    Dominant Sephirah: <span className="text-purple-400">{message.gnostic.sephirothAnalysis.dominant}</span>
                                    {' • '}
                                    Average Level: <span className="text-zinc-400">{message.gnostic.sephirothAnalysis.averageLevel.toFixed(1)}</span>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

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
        <div className={`transition-all duration-500 ease-out ${isExpanded ? 'pb-4 pt-2 border-t border-relic-mist/30 bg-white sticky bottom-0' : 'pb-8'}`}>
          <form onSubmit={handleSubmit} className="max-w-3xl mx-auto px-6">
            {/* Input Box */}
            <div className="relative transition-all duration-300">
              <input
                ref={inputRef}
                id="query-input"
                name="query"
                type="text"
                value={query}
                onChange={(e) => handleQueryChange(e.target.value)}
                placeholder={isExpanded ? "continue conversation..." : ""}
                autoComplete="off"
                className={`
                  relic-input text-sm transition-all duration-300 text-center
                  ${isExpanded
                    ? 'py-3 px-4'
                    : 'py-3'
                  }
                `}
                autoFocus
                disabled={isLoading}
              />
            </div>

            {/* Methodology Dots - Always visible, smooth transition */}
            <motion.div 
              className={`flex justify-center ${isExpanded ? 'mt-2' : 'mt-5'}`}
              initial={false}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            >
              <MethodologyFrame
                currentMethodology={methodology}
                onMethodologyChange={handleMethodologyClick}
                isSubmitting={isTransitioning}
              />
            </motion.div>

            {/* Console - Inline below methodology when in conversation */}
            {isExpanded && (
              <div className="mt-1.5 flex justify-center">
                <ConversationConsole
                  instinctMode={instinctModeEnabled}
                  onInstinctModeChange={setInstinctModeEnabled}
                  suggestions={suggestionsEnabled}
                  onSuggestionsChange={setSuggestionsEnabled}
                  audit={auditEnabled}
                  onAuditChange={setAuditEnabled}
                  mindmapConnector={mindmapConnectorEnabled}
                  onMindmapConnectorChange={setMindmapConnectorEnabled}
                  sideCanalEnabled={sideCanalEnabled}
                  onSideCanalChange={setSideCanalEnabled}
                  selectedModel={selectedModel}
                  onModelChange={setSelectedModel}
                  visualizationMode={globalVizMode}
                  onVisualizationChange={setGlobalVizMode}
                />
              </div>
            )}

            {/* Submit button */}
            {!isExpanded && (
              <div className="mt-6 text-center">
                <button
                  type="submit"
                  id="submit-button"
                  name="submit"
                  className="px-6 py-2 text-[10px] font-mono uppercase tracking-wider border border-relic-slate dark:border-white text-relic-slate dark:text-white bg-transparent hover:bg-relic-ghost/50 dark:hover:bg-relic-slate/30 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isLoading || isTransitioning}
                >
                  transmit
                </button>
              </div>
            )}



            {/* Horizontal Dashboard - Only when not in conversation */}
            {user && !isExpanded && (
              <ChatDashboard
                userId={user?.id || null}
                currentMethodology={methodology}
                legendMode={legendMode}
                darkMode={darkMode}
                sideCanalEnabled={true}
                newsNotificationsEnabled={true}
                realtimeDataEnabled={true}
                contextInjectionEnabled={true}
                autoMethodologyEnabled={true}
                onMethodologyChange={handleMethodologySwitch}
                onGuardToggle={handleGuardToggle}
                onLegendModeToggle={(enabled) => {
                  setLegendMode(enabled)
                  if (enabled) {
                    localStorage.setItem('legendMode', 'true')
                  } else {
                    localStorage.removeItem('legendMode')
                  }
                }}
                onDarkModeToggle={toggleDarkMode}
                onSideCanalToggle={(enabled) => {
                  localStorage.setItem('sideCanalEnabled', String(enabled))
                }}
                onNewsNotificationsToggle={(enabled) => {
                  localStorage.setItem('newsNotificationsEnabled', String(enabled))
                }}
                onRealtimeDataToggle={(enabled) => {
                  localStorage.setItem('realtimeDataEnabled', String(enabled))
                }}
                onContextInjectionToggle={(enabled) => {
                  localStorage.setItem('contextInjectionEnabled', String(enabled))
                }}
                onAutoMethodologyToggle={(enabled) => {
                  localStorage.setItem('autoMethodologyEnabled', String(enabled))
                }}
                onClose={() => {}}
                isCompact={isExpanded}
              />
            )}

          </form>
        </div>

        {/* Bottom spacer to balance the centering when not expanded */}
        {!isExpanded && <div className="flex-1" />}
      </main>

      {/* Continuing Conversation Indicator */}
      {continuingConversation && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-relic-ghost border border-relic-mist px-4 py-2 rounded-md animate-chat-continue">
          <span className="text-xs text-relic-slate font-mono">Continuing conversation...</span>
        </div>
      )}

      {/* Legend Mode - No top notification, only footer toggle */}

      {/* Side Chats */}
      {sideChats.map((sideChat) => (
        <SideChat
          key={sideChat.id}
          id={sideChat.id}
          methodology={sideChat.methodology}
          messages={sideChat.messages}
          onClose={() => {
            setSideChats(prev => prev.filter(c => c.id !== sideChat.id))
            if (activeChatId === sideChat.id) {
              setActiveChatId(null)
            }
          }}
          onMinimize={() => {
            // Toggle minimized state
          }}
          onSendMessage={async (query) => {
            // Handle message sending for side chat
            const userMessage: Message = {
              id: generateId(),
              role: 'user',
              content: query,
              timestamp: new Date()
            }
            setSideChats(prev => prev.map(c => 
              c.id === sideChat.id 
                ? { ...c, messages: [...c.messages, userMessage] }
                : c
            ))
            setIsLoading(true)
            
            try {
              const pageContext = getPageContext()
              const res = await fetch('/api/simple-query', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'x-session-id': sessionId, // GNOSTIC: Send session ID for Ascent Tracker
                },
                body: JSON.stringify({
                  query,
                  methodology: sideChat.methodology,
                  conversationHistory: sideChat.messages.map(m => ({
                    role: m.role,
                    content: m.content
                  })),
                  legendMode,
                  chatId: sideChat.id,
                  pageContext
                })
              })
              
              const data = await res.json()
              const assistantMessage: Message = {
                id: generateId(),
                role: 'assistant',
                content: data.response || 'No response',
                methodology: data.methodology || sideChat.methodology,
                metrics: data.metrics,
                timestamp: new Date(),
                guardResult: data.guardResult?.passed === false ? data.guardResult : undefined,
                guardAction: data.guardResult?.passed === false ? 'pending' : undefined,
                isHidden: data.guardResult?.passed === false,
                gnostic: data.gnostic, // GNOSTIC: Capture metadata from API
              }
              setSideChats(prev => prev.map(c => 
                c.id === sideChat.id 
                  ? { ...c, messages: [...c.messages, assistantMessage] }
                  : c
              ))
            } catch (error) {
              console.error('Side chat error:', error)
            } finally {
              setIsLoading(false)
            }
          }}
          isLoading={isLoading && activeChatId === sideChat.id}
          guardSuggestions={guardSuggestions}
          onRefine={(suggestion) => {
            // Handle refine for side chat
          }}
          onPivot={(suggestion) => {
            // Handle pivot for side chat
          }}
          onContinue={() => {
            // Handle continue for side chat
          }}
        />
      ))}

      {/* Footer - Only when not expanded */}
      {!isExpanded && (
        <footer className="border-t border-relic-mist/50 bg-relic-white/60 backdrop-blur-sm">
          <div className="w-full px-4 py-3">
            <div className="flex items-center justify-between">
              {/* Left side - description text - pushed to left edge */}
              <span className="text-[11px] text-relic-silver whitespace-nowrap pl-2">
                self aware - autonomous intelligence
              </span>
              
              {/* Right side - navigation and toggles - pushed to right edge */}
              <div className="flex items-center gap-4 pr-2">
                {/* Instinct Mode Toggle with Super Saiyan Icon */}
                <button
                  onClick={() => {
                    setLegendMode(!legendMode)
                    if (!legendMode) {
                      localStorage.setItem('legendMode', 'true')
                    } else {
                      localStorage.removeItem('legendMode')
                    }
                  }}
                  className="flex items-center gap-2 text-[10px] font-mono text-relic-silver hover:text-relic-slate transition-colors group"
                >
                  <SuperSaiyanIcon size={18} active={legendMode} />
                  <span className={legendMode ? 'text-amber-500' : ''}>instinct</span>
                </button>

                {/* Dark Mode Toggle */}
                <button
                  onClick={toggleDarkMode}
                  className="flex items-center gap-2 text-[10px] font-mono text-relic-silver hover:text-relic-slate transition-colors"
                >
                  <span>dark mode</span>
                  <span className={`px-2 py-0.5 border border-relic-mist ${
                    darkMode 
                      ? 'bg-relic-slate text-white' 
                      : 'bg-relic-white text-relic-slate'
                  }`}>
                    {darkMode ? 'on' : 'off'}
                  </span>
                </button>
                
                {user ? (
                  <NavigationMenu
                    user={user}
                    onMindMapClick={() => setShowMindMap(true)}
                  />
                ) : (
                  <button
                    onClick={() => setShowAuthModal(true)}
                    className="text-[10px] font-mono text-relic-silver hover:text-relic-slate transition-colors"
                  >
                    create profile
                  </button>
                )}
              </div>
            </div>
          </div>
        </footer>
      )}

      {/* Topics Panel */}
      <TopicsPanel
        isOpen={showTopicsPanel}
        onClose={() => setShowTopicsPanel(false)}
        onOpenMindMap={() => setShowMindMap(true)}
      />

      {/* Mind Map */}
      <MindMap
        isOpen={showMindMap}
        onClose={() => setShowMindMap(false)}
        userId={user?.id || null}
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
        onRemoveSuggestion={(suggestionId) => {
          // Remove suggestion from store
          removeSuggestion(suggestionId)
        }}
        onSuggestionClick={(suggestion) => {
          // USER CONFIRMED: Do both - inject topic AND open panel
          setQuery(suggestion.topicName + ' ')
          setShowTopicsPanel(true)
          // Focus input for immediate user action
          if (inputRef.current) {
            inputRef.current.focus()
          }
        }}
      />

      {/* Methodology Change Prompt */}
      <MethodologyChangePrompt
        isOpen={showMethodologyPrompt}
        methodologyName={pendingMethodology ? METHODOLOGIES.find(m => m.id === pendingMethodology)?.name || pendingMethodology : ''}
        onContinue={handleContinueInCurrentChat}
        onNewChat={handleStartNewChat}
        onCancel={handleCancelMethodologyChange}
      />

      {/* News Notification - Top Left */}
      <NewsNotification />
    </div>
  )
}
