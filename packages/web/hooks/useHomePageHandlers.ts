import { useCallback } from 'react';
import { generateId, Message } from '@/lib/chat-store';
import { useSideCanalStore } from '@/lib/stores/side-canal-store';
import { useLayerStore } from '@/lib/stores/layer-store';
import { useGrimoireStore } from '@/lib/stores/grimoire-store';
import { useGodViewStore } from '@/lib/stores/god-view-store';
import { Layer, LAYER_METADATA } from '@/lib/layer-registry';
import { METHODOLOGIES } from '@/lib/methodology-data';
import type { ThoughtEvent } from '@/lib/thought-stream';

// Reverse lookup: AI name → Layer enum value
const AI_NAME_TO_LAYER: Record<string, Layer> = Object.fromEntries(
  Object.entries(LAYER_METADATA).map(([key, meta]) => [meta.aiName, parseInt(key) as Layer])
) as Record<string, Layer>;

// Analytics helper — PostHog tracking for queries
const trackQuery = (data: Record<string, any>) => {
  if (typeof window !== 'undefined' && (window as any).posthog) {
    (window as any).posthog.capture('query_event', data);
  }
};

/** Helper to build the intelligence object from fusion data */
function buildIntelligence(fusion: any) {
  if (!fusion) return undefined;
  return {
    analysis: {
      complexity: fusion.confidence || 0,
      queryType: fusion.methodology || 'direct',
      keywords: fusion.layerActivations?.[0]?.keywords || [],
    },
    layerActivations: (fusion.layerActivations || []).map((s: any) => ({
      layerNode: AI_NAME_TO_LAYER[s.name] ?? 0,
      name: s.name,
      activation: s.effectiveWeight || 0,
      effectiveWeight: s.effectiveWeight || 0,
    })),
    dominantLayers: fusion.dominantLayers || [],
    pathActivations: [],
    methodologySelection: {
      selected: fusion.methodology || 'direct',
      confidence: fusion.confidence || 0,
      alternatives: [],
    },
    guard: {
      recommendation: fusion.guardRecommendation || 'proceed',
      reasons: [],
    },
    instinct: {
      enabled: (fusion.activeLenses || []).length > 0,
      activeLenses: fusion.activeLenses || [],
    },
    processing: {
      mode: fusion.processingMode || 'weighted',
      extendedThinkingBudget: fusion.extendedThinkingBudget || 3000,
    },
    timing: {
      fusionMs: fusion.processingTimeMs || 0,
    },
  };
}

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
    setLoadingSuggestions,
    setGuardSuggestions,
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
    setActiveChatId,
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
  } = state;

  // Instinct Mode Settings (read from store inside handlers)
  const instinctMode = () => {
    const { settings } = require('@/lib/stores/settings-store').useSettingsStore.getState();
    return settings.instinctMode;
  };
  const instinctConfig = () => {
    const { settings } = require('@/lib/stores/settings-store').useSettingsStore.getState();
    return settings.instinctConfig;
  };

  // Extract topics from response and update message (for mindmap visualization)
  const extractTopicsForMessage = useCallback(
    async (messageId: string, queryText: string, response: string) => {
      if (!sideCanalEnabled || !autoExtractEnabled) return;
      try {
        const topics = await extractAndStoreTopics(queryText, response, messageId);
        if (topics && topics.length > 0) {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === messageId
                ? {
                    ...m,
                    topics: topics.map((t: any) => ({
                      id: t.id,
                      name: t.name,
                      category: t.category,
                    })),
                  }
                : m
            )
          );
        }
      } catch (error) {
        console.error('[Side Canal] Topic extraction error:', error);
      }
    },
    [sideCanalEnabled, autoExtractEnabled, extractAndStoreTopics, setMessages]
  );

  // Toggle dark mode
  const toggleDarkMode = useCallback(() => {
    setDarkMode((prev) => {
      const newValue = !prev;
      localStorage.setItem('darkMode', String(newValue));
      if (newValue) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      const event = new CustomEvent('darkModeChange', { detail: { darkMode: newValue } });
      window.dispatchEvent(event);
      return newValue;
    });
  }, [setDarkMode]);

  // Legend mode detection in query input
  const handleQueryChange = (value: string) => {
    setQuery(value);
    if (value.toLowerCase().includes('algoq369')) {
      setLegendMode(true);
      localStorage.setItem('legendMode', 'true');
      setQuery(value.replace(/algoq369/gi, '').trim());
    }
  };

  // Handle methodology switching
  const handleMethodologySwitch = (newMethodology: string, option: 'same' | 'side' | 'new') => {
    if (option === 'same') {
      setMethodology(newMethodology);
    } else if (option === 'side') {
      const sideChatId = generateId();
      setSideChats((prev) => [
        ...prev,
        { id: sideChatId, methodology: newMethodology, messages: [] },
      ]);
      setActiveChatId(sideChatId);
    } else if (option === 'new') {
      setMessages([]);
      setMethodology(newMethodology);
      setQuery('');
    }
  };

  // Handle guard toggle
  const handleGuardToggle = (
    feature: 'suggestions' | 'bias' | 'hype' | 'echo' | 'drift' | 'factuality',
    enabled: boolean
  ) => {
    localStorage.setItem(`guard_${feature}`, enabled ? 'true' : 'false');
  };

  // Extract visible page content for context
  const getPageContextMemo = useCallback(() => {
    return getPageContext();
  }, [getPageContext]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setAttachedFiles((prev) => [...prev, ...newFiles].slice(0, 5));

      const formData = new FormData();
      newFiles.forEach((file) => formData.append('files', file));

      try {
        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });
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

  // Refinement handler
  const handleRefinement = useCallback(
    (type: string, _originalContent: string) => {
      const { addRefinement } = useSideCanalStore.getState();
      const refinementText =
        type === 'refine'
          ? 'Please refine and improve this response'
          : type === 'enhance'
            ? 'Please enhance with more depth and detail'
            : type === 'correct'
              ? 'Please verify accuracy and correct any issues'
              : 'Please expand on the key points';
      addRefinement(refinementText);
      pendingRefinementCount.current += 1;
      const lastUserMessage = messages.filter((m) => m.role === 'user').pop();
      if (lastUserMessage) {
        setQuery(lastUserMessage.content);
        setTimeout(() => {
          const form = document.querySelector('form');
          if (form) form.requestSubmit();
        }, 100);
      }
    },
    [messages, setQuery, pendingRefinementCount]
  );

  // Poll for result
  const pollForResult = async (queryId: string, startTime: number, messageId?: string) => {
    const maxAttempts = 30;
    let attempts = 0;

    const poll = async () => {
      try {
        const res = await fetch(`/api/query/${queryId}`);
        if (!res.ok) {
          console.warn('Poll failed:', res.status);
          return;
        }
        const data = await res.json();

        if (data.status === 'complete') {
          const guardFailed = data.guardResult && !data.guardResult.passed;
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
            gnostic: data.gnostic,
            intelligence: buildIntelligence(data.fusion),
          };
          setMessages((prev) => {
            const hasPlaceholder = prev.some((m) => m.id === assistantMessage.id);
            if (hasPlaceholder) {
              return prev.map((m) =>
                m.id === assistantMessage.id ? { ...assistantMessage, isStreaming: false } : m
              );
            }
            return [...prev, assistantMessage];
          });
          setIsLoading(false);

          const lastUserMessage = messages[messages.length - 1];
          if (lastUserMessage?.role === 'user') {
            extractTopicsForMessage(
              assistantMessage.id,
              lastUserMessage.content,
              assistantMessage.content
            );
          }

          const responseTime = Date.now() - startTime;
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
          });
          return;
        }

        if (data.status === 'error') {
          const errorMessage: Message = {
            id: generateId(),
            role: 'assistant',
            content: data.error || 'An error occurred',
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, errorMessage]);
          setIsLoading(false);

          const responseTime = Date.now() - startTime;
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
          });
          return;
        }

        if (attempts < maxAttempts) {
          attempts++;
          setTimeout(poll, 1000);
        } else {
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Polling error:', error);
        setIsLoading(false);
      }
    };

    poll();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || isLoading) return;

    resetDepthAnnotations();
    setIsTransitioning(true);

    import('@/lib/analytics').then(({ trackQuerySubmitted }) => {
      trackQuerySubmitted(query, methodology || 'auto');
    });

    await new Promise((resolve) => setTimeout(resolve, 800));

    // Process attached files if any
    const processedFiles = await Promise.all(
      attachedFiles.map(async (file) => {
        if (file.type.startsWith('image/')) {
          const reader = new FileReader();
          return new Promise<any>((resolve) => {
            reader.onloadend = () => {
              const base64 = (reader.result as string).split(',')[1];
              resolve({ type: 'image', name: file.name, mimeType: file.type, data: base64 });
            };
            reader.readAsDataURL(file);
          });
        } else if (file.type === 'application/pdf') {
          const arrayBuffer = await file.arrayBuffer();
          const bytes = new Uint8Array(arrayBuffer);
          let binary = '';
          const chunkSize = 8192;
          for (let i = 0; i < bytes.length; i += chunkSize) {
            const chunk = bytes.slice(i, i + chunkSize);
            binary += String.fromCharCode.apply(null, Array.from(chunk));
          }
          const base64 = btoa(binary);
          return { type: 'pdf', name: file.name, data: base64 };
        } else {
          const text = await file.text();
          return { type: 'document', name: file.name, content: text };
        }
      })
    );

    const userMessage: Message = {
      id: generateId(),
      role: 'user',
      content: query.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsExpanded(true);
    setQuery('');
    setAttachedFiles([]);
    const currentFileUrls = uploadedFileUrls;
    setUploadedFileUrls([]);
    setIsLoading(true);
    setIsTransitioning(false);
    useGodViewStore.getState().setProcessing(true);

    const startTime = Date.now();

    try {
      const currentChatId = activeChatId || 'main';
      const pageContext = getPageContext();
      const { liveRefinements } = useSideCanalStore.getState();
      const grimoireState = useGrimoireStore.getState();
      const activeGrimoire = grimoireState.activeGrimoireId
        ? grimoireState.getGrimoire(grimoireState.activeGrimoireId)
        : null;
      const grimoireMemories = activeGrimoire
        ? grimoireState.getActiveMemories(activeGrimoire.id).slice(0, 10)
        : [];
      const assistantMsgId = generateId();
      const frontendQueryId = Math.random().toString(36).slice(2, 10);

      const placeholderMessage: Message = {
        id: assistantMsgId,
        role: 'assistant',
        content: '',
        timestamp: new Date(),
        isStreaming: true,
      };
      setMessages((prev) => [...prev, placeholderMessage]);

      // Connect Metadata Thought Stream (SSE) BEFORE fetch
      let evtSource: EventSource | null = null;
      try {
        evtSource = new EventSource(`/api/thought-stream?queryId=${frontendQueryId}`);
        evtSource.onmessage = (ev) => {
          try {
            const thought = JSON.parse(ev.data) as ThoughtEvent;
            thought.messageId = assistantMsgId;
            useSideCanalStore.getState().pushMetadata(thought);
            if (thought.stage === 'complete' || thought.stage === 'error') {
              evtSource?.close();
            }
          } catch (e) {
            console.warn('Thought stream parse error:', e);
          }
        };
        evtSource.onerror = () => {
          evtSource?.close();
          evtSource = null;
        };
      } catch (e) {
        console.warn('Thought stream connection failed:', e);
      }

      const settingsState = (
        await import('@/lib/stores/settings-store')
      ).useSettingsStore.getState();

      const res = await fetch('/api/simple-query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-session-id': sessionId,
        },
        body: JSON.stringify({
          query: userMessage.content,
          methodology,
          conversationHistory: messages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          legendMode,
          chatId: currentChatId,
          pageContext,
          instinctMode: settingsState.settings.instinctMode,
          instinctConfig: settingsState.settings.instinctConfig,
          layersWeights: useLayerStore.getState().weights,
          liveRefinements: liveRefinements.length > 0 ? liveRefinements : undefined,
          grimoireContext: activeGrimoire
            ? {
                id: activeGrimoire.id,
                name: activeGrimoire.name,
                instructions: activeGrimoire.instructions,
                memories: grimoireMemories.map((m) => m.content),
              }
            : undefined,
          attachments: processedFiles.length > 0 ? processedFiles : undefined,
          fileUrls: currentFileUrls.length > 0 ? currentFileUrls : undefined,
          queryId: frontendQueryId,
        }),
      });

      if (!res.ok) throw new Error('Failed to get response');
      const data = await res.json();

      // Wire God View store with response fusion data
      if (data.fusion) {
        const layerWeights: Record<number, number> = {};
        for (const la of data.fusion.layerActivations || []) {
          const layerNum = la.layerNode ?? la.layer;
          if (layerNum != null) layerWeights[layerNum] = (la.effectiveWeight || 0) / 100;
        }
        useGodViewStore.getState().setActivations({
          layerWeights: layerWeights as any,
          dominantLayers: data.fusion.dominantLayers || [],
          methodology: data.fusion.methodology || null,
          confidence: data.fusion.confidence || 0,
          guardReasons: data.guardResult?.issues || [],
          processingMode: data.fusion.processingMode || null,
        });
      }
      useGodViewStore.getState().setProcessing(false);

      // Push full response metadata to persistent store
      useSideCanalStore.getState().pushResponseMetadata(frontendQueryId, {
        fusion: data.fusion,
        guardResult: data.guardResult,
        provider: data.provider,
        metrics: data.metrics,
        sideCanal: data.sideCanal,
        gnostic: data.gnostic,
        query: userMessage.content,
        timestamp: Date.now(),
      });

      if (data.queryId) {
        setCurrentConversationId(data.queryId);
        await pollForResult(data.queryId, startTime, assistantMsgId);
      } else {
        console.log('🌳 FRONTEND: Received API response with gnostic:', {
          hasGnostic: !!data.gnostic,
          gnosticKeys: data.gnostic ? Object.keys(data.gnostic) : [],
          layerAnalysis: data.gnostic?.layerAnalysis,
          activations: data.gnostic?.layerAnalysis?.activations,
        });

        const guardFailed = data.guardResult && !data.guardResult.passed;

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
          gnostic: data.gnostic,
          intelligence: buildIntelligence(data.fusion),
        };

        console.log('🌳 FRONTEND: Created message with gnostic:', {
          messageId: assistantMessage.id,
          hasGnostic: !!assistantMessage.gnostic,
          gnosticData: assistantMessage.gnostic,
        });

        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsgId ? { ...assistantMessage, isStreaming: false } : m
          )
        );

        extractTopicsForMessage(assistantMessage.id, userMessage.content, assistantMessage.content);

        const responseTime = Date.now() - startTime;
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
        });
      }
    } catch (error) {
      console.error('Query error:', error);
      setMessages((prev) =>
        prev.map((m) =>
          m.isStreaming
            ? {
                ...m,
                content: 'Sorry, there was an error processing your query. Please try again.',
                isStreaming: false,
              }
            : m
        )
      );

      const responseTime = Date.now() - startTime;
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
      });
    } finally {
      setIsLoading(false);
      useGodViewStore.getState().setProcessing(false);
      inputRef.current?.focus();
    }
  };

  // Guard action handlers
  const handleGuardContinue = (messageId: string) => {
    const message = messages.find((m) => m.id === messageId);
    console.log('[Guard Continue] Clicked for message:', messageId);
    console.log('[Guard Continue] Message content length:', message?.content?.length || 0);
    console.log('[Guard Continue] Message content preview:', message?.content?.substring(0, 100));

    if (!message?.content || message.content === 'No response') {
      console.error('[Guard Continue] WARNING: Message has no content! This should not happen.');
      console.error('[Guard Continue] Full message:', message);
    }

    setMessages((prev) =>
      prev.map((m) => (m.id === messageId ? { ...m, guardAction: 'accepted', isHidden: false } : m))
    );
  };

  const handleGuardRefine = async (messageId: string, refinedQuery?: string) => {
    if (refinedQuery) {
      const currentMessages = [...messages];

      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId
            ? { ...m, guardAction: 'refined', guardActionQuery: refinedQuery, isHidden: true }
            : m
        )
      );

      const userMessage: Message = {
        id: generateId(),
        role: 'user',
        content: `🔄 Refined: ${refinedQuery}`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);

      const conversationHistory = [
        ...currentMessages
          .filter((m) => m.id !== messageId && !m.isHidden)
          .map((m) => ({ role: m.role, content: m.content })),
        { role: 'user' as const, content: refinedQuery },
      ];

      try {
        const pageContext = getPageContext();
        const settingsState = (
          await import('@/lib/stores/settings-store')
        ).useSettingsStore.getState();
        const res = await fetch('/api/simple-query', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-session-id': sessionId,
          },
          body: JSON.stringify({
            query: refinedQuery,
            methodology,
            conversationHistory,
            legendMode,
            chatId: activeChatId || 'main',
            pageContext,
            instinctMode: settingsState.settings.instinctMode,
            instinctConfig: settingsState.settings.instinctConfig,
            layersWeights: useLayerStore.getState().weights,
          }),
        });

        const data = await res.json();
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
          gnostic: data.gnostic,
          intelligence: buildIntelligence(data.fusion),
        };
        setMessages((prev) => [...prev, assistantMessage]);
      } catch (error) {
        console.error('Refine query error:', error);
        const errorMessage: Message = {
          id: generateId(),
          role: 'assistant',
          content: 'Sorry, there was an error processing your refined query.',
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMessage]);
      } finally {
        setIsLoading(false);
      }
    } else {
      setLoadingSuggestions(messageId);

      const message = messages.find((m) => m.id === messageId);
      const messageIndex = messages.findIndex((m) => m.id === messageId);
      const originalQuery = messageIndex > 0 ? messages[messageIndex - 1]?.content : '';

      const recentMessages = messages
        .slice(Math.max(0, messageIndex - 4), messageIndex + 1)
        .map((m) => ({ role: m.role, content: m.content }));

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
            aiResponse: message?.content,
          }),
        });

        const data = await res.json();
        setGuardSuggestions((prev) => ({
          ...prev,
          [messageId]: { ...prev[messageId], refine: data.suggestions },
        }));
      } catch (error) {
        console.error('Failed to generate refine suggestions:', error);
        setGuardSuggestions((prev) => ({
          ...prev,
          [messageId]: { ...prev[messageId], refine: [] },
        }));
      } finally {
        setLoadingSuggestions(null);
      }
    }
  };

  const handleGuardPivot = async (messageId: string, pivotQuery?: string) => {
    if (pivotQuery) {
      const currentMessages = [...messages];

      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId
            ? { ...m, guardAction: 'pivoted', guardActionQuery: pivotQuery, isHidden: true }
            : m
        )
      );

      const userMessage: Message = {
        id: generateId(),
        role: 'user',
        content: `📍 Pivoted: ${pivotQuery}`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);

      const conversationHistory = [
        ...currentMessages
          .filter((m) => m.id !== messageId && !m.isHidden)
          .map((m) => ({ role: m.role, content: m.content })),
        { role: 'user' as const, content: pivotQuery },
      ];

      try {
        const pageContext = getPageContext();
        const settingsState = (
          await import('@/lib/stores/settings-store')
        ).useSettingsStore.getState();
        const res = await fetch('/api/simple-query', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-session-id': sessionId,
          },
          body: JSON.stringify({
            query: pivotQuery,
            methodology,
            conversationHistory,
            legendMode,
            chatId: activeChatId || 'main',
            pageContext,
            instinctMode: settingsState.settings.instinctMode,
            instinctConfig: settingsState.settings.instinctConfig,
          }),
        });

        const data = await res.json();
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
          gnostic: data.gnostic,
          intelligence: buildIntelligence(data.fusion),
        };
        setMessages((prev) => [...prev, assistantMessage]);
      } catch (error) {
        console.error('Pivot query error:', error);
        const errorMessage: Message = {
          id: generateId(),
          role: 'assistant',
          content: 'Sorry, there was an error processing your pivot query.',
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMessage]);
      } finally {
        setIsLoading(false);
      }
    } else {
      setLoadingSuggestions(messageId);

      const message = messages.find((m) => m.id === messageId);
      const messageIndex = messages.findIndex((m) => m.id === messageId);
      const originalQuery = messageIndex > 0 ? messages[messageIndex - 1]?.content : '';

      const recentMessages = messages
        .slice(Math.max(0, messageIndex - 4), messageIndex + 1)
        .map((m) => ({ role: m.role, content: m.content }));

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
            aiResponse: message?.content,
          }),
        });

        const data = await res.json();
        setGuardSuggestions((prev) => ({
          ...prev,
          [messageId]: { ...prev[messageId], pivot: data.suggestions },
        }));
      } catch (error) {
        console.error('Failed to generate pivot suggestions:', error);
        setGuardSuggestions((prev) => ({
          ...prev,
          [messageId]: { ...prev[messageId], pivot: [] },
        }));
      } finally {
        setLoadingSuggestions(null);
      }
    }
  };

  const handleMethodologyClick = (id: string) => {
    if (messages.length > 0) {
      setPendingMethodology(id);
      setShowMethodologyPrompt(true);
    } else {
      setMethodology(id);
      setIsBlinking(id);
      import('@/lib/analytics').then(({ trackMethodologyChanged }) =>
        trackMethodologyChanged(methodology, id)
      );
      setTimeout(() => setIsBlinking(null), 300);
    }
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
    // Handlers
    handleSubmit,
    handleGuardRefine,
    handleGuardPivot,
    handleGuardContinue,
    handleMethodologyClick,
    handleMethodologySwitch,
    handleContinueInCurrentChat,
    handleStartNewChat,
    handleCancelMethodologyChange,
    handleMethodHover,
    handleNewChat,
    handleQueryChange,
    handleGuardToggle,
    handleFileSelect,
    handleRefinement,
    triggerFileSelect,
    toggleDarkMode,
    extractTopicsForMessage,
    getPageContext: getPageContextMemo,
    pollForResult,
    handleSideChatSendMessage,
    handleMiniChatSendQuery,
    handlePromoteToMain,
  };
}
