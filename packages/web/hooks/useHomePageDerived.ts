import { useCallback, useMemo } from 'react';
import { Message } from '@/lib/chat-store';
import { useSideCanalStore } from '@/lib/stores/side-canal-store';
import { useSettingsStore } from '@/lib/stores/settings-store';
import { useSession } from '@/lib/session-manager';
import { useDepthAnnotations } from '@/hooks/useDepthAnnotations';
import { useCanvasAdapters } from './useCanvasAdapters';

interface UseHomePageDerivedOptions {
  messages: Message[];
  methodology: string;
  isExpanded: boolean;
}

export function useHomePageDerived({
  messages,
  methodology,
  isExpanded,
}: UseHomePageDerivedOptions) {
  // ─── Gnostic Session Management ──────────────────────────
  const { sessionId, isClient } = useSession();

  // ─── Depth Annotations Hook ──────────────────────────────
  const {
    processText,
    reset: resetDepthAnnotations,
    config: depthConfig,
    setConfig: setDepthConfig,
  } = useDepthAnnotations();

  // ─── Instinct Mode Settings ──────────────────────────────
  const { settings } = useSettingsStore();
  const { instinctMode, instinctConfig } = settings;

  // ─── Canvas Data Adapters (extracted) ────────────────────
  const { queryCards, visualNodes, visualEdges } = useCanvasAdapters(messages, methodology);

  // ─── Side Canal Store Integration ────────────────────────
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
    currentTopics,
  } = useSideCanalStore();

  // Side Canal topics → AI insights for canvas.
  // Enriches each topic with the first 1-2 sentences from the latest assistant
  // response that mention the topic name, so the panel shows real findings
  // (claims, evidence) rather than just topic labels.
  const topicInsights = useMemo(() => {
    if (!currentTopics || currentTopics.length === 0) return [];

    const lastAssistant = messages.filter((m) => m.role === 'assistant').pop();
    const responseText = lastAssistant?.content || '';

    return currentTopics.map((t) => {
      let keyFinding = t.description || '';

      if (responseText && t.name) {
        const namePattern = t.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const sectionMatch = responseText.match(
          new RegExp(namePattern + '[\\s\\S]*?(?:\\.|\\n\\n)', 'i')
        );
        if (sectionMatch) {
          const afterName = responseText.slice(
            responseText.indexOf(sectionMatch[0]) + t.name.length
          );
          const sentences = afterName.match(/[^.!?]*[.!?]/g);
          if (sentences && sentences.length > 0) {
            keyFinding = sentences.slice(0, 2).join(' ').trim();
          }
        }
      }

      const text = (t.name + ' ' + keyFinding).toLowerCase();
      let category: 'strategy' | 'insight' | 'data' | 'action' = 'insight';
      if (/strateg|plan|approach|framework|phase|roadmap/i.test(text)) category = 'strategy';
      else if (/\d+%|\$[\d,]+|million|billion|metric/i.test(text)) category = 'data';
      else if (/implement|deploy|build|launch|execute|develop/i.test(text)) category = 'action';

      return {
        id: `topic-${t.id}`,
        text: t.name + (keyFinding ? ' — ' + keyFinding : ''),
        category,
        confidence: 85,
        metricsCount: 0,
      };
    });
  }, [currentTopics, messages]);

  // ─── Page Context helper (used by handlers) ──────────────
  const getPageContext = useCallback(() => {
    try {
      const mainContent = document.querySelector('main');
      if (!mainContent) return undefined;

      if (isExpanded && messages.length > 0) {
        const messageTexts = messages
          .slice(-5)
          .map((m) => `${m.role === 'user' ? 'User' : 'AkhAI'}: ${m.content}`)
          .join('\n\n');
        return `Current conversation context:\n${messageTexts}`;
      }

      const visibleText = Array.from(
        mainContent.querySelectorAll('p, h1, h2, h3, h4, h5, h6, li, span')
      )
        .filter((el) => {
          const style = window.getComputedStyle(el);
          return (
            style.display !== 'none' &&
            style.visibility !== 'hidden' &&
            el.textContent &&
            el.textContent.trim().length > 10
          );
        })
        .map((el) => el.textContent?.trim())
        .filter(Boolean)
        .slice(0, 10)
        .join('\n');

      return visibleText || undefined;
    } catch (error) {
      console.error('Failed to extract page context:', error);
      return undefined;
    }
  }, [isExpanded, messages]);

  return {
    // Session
    sessionId,
    isClient,
    // Depth Annotations
    processText,
    resetDepthAnnotations,
    depthConfig,
    setDepthConfig,
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
    // Page context helper
    getPageContext,
  };
}
