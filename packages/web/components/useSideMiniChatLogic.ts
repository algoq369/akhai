'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import type { Message } from '@/lib/chat-store';

export interface Insight {
  id: string;
  type: 'suggestion' | 'link';
  content: string;
  source?: string;
  description?: string;
  category?: 'research' | 'data' | 'news' | 'forum' | 'code' | 'media';
}

/**
 * Extracts key topics from the conversation messages.
 * Returns a deduplicated list of up to 5 meaningful phrases.
 */
export function useExtractedTopics(messages: Message[]): string[] {
  const [extractedTopics, setExtractedTopics] = useState<string[]>([]);

  useEffect(() => {
    if (messages.length === 0) {
      setExtractedTopics([]);
      return;
    }

    const userMessages = messages.filter((m) => m.role === 'user');
    const aiMessages = messages.filter((m) => m.role === 'assistant');

    // Known meaningful phrases to detect first
    const KNOWN_PHRASES = [
      'world economic forum',
      'financial system',
      'digital currency',
      'digital currencies',
      'central bank',
      'machine learning',
      'artificial intelligence',
      'deep learning',
      'neural network',
      'climate change',
      'economic growth',
      'monetary policy',
      'fiscal policy',
      'interest rate',
      'global economy',
      'blockchain technology',
    ];

    const foundPhrases: string[] = [];
    const topicMap = new Map<string, number>();

    // Combine all messages
    const allMessages = userMessages.concat(aiMessages);
    const fullText = allMessages
      .map((m) => m.content)
      .join(' ')
      .toLowerCase();

    // Priority 1: Find known phrases
    KNOWN_PHRASES.forEach((phrase) => {
      if (fullText.includes(phrase)) {
        foundPhrases.push(phrase);
      }
    });

    // Priority 2: Extract multi-word proper noun phrases (2+ words capitalized)
    allMessages.forEach((msg) => {
      const properNouns = msg.content.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3}/g) || [];
      properNouns.forEach((phrase) => {
        const normalized = phrase.toLowerCase();
        if (phrase.split(' ').length >= 2) {
          // Only 2+ word phrases
          topicMap.set(normalized, (topicMap.get(normalized) || 0) + 1);
        }
      });
    });

    // Get top phrases from proper nouns
    const phraseTopics = Array.from(topicMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([topic]) => topic);

    // Combine, deduplicate, and limit to 5
    const seen = new Set<string>();
    const finalTopics: string[] = [];

    for (const topic of [...foundPhrases, ...phraseTopics]) {
      const lower = topic.toLowerCase();
      // Skip if we've seen this or a similar topic
      let isDuplicate = seen.has(lower);
      for (const s of seen) {
        if (s.includes(lower) || lower.includes(s)) {
          isDuplicate = true;
          break;
        }
      }
      if (!isDuplicate) {
        seen.add(lower);
        finalTopics.push(topic);
      }
      if (finalTopics.length >= 5) break;
    }

    setExtractedTopics(finalTopics);
  }, [messages]);

  return extractedTopics;
}

/**
 * Builds a multi-line synthetic summary of the conversation state.
 * Tracks topic evolution, domain, depth, and content characteristics.
 */
