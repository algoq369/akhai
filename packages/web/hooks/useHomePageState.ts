import { useState, useRef } from 'react';
import { Message } from '@/lib/chat-store';
import type { SupportedLanguage } from '@/components/LanguageSelector';
import { useHomePageDerived } from './useHomePageDerived';
import { useHomePageHandlers } from './useHomePageHandlers';
import { useHomePageEffects } from './useHomePageEffects';
import { buildPagePropBundles } from './usePagePropBundles';

export function useHomePageState() {
  // ─── Language ────────────────────────────────────────────
  const [currentLang, setCurrentLang] = useState<SupportedLanguage>('en');

  // ─── Chat state ──────────────────────────────────────────
  const [query, setQuery] = useState('');
  const [methodology, setMethodology] = useState('auto');
  const [messages, setMessages] = useState<Message[]>([]);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [uploadedFileUrls, setUploadedFileUrls] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // ─── UI state ────────────────────────────────────────────
  const [isExpanded, setIsExpanded] = useState(false);
  const [hoveredMethod, setHoveredMethod] = useState<string | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const [isBlinking, setIsBlinking] = useState<string | null>(null);
  const [darkMode, setDarkMode] = useState(false);
  const [expandedMethodology, setExpandedMethodology] = useState<string | null>(null);
  const [continuingConversation, setContinuingConversation] = useState<string | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // ─── Guard state ─────────────────────────────────────────
  const [loadingSuggestions, setLoadingSuggestions] = useState<string | null>(null);
  const [guardSuggestions, setGuardSuggestions] = useState<
    Record<string, { refine?: string[]; pivot?: string[] }>
  >({});

  // ─── Auth state ──────────────────────────────────────────
  const [user, setUser] = useState<any>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // ─── MindMap / Dashboard ─────────────────────────────────
  const [showMindMap, setShowMindMap] = useState(false);
  const [mindMapInitialView, setMindMapInitialView] = useState<'graph' | 'history' | 'report'>(
    'graph'
  );
  const [showDashboard, setShowDashboard] = useState(false);
  const [showLayerDashboard, setShowLayerDashboard] = useState(false);

  // ─── Feature flags / toggles ─────────────────────────────
  const [legendMode, setLegendMode] = useState(false);
  const [instinctModeEnabled, setInstinctModeEnabled] = useState(false);
  const [suggestionsEnabled, setSuggestionsEnabled] = useState(true);
  const [auditEnabled, setAuditEnabled] = useState(false);
  const [mindmapConnectorEnabled, setMindmapConnectorEnabled] = useState(false);
  const [pipelineEnabled, setPipelineEnabled] = useState(true);
  const [selectedModel, setSelectedModel] = useState('claude');
  const [realtimeDataEnabled, setRealtimeDataEnabled] = useState(false);
  const [newsNotificationsEnabled, setNewsNotificationsEnabled] = useState(false);

  // ─── Visualization state ─────────────────────────────────
  const [vizMode, setVizMode] = useState<Record<string, 'layers' | 'insight' | 'text' | 'mindmap'>>(
    {}
  );
  const [globalVizMode, setGlobalVizMode] = useState<'off' | 'synthesis' | 'insight'>('synthesis');
  const [mindmapVisibility, setMindmapVisibility] = useState<Record<string, boolean>>({});
  const [gnosticVisibility, setGnosticVisibility] = useState<Record<string, boolean>>({});

  // ─── Side chats ──────────────────────────────────────────
  const [sideChats, setSideChats] = useState<
    Array<{ id: string; methodology: string; messages: Message[] }>
  >([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);

  // ─── Methodology prompt ──────────────────────────────────
  const [showMethodologyPrompt, setShowMethodologyPrompt] = useState(false);
  const [pendingMethodology, setPendingMethodology] = useState<string | null>(null);

  // ─── Pipeline ────────────────────────────────────────────
  const [historyPanelOpen, setHistoryPanelOpen] = useState(false);
  const [hiddenPipelines, setHiddenPipelines] = useState<Set<string>>(new Set());
  const toggleMsgPipeline = (msgId: string) => {
    setHiddenPipelines((prev) => {
      const next = new Set(prev);
      if (next.has(msgId)) next.delete(msgId);
      else next.add(msgId);
      return next;
    });
  };

  // ─── Deep Dive ───────────────────────────────────────────
  const [deepDiveQuery, setDeepDiveQuery] = useState<string>('');

  // ─── Annotations / Refinement ────────────────────────────
  const [messageAnnotations, setMessageAnnotations] = useState<Record<string, any[]>>({});
  const [currentConversationId, setCurrentConversationId] = useState<string | undefined>(undefined);
  const [refinementCounts, setRefinementCounts] = useState<Record<string, number>>({});
  const pendingRefinementCount = useRef(0);

  // ─── Cognitive Signatures ────────────────────────────────
  const [messageCognitiveSignatures, setMessageCognitiveSignatures] = useState<Record<string, any>>(
    {}
  );

  // ─── Extended Thinking (raw thinking stream per message) ─
  const [messageRawThinking, setMessageRawThinking] = useState<Record<string, string>>({});

  // ─── View Mode (classic / mini-canvas / canvas) ──────────
  const [viewMode, setViewMode] = useState<'classic' | 'mini-canvas' | 'canvas'>('classic');
  const isCanvasMode = viewMode === 'canvas';

  // ─── Refs ────────────────────────────────────────────────
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const diamondRef = useRef<HTMLDivElement>(null);

  // ─── Derived state (session, depth, settings, canvas, side canal) ───
  const {
    sessionId,
    isClient,
    processText,
    resetDepthAnnotations,
    depthConfig,
    setDepthConfig,
    instinctMode,
    instinctConfig,
    queryCards,
    visualNodes,
    visualEdges,
    sideCanalEnabled,
    setSideCanalEnabled,
    contextInjectionEnabled,
    setContextInjectionEnabled,
    autoExtractEnabled,
    topicSuggestions,
    topicToastVisible,
    setTopicToastVisible,
    showTopicsPanel,
    setShowTopicsPanel,
    extractAndStoreTopics,
    refreshSuggestions,
    removeSuggestion,
    currentTopics,
    topicInsights,
    getPageContext,
  } = useHomePageDerived({ messages, methodology, isExpanded });

  // ═══════════════ Handlers hook ═══════════════════════════
  const handlers = useHomePageHandlers({
    query,
    setQuery,
    methodology,
    setMethodology,
    messages,
    setMessages,
    attachedFiles,
    setAttachedFiles,
    uploadedFileUrls,
    setUploadedFileUrls,
    isLoading,
    setIsLoading,
    isExpanded,
    setIsExpanded,
    setIsBlinking,
    setLoadingSuggestions,
    setGuardSuggestions,
    darkMode,
    setDarkMode,
    legendMode,
    setLegendMode,
    setShowMethodologyPrompt,
    pendingMethodology,
    setPendingMethodology,
    setIsTransitioning,
    setCurrentConversationId,
    setContinuingConversation,
    setMessageAnnotations,
    sideChats,
    setSideChats,
    activeChatId,
    setActiveChatId,
    hoveredMethod,
    setHoveredMethod,
    setTooltipPos,
    fileInputRef,
    inputRef,
    containerRef,
    pendingRefinementCount,
    sessionId,
    sideCanalEnabled,
    autoExtractEnabled,
    extractAndStoreTopics,
    getPageContext,
    resetDepthAnnotations,
    setMessageRawThinking,
  });

  // ═══════════════ Effects (delegated to useHomePageEffects) ═
  const { checkSession, loadConversation } = useHomePageEffects({
    depthConfig,
    messages,
    processText,
    messageAnnotations,
    setMessageAnnotations,
    pendingRefinementCount,
    refinementCounts,
    setRefinementCounts,
    deepDiveQuery,
    setDeepDiveQuery,
    sideCanalEnabled,
    showTopicsPanel,
    setShowTopicsPanel,
    refreshSuggestions,
    setUser,
    setShowAuthModal,
    setDarkMode,
    setMessages,
    setContinuingConversation,
    setIsExpanded,
    setCurrentConversationId,
    setCurrentLang,
    setLegendMode,
    messagesEndRef,
    messageCognitiveSignatures,
    setMessageCognitiveSignatures,
  });

  // ═══════════════ Prop bundles (delegated) ═════════════════
  const { chatMessagesProps, inputSectionProps, overlaysProps } = buildPagePropBundles({
    messages,
    methodology,
    query,
    attachedFiles,
    setAttachedFiles,
    vizMode,
    setVizMode,
    globalVizMode,
    setGlobalVizMode,
    depthConfig,
    setDepthConfig,
    messageAnnotations,
    messageCognitiveSignatures,
    messageRawThinking,
    mindmapVisibility,
    setMindmapVisibility,
    gnosticVisibility,
    setGnosticVisibility,
    pipelineEnabled,
    setPipelineEnabled,
    hiddenPipelines,
    toggleMsgPipeline,
    loadingSuggestions,
    guardSuggestions,
    messagesEndRef,
    inputRef,
    fileInputRef,
    setQuery,
    setShowMindMap,
    setDeepDiveQuery,
    setLegendMode,
    setShowAuthModal,
    setShowTopicsPanel,
    setMindMapInitialView,
    setShowLayerDashboard,
    isExpanded,
    isLoading,
    isTransitioning,
    darkMode,
    legendMode,
    user,
    selectedModel,
    setSelectedModel,
    showLayerDashboard,
    instinctModeEnabled,
    setInstinctModeEnabled,
    suggestionsEnabled,
    setSuggestionsEnabled,
    auditEnabled,
    setAuditEnabled,
    mindmapConnectorEnabled,
    setMindmapConnectorEnabled,
    sideCanalEnabled,
    setSideCanalEnabled,
    showTopicsPanel,
    showMindMap,
    mindMapInitialView,
    showAuthModal,
    topicSuggestions,
    removeSuggestion,
    showMethodologyPrompt,
    historyPanelOpen,
    setHistoryPanelOpen,
    loadConversation,
    checkSession,
    handlers,
  });

  // ═══════════════ Return everything ═══════════════════════
  return {
    chatMessagesProps,
    inputSectionProps,
    overlaysProps,
    currentLang,
    setCurrentLang,
    query,
    setQuery,
    methodology,
    setMethodology,
    messages,
    setMessages,
    attachedFiles,
    setAttachedFiles,
    uploadedFileUrls,
    setUploadedFileUrls,
    isLoading,
    setIsLoading,

    // UI state
    isExpanded,
    setIsExpanded,
    hoveredMethod,
    setHoveredMethod,
    tooltipPos,
    setTooltipPos,
    isBlinking,
    setIsBlinking,
    darkMode,
    setDarkMode,
    expandedMethodology,
    setExpandedMethodology,
    continuingConversation,
    setContinuingConversation,
    isTransitioning,
    setIsTransitioning,

    // Guard state
    loadingSuggestions,
    setLoadingSuggestions,
    guardSuggestions,
    setGuardSuggestions,

    // Auth state
    user,
    setUser,
    showAuthModal,
    setShowAuthModal,
    checkSession,

    // MindMap / Dashboard
    showMindMap,
    setShowMindMap,
    mindMapInitialView,
    setMindMapInitialView,
    showDashboard,
    setShowDashboard,
    showLayerDashboard,
    setShowLayerDashboard,

    // Feature flags / toggles
    legendMode,
    setLegendMode,
    instinctModeEnabled,
    setInstinctModeEnabled,
    suggestionsEnabled,
    setSuggestionsEnabled,
    auditEnabled,
    setAuditEnabled,
    mindmapConnectorEnabled,
    setMindmapConnectorEnabled,
    pipelineEnabled,
    setPipelineEnabled,
    selectedModel,
    setSelectedModel,
    realtimeDataEnabled,
    setRealtimeDataEnabled,
    newsNotificationsEnabled,
    setNewsNotificationsEnabled,

    // Visualization state
    vizMode,
    setVizMode,
    globalVizMode,
    setGlobalVizMode,
    mindmapVisibility,
    setMindmapVisibility,
    gnosticVisibility,
    setGnosticVisibility,

    // Side chats
    sideChats,
    setSideChats,
    activeChatId,
    setActiveChatId,

    // Methodology prompt
    showMethodologyPrompt,
    setShowMethodologyPrompt,
    pendingMethodology,
    setPendingMethodology,

    // Pipeline
    historyPanelOpen,
    setHistoryPanelOpen,
    hiddenPipelines,
    setHiddenPipelines,
    toggleMsgPipeline,

    // Deep Dive
    deepDiveQuery,
    setDeepDiveQuery,

    // Annotations / Refinement
    messageAnnotations,
    setMessageAnnotations,
    currentConversationId,
    setCurrentConversationId,
    refinementCounts,
    setRefinementCounts,
    pendingRefinementCount,

    // Cognitive Signatures
    messageCognitiveSignatures,
    setMessageCognitiveSignatures,

    // Extended Thinking
    messageRawThinking,
    setMessageRawThinking,

    // View Mode
    viewMode,
    setViewMode,
    isCanvasMode,

    // Refs
    fileInputRef,
    messagesEndRef,
    inputRef,
    containerRef,
    diamondRef,

    // Session
    sessionId,
    isClient,

    // Depth Annotations
    depthConfig,
    setDepthConfig,
    processText,
    resetDepthAnnotations,

    // Instinct Mode Settings (from store)
    instinctMode,
    instinctConfig,

    // Canvas data
    queryCards,
    visualNodes,
    visualEdges,

    // Side Canal store values
    sideCanalEnabled,
    setSideCanalEnabled,
    contextInjectionEnabled,
    setContextInjectionEnabled,
    autoExtractEnabled,
    topicSuggestions,
    topicToastVisible,
    setTopicToastVisible,
    showTopicsPanel,
    setShowTopicsPanel,
    extractAndStoreTopics,
    refreshSuggestions,
    removeSuggestion,
    currentTopics,
    topicInsights,

    // Load conversation (used by ContinueParamWatcher and Overlays)
    loadConversation,

    // All handlers from useHomePageHandlers
    ...handlers,
  };
}

export type HomePageState = ReturnType<typeof useHomePageState>;
