'use client';

/**
 * CANVAS MODE PAGE
 *
 * Draggable whiteboard/canvas interface for AkhAI.
 * Alternative view to the classic chat interface.
 */

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { CanvasWorkspace, QueryCard, VisualNode, VisualEdge } from '@/components/canvas';
import { useLayerStore } from '@/lib/stores/layer-store';
import DarkModeToggle from '@/components/DarkModeToggle';
import SideMiniChat from '@/components/SideMiniChat';
import type { Message } from '@/lib/chat-store';
// ArrowLeftIcon inline to avoid heroicons sizing issues

/**
 * Reconcile persisted stage IDs against the current queryCards list:
 * - drop orphans (IDs not in current queries — deleted, DB swap, stale session)
 * - top up to 5 from most recent unstaged cards if short
 * - persist the cleaned list back to DB so orphans don't reappear
 */
async function reconcileStage(cards: QueryCard[]): Promise<string[]> {
  if (cards.length === 0) return [];
  const validIds = new Set(cards.map((c) => c.id));
  const res = await fetch('/api/canvas-stage');
  const data = await res.json();
  const raw: string[] = Array.isArray(data.stageIds)
    ? data.stageIds.filter((id: unknown): id is string => typeof id === 'string')
    : [];
  let cleaned = raw.filter((id) => validIds.has(id));
  if (cleaned.length < 5) {
    const fillCount = 5 - cleaned.length;
    const existingSet = new Set(cleaned);
    const fillers = cards
      .filter((c) => !existingSet.has(c.id))
      .slice(0, fillCount)
      .map((c) => c.id);
    cleaned = [...cleaned, ...fillers];
  }
  const changed = cleaned.length !== raw.length || cleaned.some((id, i) => id !== raw[i]);
  if (changed) {
    fetch('/api/canvas-stage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stageIds: cleaned }),
    }).catch(() => {});
  }
  return cleaned;
}

