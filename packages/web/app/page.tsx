'use client'

import { useState, useRef, useEffect, useCallback, Suspense, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { generateId, Message } from '@/lib/chat-store'
import { trackQuery } from '@/lib/analytics'
import { useSideCanalStore } from '@/lib/stores/side-canal-store'
import { useSettingsStore } from '@/lib/stores/settings-store'
import GuardWarning from '@/components/GuardWarning'
import { InstinctModeConsole } from '@/components/InstinctModeConsole'
import LayerConsole from '@/components/LayerConsole'
import TreeConfigurationModal from '@/components/TreeConfigurationModal'
import QChat from '@/components/QChat'
// MethodologyExplorer removed - now using inline CSS hover
import AuthModal from '@/components/AuthModal'
// UserProfile is now global in layout.tsx
import { getCurrentLanguage, type SupportedLanguage } from '@/components/LanguageSelector'
import { getTranslation } from '@/lib/translations'
import SuggestionToast from '@/components/SuggestionToast'
import TopicsPanel from '@/components/TopicsPanel'
import MindMap from '@/components/MindMap'
import SideMiniChat from '@/components/SideMiniChat'
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
import LayerResponse, { shouldShowLayers } from '@/components/LayerResponse'
import ConversationConsole, { InlineConsole } from '@/components/ConversationConsole'
import { LayerTreeFull } from '@/components/LayerTreeFull'
import AntipatternBadge from '@/components/AntipatternBadge'
import IntelligenceBadge from '@/components/IntelligenceBadge'
import MetadataStrip from '@/components/MetadataStrip'
import DarkModeToggle from '@/components/DarkModeToggle'
import { Layer, LAYER_METADATA } from '@/lib/layer-registry'
import { useSession } from '@/lib/session-manager'
import { HebrewTermDisplay } from '@/lib/origin-formatter'
import { analyzeLayerContent } from '@/lib/layer-mapper'
import { DepthText } from '@/components/DepthAnnotation'
import { useDepthAnnotations } from '@/hooks/useDepthAnnotations'
import LiveRefinementCanal from '@/components/LiveRefinementCanal'
import FileDropZone from '@/components/FileDropZone'
import CanvasWorkspace from '@/components/canvas/CanvasWorkspace'
import type { QueryCard } from '@/components/canvas/QueryCardsPanel'
import type { VisualNode, VisualEdge } from '@/components/canvas/VisualsPanel'

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

/**
 * Generate LayerMini data for every query - adapts to content and evolves with conversation
 * Always returns valid activations even if gnostic metadata doesn't exist
 */
function generateLayerData(message: Message, messageIndex: number, totalMessages: number): {
  activations: Record<number, number>
  userLevel: Layer
} {
  // Default activations for all 11 Layers (ensures no undefined values)
  const defaultActivations: Record<number, number> = {
    1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0, 11: 0
  }

  // PRIORITY 1: Use Intelligence Fusion activations (most accurate from pre-processing)
  if (message.intelligence?.layerActivations && message.intelligence.layerActivations.length > 0) {
    const activations: Record<number, number> = { ...defaultActivations }
    message.intelligence.layerActivations.forEach(({ layerNode, activation }) => {
      activations[layerNode] = activation ?? 0
    })
    return {
      activations,
      userLevel: (message.gnostic?.progressState?.currentLevel || 1) as Layer
    }
  }

  // PRIORITY 2: Use gnostic metadata (from API response processing)
  if (message.gnostic?.layerAnalysis) {
    return {
      activations: { ...defaultActivations, ...message.gnostic.layerAnalysis.activations },
      userLevel: (message.gnostic.progressState?.currentLevel || 1) as Layer
    }
  }

  // Generate activations based on content analysis
  const content = message.content || ''
  const analysis = analyzeLayerContent(content)

  // Convert analysis to activations record (with defaults)
  const activations: Record<number, number> = { ...defaultActivations }
  analysis.activations.forEach(({ layerNode, activation }) => {
    activations[layerNode] = activation ?? 0
  })

  // Calculate user level based on conversation progression
  // More messages = higher ascent (evolves with chat)
  const progressionLevel = Math.min(Math.ceil((messageIndex + 1) / 3), 10)
  const userLevel = progressionLevel as Layer

  return { activations, userLevel }
}

/**
 * Helper component to watch URL parameters
 * Separated to enable proper Suspense boundary for Next.js 15
 */
function ContinueParamWatcher({ onContinue }: { onContinue: (id: string) => void }) {
  const searchParams = useSearchParams()
  const continueParam = searchParams?.get('continue')

  useEffect(() => {
    if (continueParam) {
      console.log('[History] Loading conversation:', continueParam)
      onContinue(continueParam)
    }
  }, [continueParam, onContinue])

  return null
}

function HomePage() {

  const [currentLang, setCurrentLang] = useState<SupportedLanguage>('en')
  const [query, setQuery] = useState('')
  const [methodology, setMethodology] = useState('auto')
  const [messages, setMessages] = useState<Message[]>([])
  const [attachedFiles, setAttachedFiles] = useState<File[]>([])
  const [uploadedFileUrls, setUploadedFileUrls] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
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
  const [mindMapInitialView, setMindMapInitialView] = useState<'graph' | 'history' | 'report'>('graph')
  const [showDashboard, setShowDashboard] = useState(false)
  const [showLayerDashboard, setShowLayerDashboard] = useState(false)
  const [legendMode, setLegendMode] = useState(false)
  const [sideChats, setSideChats] = useState<Array<{ id: string; methodology: string; messages: Message[] }>>([])
  const [activeChatId, setActiveChatId] = useState<string | null>(null)
  const [continuingConversation, setContinuingConversation] = useState<string | null>(null)
  const [showMethodologyPrompt, setShowMethodologyPrompt] = useState(false)
  const [pendingMethodology, setPendingMethodology] = useState<string | null>(null)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [mindmapVisibility, setMindmapVisibility] = useState<Record<string, boolean>>({})
  const [vizMode, setVizMode] = useState<Record<string, 'layers' | 'insight' | 'text' | 'mindmap'>>({})
  const [gnosticVisibility, setGnosticVisibility] = useState<Record<string, boolean>>({})
  const [deepDiveQuery, setDeepDiveQuery] = useState<string>('')  // NEW: For Deep Dive → Mini Chat
  const [messageAnnotations, setMessageAnnotations] = useState<Record<string, any[]>>({})  // Store annotations per message
  const [currentConversationId, setCurrentConversationId] = useState<string | undefined>(undefined)  // NEW: For sharing conversation

  // Canvas Mode State
  const [isCanvasMode, setIsCanvasMode] = useState(false)

  // Gnostic Session Management - Track user's ascent journey
  const { sessionId, isClient } = useSession()

  // Depth Annotations Hook
  const { processText, reset: resetDepthAnnotations, config: depthConfig } = useDepthAnnotations()

  // Instinct Mode Settings
  const { settings } = useSettingsStore()
  const { instinctMode, instinctConfig } = settings

  // Canvas Data Adapters - Convert messages to canvas format
  const queryCards = useMemo<QueryCard[]>(() => {
    return messages
      .filter(m => m.role === 'user')
      .map((m, idx) => {
        // Find the assistant response that follows this user message
        const userIndex = messages.indexOf(m)
        const nextAssistant = messages.find((r, i) => r.role === 'assistant' && i > userIndex)
        return {
          id: m.id,
          query: m.content,
          response: nextAssistant?.content || '',
          timestamp: new Date(),
          methodology: methodology,
        }
      })
  }, [messages, methodology])

  const visualNodes = useMemo<VisualNode[]>(() => {
    // Extract key concepts from messages for mindmap
    const nodes: VisualNode[] = []
    messages.forEach((m, idx) => {
      if (m.role === 'assistant' && m.content.length > 50) {
        // Create a node for each significant response
        nodes.push({
          id: `node-${m.id}`,
          label: m.content.slice(0, 40) + '...',
          type: 'concept',
          x: 100 + (idx % 3) * 150,
          y: 100 + Math.floor(idx / 3) * 120,
        })
      }
    })
    return nodes
  }, [messages])

  const visualEdges = useMemo<VisualEdge[]>(() => {
    // Create edges between consecutive nodes
    return visualNodes.slice(1).map((node, idx) => ({
      id: `edge-${idx}`,
      source: visualNodes[idx].id,
      target: node.id,
    }))
  }, [visualNodes])

  // Log depth config on mount
  useEffect(() => {
    console.log('[DepthAnnotations] Config loaded:', depthConfig)
    console.log('[DepthAnnotations] LocalStorage:', localStorage.getItem('akhai-depth-config'))
  }, [])

  // Process depth annotations when new assistant messages arrive
  useEffect(() => {
    console.log('[DepthAnnotations] Effect triggered - config.enabled:', depthConfig.enabled, 'messages:', messages.length)

    if (!depthConfig.enabled) {
      console.log('[DepthAnnotations] Disabled - toggle is OFF')
      return
    }

    const lastMessage = messages[messages.length - 1]
    if (lastMessage && lastMessage.role === 'assistant') {
      // Check if already processed
      if (messageAnnotations[lastMessage.id]) {
        console.log('[DepthAnnotations] Already processed message:', lastMessage.id)
        return
      }

      console.log('[DepthAnnotations] Processing NEW message:', lastMessage.content.slice(0, 100))

      // Process the message content for depth annotations
      const annotations = processText(lastMessage.content)

      console.log('[DepthAnnotations] Detected annotations:', annotations.length, annotations)

      if (annotations.length > 0) {
        setMessageAnnotations(prev => ({
          ...prev,
          [lastMessage.id]: annotations
        }))
      } else {
        console.log('[DepthAnnotations] No annotations detected - text may not match patterns')
        // Still mark as processed to avoid repeated attempts
        setMessageAnnotations(prev => ({
          ...prev,
          [lastMessage.id]: []
        }))
      }
    }
  }, [messages, depthConfig.enabled, processText])

  // Clear Deep Dive query after Mini Chat receives it
  useEffect(() => {
    if (deepDiveQuery) {
      const timer = setTimeout(() => {
        setDeepDiveQuery('')
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [deepDiveQuery])

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

  // Dark mode initialization and sync
  useEffect(() => {
    const savedDarkMode = localStorage.getItem('darkMode') === 'true'
    setDarkMode(savedDarkMode)
    if (savedDarkMode) {
      document.documentElement.classList.add('dark')
    }

    // Listen for dark mode changes from other components
    const handleDarkModeChange = (e: CustomEvent) => {
      setDarkMode(e.detail.darkMode)
    }

    window.addEventListener('darkModeChange' as any, handleDarkModeChange as any)

    return () => {
      window.removeEventListener('darkModeChange' as any, handleDarkModeChange as any)
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

      // Notify other components about dark mode change
      const event = new CustomEvent('darkModeChange', { detail: { darkMode: newValue } })
      window.dispatchEvent(event)

      return newValue
    })
  }, [])

  // Check user session on mount
  useEffect(() => {
    try {
      checkSession()

      // Initialize language from storage
      const lang = getCurrentLanguage()
      setCurrentLang(lang)

      // Listen for language changes
      const handleLanguageChange = (e: CustomEvent<SupportedLanguage>) => {
        setCurrentLang(e.detail)
      }
      window.addEventListener('languagechange', handleLanguageChange as EventListener)

      // Check for conversation continuation from URL
      const params = new URLSearchParams(window.location.search)
      const continueId = params.get('continue')
      if (continueId) {
        setCurrentConversationId(continueId)
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

      return () => {
        window.removeEventListener('languagechange', handleLanguageChange as EventListener)
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

  const loadConversation = useCallback(async (queryId: string) => {
    try {
      console.log('[History] Fetching conversation for:', queryId)
      const res = await fetch(`/api/history/${queryId}/conversation`)
      console.log('[History] Response status:', res.status)
      if (res.ok) {
        const data = await res.json()
        console.log('[History] Data received:', data.messages?.length, 'messages')
        if (data.messages && data.messages.length > 0) {
          const loadedMessages = data.messages.map((msg: any) => ({
            id: generateId(),
            role: msg.role,
            content: msg.content,
            timestamp: new Date(msg.timestamp * 1000),
            methodology: msg.methodology,
            gnostic: msg.gnostic || null,
            pipelineEvents: msg.pipelineEvents || null,
          }))

          // Restore pipeline metadata into Zustand store for MetadataStrip
          loadedMessages.forEach((msg: any) => {
            if (msg.role === 'assistant' && msg.pipelineEvents?.length > 0) {
              msg.pipelineEvents.forEach((ev: any) => {
                useSideCanalStore.getState().pushMetadata({
                  ...ev,
                  messageId: msg.id,
                })
              })
            }
          })

          console.log('[History] Setting messages:', loadedMessages.length)
          setMessages(loadedMessages)
          setContinuingConversation(queryId)
          setIsExpanded(true)
          console.log('[History] Conversation loaded successfully')
          // Clear URL param
          window.history.replaceState({}, '', '/')
          setTimeout(() => setContinuingConversation(null), 3000)
        } else {
          console.warn('[History] No messages in response')
        }
      } else {
        console.error('[History] Failed to fetch:', res.status)
      }
    } catch (error) {
      console.error('[History] Failed to load conversation:', error)
    }
  }, []) // Empty deps - setState functions are stable

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

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files)
      setAttachedFiles(prev => [...prev, ...newFiles].slice(0, 5)) // Max 5 files

      // Upload files immediately
      const formData = new FormData()
      newFiles.forEach(file => formData.append('files', file))

      try {
        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        })

        if (response.ok) {
          const data = await response.json()
          const urls = data.files.map((f: any) => f.url)
          setUploadedFileUrls(prev => [...prev, ...urls])
          console.log('Files uploaded:', data.files)
        } else {
          const error = await response.json()
          console.error('Upload failed:', error)
        }
      } catch (error) {
        console.error('Upload error:', error)
      }
    }
  }

  const triggerFileSelect = () => {
    fileInputRef.current?.click()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!query.trim() || isLoading) {
      return
    }

    // Reset depth annotations for new query
    resetDepthAnnotations()

    // Start transition animation
    setIsTransitioning(true)

    // Wait for transition animation before proceeding
    await new Promise(resolve => setTimeout(resolve, 800))

    // Process attached files if any
    const processedFiles = await Promise.all(
      attachedFiles.map(async (file) => {
        if (file.type.startsWith('image/')) {
          // Convert image to base64
          const reader = new FileReader()
          return new Promise<any>((resolve) => {
            reader.onloadend = () => {
              const base64 = (reader.result as string).split(',')[1]
              resolve({
                type: 'image',
                name: file.name,
                mimeType: file.type,
                data: base64
              })
            }
            reader.readAsDataURL(file)
          })
        } else if (file.type === 'application/pdf') {
          // Handle PDF - convert to base64 in chunks to avoid stack overflow
          const arrayBuffer = await file.arrayBuffer()
          const bytes = new Uint8Array(arrayBuffer)
          let binary = ''
          const chunkSize = 8192
          for (let i = 0; i < bytes.length; i += chunkSize) {
            const chunk = bytes.slice(i, i + chunkSize)
            binary += String.fromCharCode.apply(null, Array.from(chunk))
          }
          const base64 = btoa(binary)
          return {
            type: 'pdf',
            name: file.name,
            data: base64
          }
        } else {
          // Handle text documents
          const text = await file.text()
          return {
            type: 'document',
            name: file.name,
            content: text
          }
        }
      })
    )

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
    setAttachedFiles([]) // Clear attached files
    const currentFileUrls = uploadedFileUrls // Capture URLs before clearing
    setUploadedFileUrls([]) // Clear uploaded file URLs
    setIsLoading(true)
    setIsTransitioning(false)

    const startTime = Date.now()


    try {
      const currentChatId = activeChatId || 'main'
      const pageContext = getPageContext()
      const { liveRefinements } = useSideCanalStore.getState()
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
          pageContext,
          instinctMode,
          instinctConfig,
          liveRefinements: liveRefinements.length > 0 ? liveRefinements : undefined,
          attachments: processedFiles.length > 0 ? processedFiles : undefined,
          fileUrls: currentFileUrls.length > 0 ? currentFileUrls : undefined
        })
      })


      if (!res.ok) throw new Error('Failed to get response')

      const data = await res.json()

      // Pre-generate assistant message ID for metadata stream binding
      const assistantMsgId = generateId()

      // Connect Metadata Thought Stream (SSE) if queryId available
      if (data.queryId) {
        try {
          const evtSource = new EventSource(`/api/thought-stream?queryId=${data.queryId}`)
          evtSource.onmessage = (ev) => {
            try {
              const thought = JSON.parse(ev.data) as import('@/lib/thought-stream').ThoughtEvent
              thought.messageId = assistantMsgId
              useSideCanalStore.getState().pushMetadata(thought)
              if (thought.stage === 'complete' || thought.stage === 'error') {
                evtSource.close()
              }
            } catch { /* ignore parse errors */ }
          }
          evtSource.onerror = () => evtSource.close()
        } catch { /* SSE not critical */ }
      }

      // Handle Side Canal suggestions - refresh from store
      if (data.sideCanal?.suggestions && data.sideCanal.suggestions.length > 0) {
        // Suggestions are now managed by the store, refresh will be triggered automatically
        // by the extractTopicsForMessage callback
      }

      // Poll for the result if we got a queryId
      if (data.queryId) {
        // Set conversation ID for sharing
        setCurrentConversationId(data.queryId)
        await pollForResult(data.queryId, startTime, assistantMsgId)
      } else {
        // 🔍 DIAGNOSTIC: Log received gnostic data from API
        console.log('🌳 FRONTEND: Received API response with gnostic:', {
          hasGnostic: !!data.gnostic,
          gnosticKeys: data.gnostic ? Object.keys(data.gnostic) : [],
          layerAnalysis: data.gnostic?.layerAnalysis,
          activations: data.gnostic?.layerAnalysis?.activations,
        })

        // Check for grounding guard failures
        const guardFailed = data.guardResult && !data.guardResult.passed

        // Immediate response (store guard result, hide if failed)
        const assistantMessage: Message = {
          id: assistantMsgId,
          role: 'assistant',
          content: data.response || data.finalDecision || 'No response',
          methodology: data.methodology || methodology,
          metrics: data.metrics,
          timestamp: new Date(),
          guardResult: guardFailed ? data.guardResult : undefined,
          guardAction: guardFailed ? 'pending' : undefined,
          isHidden: guardFailed,
          gnostic: data.gnostic, // GNOSTIC: Capture metadata from API
          // INTELLIGENCE: Map fusion response to intelligence interface
          intelligence: data.fusion ? {
            analysis: {
              complexity: data.fusion.confidence || 0,
              queryType: data.fusion.methodology || 'direct',
              keywords: data.fusion.layerActivations?.[0]?.keywords || []
            },
            layerActivations: (data.fusion.layerActivations || []).map((s: any) => ({
              layerNode: 0,
              name: s.name,
              activation: s.effectiveWeight || 0,
              effectiveWeight: s.effectiveWeight || 0
            })),
            dominantLayers: data.fusion.dominantLayers || [],
            pathActivations: [],
            methodologySelection: {
              selected: data.fusion.methodology || 'direct',
              confidence: data.fusion.confidence || 0,
              alternatives: []
            },
            guard: {
              recommendation: data.fusion.guardRecommendation || 'proceed',
              reasons: []
            },
            instinct: {
              enabled: (data.fusion.activeLenses || []).length > 0,
              activeLenses: data.fusion.activeLenses || []
            },
            processing: {
              mode: data.fusion.processingMode || 'weighted',
              extendedThinkingBudget: data.fusion.extendedThinkingBudget || 3000
            },
            timing: {
              fusionMs: data.fusion.processingTimeMs || 0
            }
          } : undefined,
        }

        // 🔍 DIAGNOSTIC: Log message with gnostic before setting state
        console.log('🌳 FRONTEND: Created message with gnostic:', {
          messageId: assistantMessage.id,
          hasGnostic: !!assistantMessage.gnostic,
          gnosticData: assistantMessage.gnostic,
        })

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

  const pollForResult = async (queryId: string, startTime: number, messageId?: string) => {
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
            id: messageId || generateId(),
            role: 'assistant',
            content: data.response || data.finalDecision || 'No response',
            methodology: data.methodology,
            metrics: data.metrics,
            timestamp: new Date(),
            guardResult: guardFailed ? data.guardResult : undefined,
            guardAction: guardFailed ? 'pending' : undefined,
            isHidden: guardFailed,
            gnostic: data.gnostic, // GNOSTIC: Capture metadata from API
          // INTELLIGENCE: Map fusion response to intelligence interface
          intelligence: data.fusion ? {
            analysis: {
              complexity: data.fusion.confidence || 0,
              queryType: data.fusion.methodology || 'direct',
              keywords: data.fusion.layerActivations?.[0]?.keywords || []
            },
            layerActivations: (data.fusion.layerActivations || []).map((s: any) => ({
              layerNode: 0,
              name: s.name,
              activation: s.effectiveWeight || 0,
              effectiveWeight: s.effectiveWeight || 0
            })),
            dominantLayers: data.fusion.dominantLayers || [],
            pathActivations: [],
            methodologySelection: {
              selected: data.fusion.methodology || 'direct',
              confidence: data.fusion.confidence || 0,
              alternatives: []
            },
            guard: {
              recommendation: data.fusion.guardRecommendation || 'proceed',
              reasons: []
            },
            instinct: {
              enabled: (data.fusion.activeLenses || []).length > 0,
              activeLenses: data.fusion.activeLenses || []
            },
            processing: {
              mode: data.fusion.processingMode || 'weighted',
              extendedThinkingBudget: data.fusion.extendedThinkingBudget || 3000
            },
            timing: {
              fusionMs: data.fusion.processingTimeMs || 0
            }
          } : undefined,
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
    const message = messages.find(m => m.id === messageId)
    console.log('[Guard Continue] Clicked for message:', messageId)
    console.log('[Guard Continue] Message content length:', message?.content?.length || 0)
    console.log('[Guard Continue] Message content preview:', message?.content?.substring(0, 100))

    if (!message?.content || message.content === 'No response') {
      console.error('[Guard Continue] WARNING: Message has no content! This should not happen.')
      console.error('[Guard Continue] Full message:', message)
    }

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
            pageContext,
            instinctMode,
            instinctConfig
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
          // INTELLIGENCE: Map fusion response to intelligence interface
          intelligence: data.fusion ? {
            analysis: {
              complexity: data.fusion.confidence || 0,
              queryType: data.fusion.methodology || 'direct',
              keywords: data.fusion.layerActivations?.[0]?.keywords || []
            },
            layerActivations: (data.fusion.layerActivations || []).map((s: any) => ({
              layerNode: 0,
              name: s.name,
              activation: s.effectiveWeight || 0,
              effectiveWeight: s.effectiveWeight || 0
            })),
            dominantLayers: data.fusion.dominantLayers || [],
            pathActivations: [],
            methodologySelection: {
              selected: data.fusion.methodology || 'direct',
              confidence: data.fusion.confidence || 0,
              alternatives: []
            },
            guard: {
              recommendation: data.fusion.guardRecommendation || 'proceed',
              reasons: []
            },
            instinct: {
              enabled: (data.fusion.activeLenses || []).length > 0,
              activeLenses: data.fusion.activeLenses || []
            },
            processing: {
              mode: data.fusion.processingMode || 'weighted',
              extendedThinkingBudget: data.fusion.extendedThinkingBudget || 3000
            },
            timing: {
              fusionMs: data.fusion.processingTimeMs || 0
            }
          } : undefined,
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
            pageContext,
            instinctMode,
            instinctConfig
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
          // INTELLIGENCE: Map fusion response to intelligence interface
          intelligence: data.fusion ? {
            analysis: {
              complexity: data.fusion.confidence || 0,
              queryType: data.fusion.methodology || 'direct',
              keywords: data.fusion.layerActivations?.[0]?.keywords || []
            },
            layerActivations: (data.fusion.layerActivations || []).map((s: any) => ({
              layerNode: 0,
              name: s.name,
              activation: s.effectiveWeight || 0,
              effectiveWeight: s.effectiveWeight || 0
            })),
            dominantLayers: data.fusion.dominantLayers || [],
            pathActivations: [],
            methodologySelection: {
              selected: data.fusion.methodology || 'direct',
              confidence: data.fusion.confidence || 0,
              alternatives: []
            },
            guard: {
              recommendation: data.fusion.guardRecommendation || 'proceed',
              reasons: []
            },
            instinct: {
              enabled: (data.fusion.activeLenses || []).length > 0,
              activeLenses: data.fusion.activeLenses || []
            },
            processing: {
              mode: data.fusion.processingMode || 'weighted',
              extendedThinkingBudget: data.fusion.extendedThinkingBudget || 3000
            },
            timing: {
              fusionMs: data.fusion.processingTimeMs || 0
            }
          } : undefined,
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
    setCurrentConversationId(undefined)
    setContinuingConversation(null)
    setMessageAnnotations({})
    resetDepthAnnotations()
  }

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-300 ${darkMode ? 'bg-relic-void' : 'bg-white'}`}>
      {/* Global File Drop Zone */}
      <FileDropZone
        onFilesChange={setAttachedFiles}
        onUploadComplete={(files) => {
          const urls = files.map(f => f.url)
          console.log('📎 page.tsx: File URLs stored in state:', urls)
          setUploadedFileUrls(urls)
        }}
        maxFiles={5}
        maxSizeMB={10}
      />

      {/* Header - Only show when expanded */}
      {isExpanded && (
        <header className="border-b border-relic-mist/50 dark:border-relic-slate/30 bg-white/80 dark:bg-relic-void/80 backdrop-blur-sm sticky top-0 z-20 animate-fade-in">
          <div className="max-w-3xl mx-auto px-6 py-3">
            <div className="flex items-center justify-between">
              <button
                onClick={handleNewChat}
                className="text-[10px] uppercase tracking-[0.3em] text-relic-silver dark:text-relic-silver/70 hover:text-relic-slate dark:hover:text-relic-ghost transition-colors"
              >
                ◊ akhai
              </button>
              <div className="flex items-center gap-3">
                {/* Canvas Mode Toggle */}
                <button
                  onClick={() => setIsCanvasMode(!isCanvasMode)}
                  className={`flex items-center gap-1.5 px-2 py-1 rounded text-[9px] font-medium transition-all ${
                    isCanvasMode 
                      ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-300' 
                      : 'bg-relic-ghost text-relic-silver hover:bg-relic-mist dark:bg-relic-slate/30 dark:text-relic-ghost'
                  }`}
                >
                  <span>{isCanvasMode ? '◫' : '☰'}</span>
                  <span>{isCanvasMode ? 'Canvas' : 'Classic'}</span>
                </button>
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
      <main className={`flex-1 flex flex-col transition-all duration-500 ease-out ${isExpanded && !isCanvasMode ? 'ml-60' : ''} ${
        isExpanded && user && !isCanvasMode ? 'mr-80' : ''
      }`}>

        {/* Canvas Mode */}
        {isCanvasMode && isExpanded && (
          <CanvasWorkspace
            queryCards={queryCards}
            visualNodes={visualNodes}
            visualEdges={visualEdges}
            onQuerySelect={(id) => console.log('Selected query:', id)}
            onNodeSelect={(id) => console.log('Selected node:', id)}
          />
        )}

        {/* Classic Mode - Logo Section - Fixed at TOP when not expanded */}
        {!isCanvasMode && !isExpanded && (
          <div className="text-center pt-8 pb-4">
            <h1 className="text-3xl font-light text-relic-slate dark:text-white tracking-[0.3em] mb-1">
              A K H A I
            </h1>
            <p className="text-sm font-light text-relic-silver/60 dark:text-white/50 tracking-wide mb-0.5">
              school of thoughts
            </p>
            <p className="text-[10px] uppercase tracking-[0.2em] text-relic-slate/50 dark:text-white/40 mb-6">
              SOVEREIGNINTELLIGENCE
            </p>
            {/* Diamond Logo with INLINE methodology explorer - no more flickering */}
            <div className="group relative inline-block">
        <div
          ref={diamondRef}
                data-diamond-logo
                className="cursor-pointer"
              >
                <span className="text-4xl font-extralight text-relic-mist dark:text-relic-silver/30 group-hover:text-relic-silver dark:group-hover:text-relic-ghost group-hover:scale-110 transition-all duration-500 inline-block">
            ◊
          </span>
                <p className="text-[8px] tracking-[0.2em] text-relic-silver/40 mt-2">
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
                  /* Rich Data View - 380px x 240px (rectangular) */
                  <div className="bg-white dark:bg-relic-void backdrop-blur-md border border-relic-mist dark:border-relic-slate/30 shadow-2xl w-[380px]">
                    {(() => {
                      const detail = METHODOLOGY_DETAILS.find(m => m.id === expandedMethodology)
                      if (!detail) return null
                      const isCoding = detail.id === 'pot'
                      const isResearch = detail.id === 'react'
                      return (
                        <>
                          {/* Header */}
                          <div className="border-b border-relic-mist/30 dark:border-relic-slate/20 px-3 py-2 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="text-xl text-relic-slate dark:text-white">{detail.symbol}</div>
                              <div>
                                <h2 className="text-sm font-mono text-relic-slate dark:text-white">{detail.name}</h2>
                                <p className="text-[9px] text-relic-silver dark:text-relic-ghost">{detail.fullName}</p>
                              </div>
                            </div>
                            <button
                              onClick={() => setExpandedMethodology(null)}
                              className="text-xs text-relic-silver dark:text-relic-ghost hover:text-relic-slate dark:hover:text-white"
                            >
                              ✕
                            </button>
                          </div>

                          {/* Content - Rich Data */}
                          <div className="px-3 py-2 space-y-2">
                            {/* Type badges */}
                            <div className="flex gap-1.5">
                              {isCoding && (
                                <span className="text-[8px] px-1.5 py-0.5 bg-relic-ghost dark:bg-relic-slate/20 text-relic-slate dark:text-relic-ghost border border-relic-mist/30 dark:border-relic-slate/30">
                                  CODE
                                </span>
                              )}
                              {isResearch && (
                                <span className="text-[8px] px-1.5 py-0.5 bg-relic-ghost dark:bg-relic-slate/20 text-relic-slate dark:text-relic-ghost border border-relic-mist/30 dark:border-relic-slate/30">
                                  WEB
                                </span>
                              )}
                            </div>

                            {/* Description */}
                            <p className="text-[9px] text-relic-slate dark:text-relic-ghost leading-tight">{detail.description}</p>

                            {/* How it works - 2 steps */}
                            <div className="space-y-0.5">
                              <p className="text-[8px] uppercase tracking-wider text-relic-silver dark:text-relic-ghost">Process</p>
                              {detail.howItWorks.slice(0, 2).map((step, i) => (
                                <p key={i} className="text-[9px] text-relic-slate dark:text-relic-ghost leading-tight flex gap-1">
                                  <span className="text-relic-silver dark:text-relic-ghost">→</span>
                                  <span>{step}</span>
                                </p>
                              ))}
                            </div>

                            {/* Format */}
                            <div>
                              <p className="text-[8px] uppercase tracking-wider text-relic-silver dark:text-relic-ghost mb-0.5">Format</p>
                              <p className="text-[9px] font-mono text-relic-slate dark:text-white">{detail.format}</p>
                            </div>

                            {/* Metrics - Grid */}
                            <div className="pt-1.5 border-t border-relic-mist/20 dark:border-relic-slate/10 grid grid-cols-3 gap-2">
                              <div>
                                <span className="text-[8px] uppercase text-relic-silver dark:text-relic-ghost block">Tokens</span>
                                <span className="text-[10px] font-mono text-relic-slate dark:text-white">{detail.metrics.tokens}</span>
                              </div>
                              <div>
                                <span className="text-[8px] uppercase text-relic-silver dark:text-relic-ghost block">Latency</span>
                                <span className="text-[10px] font-mono text-relic-slate dark:text-white">{detail.metrics.latency}</span>
                              </div>
                              <div>
                                <span className="text-[8px] uppercase text-relic-silver dark:text-relic-ghost block">Cost</span>
                                <span className="text-[10px] font-mono text-relic-slate dark:text-white">{detail.metrics.cost}</span>
                              </div>
                            </div>

                            {/* Example */}
                            {detail.examples[0] && (
                              <div className="pt-1.5 border-t border-relic-mist/20 dark:border-relic-slate/10">
                                <p className="text-[8px] uppercase tracking-wider text-relic-silver dark:text-relic-ghost mb-0.5">Example</p>
                                <p className="text-[9px] italic text-relic-slate dark:text-relic-ghost leading-tight">{detail.examples[0]}</p>
                              </div>
                            )}
                          </div>
                        </>
                      )
                    })()}
                  </div>
                ) : (
                  /* Horizontal List */
                  <div className="bg-white dark:bg-relic-void border border-relic-mist dark:border-relic-slate/30 shadow-xl p-3">
                    <div className="flex gap-2">
                      {METHODOLOGIES.map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => {
                            setExpandedMethodology(m.id)
                          }}
                          className={`
                            flex flex-col items-center justify-center w-24 h-16
                            border transition-all duration-200 bg-white dark:bg-relic-slate/20
                            ${methodology === m.id
                              ? 'border-relic-slate dark:border-white text-relic-slate dark:text-white'
                              : 'border-relic-mist dark:border-relic-slate/30 hover:border-relic-slate/60 dark:hover:border-relic-ghost text-relic-slate dark:text-relic-ghost'
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
        {isExpanded && !isCanvasMode && (
          <div className="text-center py-3 mb-2">
            <span className="text-2xl font-extralight opacity-50 text-relic-mist">
              ◊
            </span>
          </div>
        )}

        {/* Messages Area - Appears when expanded (Classic Mode only) */}
        {isExpanded && !isCanvasMode && (
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
                      <p className="text-relic-slate dark:text-relic-ghost px-4 py-3 text-sm">
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
                          {globalVizMode !== 'off' && (shouldShowLayers(message.content, !!message.gnostic) || shouldShowInsightMap(message.content, !!message.gnostic) || shouldShowMindmap(message.content, message.topics)) && (
                            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-relic-mist/30">
                              <span className="text-[9px] text-relic-silver uppercase tracking-wide">View:</span>
                              <button
                                onClick={() => setVizMode(prev => ({ ...prev, [message.id]: 'layers' }))}
                                className={`px-2 py-1 text-[9px] rounded-md transition-all ${
                                  (vizMode[message.id] || 'layers') === 'layers'
                                    ? 'bg-indigo-100 text-indigo-700 font-medium'
                                    : 'text-relic-silver hover:bg-relic-ghost'
                                }`}
                              >
                                ◎ AI Layers
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

                          {/* LAYERS VIEW - Sovereign Intelligence Tree */}
                          {globalVizMode !== 'off' && (vizMode[message.id] || 'layers') === 'layers' && shouldShowLayers(message.content, !!message.gnostic) && (
                            <LayerResponse
                              content={message.content}
                              query={messages[messages.indexOf(message) - 1]?.content || ''}
                              methodology={message.methodology || methodology}
                              onSwitchToInsight={() => setVizMode(prev => ({ ...prev, [message.id]: 'insight' }))}
                              onOpenMindMap={() => setShowMindMap(true)}
                              onDeepDive={(query) => setDeepDiveQuery(query)}
                            />
                          )}

                          {/* INSIGHT MINDMAP - Grokipedia-style knowledge graph */}
                          {globalVizMode !== 'off' && vizMode[message.id] === 'insight' && shouldShowInsightMap(message.content, !!message.gnostic) && (
                            <InsightMindmap
                              content={message.content}
                              query={messages[messages.indexOf(message) - 1]?.content || ''}
                              methodology={message.methodology || methodology}
                              onSwitchToLayers={() => setVizMode(prev => ({ ...prev, [message.id]: 'layers' }))}
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
                          {depthConfig.enabled && messageAnnotations[message.id] && messageAnnotations[message.id].length > 0 ? (
                            <DepthText
                              text={message.content}
                              annotations={messageAnnotations[message.id]}
                              config={depthConfig}
                              className="text-relic-slate leading-relaxed text-sm"
                              onExpand={(query) => {
                                // When user clicks an expandable annotation, set it as the query
                                setQuery(query)
                              }}
                            />
                          ) : (
                            <div className="text-relic-slate leading-relaxed whitespace-pre-wrap text-sm">
                              {message.content.split(/(\bhttps?:\/\/[^\s]+)/g).map((part, idx) => {
                                // Check if this part is a URL
                                if (/^https?:\/\//.test(part)) {
                                  return (
                                    <a
                                      key={idx}
                                      href={part}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-relic-slate dark:text-white underline hover:text-relic-void dark:hover:text-relic-ghost transition-colors"
                                    >
                                      {part}
                                    </a>
                                  )
                                }
                                return <span key={idx}>{part}</span>
                              })}
                            </div>
                          )}

                          {/* Metadata Thought Stream — real-time pipeline stage */}
                          {message.role === 'assistant' && (
                            <MetadataStrip messageId={message.id} />
                          )}

                          {/* Inline Visualize Button */}
                          {(shouldShowLayers(message.content, !!message.gnostic) || shouldShowInsightMap(message.content, !!message.gnostic)) && globalVizMode === 'off' && (
                            <InlineConsole
                              onVisualize={() => setVizMode(prev => ({ ...prev, [message.id]: 'layers' }))}
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
                          {/* INTELLIGENCE FUSION BADGE */}
                          {/* ================================================================ */}
                          {message.intelligence && (
                            <div className="mt-4 pt-3 border-t border-relic-mist/20 dark:border-relic-slate/15">
                              <IntelligenceBadge
                                intelligence={message.intelligence}
                                methodology={message.methodology}
                                selectionReason={message.gnostic?.layerAnalysis?.dominant ? `Layer analysis: ${message.gnostic.layerAnalysis.dominant} dominant` : undefined}
                              />
                            </div>
                          )}

                          {/* ================================================================ */}
                          {/* LAYERS MINI - ALWAYS VISIBLE (Evolves with conversation) */}
                          {/* ================================================================ */}
                          <div className="mt-6 pt-4 border-t border-relic-mist/30 dark:border-relic-slate/20">
                            {(() => {
                              const messageIndex = messages.filter(m => m.role === 'assistant').indexOf(message)
                              const totalMessages = messages.filter(m => m.role === 'assistant').length
                              const layersData = generateLayerData(message, messageIndex, totalMessages)

                              return (
                                <Link href="/tree-of-life" className="block cursor-pointer transition-all hover:shadow-lg">
                                  <div className="bg-white dark:bg-relic-void/30 border border-relic-mist dark:border-relic-slate/30 p-4 mb-4 hover:border-purple-300 dark:hover:border-purple-500 transition-colors">
                                    <div className="text-[9px] uppercase tracking-[0.2em] text-relic-silver mb-3 text-center flex items-center justify-center gap-2">
                                      <span>Tree of Life • Query {messageIndex + 1}/{totalMessages}</span>
                                      <span className="text-[8px] text-relic-silver dark:text-relic-ghost opacity-60">Click to explore →</span>
                                    </div>
                                    <LayerTreeFull
                                      activations={layersData.activations}
                                      compact={true}
                                      showLabels={true}
                                      showPaths={true}
                                      className="mx-auto"
                                    />
                                    <div className="mt-3 text-center text-[8px] text-relic-silver">
                                      Ascent Level: {layersData.userLevel}/11
                                    </div>
                                  </div>
                                </Link>
                              )
                            })()}
                          </div>

                          {/* ================================================================ */}
                          {/* GNOSTIC SOVEREIGN INTELLIGENCE FOOTER (Optional Details) */}
                          {/* ================================================================ */}
                          {message.gnostic && (
                            <div className="mt-2">
                              {/* Toggle Button */}
                              <button
                                onClick={() => setGnosticVisibility(prev => ({
                                  ...prev,
                                  [message.id]: prev[message.id] === undefined ? false : !prev[message.id]
                                }))}
                                className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-relic-silver hover:text-relic-slate dark:hover:text-relic-ghost transition-colors mb-3"
                              >
                                <span className="text-relic-silver">⟁</span>
                                <span>Gnostic Details</span>
                                <span className="text-relic-mist">
                                  {(gnosticVisibility[message.id] === undefined ? true : gnosticVisibility[message.id]) ? '▼' : '▶'}
                                </span>
                              </button>

                              {(gnosticVisibility[message.id] === undefined ? true : gnosticVisibility[message.id]) && (
                                <div className="space-y-4 animate-fade-in">
                                  {/* Antipatterns Purification Notice */}
                                  {message.gnostic.antipatternPurified && (
                                    <AntipatternBadge
                                      antipatternType={message.gnostic.antipatternType}
                                      severity={message.gnostic.antipatternCritique?.severity ?? 0.5}
                                      critique={message.gnostic.antipatternCritique ?? null}
                                    />
                                  )}

                                  {/* Sovereignty Reminder */}
                                  {message.gnostic.sovereigntyFooter && (
                                    <div className="bg-relic-ghost/50 dark:bg-relic-void/30 border border-relic-mist dark:border-relic-slate/30 p-3">
                                      <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-relic-slate dark:text-relic-ghost mb-2">
                                        <span>◈</span>
                                        <span>sovereignty reminder</span>
                                      </div>
                                      <p className="text-[10px] text-relic-silver leading-relaxed whitespace-pre-wrap">
                                        {message.gnostic.sovereigntyFooter}
                                      </p>
                                    </div>
                                  )}

                                  {/* Ascent Progress */}
                                  {message.gnostic.progressState && (
                                    <div className="bg-relic-ghost/50 dark:bg-relic-void/30 border border-relic-mist dark:border-relic-slate/30 p-3">
                                      <div className="text-[9px] text-relic-silver uppercase tracking-[0.2em] mb-3">
                                        <HebrewTermDisplay term="SEPHIROTH" showAI={false} /> Ascent
                                      </div>
                                      <div className="flex items-center justify-between mb-2 pb-2 border-b border-relic-mist/50 dark:border-relic-slate/20">
                                        <span className="text-[10px] text-relic-silver">
                                          Current Level:
                                        </span>
                                        <div className="text-[10px] font-mono text-relic-slate dark:text-white">
                                          {message.gnostic.progressState.levelName} ({message.gnostic.progressState.currentLevel}/11)
                                        </div>
                                      </div>
                                      <div className="flex items-center justify-between mb-1">
                                        <span className="text-[10px] text-relic-silver">Velocity:</span>
                                        <span className="text-[10px] font-mono text-relic-slate dark:text-relic-ghost">
                                          {message.gnostic.progressState.velocity.toFixed(2)} levels/query
                                          {message.gnostic.progressState.velocity > 2.0 && ' ⚡'}
                                        </span>
                                      </div>
                                      <div className="flex items-center justify-between">
                                        <span className="text-[10px] text-relic-silver">Total Queries:</span>
                                        <span className="text-[10px] font-mono text-relic-slate dark:text-relic-ghost">
                                          {message.gnostic.progressState.totalQueries}
                                        </span>
                                      </div>
                                      {message.gnostic.progressState.nextElevation && (
                                        <div className="mt-3 pt-3 border-t border-relic-mist/50 dark:border-relic-slate/20">
                                          <div className="text-[9px] text-relic-silver uppercase tracking-wider mb-1">
                                            Next Elevation
                                          </div>
                                          <p className="text-[10px] text-relic-slate dark:text-relic-ghost leading-relaxed">
                                            {message.gnostic.progressState.nextElevation}
                                          </p>
                                        </div>
                                      )}
                                    </div>
                                  )}

                                  {/* Detailed Layer Activations */}
                                  {message.gnostic.layerAnalysis?.activations && (
                                    <div className="bg-relic-ghost/50 dark:bg-relic-void/30 border border-relic-mist dark:border-relic-slate/30 p-3">
                                      <div className="text-[9px] text-relic-silver uppercase tracking-[0.2em] mb-3">
                                        Layer Analysis
                                      </div>
                                      <div className="space-y-1.5">
                                        {(() => {
                                          // Convert Record<Layer, number> to array and sort
                                          const activationsArray = Object.entries(message.gnostic.layerAnalysis.activations)
                                            .map(([layerNode, activation]) => ({ layerNode: parseInt(layerNode), activation }))
                                            .sort((a, b) => b.activation - a.activation)
                                            .slice(0, 5)

                                          return activationsArray.map((act, idx) => {
                                            const layerNode = Object.entries(LAYER_METADATA).find(([_, meta]) => meta.level === act.layerNode)?.[1]
                                            if (!layerNode) return null
                                            const percentage = Math.round(act.activation * 100)
                                            return (
                                              <div key={idx} className="flex items-center justify-between">
                                                <span className="text-[10px] text-relic-slate dark:text-relic-ghost">
                                                  {layerNode.name}
                                                </span>
                                                <div className="flex items-center gap-2">
                                                  <div className="w-24 h-1.5 bg-relic-mist dark:bg-relic-slate/30 rounded-full overflow-hidden">
                                                    <div
                                                      className="h-full bg-relic-slate dark:bg-relic-ghost transition-all duration-500"
                                                      style={{ width: `${percentage}%` }}
                                                    />
                                                  </div>
                                                  <span className="text-[9px] font-mono text-relic-silver w-8 text-right">
                                                    {percentage}%
                                                  </span>
                                                </div>
                                              </div>
                                            )
                                          })
                                        })()}
                                      </div>
                                      {message.gnostic?.layerAnalysis?.dominant && (
                                        <div className="mt-3 pt-2 border-t border-relic-mist/50 dark:border-relic-slate/20">
                                          <div className="text-[9px] text-relic-silver">
                                            Dominant: <span className="text-relic-slate dark:text-white font-medium">
                                              {message.gnostic.layerAnalysis.dominant}
                                            </span>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  )}

                                  {/* Synthesis Insight */}
                                  {message.gnostic.layerAnalysis.synthesisInsight && (
                                    <div className="bg-relic-ghost/50 dark:bg-relic-void/30 border border-relic-mist dark:border-relic-slate/30 p-3">
                                      <div className="text-[10px] uppercase tracking-wider text-relic-slate dark:text-relic-ghost mb-2">
                                        <HebrewTermDisplay term="DAAT" showAI={true} className="text-[10px]" />
                                      </div>
                                      <p className="text-[10px] text-relic-silver leading-relaxed mb-2">
                                        {message.gnostic.layerAnalysis.synthesisInsight.insight}
                                      </p>
                                      <div className="text-[9px] text-relic-mist font-mono">
                                        Confidence: {(message.gnostic.layerAnalysis.synthesisInsight.confidence * 100).toFixed(0)}%
                                      </div>
                                    </div>
                                  )}

                                  {/* Meta-Core Protocol State */}
                                  {message.gnostic.metaCoreState && (
                                    <div className="bg-relic-ghost/50 dark:bg-relic-void/30 border border-relic-mist dark:border-relic-slate/30 p-3">
                                      <div className="text-[9px] text-relic-silver mb-3">
                                        <HebrewTermDisplay term="KETHER" showAI={true} className="text-[9px]" /> Protocol
                                      </div>
                                      <div className="space-y-2 text-[10px]">
                                        <div className="flex justify-between items-baseline">
                                          <span className="text-relic-silver">Intent:</span>
                                          <span className="text-relic-slate dark:text-relic-ghost text-right ml-4">{message.gnostic.metaCoreState.intent}</span>
                                        </div>
                                        <div className="flex justify-between items-baseline">
                                          <span className="text-relic-silver">Boundary:</span>
                                          <span className="text-relic-slate dark:text-relic-ghost text-right ml-4">{message.gnostic.metaCoreState.boundary}</span>
                                        </div>
                                        <div className="flex justify-between items-baseline">
                                          <span className="text-relic-silver">Reflection:</span>
                                          <span className="text-relic-slate dark:text-relic-ghost font-mono">{message.gnostic.metaCoreState.reflectionMode ? 'Active' : 'Inactive'}</span>
                                        </div>
                                        <div className="flex justify-between items-baseline">
                                          <span className="text-relic-silver">Ascent Level:</span>
                                          <span className="text-relic-slate dark:text-relic-ghost font-mono">{message.gnostic.metaCoreState.ascentLevel}/10</span>
                                        </div>
                                      </div>
                                    </div>
                                  )}

                                  {/* Dominant Layer */}
                                  <div className="text-[9px] text-relic-silver text-center border-t border-relic-mist/30 dark:border-relic-slate/20 pt-3">
                                    <div className="mb-1">
                                      Dominant <HebrewTermDisplay term="SEFIRAH" showAI={false} className="text-[9px]" />:
                                    </div>
                                    <div className="font-mono text-relic-slate dark:text-white">
                                      {message.gnostic.layerAnalysis.dominant}
                                    </div>
                                    <div className="text-[8px] text-relic-mist mt-1">
                                      Average Level: {message.gnostic.layerAnalysis.averageLevel.toFixed(1)}
                                    </div>
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
        <div className={`transition-all duration-500 ease-out ${isExpanded ? 'pb-4 pt-2 border-t border-relic-mist/30 dark:border-relic-slate/30 bg-white dark:bg-relic-void sticky bottom-0' : 'pb-8'}`}>
          <LiveRefinementCanal isVisible={isExpanded && messages.length > 0} isLoading={isLoading} />
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

              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,.pdf,.txt,.md,.docx"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>

            {/* Attached Files Display */}
            {attachedFiles.length > 0 && (
              <div className="mt-2 flex items-center gap-3 text-[9px] font-mono text-relic-slate dark:text-relic-silver">
                {attachedFiles.map((file, index) => {
                  const getFileType = (file: File): 'img' | 'pdf' | 'txt' => {
                    if (file.type.startsWith('image/')) return 'img'
                    if (file.type === 'application/pdf') return 'pdf'
                    return 'txt'
                  }

                  const fileType = getFileType(file)
                  const sizeKB = (file.size / 1024).toFixed(0)

                  return (
                    <div key={index} className="inline-flex items-center gap-1.5">
                      {/* Status indicator */}
                      <span className="w-1 h-1 rounded-full bg-emerald-500" />

                      {/* File info */}
                      <span className="truncate max-w-[100px]">
                        {file.name}
                      </span>

                      <span className="text-relic-silver/60">
                        {sizeKB}k
                      </span>

                      <span className="text-relic-silver/60">
                        {fileType}
                      </span>

                      {/* Remove */}
                      <button
                        type="button"
                        onClick={() => {
                          setAttachedFiles(prev => prev.filter((_, i) => i !== index))
                        }}
                        className="text-relic-silver/60 hover:text-relic-void dark:hover:text-white transition-colors text-[8px]"
                      >
                        ×
                      </button>
                    </div>
                  )
                })}
              </div>
            )}

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
                consoleOpen={showLayerDashboard}
                onConsoleToggle={() => setShowLayerDashboard(!showLayerDashboard)}
              />
            </motion.div>

            {/* Instinct Mode Console - Below methodology */}
            <div className="flex justify-center">
              <InstinctModeConsole />
            </div>

            {/* Console - Inline below methodology */}
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
                attachedFilesCount={attachedFiles.length}
                onFilesClick={triggerFileSelect}
              />
            </div>

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
                  pageContext,
                  instinctMode,
                  instinctConfig
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
          // INTELLIGENCE: Map fusion response to intelligence interface
          intelligence: data.fusion ? {
            analysis: {
              complexity: data.fusion.confidence || 0,
              queryType: data.fusion.methodology || 'direct',
              keywords: data.fusion.layerActivations?.[0]?.keywords || []
            },
            layerActivations: (data.fusion.layerActivations || []).map((s: any) => ({
              layerNode: 0,
              name: s.name,
              activation: s.effectiveWeight || 0,
              effectiveWeight: s.effectiveWeight || 0
            })),
            dominantLayers: data.fusion.dominantLayers || [],
            pathActivations: [],
            methodologySelection: {
              selected: data.fusion.methodology || 'direct',
              confidence: data.fusion.confidence || 0,
              alternatives: []
            },
            guard: {
              recommendation: data.fusion.guardRecommendation || 'proceed',
              reasons: []
            },
            instinct: {
              enabled: (data.fusion.activeLenses || []).length > 0,
              activeLenses: data.fusion.activeLenses || []
            },
            processing: {
              mode: data.fusion.processingMode || 'weighted',
              extendedThinkingBudget: data.fusion.extendedThinkingBudget || 3000
            },
            timing: {
              fusionMs: data.fusion.processingTimeMs || 0
            }
          } : undefined,
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
        <footer className="border-t border-relic-mist/30 dark:border-relic-slate/20">
          <div className="w-full px-4 py-3">
            <div className="flex items-center justify-between">
              {/* Left side - description text - pushed to left edge */}
              <span className="text-[11px] text-relic-silver dark:text-relic-ghost whitespace-nowrap pl-2">
                self aware - autonomous intelligence
              </span>
              
              {/* Right side - navigation and toggles - pushed to right edge */}
              <div className="flex items-center gap-4 pr-2">
                {/* Instinct Mode Toggle */}
                <button
                  onClick={() => {
                    const { settings, setInstinctMode } = useSettingsStore.getState()
                    setInstinctMode(!settings.instinctMode)
                  }}
                  className="flex items-center gap-2 text-[10px] font-mono text-relic-silver dark:text-relic-ghost hover:text-relic-slate dark:hover:text-white transition-colors group"
                >
                  <SuperSaiyanIcon size={18} active={settings.instinctMode} />
                  <span className={settings.instinctMode ? 'text-relic-void dark:text-white' : ''}>instinct</span>
                </button>

                {/* AI Config Console Toggle */}
                <button
                  onClick={() => setShowLayerDashboard(!showLayerDashboard)}
                  className="flex items-center gap-2 text-[10px] font-mono text-relic-silver dark:text-relic-ghost hover:text-relic-slate dark:hover:text-white transition-colors group"
                >
                  <span
                    className="text-[14px] transition-all"
                    style={{
                      color: showLayerDashboard ? '#a855f7' : '#94a3b8',
                      filter: showLayerDashboard ? 'drop-shadow(0 0 3px #a855f7)' : 'none'
                    }}
                  >
                    ✦
                  </span>
                  <span className={showLayerDashboard ? 'text-relic-void dark:text-white' : ''}>ai config</span>
                </button>

                {user ? (
                  <NavigationMenu
                    user={user}
                    onMindMapClick={() => {
                      setMindMapInitialView('graph')
                      setShowMindMap(true)
                    }}
                    onHistoryClick={() => {
                      setMindMapInitialView('history')
                      setShowMindMap(true)
                    }}
                  />
                ) : (
                  <button
                    onClick={() => setShowAuthModal(true)}
                    className="text-[10px] font-mono text-relic-silver dark:text-relic-ghost hover:text-relic-slate dark:hover:text-white transition-colors"
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
        onClose={() => {
          setShowMindMap(false)
          setMindMapInitialView('graph') // Reset to graph view when closed
        }}
        userId={user?.id || null}
        initialView={mindMapInitialView}
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

      {/* Create Profile Button - Show when not logged in and expanded */}
      {!user && isExpanded && (
        <div className="fixed top-14 right-4 z-30">
          <button
            onClick={() => setShowAuthModal(true)}
            className="px-4 py-2 text-xs font-mono border-2 border-relic-slate/30 dark:border-relic-ghost/30 text-relic-slate dark:text-relic-ghost bg-transparent hover:bg-relic-ghost/50 dark:hover:bg-relic-slate/20 transition-all duration-200"
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

      {/* Side Mini Chat - Context Watcher - Always visible if there are messages */}
      <SideMiniChat
        isVisible={messages.length > 0}
        draggable={isCanvasMode}
        defaultPosition={isCanvasMode ? { left: 10, top: 500 } : undefined}
        messages={messages}
        externalQuery={deepDiveQuery}
        conversationId={currentConversationId}
        onSendQuery={async (queryText) => {
          // Check if already loading
          if (isLoading || !queryText.trim()) return

          // Set the query text
          setQuery(queryText)

          // Wait a moment for React state to update
          await new Promise(resolve => setTimeout(resolve, 50))

          // Start transition animation
          setIsTransitioning(true)

          // Wait for transition animation
          await new Promise(resolve => setTimeout(resolve, 800))

          const userMessage: Message = {
            id: generateId(),
            role: 'user',
            content: queryText.trim(),
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
                'x-session-id': sessionId,
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
                pageContext,
                instinctMode,
                instinctConfig
              })
            })

            if (!res.ok) {
              throw new Error(`HTTP error! status: ${res.status}`)
            }

            const data = await res.json()

            // Handle methodology-specific responses
            const aiMessage: Message = {
              id: generateId(),
              role: 'assistant',
              content: data.response,
              timestamp: new Date(),
              methodology: data.methodologyUsed,
              topics: data.topics,
              gnostic: data.gnostic,
              // INTELLIGENCE: Map fusion response to intelligence interface
              intelligence: data.fusion ? {
                analysis: {
                  complexity: data.fusion.confidence || 0,
                  queryType: data.fusion.methodology || 'direct',
                  keywords: data.fusion.layerActivations?.[0]?.keywords || []
                },
                layerActivations: (data.fusion.layerActivations || []).map((s: any) => ({
                  layerNode: 0,
                  name: s.name,
                  activation: s.effectiveWeight || 0,
                  effectiveWeight: s.effectiveWeight || 0
                })),
                dominantLayers: data.fusion.dominantLayers || [],
                pathActivations: [],
                methodologySelection: {
                  selected: data.fusion.methodology || 'direct',
                  confidence: data.fusion.confidence || 0,
                  alternatives: []
                },
                guard: {
                  recommendation: data.fusion.guardRecommendation || 'proceed',
                  reasons: []
                },
                instinct: {
                  enabled: (data.fusion.activeLenses || []).length > 0,
                  activeLenses: data.fusion.activeLenses || []
                },
                processing: {
                  mode: data.fusion.processingMode || 'weighted',
                  extendedThinkingBudget: data.fusion.extendedThinkingBudget || 3000
                },
                timing: {
                  fusionMs: data.fusion.processingTimeMs || 0
                }
              } : undefined,
            }

            setMessages(prev => [...prev, aiMessage])

            // Auto-track Gnostic progression
            if (data.gnostic?.progressState) {
              console.log(`[GNOSTIC] Ascent Level: ${data.gnostic.progressState.currentLevel} (${data.gnostic.progressState.levelName})`)
            }

            // Analytics tracking
            const latency = Date.now() - startTime
            if (typeof window !== 'undefined' && (window as any).posthog) {
              (window as any).posthog.capture('query_completed', {
                methodology: data.methodologyUsed,
                latency,
                tokens: data.metrics?.tokens,
                cost: data.metrics?.cost,
                guardPassed: data.guardResult?.passed,
                legendMode
              })
            }

          } catch (error) {
            console.error('Query error:', error)
            const errorMessage: Message = {
              id: generateId(),
              role: 'assistant',
              content: 'An error occurred while processing your query. Please try again.',
              timestamp: new Date()
            }
            setMessages(prev => [...prev, errorMessage])
          } finally {
            setIsLoading(false)
          }
        }}
        onPromoteToMain={(query, response) => {
          // Add mini chat exchange to main chat
          const userMsg: Message = {
            id: generateId(),
            role: 'user',
            content: `[Promoted from Side Chat] ${query}`,
            timestamp: new Date()
          }
          const aiMsg: Message = {
            id: generateId(),
            role: 'assistant',
            content: response,
            timestamp: new Date(),
            methodology: 'direct'
          }
          setMessages(prev => [...prev, userMsg, aiMsg])
          if (!isExpanded) setIsExpanded(true)
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

      {/* Tree Configuration Modal - Single entry point for both buttons */}
      <TreeConfigurationModal
        isOpen={showLayerDashboard}
        onClose={() => setShowLayerDashboard(false)}
      />

      {/* URL Parameter Watcher - Wrapped in Suspense for Next.js 15 compatibility */}
      <Suspense fallback={null}>
        <ContinueParamWatcher onContinue={loadConversation} />
      </Suspense>
    </div>
  )
}

// Export with Suspense boundary for production builds
export default function HomePageWithSuspense() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-relic-white dark:bg-relic-void flex items-center justify-center">
        <div className="text-center">
          <div className="animate-pulse text-relic-slate dark:text-relic-ghost">Loading...</div>
        </div>
      </div>
    }>
      <HomePage />
    </Suspense>
  )
}
