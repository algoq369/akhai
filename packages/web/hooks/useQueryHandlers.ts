import { useCallback } from 'react';
import { generateId, Message } from '@/lib/chat-store';
import { useSideCanalStore } from '@/lib/stores/side-canal-store';
import { useLayerStore } from '@/lib/stores/layer-store';
import { useGrimoireStore } from '@/lib/stores/grimoire-store';
import { useGodViewStore } from '@/lib/stores/god-view-store';
import { buildIntelligence, trackQuery } from '@/lib/query-helpers';
import type { ThoughtEvent } from '@/lib/thought-stream';

/** Normalize methodology to string — API may return object {selected, reason} or {family, model, reasoning} */
function normalizeMethodology(raw: unknown): string | undefined {
  if (!raw) return undefined;
  if (typeof raw === 'string') return raw;
  if (typeof raw === 'object' && raw !== null) {
    const obj = raw as Record<string, unknown>;
    return String(obj.selected || obj.family || obj.model || obj.id || 'auto');
  }
  return String(raw);
}

/**
 * State subset needed by query-submission handlers.
 * Every property the handlers read or write is listed here.
 */
export interface UseQueryHandlersState {
  query: string;
  setQuery: React.Dispatch<React.SetStateAction<string>>;
  methodology: string;
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  attachedFiles: File[];
  setAttachedFiles: React.Dispatch<React.SetStateAction<File[]>>;
  uploadedFileUrls: string[];
  setUploadedFileUrls: React.Dispatch<React.SetStateAction<string[]>>;
  isLoading: boolean;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  setIsExpanded: React.Dispatch<React.SetStateAction<boolean>>;
  setIsTransitioning: React.Dispatch<React.SetStateAction<boolean>>;
  setCurrentConversationId: React.Dispatch<React.SetStateAction<string | undefined>>;
  legendMode: boolean;
  activeChatId: string | null;
  sessionId: string;
  sideCanalEnabled: boolean;
  autoExtractEnabled: boolean;
  extractAndStoreTopics: (query: string, response: string, messageId: string) => Promise<any>;
  getPageContext: () => string | undefined;
  resetDepthAnnotations: () => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
}

export function useQueryHandlers(state: UseQueryHandlersState) {
  const {
    query,
    setQuery,
    methodology,
    messages,
    setMessages,
    attachedFiles,
    setAttachedFiles,
    uploadedFileUrls,
    setUploadedFileUrls,
    isLoading,
    setIsLoading,
    setIsExpanded,
    setIsTransitioning,
    setCurrentConversationId,
    legendMode,
    activeChatId,
    sessionId,
    sideCanalEnabled,
    autoExtractEnabled,
    extractAndStoreTopics,
    getPageContext,
    resetDepthAnnotations,
    inputRef,
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

  // Poll for result
  const pollForResult = async (
    queryId: string,
    startTime: number,
    messageId?: string,
    initialFusion?: any,
    initialMiniCanvas?: any
  ) => {
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
            methodology: normalizeMethodology(data.methodology),
            metrics: data.metrics,
            timestamp: new Date(),
            guardResult: guardFailed ? data.guardResult : undefined,
            guardAction: guardFailed ? 'pending' : undefined,
            isHidden: guardFailed,
            gnostic: data.gnostic,
            intelligence: buildIntelligence(data.fusion || initialFusion),
            miniCanvas: data.miniCanvas || initialMiniCanvas,
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
        await pollForResult(data.queryId, startTime, assistantMsgId, data.fusion, data.miniCanvas);
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
          methodology: normalizeMethodology(data.methodology) || methodology,
          metrics: data.metrics,
          timestamp: new Date(),
          guardResult: guardFailed ? data.guardResult : undefined,
          guardAction: guardFailed ? 'pending' : undefined,
          isHidden: guardFailed,
          gnostic: data.gnostic,
          intelligence: buildIntelligence(data.fusion),
          miniCanvas: data.miniCanvas,
          instinctMode: data.instinctMode || false,
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

  return { handleSubmit, pollForResult, extractTopicsForMessage };
}
