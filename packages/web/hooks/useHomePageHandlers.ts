import { useCallback } from 'react';
import { generateId, Message } from '@/lib/chat-store';
import { buildIntelligence } from '@/lib/query-helpers';
import { METHODOLOGIES } from '@/lib/methodology-data';
import { useQueryHandlers, type UseQueryHandlersState } from './useQueryHandlers';
import { useGuardHandlers, type UseGuardHandlersState } from './useGuardHandlers';

/**
 * State bag passed from useHomePageState into useHomePageHandlers.
 * Every property the handlers read or write is listed here.
 */
export interface HomePageStateForHandlers {
  query: string;
  setQuery: React.Dispatch<React.SetStateAction<string>>;
  methodology: string;
  setMethodology: React.Dispatch<React.SetStateAction<string>>;
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  attachedFiles: File[];
  setAttachedFiles: React.Dispatch<React.SetStateAction<File[]>>;
  uploadedFileUrls: string[];
  setUploadedFileUrls: React.Dispatch<React.SetStateAction<string[]>>;
  isLoading: boolean;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  isExpanded: boolean;
  setIsExpanded: React.Dispatch<React.SetStateAction<boolean>>;
  setIsBlinking: React.Dispatch<React.SetStateAction<string | null>>;
  setLoadingSuggestions: React.Dispatch<React.SetStateAction<string | null>>;
  setGuardSuggestions: React.Dispatch<
    React.SetStateAction<Record<string, { refine?: string[]; pivot?: string[] }>>
  >;
  darkMode: boolean;
  setDarkMode: React.Dispatch<React.SetStateAction<boolean>>;
  legendMode: boolean;
  setLegendMode: React.Dispatch<React.SetStateAction<boolean>>;
  setShowMethodologyPrompt: React.Dispatch<React.SetStateAction<boolean>>;
  pendingMethodology: string | null;
  setPendingMethodology: React.Dispatch<React.SetStateAction<string | null>>;
  setIsTransitioning: React.Dispatch<React.SetStateAction<boolean>>;
  setCurrentConversationId: React.Dispatch<React.SetStateAction<string | undefined>>;
  setContinuingConversation: React.Dispatch<React.SetStateAction<string | null>>;
  setMessageAnnotations: React.Dispatch<React.SetStateAction<Record<string, any[]>>>;
  sideChats: Array<{ id: string; methodology: string; messages: Message[] }>;
  setSideChats: React.Dispatch<
    React.SetStateAction<Array<{ id: string; methodology: string; messages: Message[] }>>
  >;
  activeChatId: string | null;
  setActiveChatId: React.Dispatch<React.SetStateAction<string | null>>;
  hoveredMethod: string | null;
  setHoveredMethod: React.Dispatch<React.SetStateAction<string | null>>;
  setTooltipPos: React.Dispatch<React.SetStateAction<{ x: number; y: number }>>;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  inputRef: React.RefObject<HTMLInputElement | null>;
  containerRef: React.RefObject<HTMLDivElement | null>;
  pendingRefinementCount: React.MutableRefObject<number>;
  sessionId: string;
  sideCanalEnabled: boolean;
  autoExtractEnabled: boolean;
  extractAndStoreTopics: (query: string, response: string, messageId: string) => Promise<any>;
  getPageContext: () => string | undefined;
  resetDepthAnnotations: () => void;
}

