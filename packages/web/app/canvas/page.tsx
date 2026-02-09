'use client'

/**
 * CANVAS MODE PAGE
 *
 * Draggable whiteboard/canvas interface for AkhAI.
 * Alternative view to the classic chat interface.
 */

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { CanvasWorkspace, QueryCard, VisualNode, VisualEdge } from '@/components/canvas'
import { useLayerStore } from '@/lib/stores/layer-store'
import DarkModeToggle from '@/components/DarkModeToggle'
import SideMiniChat from '@/components/SideMiniChat'
import type { Message } from '@/lib/chat-store'
// ArrowLeftIcon inline to avoid heroicons sizing issues

export default function CanvasPage() {
  const router = useRouter()
  const [darkMode, setDarkMode] = useState(false)
  const [queryCards, setQueryCards] = useState<QueryCard[]>([])
  const [visualNodes, setVisualNodes] = useState<VisualNode[]>([])
  const [visualEdges, setVisualEdges] = useState<VisualEdge[]>([])
  const [miniChatMessages, setMiniChatMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isQueryLoading, setIsQueryLoading] = useState(false)

  // Load dark mode preference
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('akhai-dark-mode')
      if (saved) setDarkMode(saved === 'true')
    }
  }, [])

  // Fetch real query history on mount
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await fetch('/api/history')
        const data = await res.json()
        const queries = data.queries || []

        // Convert to QueryCard format
        const cards: QueryCard[] = queries.slice(0, 10).map((q: any) => ({
          id: q.id,
          query: q.query,
          response: q.result ? JSON.parse(q.result)?.finalAnswer || 'No response' : 'Pending...',
          timestamp: new Date(q.created_at * 1000),
          methodology: q.flow || 'direct',
          layerNode: 'encoder',
        }))

        setQueryCards(cards)

        // Generate visual nodes from query topics
        const nodes: VisualNode[] = []
        const nodeSet = new Set<string>()

        cards.forEach((card, idx) => {
          // Extract key terms from query for nodes
          const terms = card.query
            .toLowerCase()
            .split(/\s+/)
            .filter((w: string) => w.length > 4)
            .slice(0, 2)

          terms.forEach((term: string) => {
            if (!nodeSet.has(term)) {
              nodeSet.add(term)
              nodes.push({
                id: `n${nodes.length}`,
                label: term.charAt(0).toUpperCase() + term.slice(1),
                type: idx % 3 === 0 ? 'concept' : idx % 3 === 1 ? 'insight' : 'connection',
                description: `Extracted from: "${card.query.substring(0, 50)}..."`,
                weight: 0.9 - (nodes.length * 0.1),
                color: ['#a78bfa', '#818cf8', '#f87171', '#fbbf24', '#22c55e'][nodes.length % 5],
              })
            }
          })
        })

        setVisualNodes(nodes.slice(0, 8))

        // Generate edges between consecutive nodes
        const edges: VisualEdge[] = []
        for (let i = 0; i < Math.min(nodes.length - 1, 5); i++) {
          edges.push({
            source: nodes[i].id,
            target: nodes[i + 1].id,
            label: 'relates to',
          })
        }
        setVisualEdges(edges)
      } catch (error) {
        console.error('Failed to fetch history:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchHistory()
  }, [])

  const handleQuerySelect = useCallback((queryId: string) => {
    console.log('Selected query:', queryId)
    // Highlight related nodes, scroll to card
    const card = queryCards.find(c => c.id === queryId)
    if (card) {
      // Could scroll to card or highlight it
    }
  }, [queryCards])

  const handleNodeSelect = useCallback((nodeId: string) => {
    console.log('Selected node:', nodeId)
    // Show node details, highlight related queries
  }, [])

  // Handle query submission from mini-chat
  const handleSendQuery = useCallback(async (query: string) => {
    if (!query.trim() || isQueryLoading) return

    setIsQueryLoading(true)

    // Add user message to mini chat
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: query,
      timestamp: new Date(),
    }
    setMiniChatMessages(prev => [...prev, userMessage])

    try {
      // Submit to API
      const res = await fetch('/api/simple-query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          methodology: 'direct',
          conversationHistory: miniChatMessages.map(m => ({
            role: m.role,
            content: m.content,
          })),
        }),
      })

      const data = await res.json()
      const response = data.response || 'No response'

      // Add AI response to mini chat
      const aiMessage: Message = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: response,
        timestamp: new Date(),
      }
      setMiniChatMessages(prev => [...prev, aiMessage])

      // Add to query cards
      const newCard: QueryCard = {
        id: `canvas-${Date.now()}`,
        query,
        response,
        timestamp: new Date(),
        methodology: 'direct',
        layerNode: 'encoder',
      }
      setQueryCards(prev => [newCard, ...prev])
    } catch (error) {
      console.error('Query failed:', error)
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: 'Error: Failed to process query',
        timestamp: new Date(),
      }
      setMiniChatMessages(prev => [...prev, errorMessage])
    } finally {
      setIsQueryLoading(false)
    }
  }, [isQueryLoading, miniChatMessages])

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-relic-void' : 'bg-white'}`}>
      {/* Header */}
      <header className={`fixed top-0 left-0 right-0 z-50 border-b ${
        darkMode ? 'border-relic-slate/30 bg-relic-void/90' : 'border-relic-mist bg-white/90'
      } backdrop-blur-sm`}>
        <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between">
          {/* Left: Back + Logo */}
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className={`p-1.5 rounded hover:bg-relic-ghost/50 transition-colors ${
                darkMode ? 'text-relic-ghost' : 'text-relic-slate'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 16, height: 16 }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
              </svg>
            </Link>
            <div>
              <h1 className={`text-sm font-light tracking-[0.2em] ${
                darkMode ? 'text-white' : 'text-relic-slate'
              }`}>
                A K H A I
              </h1>
              <p className={`text-[8px] uppercase tracking-wider ${
                darkMode ? 'text-relic-ghost/60' : 'text-relic-silver/60'
              }`}>
                Canvas Mode
              </p>
            </div>
          </div>

          {/* Center: Minimal Label */}
          <div className="flex items-center">
            <span className={`text-[8px] uppercase tracking-widest ${
              darkMode ? 'text-relic-ghost/40' : 'text-relic-silver/40'
            }`}>
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
        <CanvasWorkspace
          queryCards={queryCards}
          visualNodes={visualNodes}
          visualEdges={visualEdges}
          onQuerySelect={handleQuerySelect}
          onNodeSelect={handleNodeSelect}
          classicContent={
            <div className="flex items-center justify-center h-screen text-relic-silver">
              Redirecting to classic mode...
            </div>
          }
        />
        <SideMiniChat
          isVisible={true}
          messages={miniChatMessages}
          draggable={true}
          defaultPosition={{ left: 20, top: 400 }}
          onSendQuery={handleSendQuery}
        />
        {/* Loading overlay */}
        {(isLoading || isQueryLoading) && (
          <div className="fixed bottom-4 right-4 bg-white/90 dark:bg-relic-void/90 px-3 py-2 rounded-lg shadow-lg border border-relic-mist/30">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 border-2 border-relic-silver border-t-relic-void rounded-full animate-spin" />
              <span className="text-[9px] text-relic-slate dark:text-relic-ghost font-mono">
                {isLoading ? 'Loading history...' : 'Processing query...'}
              </span>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