export function useSyntheticSummary(messages: Message[]): { summary: string; lines: number } {
  return useMemo(() => {
    if (messages.length === 0) {
      return {
        summary: 'Awaiting first query to begin conversation',
        lines: 1,
      };
    }

    // Get last 5 queries to track progression
    const userMessages = messages.filter((m) => m.role === 'user');
    const aiMessages = messages.filter((m) => m.role === 'assistant');

    const lastAiMessage = aiMessages[aiMessages.length - 1];
    const lastUserMessage = userMessages[userMessages.length - 1];

    if (!lastAiMessage) {
      return {
        summary: 'Processing your query...',
        lines: 1,
      };
    }

    // Extract topics from last 3-5 exchanges to show progression
    const recentExchanges = Math.min(5, userMessages.length);
    const recentQueries = userMessages.slice(-recentExchanges);
    const recentResponses = aiMessages.slice(-recentExchanges);

    // Track topic evolution across conversation - ENHANCED for phrases
    const allTopics: string[] = [];
    const MEANINGFUL_PHRASES = [
      'world economic forum',
      'financial system',
      'digital currency',
      'central bank',
      'machine learning',
      'artificial intelligence',
      'global economy',
      'monetary policy',
    ];

    // First check for known phrases
    const fullText = recentResponses
      .map((r) => r.content)
      .join(' ')
      .toLowerCase();
    MEANINGFUL_PHRASES.forEach((phrase) => {
      if (fullText.includes(phrase) && !allTopics.includes(phrase)) {
        allTopics.push(phrase);
      }
    });

    // Then extract multi-word proper nouns
    recentResponses.forEach((response) => {
      const multiWordPhrases =
        response.content.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,2}/g) || [];
      multiWordPhrases.forEach((phrase) => {
        const normalized = phrase.toLowerCase();
        if (phrase.split(' ').length >= 2 && !allTopics.includes(normalized)) {
          allTopics.push(normalized);
        }
      });
    });

    // Current query analysis
    const currentQuery = lastUserMessage?.content || '';
    const currentResponse = lastAiMessage.content;

    // Domain detection
    const queryLower = currentQuery.toLowerCase();
    const responseLower = currentResponse.toLowerCase();

    const isFinancial =
      /financ|econom|market|invest|stock|bond|asset|trading|gdp|inflation|monetary|fiscal/i.test(
        queryLower + ' ' + responseLower
      );
    const isCrypto = /crypto|bitcoin|ethereum|blockchain|defi|web3/i.test(
      queryLower + ' ' + responseLower
    );
    const isTech = /tech|software|hardware|computer|digital|ai|ml/i.test(
      queryLower + ' ' + responseLower
    );
    const isScience = /science|research|study|academ|peer.review/i.test(
      queryLower + ' ' + responseLower
    );

    // Determine primary domain
    let domain = 'general knowledge';
    if (isFinancial) domain = 'financial/economic analysis';
    else if (isCrypto) domain = 'cryptocurrency/blockchain';
    else if (isTech) domain = 'technology/software';
    else if (isScience) domain = 'scientific research';

    // Response characteristics
    const responseLength = currentResponse.length;
    const hasData = /\d+%|\d+\.\d+|trillion|billion|million/i.test(currentResponse);
    const hasComparison = /versus|vs|compared to|better|worse|higher|lower/i.test(currentResponse);
    const hasTrends = /trend|forecast|predict|outlook|future|2025|2026/i.test(currentResponse);
    const hasWarnings = /risk|warning|caution|concern|challenge|threat/i.test(currentResponse);

    // Build comprehensive summary (can be 3-5 lines based on complexity)
    const lines: string[] = [];

    // Line 1: Current topic focus with domain context
    const topicCount = allTopics.slice(0, 4).length;
    const mainTopics = allTopics.slice(0, 3).join(', ');
    lines.push(
      `${domain} • ${recentExchanges} recent ${recentExchanges === 1 ? 'query' : 'queries'} • exploring: ${mainTopics}`
    );

    // Line 2: Conversation progression and depth
    const exchanges = Math.floor(messages.length / 2);
    const responseDepth =
      responseLength > 1000
        ? 'comprehensive'
        : responseLength > 600
          ? 'detailed'
          : responseLength > 300
            ? 'focused'
            : 'concise';
    lines.push(
      `progression: ${exchanges} total exchanges • current response: ${responseDepth} (${responseLength} chars)`
    );

    // Line 3: Content characteristics and insights
    const characteristics: string[] = [];
    if (hasData) characteristics.push('quantitative data');
    if (hasComparison) characteristics.push('comparative analysis');
    if (hasTrends) characteristics.push('forward-looking');
    if (hasWarnings) characteristics.push('risk-aware');

    if (characteristics.length > 0) {
      lines.push(`insights: ${characteristics.join(' • ')}`);
    }

    // Line 4 (optional): Topic evolution if conversation has progressed
    if (recentExchanges > 2) {
      const firstTopics = new Set(
        recentQueries[0].content.toLowerCase().match(/\b[a-z]{4,}\b/g) || []
      );
      const lastTopics = new Set(currentQuery.toLowerCase().match(/\b[a-z]{4,}\b/g) || []);
      const overlap = Array.from(firstTopics).filter((t) => lastTopics.has(t)).length;
      const evolution = overlap > 2 ? 'focused deepening' : 'exploratory branching';
      lines.push(`evolution: ${evolution} • ${topicCount} distinct topics tracked`);
    }

    return {
      summary: lines.join('\n'),
      lines: lines.length,
    };
  }, [messages]);
}