export function useHomePageHandlers(state: HomePageStateForHandlers) {
  const {
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
    setIsExpanded,
    setIsBlinking,
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
    setSideChats,
    activeChatId,
    setHoveredMethod,
    setTooltipPos,
    fileInputRef,
    containerRef,
    sessionId,
    getPageContext,
    resetDepthAnnotations,
  } = state;

  // ─── Compose sub-hooks ────────────────────────────────────
  const queryHandlers = useQueryHandlers(state as UseQueryHandlersState);
  const guardHandlers = useGuardHandlers(state as UseGuardHandlersState);

  const getPageContextMemo = useCallback(() => getPageContext(), [getPageContext]);

  // ─── Dark mode toggle ────────────────────────────────────
  const toggleDarkMode = useCallback(() => {
    setDarkMode((prev) => {
      const newValue = !prev;
      localStorage.setItem('darkMode', String(newValue));
      if (newValue) document.documentElement.classList.add('dark');
      else document.documentElement.classList.remove('dark');
      const event = new CustomEvent('darkModeChange', { detail: { darkMode: newValue } });
      window.dispatchEvent(event);
      return newValue;
    });
  }, [setDarkMode]);

  // ─── Query input ──────────────────────────────────────────
  const handleQueryChange = (value: string) => {
    setQuery(value);
    if (value.toLowerCase().includes('algoq369')) {
      setLegendMode(true);
      localStorage.setItem('legendMode', 'true');
      setQuery(value.replace(/algoq369/gi, '').trim());
    }
  };

  // ─── Methodology switching ────────────────────────────────
  const handleMethodologySwitch = (newMethodology: string, option: 'same' | 'side' | 'new') => {
    if (option === 'same') {
      setMethodology(newMethodology);
    } else if (option === 'side') {
      const sideChatId = generateId();
      setSideChats((prev) => [
        ...prev,
        { id: sideChatId, methodology: newMethodology, messages: [] },
      ]);
      state.setActiveChatId(sideChatId);
    } else if (option === 'new') {
      setMessages([]);
      setMethodology(newMethodology);
      setQuery('');
    }
  };

  const handleMethodologyClick = (id: string) => {
    // Always switch silently — no modal prompt
    setMethodology(id);
    setIsBlinking(id);
    import('@/lib/analytics').then(({ trackMethodologyChanged }) =>
      trackMethodologyChanged(methodology, id)
    );
    setTimeout(() => setIsBlinking(null), 300);
  };

  const handleContinueInCurrentChat = () => {
    if (pendingMethodology) {
      setMethodology(pendingMethodology);
      setIsBlinking(pendingMethodology);
      setTimeout(() => setIsBlinking(null), 300);
    }
    setShowMethodologyPrompt(false);
    setPendingMethodology(null);
  };

  const handleStartNewChat = () => {
    if (pendingMethodology) {
      setMessages([]);
      setMethodology(pendingMethodology);
      setIsExpanded(false);
      setIsBlinking(pendingMethodology);
      setTimeout(() => setIsBlinking(null), 300);
    }
    setShowMethodologyPrompt(false);
    setPendingMethodology(null);
  };

  const handleCancelMethodologyChange = () => {
    setShowMethodologyPrompt(false);
    setPendingMethodology(null);
  };

  const handleMethodHover = (
    m: (typeof METHODOLOGIES)[0],
    e: React.MouseEvent<HTMLButtonElement>
  ) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const containerRect = containerRef.current?.getBoundingClientRect();
    if (containerRect) {
      setTooltipPos({
        x: rect.left + rect.width / 2 - containerRect.left,
        y: rect.bottom - containerRect.top + 8,
      });
    }
    setHoveredMethod(m.id);
  };

  const handleNewChat = () => {
    setMessages([]);
    setIsExpanded(false);
    setQuery('');
    setCurrentConversationId(undefined);
    setContinuingConversation(null);
    setMessageAnnotations({});
    resetDepthAnnotations();
  };

  // ─── File handling ────────────────────────────────────────
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setAttachedFiles((prev) => [...prev, ...newFiles].slice(0, 5));
      const formData = new FormData();
      newFiles.forEach((file) => formData.append('files', file));
      try {
        const response = await fetch('/api/upload', { method: 'POST', body: formData });
        if (response.ok) {
          const data = await response.json();
          const urls = data.files.map((f: any) => f.url);
          setUploadedFileUrls((prev) => [...prev, ...urls]);
          console.log('Files uploaded:', data.files);
        } else {
          const error = await response.json();
          console.error('Upload failed:', error);
        }
      } catch (error) {
        console.error('Upload error:', error);
      }
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  // ─── Side chat / Mini chat handlers ───────────────────────
  const handleSideChatSendMessage = async (
    sideChat: { id: string; methodology: string; messages: Message[] },
    query: string
  ) => {
    const userMessage: Message = {
      id: generateId(),
      role: 'user',
      content: query,
      timestamp: new Date(),
    };
    setSideChats((prev) =>
      prev.map((c) => (c.id === sideChat.id ? { ...c, messages: [...c.messages, userMessage] } : c))
    );
    setIsLoading(true);
    try {
      const settingsState = (
        await import('@/lib/stores/settings-store')
      ).useSettingsStore.getState();
      const pageContext = getPageContextMemo();
      const res = await fetch('/api/simple-query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-session-id': sessionId },
        body: JSON.stringify({
          query,
          methodology: sideChat.methodology,
          conversationHistory: sideChat.messages.map((m) => ({ role: m.role, content: m.content })),
          legendMode,
          chatId: sideChat.id,
          pageContext,
          instinctMode: settingsState.settings.instinctMode,
          instinctConfig: settingsState.settings.instinctConfig,
        }),
      });
      const data = await res.json();
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
        gnostic: data.gnostic,
        intelligence: buildIntelligence(data.fusion),
        instinctMode: data.instinctMode || false,
      };
      setSideChats((prev) =>
        prev.map((c) =>
          c.id === sideChat.id ? { ...c, messages: [...c.messages, assistantMessage] } : c
        )
      );
    } catch (error) {
      console.error('Side chat error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMiniChatSendQuery = async (queryText: string) => {
    if (isLoading || !queryText.trim()) return;
    setQuery(queryText);
    await new Promise((resolve) => setTimeout(resolve, 50));
    setIsTransitioning(true);
    await new Promise((resolve) => setTimeout(resolve, 800));
    const userMessage: Message = {
      id: generateId(),
      role: 'user',
      content: queryText.trim(),
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setIsExpanded(true);
    setQuery('');
    setIsLoading(true);
    setIsTransitioning(false);
    const startTime = Date.now();
    try {
      const settingsState = (
        await import('@/lib/stores/settings-store')
      ).useSettingsStore.getState();
      const currentChatId = activeChatId || 'main';
      const pageContext = getPageContextMemo();
      const res = await fetch('/api/simple-query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-session-id': sessionId },
        body: JSON.stringify({
          query: userMessage.content,
          methodology,
          conversationHistory: messages.map((m) => ({ role: m.role, content: m.content })),
          legendMode,
          chatId: currentChatId,
          pageContext,
          instinctMode: settingsState.settings.instinctMode,
          instinctConfig: settingsState.settings.instinctConfig,
        }),
      });
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      const aiMessage: Message = {
        id: generateId(),
        role: 'assistant',
        content: data.response,
        timestamp: new Date(),
        methodology: data.methodologyUsed,
        topics: data.topics,
        gnostic: data.gnostic,
        intelligence: buildIntelligence(data.fusion),
      };
      setMessages((prev) => [...prev, aiMessage]);
      if (data.gnostic?.progressState) {
        console.log(
          `[GNOSTIC] Ascent Level: ${data.gnostic.progressState.currentLevel} (${data.gnostic.progressState.levelName})`
        );
      }
      const latency = Date.now() - startTime;
      if (typeof window !== 'undefined' && (window as any).posthog) {
        (window as any).posthog.capture('query_completed', {
          methodology: data.methodologyUsed,
          latency,
          tokens: data.metrics?.tokens,
          cost: data.metrics?.cost,
          guardPassed: data.guardResult?.passed,
          legendMode,
        });
      }
    } catch (error) {
      console.error('Query error:', error);
      const errorMessage: Message = {
        id: generateId(),
        role: 'assistant',
        content: 'An error occurred while processing your query. Please try again.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePromoteToMain = (query: string, response: string) => {
    const userMsg: Message = {
      id: generateId(),
      role: 'user',
      content: `[Promoted from Side Chat] ${query}`,
      timestamp: new Date(),
    };
    const aiMsg: Message = {
      id: generateId(),
      role: 'assistant',
      content: response,
      timestamp: new Date(),
      methodology: 'direct',
    };
    setMessages((prev) => [...prev, userMsg, aiMsg]);
    if (!state.isExpanded) setIsExpanded(true);
  };

  return {
    // From sub-hooks
    ...queryHandlers,
    ...guardHandlers,
    // UI / Navigation
    toggleDarkMode,
    handleQueryChange,
    handleMethodologySwitch,
    handleMethodologyClick,
    handleContinueInCurrentChat,
    handleStartNewChat,
    handleCancelMethodologyChange,
    handleMethodHover,
    handleNewChat,
    // File handling
    handleFileSelect,
    triggerFileSelect,
    // Side chat / Mini chat
    handleSideChatSendMessage,
    handleMiniChatSendQuery,
    handlePromoteToMain,
    // Context
    getPageContext: getPageContextMemo,
  };
}
