import { useCallback } from 'react';
import { generateId, Message } from '@/lib/chat-store';
import { useSideCanalStore } from '@/lib/stores/side-canal-store';
import { useLayerStore } from '@/lib/stores/layer-store';
import { buildIntelligence } from '@/lib/query-helpers';

export interface UseGuardHandlersState {
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  setQuery: React.Dispatch<React.SetStateAction<string>>;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  setLoadingSuggestions: React.Dispatch<React.SetStateAction<string | null>>;
  setGuardSuggestions: React.Dispatch<
    React.SetStateAction<Record<string, { refine?: string[]; pivot?: string[] }>>
  >;
  methodology: string;
  legendMode: boolean;
  activeChatId: string | null;
  sessionId: string;
  getPageContext: () => string | undefined;
  pendingRefinementCount: React.MutableRefObject<number>;
}

export function useGuardHandlers(state: UseGuardHandlersState) {
  const {
    messages,
    setMessages,
    setQuery,
    setIsLoading,
    setLoadingSuggestions,
    setGuardSuggestions,
    methodology,
    legendMode,
    activeChatId,
    sessionId,
    getPageContext,
    pendingRefinementCount,
  } = state;

  const handleGuardToggle = (
    feature: 'suggestions' | 'bias' | 'hype' | 'echo' | 'drift' | 'factuality',
    enabled: boolean
  ) => {
    localStorage.setItem(`guard_${feature}`, enabled ? 'true' : 'false');
  };

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

  return {
    handleGuardToggle,
    handleRefinement,
    handleGuardContinue,
    handleGuardRefine,
    handleGuardPivot,
  };
}