/**
 * Fetches AI-powered contextual link insights when new messages arrive.
 * Returns insights array and metacognition data.
 */
export function useInsightGeneration(
  messages: Message[],
  extractedTopics: string[]
): { insights: Insight[]; metacognition: { confidence: number; reasoning: string } | null } {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [metacognition, setMetacognition] = useState<{
    confidence: number;
    reasoning: string;
  } | null>(null);
  const lastAnalyzedLength = useRef(0);
  const shownInsights = useRef<Set<string>>(new Set());

  useEffect(() => {
    const generateInsightsForNewMessage = async () => {
      const newInsights: Insight[] = [];
      const lastAiMessage = messages.filter((m) => m.role === 'assistant').pop();
      const lastUserMessage = messages.filter((m) => m.role === 'user').pop();

      if (!lastAiMessage || !lastUserMessage) return;

      const userQuery = lastUserMessage.content;
      const aiResponse = lastAiMessage.content;

      // Build conversation context from recent messages
      const recentMessages = messages.slice(-6); // Last 3 exchanges
      const conversationContext = recentMessages
        .map((m) => `${m.role === 'user' ? 'User' : 'AI'}: ${m.content.substring(0, 200)}`)
        .join('\n');

      // Use enhanced AI-powered link discovery
      let linkInsights: Insight[] = [];

      try {
        console.log('[MiniChat] Using ENHANCED link discovery with AI analysis');

        const response = await fetch('/api/enhanced-links', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: userQuery,
            conversationContext,
            topics: extractedTopics,
          }),
        });

        if (response.ok) {
          const data = await response.json();

          if (data.success) {
            // MiniChat gets the "minichat" type links (practical/applied)
            const minichatLinks = data.minichatLinks || [];

            // Convert to Insight format (only show MiniChat links here)
            linkInsights = minichatLinks
              .filter((link: any) => !shownInsights.current.has(link.url))
              .slice(0, 3) // Only 3 links for MiniChat
              .map((link: any) => ({
                id: link.id,
                type: 'link' as const,
                content: link.url,
                source: link.source,
                description: link.snippet,
                category: 'code', // MiniChat focuses on practical links
              }));

            if (data.searchUnavailable && linkInsights.length === 0) {
              console.warn('[MiniChat] Search unavailable — DDG rate-limited');
            }

            console.log('[MiniChat] AI-powered links discovered:', {
              query: userQuery.substring(0, 60),
              linksFound: minichatLinks.length,
              linksShown: linkInsights.length,
              searchUnavailable: data.searchUnavailable || false,
            });

            // Store metacognitive awareness
            if (data.metacognition) {
              setMetacognition(data.metacognition);
            }
          }
        } else {
          console.error('[MiniChat] Enhanced link discovery failed:', response.status);
        }
      } catch (error) {
        console.error('[MiniChat] Enhanced link discovery error:', error);
      }

      // Track shown links
      linkInsights.forEach((link) => {
        shownInsights.current.add(link.content);
      });

      newInsights.push(...linkInsights);

      // Clean up old shown insights (keep last 30)
      if (shownInsights.current.size > 30) {
        const arr = Array.from(shownInsights.current);
        shownInsights.current = new Set(arr.slice(-30));
      }

      // MiniChat shows 3 high-quality links
      setInsights(newInsights.slice(0, 3));
    };

    if (messages.length > lastAnalyzedLength.current && messages.length > 0) {
      console.log('[MiniChat] New message detected - using AI to discover contextual links');
      generateInsightsForNewMessage();
      lastAnalyzedLength.current = messages.length;
    }
  }, [messages, extractedTopics]);

  return { insights, metacognition };
}