export default function CanvasPage() {
  const router = useRouter();
  const [darkMode, setDarkMode] = useState(false);
  const [queryCards, setQueryCards] = useState<QueryCard[]>([]);
  const [visualNodes, setVisualNodes] = useState<VisualNode[]>([]);
  const [visualEdges, setVisualEdges] = useState<VisualEdge[]>([]);
  const [miniChatMessages, setMiniChatMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isQueryLoading, setIsQueryLoading] = useState(false);
  // Canvas stage: ids of up to 3 queries currently rendered on the stage.
  const [stageIds, setStageIds] = useState<string[]>([]);

  // Load dark mode preference
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('akhai-dark-mode');
      if (saved) setDarkMode(saved === 'true');
    }
  }, []);

  // Fetch real query history on mount
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await fetch('/api/history');
        const data = await res.json();
        const queries = data.queries || [];

        // Convert to QueryCard format
        const cards: QueryCard[] = queries.slice(0, 30).map((q: any) => ({
          id: q.id,
          query: q.query,
          response: q.result ? JSON.parse(q.result)?.finalAnswer || 'No response' : 'Pending...',
          timestamp: new Date(q.created_at * 1000),
          methodology: q.flow || 'direct',
          layerNode: 'encoder',
        }));

        setQueryCards(cards);

        // Reconcile persisted stage: drop orphan IDs, top up to 5 from most recent, persist cleaned.
        try {
          const cleaned = await reconcileStage(cards);
          setStageIds(cleaned);
        } catch (stageErr) {
          console.error('Failed to reconcile canvas stage:', stageErr);
        }

        // Generate visual nodes from query topics
        const nodes: VisualNode[] = [];
        const nodeSet = new Set<string>();

        const STOP_WORDS = new Set([
          'about',
          'after',
          'again',
          'before',
          'could',
          'every',
          'first',
          'might',
          'never',
          'other',
          'their',
          'there',
          'these',
          'thing',
          'think',
          'those',
          'under',
          'where',
          'which',
          'would',
          'being',
          'doing',
          'going',
          'having',
          'should',
          'through',
          'between',
          'because',
        ]);
        cards.forEach((card, idx) => {
          // Extract key terms from query for nodes
          const terms = card.query
            .toLowerCase()
            .replace(/[^a-z\s]/g, '')
            .split(/\s+/)
            .filter((w: string) => w.length > 4 && !STOP_WORDS.has(w))
            .slice(0, 2);

          terms.forEach((term: string) => {
            if (!nodeSet.has(term)) {
              nodeSet.add(term);
              nodes.push({
                id: `n${nodes.length}`,
                label: term.charAt(0).toUpperCase() + term.slice(1),
                type: idx % 3 === 0 ? 'concept' : idx % 3 === 1 ? 'insight' : 'connection',
                description: `Extracted from: "${card.query.substring(0, 50)}..."`,
                weight: 0.9 - nodes.length * 0.1,
                color: ['#a78bfa', '#818cf8', '#f87171', '#fbbf24', '#22c55e'][nodes.length % 5],
              });
            }
          });
        });

        setVisualNodes(nodes.slice(0, 8));

        // Generate edges between consecutive nodes
        const edges: VisualEdge[] = [];
        for (let i = 0; i < Math.min(nodes.length - 1, 5); i++) {
          edges.push({
            source: nodes[i].id,
            target: nodes[i + 1].id,
            label: 'relates to',
          });
        }
        setVisualEdges(edges);
      } catch (error) {
        console.error('Failed to fetch history:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHistory();
  }, []);

  const handleQuerySelect = useCallback(
    (queryId: string) => {
      console.log('Selected query:', queryId);
      // Highlight related nodes, scroll to card
      const card = queryCards.find((c) => c.id === queryId);
      if (card) {
        // Could scroll to card or highlight it
      }
    },
    [queryCards]
  );

  const handleNodeSelect = useCallback((nodeId: string) => {
    console.log('Selected node:', nodeId);
    // Show node details, highlight related queries
  }, []);

  // Reset the stage to the 5 most recent queries and persist.
  const onResetStage = useCallback(() => {
    const defaultIds = queryCards.slice(0, 5).map((c) => c.id);
    setStageIds(defaultIds);
    fetch('/api/canvas-stage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stageIds: defaultIds }),
    }).catch(() => {});
  }, [queryCards]);

  // Toggle a query's stage membership. Optimistic local update + fire-and-forget persist.
  const onToggleStage = useCallback(
    (queryId: string) => {
      const isOnStage = stageIds.includes(queryId);
      let next: string[];
      if (isOnStage) {
        next = stageIds.filter((id) => id !== queryId);
      } else if (stageIds.length < 5) {
        next = [...stageIds, queryId];
      } else {
        // Stage full — bump the oldest staged query (by timestamp).
        const staged = queryCards
          .filter((c) => stageIds.includes(c.id))
          .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
        const oldest = staged[0]?.id;
        next = stageIds.filter((id) => id !== oldest).concat([queryId]);
      }
      setStageIds(next);
      fetch('/api/canvas-stage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stageIds: next }),
      }).catch(() => {});
    },
    [stageIds, queryCards]
  );

  // Handle query submission from mini-chat
  const handleSendQuery = useCallback(
    async (query: string) => {
      if (!query.trim() || isQueryLoading) return;

      setIsQueryLoading(true);

      // Add user message to mini chat
      const userMessage: Message = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: query,
        timestamp: new Date(),
      };
      setMiniChatMessages((prev) => [...prev, userMessage]);

      try {
        // Submit to API
        const res = await fetch('/api/simple-query', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query,
            methodology: 'direct',
            conversationHistory: miniChatMessages.map((m) => ({
              role: m.role,
              content: m.content,
            })),
          }),
        });

        const data = await res.json();
        const response = data.response || 'No response';

        // Add AI response to mini chat
        const aiMessage: Message = {
          id: `ai-${Date.now()}`,
          role: 'assistant',
          content: response,
          timestamp: new Date(),
        };
        setMiniChatMessages((prev) => [...prev, aiMessage]);

        // Add to query cards
        const newCard: QueryCard = {
          id: `canvas-${Date.now()}`,
          query,
          response,
          timestamp: new Date(),
          methodology: 'direct',
          layerNode: 'encoder',
        };
        setQueryCards((prev) => [newCard, ...prev]);
        // Auto-stage the fresh card as newest slot (right). Bumps oldest if stage is full.
        setStageIds((prev) => {
          if (prev.includes(newCard.id)) return prev;
          let next: string[];
          if (prev.length < 5) {
            next = [...prev, newCard.id];
          } else {
            // Bump the oldest staged card. prev is insertion order from fetch, so prev[0] is oldest-known.
            next = prev.slice(1).concat([newCard.id]);
          }
          fetch('/api/canvas-stage', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ stageIds: next }),
          }).catch(() => {});
          return next;
        });
      } catch (error) {
        console.error('Query failed:', error);
        const errorMessage: Message = {
          id: `error-${Date.now()}`,
          role: 'assistant',
          content: 'Error: Failed to process query',
          timestamp: new Date(),
        };
        setMiniChatMessages((prev) => [...prev, errorMessage]);
      } finally {
        setIsQueryLoading(false);
      }
    },
    [isQueryLoading, miniChatMessages]
  );

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-relic-void' : 'bg-white'}`}>
      {/* Header */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 border-b ${
          darkMode ? 'border-relic-slate/30 bg-relic-void/90' : 'border-relic-mist bg-white/90'
        } backdrop-blur-sm`}
      >
        <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between">
          {/* Left: Back + Logo */}
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className={`p-1.5 rounded hover:bg-relic-ghost/50 transition-colors ${
                darkMode ? 'text-relic-ghost' : 'text-relic-slate'
              }`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                style={{ width: 16, height: 16 }}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18"
                />
              </svg>
            </Link>
            <div>
              <h1
                className={`text-sm font-light tracking-[0.2em] ${
                  darkMode ? 'text-white' : 'text-relic-slate'
                }`}
              >
                A K H A I
              </h1>
              <p
                className={`text-[8px] uppercase tracking-wider ${
                  darkMode ? 'text-relic-ghost/60' : 'text-relic-silver/60'
                }`}
              >
                Canvas Mode
              </p>
            </div>
          </div>

          {/* Center: Minimal Label */}
          <div className="flex items-center">
            <span
              className={`text-[8px] uppercase tracking-widest ${
                darkMode ? 'text-relic-ghost/40' : 'text-relic-silver/40'
              }`}
            >
              canvas
            </span>
          </div>

          {/* Right: Controls */}
          <div className="flex items-center gap-3">
            <DarkModeToggle />
            <Link
              href="/tree-of-life"
              className={`text-[9px] px-2 py-1 rounded transition-all ${
                darkMode
                  ? 'text-relic-ghost/70 hover:text-white hover:bg-relic-slate/30'
                  : 'text-relic-silver hover:text-relic-slate hover:bg-relic-ghost'
              }`}
            >
              AI Config →
            </Link>
          </div>
        </div>
      </header>

      {/* Main Canvas Area */}
      <main className="pt-12">
        {!isLoading && queryCards.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center text-center px-8"
            style={{ minHeight: 'calc(100vh - 120px)' }}
          >
            <div className="text-4xl font-mono mb-4 text-relic-silver">◊</div>
            <h1 className="text-2xl font-mono mb-3 text-relic-silver">Your research stage</h1>
            <p className="text-sm text-relic-silver/60 mb-8 max-w-md">
              Submit a query from the chat panel in the corner. Your queries will land here, and
              you&apos;ll see how they connect.
            </p>
            <div className="text-xs text-relic-silver/40 font-mono animate-pulse">
              ↘ mini-chat ready
            </div>
          </div>
        ) : (
          <CanvasWorkspace
            queryCards={queryCards}
            visualNodes={visualNodes}
            visualEdges={visualEdges}
            stageIds={stageIds}
            onToggleStage={onToggleStage}
            onResetStage={onResetStage}
            darkMode={darkMode}
            onQuerySelect={handleQuerySelect}
            onNodeSelect={handleNodeSelect}
            classicContent={
              <div className="flex items-center justify-center h-screen text-relic-silver">
                Redirecting to classic mode...
              </div>
            }
          />
        )}
        <SideMiniChat
          isVisible={true}
          messages={miniChatMessages}
          draggable={true}
          defaultPosition={{
            // Sit 8px to the LEFT of the Q button (48px wide at right:24 bottom:32),
            // bottom-aligned with it. Panel is 200×260 by default.
            left: typeof window !== 'undefined' ? window.innerWidth - 280 : 1000,
            top: typeof window !== 'undefined' ? window.innerHeight - 292 : 400,
          }}
          onSendQuery={handleSendQuery}
        />
        {isLoading && queryCards.length === 0 && (
          <div
            className="flex items-center justify-center"
            style={{ minHeight: 'calc(100vh - 120px)' }}
          >
            <div className="text-[10px] uppercase tracking-[0.3em] text-relic-silver/40">
              ◇ loading canvas...
            </div>
          </div>
        )}
        {isQueryLoading && (
          <div className="fixed bottom-4 right-4 bg-white/90 dark:bg-relic-void/90 px-3 py-2 rounded-lg shadow-lg border border-relic-mist/30">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 border-2 border-relic-silver border-t-relic-void rounded-full animate-spin" />
              <span className="text-[9px] text-relic-slate dark:text-relic-ghost font-mono">
                Processing query...
              </span>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
