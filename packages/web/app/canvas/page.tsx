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
import { useSefirotStore } from '@/lib/stores/sefirot-store'
import DarkModeToggle from '@/components/DarkModeToggle'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'

// Demo data - in production this would come from the conversation store
const DEMO_QUERY_CARDS: QueryCard[] = [
  {
    id: '1',
    query: 'What is the Kabbalistic Tree of Life?',
    response: 'The Kabbalistic Tree of Life (Etz Chaim) is a mystical symbol representing the structure of creation and the path of spiritual ascent. It consists of 10 Sefirot (emanations) connected by 22 paths, forming a map of consciousness and divine energy flow.',
    timestamp: new Date(Date.now() - 3600000),
    methodology: 'direct',
    sefirah: 'Binah',
  },
  {
    id: '2',
    query: 'How does AkhAI use the Sefirot in AI processing?',
    response: 'AkhAI maps the 10 Sefirot to AI processing layers: Malkuth (input parsing), Yesod (comprehension), Hod (communication), Netzach (persistence), Tiferet (synthesis), Gevurah (critical analysis), Chesed (expansion), Binah (knowledge recall), Chokmah (reasoning), and Kether (meta-cognition). This creates a holistic processing pipeline.',
    timestamp: new Date(Date.now() - 1800000),
    methodology: 'cod',
    sefirah: 'Chokmah',
    guardWarnings: ['Source verification pending'],
  },
  {
    id: '3',
    query: 'Explain the Guard system',
    response: 'The Guard system monitors AI outputs for anti-patterns (Qliphoth). It detects: hallucinations, contradictions, over-confidence, verbose padding, and source hiding. Each warning triggers a confidence adjustment and optional correction.',
    timestamp: new Date(Date.now() - 900000),
    methodology: 'bot',
    sefirah: 'Gevurah',
  },
]

const DEMO_VISUAL_NODES: VisualNode[] = [
  { id: 'n1', label: 'Kabbalistic Tree', type: 'concept', description: 'Central mystical framework', weight: 0.9, color: '#a78bfa' },
  { id: 'n2', label: 'Sefirot Mapping', type: 'insight', description: 'AI layers correspond to emanations', weight: 0.8, color: '#818cf8' },
  { id: 'n3', label: 'Guard System', type: 'connection', description: 'Anti-pattern detection', weight: 0.7, color: '#f87171' },
  { id: 'n4', label: 'Processing Pipeline', type: 'sefirah', description: 'From input to output', weight: 0.6, color: '#fbbf24' },
  { id: 'n5', label: 'Qliphoth', type: 'concept', description: 'Shadow patterns to avoid', weight: 0.5, color: '#ef4444' },
]

const DEMO_VISUAL_EDGES: VisualEdge[] = [
  { source: 'n1', target: 'n2', label: 'maps to' },
  { source: 'n2', target: 'n4', label: 'creates' },
  { source: 'n3', target: 'n5', label: 'monitors' },
  { source: 'n4', target: 'n3', label: 'feeds' },
]

export default function CanvasPage() {
  const router = useRouter()
  const [darkMode, setDarkMode] = useState(false)
  const [queryCards, setQueryCards] = useState<QueryCard[]>(DEMO_QUERY_CARDS)
  const [visualNodes, setVisualNodes] = useState<VisualNode[]>(DEMO_VISUAL_NODES)
  const [visualEdges, setVisualEdges] = useState<VisualEdge[]>(DEMO_VISUAL_EDGES)

  // Load dark mode preference
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('akhai-dark-mode')
      if (saved) setDarkMode(saved === 'true')
    }
  }, [])

  const handleQuerySelect = useCallback((queryId: string) => {
    console.log('Selected query:', queryId)
    // In production: highlight related nodes, scroll to card, etc.
  }, [])

  const handleNodeSelect = useCallback((nodeId: string) => {
    console.log('Selected node:', nodeId)
    // In production: show node details, highlight related queries, etc.
  }, [])

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
              <ArrowLeftIcon className="w-4 h-4" />
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

          {/* Center: View Toggle */}
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className={`px-3 py-1 text-[9px] rounded transition-all ${
                darkMode 
                  ? 'bg-relic-slate/30 text-relic-ghost hover:bg-relic-slate/50' 
                  : 'bg-relic-ghost text-relic-slate hover:bg-relic-mist'
              }`}
            >
              ← Classic Chat
            </Link>
            <span className={`px-3 py-1 text-[9px] rounded ${
              darkMode 
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' 
                : 'bg-purple-100 text-purple-600 border border-purple-200'
            }`}>
              ◇ Canvas
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
      </main>
    </div>
  )
}