/**
 * Manages drag-to-move and resize behavior for canvas mode.
 */
export function useDragResize(draggable: boolean, defaultPosition?: { left: number; top: number }) {
  const [dragPos, setDragPos] = useState({
    left: defaultPosition?.left ?? 10,
    top: defaultPosition?.top ?? (typeof window !== 'undefined' ? window.innerHeight - 280 : 500),
  });
  const [isDragging, setIsDragging] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const [chatSize, setChatSize] = useState({ width: 200, height: 260 });
  const [isResizing, setIsResizing] = useState(false);
  const resizeStart = useRef({ x: 0, y: 0, w: 200, h: 260 });

  // Update default position when prop changes
  useEffect(() => {
    if (defaultPosition) {
      setDragPos({ left: defaultPosition.left, top: defaultPosition.top });
    }
  }, [defaultPosition?.left, defaultPosition?.top]);

  const handleDragStart = useCallback(
    (e: React.MouseEvent) => {
      if (!draggable) return;
      e.preventDefault();
      setIsDragging(true);
      dragOffset.current = { x: e.clientX - dragPos.left, y: e.clientY - dragPos.top };

      const handleMove = (ev: MouseEvent) => {
        setDragPos({
          left: ev.clientX - dragOffset.current.x,
          top: ev.clientY - dragOffset.current.y,
        });
      };

      const cleanup = () => {
        setIsDragging(false);
        document.removeEventListener('mousemove', handleMove);
        document.removeEventListener('mouseup', cleanup);
        document.removeEventListener('mouseleave', cleanup);
      };

      // Handle normal mouseup
      document.addEventListener('mousemove', handleMove);
      document.addEventListener('mouseup', cleanup);
      // Also cleanup if mouse leaves the window (prevents stuck drag state)
      document.addEventListener('mouseleave', cleanup);
    },
    [draggable, dragPos.left, dragPos.top]
  );

  const handleResizeStart = useCallback(
    (e: React.MouseEvent) => {
      if (!draggable) return;
      e.preventDefault();
      e.stopPropagation();
      setIsResizing(true);
      resizeStart.current = { x: e.clientX, y: e.clientY, w: chatSize.width, h: chatSize.height };

      const handleMove = (ev: MouseEvent) => {
        const dw = ev.clientX - resizeStart.current.x;
        const dh = ev.clientY - resizeStart.current.y;
        setChatSize({
          width: Math.min(400, Math.max(150, resizeStart.current.w + dw)),
          height: Math.min(500, Math.max(150, resizeStart.current.h + dh)),
        });
      };

      const cleanup = () => {
        setIsResizing(false);
        document.removeEventListener('mousemove', handleMove);
        document.removeEventListener('mouseup', cleanup);
        document.removeEventListener('mouseleave', cleanup);
      };

      document.addEventListener('mousemove', handleMove);
      document.addEventListener('mouseup', cleanup);
      // Also cleanup if mouse leaves the window (prevents stuck resize state)
      document.addEventListener('mouseleave', cleanup);
    },
    [draggable, chatSize.width, chatSize.height]
  );

  return { dragPos, isDragging, handleDragStart, chatSize, isResizing, handleResizeStart };
}
