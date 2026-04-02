import { useEffect, useCallback, useRef } from 'react';
import { generateId, Message } from '@/lib/chat-store';
import { useSideCanalStore } from '@/lib/stores/side-canal-store';
import { getCurrentLanguage, type SupportedLanguage } from '@/components/LanguageSelector';

export interface HomePageEffectsInput {
  // Depth annotations
  depthConfig: { enabled: boolean; density: string };
  messages: Message[];
  processText: (text: string) => any[];
  messageAnnotations: Record<string, any[]>;
  setMessageAnnotations: React.Dispatch<React.SetStateAction<Record<string, any[]>>>;
  // Refinement
  pendingRefinementCount: React.MutableRefObject<number>;
  refinementCounts: Record<string, number>;
  setRefinementCounts: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  // Deep dive
  deepDiveQuery: string;
  setDeepDiveQuery: React.Dispatch<React.SetStateAction<string>>;
  // Side Canal
  sideCanalEnabled: boolean;
  showTopicsPanel: boolean;
  setShowTopicsPanel: (open: boolean) => void;
  refreshSuggestions: () => Promise<void>;
  // Auth
  setUser: React.Dispatch<React.SetStateAction<any>>;
  setShowAuthModal: React.Dispatch<React.SetStateAction<boolean>>;
  // Dark mode
  setDarkMode: React.Dispatch<React.SetStateAction<boolean>>;
  // Conversation
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  setContinuingConversation: React.Dispatch<React.SetStateAction<string | null>>;
  setIsExpanded: React.Dispatch<React.SetStateAction<boolean>>;
  setCurrentConversationId: React.Dispatch<React.SetStateAction<string | undefined>>;
  setCurrentLang: React.Dispatch<React.SetStateAction<SupportedLanguage>>;
  setLegendMode: React.Dispatch<React.SetStateAction<boolean>>;
  // Scroll
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
}

