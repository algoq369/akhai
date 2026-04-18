import type { Message } from '@/lib/chat-store';

/**
 * Constructs prop bundles for section components to reduce prop drilling in page.tsx.
 * Pure function — no hooks, no side effects.
 */
export function buildPagePropBundles(opts: {
  // Chat
  messages: Message[];
  methodology: string;
  query: string;
  attachedFiles: File[];
  setAttachedFiles: any;
  // Viz
  vizMode: any;
  setVizMode: any;
  globalVizMode: any;
  setGlobalVizMode: any;
  depthConfig: any;
  setDepthConfig: any;
  messageAnnotations: any;
  messageCognitiveSignatures: any;
  messageRawThinking?: Record<string, string>;
  mindmapVisibility: any;
  setMindmapVisibility: any;
  gnosticVisibility: any;
  setGnosticVisibility: any;
  // Pipeline
  pipelineEnabled: boolean;
  setPipelineEnabled: any;
  hiddenPipelines: Set<string>;
  toggleMsgPipeline: any;
  // Guard
  loadingSuggestions: string | null;
  guardSuggestions: any;
  // Refs
  messagesEndRef: any;
  inputRef: any;
  fileInputRef: any;
  // Setters
  setQuery: any;
  setShowMindMap: any;
  setDeepDiveQuery: any;
  setLegendMode: any;
  setShowAuthModal: any;
  setShowTopicsPanel: any;
  setMindMapInitialView: any;
  setShowLayerDashboard: any;
  // UI state
  isExpanded: boolean;
  isLoading: boolean;
  isTransitioning: boolean;
  darkMode: boolean;
  legendMode: boolean;
  user: any;
  selectedModel: string;
  setSelectedModel: any;
  showLayerDashboard: boolean;
  instinctModeEnabled: boolean;
  setInstinctModeEnabled: any;
  suggestionsEnabled: boolean;
  setSuggestionsEnabled: any;
  auditEnabled: boolean;
  setAuditEnabled: any;
  mindmapConnectorEnabled: boolean;
  setMindmapConnectorEnabled: any;
  sideCanalEnabled: boolean;
  setSideCanalEnabled: any;
  // Overlays
  showTopicsPanel: boolean;
  showMindMap: boolean;
  mindMapInitialView: any;
  showAuthModal: boolean;
  topicSuggestions: any;
  removeSuggestion: any;
  showMethodologyPrompt: boolean;
  historyPanelOpen: boolean;
  setHistoryPanelOpen: any;
  loadConversation: any;
  checkSession: any;
  // Handlers
  handlers: any;
}) {
  const s = opts;
  const h = opts.handlers;

  const chatMessagesProps = {
    messages: s.messages,
    methodology: s.methodology,
    vizMode: s.vizMode,
    setVizMode: s.setVizMode,
    globalVizMode: s.globalVizMode,
    depthConfig: s.depthConfig,
    setDepthConfig: s.setDepthConfig,
    messageAnnotations: s.messageAnnotations,
    messageCognitiveSignatures: s.messageCognitiveSignatures,
    messageRawThinking: s.messageRawThinking,
    mindmapVisibility: s.mindmapVisibility,
    setMindmapVisibility: s.setMindmapVisibility,
    gnosticVisibility: s.gnosticVisibility,
    setGnosticVisibility: s.setGnosticVisibility,
    pipelineEnabled: s.pipelineEnabled,
    hiddenPipelines: s.hiddenPipelines,
    toggleMsgPipeline: s.toggleMsgPipeline,
    loadingSuggestions: s.loadingSuggestions,
    guardSuggestions: s.guardSuggestions,
    messagesEndRef: s.messagesEndRef,
    setQuery: s.setQuery,
    setShowMindMap: s.setShowMindMap,
    setDeepDiveQuery: s.setDeepDiveQuery,
    handleGuardRefine: h.handleGuardRefine,
    handleGuardPivot: h.handleGuardPivot,
    handleGuardContinue: h.handleGuardContinue,
  } as const;

  const inputSectionProps = {
    isExpanded: s.isExpanded,
    isLoading: s.isLoading,
    isTransitioning: s.isTransitioning,
    query: s.query,
    onQueryChange: h.handleQueryChange,
    onSubmit: h.handleSubmit,
    inputRef: s.inputRef,
    fileInputRef: s.fileInputRef,
    attachedFiles: s.attachedFiles,
    setAttachedFiles: s.setAttachedFiles,
    onFileSelect: h.handleFileSelect,
    triggerFileSelect: h.triggerFileSelect,
    methodology: s.methodology,
    onMethodologyClick: h.handleMethodologyClick,
    showLayerDashboard: s.showLayerDashboard,
    setShowLayerDashboard: s.setShowLayerDashboard,
    instinctModeEnabled: s.instinctModeEnabled,
    setInstinctModeEnabled: s.setInstinctModeEnabled,
    suggestionsEnabled: s.suggestionsEnabled,
    setSuggestionsEnabled: s.setSuggestionsEnabled,
    auditEnabled: s.auditEnabled,
    setAuditEnabled: s.setAuditEnabled,
    mindmapConnectorEnabled: s.mindmapConnectorEnabled,
    setMindmapConnectorEnabled: s.setMindmapConnectorEnabled,
    sideCanalEnabled: s.sideCanalEnabled,
    setSideCanalEnabled: s.setSideCanalEnabled,
    pipelineEnabled: s.pipelineEnabled,
    setPipelineEnabled: s.setPipelineEnabled,
    selectedModel: s.selectedModel,
    setSelectedModel: s.setSelectedModel,
    globalVizMode: s.globalVizMode,
    setGlobalVizMode: s.setGlobalVizMode,
    user: s.user,
    legendMode: s.legendMode,
    darkMode: s.darkMode,
    onMethodologySwitch: h.handleMethodologySwitch,
    onGuardToggle: h.handleGuardToggle,
    onLegendModeToggle: (enabled: boolean) => {
      s.setLegendMode(enabled);
      if (enabled) localStorage.setItem('legendMode', 'true');
      else localStorage.removeItem('legendMode');
    },
    toggleDarkMode: h.toggleDarkMode,
    messages: s.messages,
  } as const;

  const overlaysProps = {
    showTopicsPanel: s.showTopicsPanel,
    setShowTopicsPanel: s.setShowTopicsPanel,
    setShowMindMap: s.setShowMindMap,
    showMindMap: s.showMindMap,
    onCloseMindMap: () => {
      s.setShowMindMap(false);
      s.setMindMapInitialView('graph');
    },
    onSendMindMapQuery: (q: string) => {
      s.setQuery(q);
      setTimeout(() => {
        const form = s.inputRef.current?.closest('form');
        if (form) form.requestSubmit();
      }, 100);
    },
    userId: s.user?.id || null,
    mindMapInitialView: s.mindMapInitialView,
    showAuthModal: s.showAuthModal,
    onCloseAuth: () => s.setShowAuthModal(false),
    onAuthSuccess: () => {
      s.checkSession();
      s.setShowAuthModal(false);
    },
    topicSuggestions: s.topicSuggestions,
    onRemoveSuggestion: s.removeSuggestion,
    onSuggestionClick: (suggestion: any) => {
      s.setQuery(suggestion.topicName + ' ');
      if (s.inputRef.current) s.inputRef.current.focus();
    },
    showMethodologyPrompt: s.showMethodologyPrompt,
    onContinueInCurrentChat: h.handleContinueInCurrentChat,
    onStartNewChat: h.handleStartNewChat,
    onCancelMethodologyChange: h.handleCancelMethodologyChange,
    showLayerDashboard: s.showLayerDashboard,
    onCloseLayerDashboard: () => s.setShowLayerDashboard(false),
    loadConversation: s.loadConversation,
    historyPanelOpen: s.historyPanelOpen,
    setHistoryPanelOpen: s.setHistoryPanelOpen,
    messages: s.messages,
    messageCognitiveSignatures: s.messageCognitiveSignatures,
  } as const;

  return { chatMessagesProps, inputSectionProps, overlaysProps };
}
