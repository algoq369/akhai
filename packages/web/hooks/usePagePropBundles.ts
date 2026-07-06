import type { Message } from '@/lib/chat-store';
import type { ComponentProps } from 'react';
import type ChatMessages from '@/components/sections/ChatMessages';
import type InputSection from '@/components/home/InputSection';
import type Overlays from '@/components/home/Overlays';
import type { useHomePageHandlers } from './useHomePageHandlers';

// Prop types of the consumer components — the bundles below must satisfy these.
type CMProps = ComponentProps<typeof ChatMessages>;
type ISProps = ComponentProps<typeof InputSection>;
type OVProps = ComponentProps<typeof Overlays>;

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
  setAttachedFiles: ISProps['setAttachedFiles'];
  // Viz
  vizMode: CMProps['vizMode'];
  setVizMode: CMProps['setVizMode'];
  globalVizMode: CMProps['globalVizMode'];
  setGlobalVizMode: ISProps['setGlobalVizMode'];
  depthConfig: CMProps['depthConfig'];
  setDepthConfig: CMProps['setDepthConfig'];
  messageAnnotations: CMProps['messageAnnotations'];
  messageCognitiveSignatures: CMProps['messageCognitiveSignatures'];
  messageRawThinking?: Record<string, string>;
  mindmapVisibility: CMProps['mindmapVisibility'];
  setMindmapVisibility: CMProps['setMindmapVisibility'];
  gnosticVisibility: CMProps['gnosticVisibility'];
  setGnosticVisibility: CMProps['setGnosticVisibility'];
  // Pipeline
  pipelineEnabled: boolean;
  setPipelineEnabled: ISProps['setPipelineEnabled'];
  hiddenPipelines: Set<string>;
  toggleMsgPipeline: CMProps['toggleMsgPipeline'];
  // Guard
  loadingSuggestions: string | null;
  guardSuggestions: CMProps['guardSuggestions'];
  // Refs
  messagesEndRef: CMProps['messagesEndRef'];
  inputRef: ISProps['inputRef'];
  fileInputRef: ISProps['fileInputRef'];
  // Setters
  setQuery: CMProps['setQuery'];
  setShowMindMap: CMProps['setShowMindMap'];
  setDeepDiveQuery: CMProps['setDeepDiveQuery'];
  setLegendMode: (enabled: boolean) => void;
  setShowAuthModal: (show: boolean) => void;
  setShowTopicsPanel: OVProps['setShowTopicsPanel'];
  setMindMapInitialView: (view: OVProps['mindMapInitialView']) => void;
  setShowLayerDashboard: ISProps['setShowLayerDashboard'];
  // UI state
  isExpanded: boolean;
  isLoading: boolean;
  isTransitioning: boolean;
  darkMode: boolean;
  legendMode: boolean;
  user: ISProps['user'];
  selectedModel: string;
  setSelectedModel: ISProps['setSelectedModel'];
  showLayerDashboard: boolean;
  instinctModeEnabled: boolean;
  setInstinctModeEnabled: ISProps['setInstinctModeEnabled'];
  suggestionsEnabled: boolean;
  setSuggestionsEnabled: ISProps['setSuggestionsEnabled'];
  auditEnabled: boolean;
  setAuditEnabled: ISProps['setAuditEnabled'];
  mindmapConnectorEnabled: boolean;
  setMindmapConnectorEnabled: ISProps['setMindmapConnectorEnabled'];
  sideCanalEnabled: boolean;
  setSideCanalEnabled: ISProps['setSideCanalEnabled'];
  // Overlays
  showTopicsPanel: boolean;
  showMindMap: boolean;
  mindMapInitialView: OVProps['mindMapInitialView'];
  showAuthModal: boolean;
  topicSuggestions: OVProps['topicSuggestions'];
  removeSuggestion: OVProps['onRemoveSuggestion'];
  showMethodologyPrompt: boolean;
  historyPanelOpen: boolean;
  setHistoryPanelOpen: OVProps['setHistoryPanelOpen'];
  loadConversation: OVProps['loadConversation'];
  checkSession: () => Promise<void>;
  // Chat ID
  activeChatId: string | null;
  // Handlers
  handlers: ReturnType<typeof useHomePageHandlers>;
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
    onSuggestionClick: (suggestion: OVProps['topicSuggestions'][number]) => {
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
    chatId: s.activeChatId || 'main',
  } as const;

  return { chatMessagesProps, inputSectionProps, overlaysProps };
}