export function useHomePageEffects(input: HomePageEffectsInput) {
  const {
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
  } = input;

  // Log depth config on mount
  useEffect(() => {
    console.log('[DepthAnnotations] Config loaded:', depthConfig);
    console.log('[DepthAnnotations] LocalStorage:', localStorage.getItem('akhai-depth-config'));
  }, []);

  // Process depth annotations when new assistant messages arrive
  useEffect(() => {
    console.log(
      '[DepthAnnotations] Effect triggered - config.enabled:',
      depthConfig.enabled,
      'messages:',
      messages.length
    );
    if (!depthConfig.enabled) {
      console.log('[DepthAnnotations] Disabled - toggle is OFF');
      return;
    }
    const lastMessage = messages[messages.length - 1];
    if (lastMessage && lastMessage.role === 'assistant') {
      if (lastMessage.isStreaming) return;
      const existing = messageAnnotations[lastMessage.id];
      if (existing && existing.length > 0) return;
      if (!lastMessage.content || lastMessage.content.length < 50) return;
      console.log('[DepthAnnotations] Processing message:', lastMessage.content.slice(0, 100));
      const annotations = processText(lastMessage.content);
      console.log('[DepthAnnotations] Detected annotations:', annotations.length, annotations);
      if (annotations.length > 0) {
        setMessageAnnotations((prev) => ({ ...prev, [lastMessage.id]: annotations }));
      } else {
        console.log('[DepthAnnotations] No annotations detected - text may not match patterns');
        setMessageAnnotations((prev) => ({ ...prev, [lastMessage.id]: [] }));
      }
    }
  }, [messages, depthConfig.enabled, processText]);

  // Re-process all annotations when density changes
  const prevDensityRef = useRef(depthConfig.density);
  useEffect(() => {
    if (prevDensityRef.current !== depthConfig.density) {
      prevDensityRef.current = depthConfig.density;
      if (!depthConfig.enabled) return;
      const newAnnotations: Record<string, any[]> = {};
      messages
        .filter((m) => m.role === 'assistant' && m.content)
        .forEach((m) => {
          const anns = processText(m.content);
          newAnnotations[m.id] = anns;
        });
      setMessageAnnotations(newAnnotations);
    }
  }, [depthConfig.density, depthConfig.enabled, messages, processText]);

  // Apply pending refinement count to new assistant messages
  useEffect(() => {
    if (pendingRefinementCount.current > 0) {
      const lastMessage = messages[messages.length - 1];
      if (
        lastMessage &&
        lastMessage.role === 'assistant' &&
        !lastMessage.isStreaming &&
        !refinementCounts[lastMessage.id]
      ) {
        setRefinementCounts((prev) => ({
          ...prev,
          [lastMessage.id]: pendingRefinementCount.current,
        }));
        pendingRefinementCount.current = 0;
      }
    }
  }, [messages]);

  // Clear Deep Dive query after Mini Chat receives it
  useEffect(() => {
    if (deepDiveQuery) {
      const timer = setTimeout(() => {
        setDeepDiveQuery('');
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [deepDiveQuery]);

  // Force topics panel closed
  useEffect(() => {
    if (showTopicsPanel) setShowTopicsPanel(false);
  }, []);

  // ─── Session / Auth ────────────────────────────────────────
  const checkSession = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/session');
      const data = await response.json();
      setUser(data.user);
      if (data.user?.id) {
        const { identifyUser } = await import('@/lib/analytics');
        identifyUser(data.user.id, {
          username: data.user.username,
          email: data.user.email,
          authProvider: data.user.auth_provider,
        });
      }
    } catch (error) {
      console.error('Session check error:', error);
    }
  }, []);

  useEffect(() => {
    const showHandler = () => setShowAuthModal(true);
    const successHandler = () => checkSession();
    window.addEventListener('akhai:show-auth', showHandler);
    window.addEventListener('akhai:auth-success', successHandler);
    return () => {
      window.removeEventListener('akhai:show-auth', showHandler);
      window.removeEventListener('akhai:auth-success', successHandler);
    };
  }, [checkSession]);

  // ─── Side Canal auto-synopsis ─────────────────────────────
  useEffect(() => {
    const { autoSynopsisEnabled, currentTopics, generateSynopsisForTopic } =
      useSideCanalStore.getState();
    if (!sideCanalEnabled || !autoSynopsisEnabled) return;
    if (currentTopics.length > 0) {
      currentTopics.forEach((topic) => {
        generateSynopsisForTopic(topic.id).catch((error) => {
          console.error('[Side Canal] Auto-synopsis failed for topic:', topic.id, error);
        });
      });
    }
    const interval = setInterval(
      () => {
        const state = useSideCanalStore.getState();
        if (state.autoSynopsisEnabled && state.currentTopics.length > 0) {
          state.currentTopics.forEach((topic) => {
            state.generateSynopsisForTopic(topic.id).catch((error) => {
              console.error('[Side Canal] Auto-synopsis failed for topic:', topic.id, error);
            });
          });
        }
      },
      5 * 60 * 1000
    );
    return () => clearInterval(interval);
  }, [sideCanalEnabled]);

  // ─── Dark mode init ────────────────────────────────────────
  useEffect(() => {
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    setDarkMode(savedDarkMode);
    if (savedDarkMode) document.documentElement.classList.add('dark');
    const handleDarkModeChange = (e: CustomEvent) => {
      setDarkMode(e.detail.darkMode);
    };
    window.addEventListener('darkModeChange' as any, handleDarkModeChange as any);
    return () => {
      window.removeEventListener('darkModeChange' as any, handleDarkModeChange as any);
    };
  }, []);

  // ─── Load conversation ─────────────────────────────────────
  const loadConversation = useCallback(async (queryId: string) => {
    try {
      console.log('[History] Fetching conversation for:', queryId);
      const res = await fetch(`/api/history/${queryId}/conversation`);
      console.log('[History] Response status:', res.status);
      if (res.ok) {
        const data = await res.json();
        console.log('[History] Data received:', data.messages?.length, 'messages');
        if (data.messages && data.messages.length > 0) {
          const loadedMessages = data.messages.map((msg: any) => ({
            id: generateId(),
            role: msg.role,
            content: msg.content,
            timestamp: new Date(msg.timestamp * 1000),
            methodology: msg.methodology,
            gnostic: msg.gnostic || null,
            pipelineEvents: msg.pipelineEvents || null,
          }));
          loadedMessages.forEach((msg: any) => {
            if (msg.role === 'assistant' && msg.pipelineEvents?.length > 0) {
              msg.pipelineEvents.forEach((ev: any) => {
                useSideCanalStore.getState().pushMetadata({ ...ev, messageId: msg.id });
              });
            }
          });
          console.log('[History] Setting messages:', loadedMessages.length);
          setMessages(loadedMessages);
          setContinuingConversation(queryId);
          setIsExpanded(true);
          console.log('[History] Conversation loaded successfully');
          window.history.replaceState({}, '', '/');
          setTimeout(() => setContinuingConversation(null), 3000);
        } else {
          console.warn('[History] No messages in response');
        }
      } else {
        console.error('[History] Failed to fetch:', res.status);
      }
    } catch (error) {
      console.error('[History] Failed to load conversation:', error);
    }
  }, []);

  // ─── Mount initialization ─────────────────────────────────
  useEffect(() => {
    try {
      checkSession();
      const lang = getCurrentLanguage();
      setCurrentLang(lang);
      const handleLanguageChange = (e: CustomEvent<SupportedLanguage>) => {
        setCurrentLang(e.detail);
      };
      window.addEventListener('languagechange', handleLanguageChange as EventListener);
      const params = new URLSearchParams(window.location.search);
      const continueId = params.get('continue');
      if (continueId) {
        setCurrentConversationId(continueId);
        loadConversation(continueId);
      }
      try {
        const savedLegendMode = localStorage.getItem('legendMode') === 'true';
        if (savedLegendMode) setLegendMode(true);
      } catch (e) {}
      return () => {
        window.removeEventListener('languagechange', handleLanguageChange as EventListener);
      };
    } catch (error) {
      console.error('Mount error:', error);
    }
  }, []);

  // Handle browser back/forward with ?continue= param
  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const continueId = params.get('continue');
      if (continueId) {
        setCurrentConversationId(continueId);
        loadConversation(continueId);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [loadConversation]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Check for topic suggestions after messages update
  useEffect(() => {
    if (messages.length > 0 && sideCanalEnabled) {
      refreshSuggestions().catch(console.error);
    }
  }, [messages, sideCanalEnabled, refreshSuggestions]);

  return { checkSession, loadConversation };
}
