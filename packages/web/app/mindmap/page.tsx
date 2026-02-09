'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import MindMapHistoryView from '@/components/MindMapHistoryView'
import MindMapReportView from '@/components/MindMapReportView'
import LayerConsole from '@/components/LayerConsole'

// Radial knowledge graph
const MindMapDiagramView = dynamic(
  () => import('@/components/MindMapDiagramView'),
  { ssr: false }
)
import {
  MapIcon,
  ClockIcon,
  BookOpenIcon,
  ArrowLeftIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline'

type ViewMode = 'graph' | 'history' | 'report'

interface Topic {
  id: string
  name: string
  description?: string | null
  category?: string | null
  queryCount?: number
  color?: string
}

interface Connection {
  from: string
  to: string
  fromName?: string
  toName?: string
}

export default function MindMapPage() {
  const router = useRouter()
  const [viewMode, setViewMode] = useState<ViewMode>('graph')
  const [showLayerConsole, setShowLayerConsole] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [user, setUser] = useState<any>(null)
  const [topics, setTopics] = useState<Topic[]>([])
  const [connections, setConnections] = useState<Connection[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Check session
  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await fetch('/api/auth/session')
        if (res.ok) {
          const data = await res.json()
          setUser(data.user)
        }
      } catch (error) {
        console.error('Session check error:', error)
      }
    }
    checkSession()
  }, [])

  // Fetch mind map data
  useEffect(() => {
    const fetchMindMapData = async () => {
      try {
        setIsLoading(true)
        const res = await fetch('/api/mindmap/data')
        if (res.ok) {
          const data = await res.json()
          setTopics(data.nodes || [])
          setConnections(data.connections || [])
        }
      } catch (error) {
        console.error('Mind map data fetch error:', error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchMindMapData()
  }, [])

  // Filter topics by search term
  const filteredTopics = searchTerm
    ? topics.filter(t =>
        t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.category?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : topics

  // Handle topic expand
  const handleTopicExpand = useCallback((topicId: string) => {
    console.log('Expand topic:', topicId)
    // TODO: Open topic expansion panel
  }, [])

  const viewModes = [
    { id: 'graph' as ViewMode, icon: MapIcon, label: 'Graph' },
    { id: 'history' as ViewMode, icon: ClockIcon, label: 'History' },
    { id: 'report' as ViewMode, icon: BookOpenIcon, label: 'Report' }
  ]

  return (
    <div className="min-h-screen bg-white dark:bg-relic-void">
      {/* Header */}
      <header className="border-b border-relic-mist/50 dark:border-relic-slate/30 bg-white/80 dark:bg-relic-void/80 backdrop-blur-sm sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/')}
                className="text-relic-silver hover:text-relic-void dark:hover:text-white transition-colors"
              >
                <ArrowLeftIcon className="w-4 h-4" />
              </button>
              <h1 className="text-[10px] uppercase tracking-[0.3em] text-relic-silver dark:text-relic-silver/70">
                mind map
              </h1>
            </div>

            <div className="flex items-center gap-4">
              {/* Search */}
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="search nodes..."
                className="w-48 px-3 py-1.5 text-[9px] font-mono bg-transparent border border-relic-mist/30 dark:border-relic-slate/30 text-relic-void dark:text-white placeholder:text-relic-silver/50 focus:outline-none focus:border-relic-slate/50"
              />

              {/* View Mode Tabs */}
              <div className="flex items-center gap-1 bg-relic-ghost/50 dark:bg-relic-slate/20 p-0.5 rounded">
                {viewModes.map(mode => (
                  <button
                    key={mode.id}
                    onClick={() => setViewMode(mode.id)}
                    className={`px-2 py-1 text-[8px] font-mono uppercase tracking-wider transition-colors ${
                      viewMode === mode.id
                        ? 'bg-white dark:bg-relic-void text-relic-void dark:text-white'
                        : 'text-relic-silver hover:text-relic-slate dark:hover:text-relic-ghost'
                    }`}
                  >
                    <mode.icon className="w-3 h-3 inline mr-1" />
                    {mode.label}
                  </button>
                ))}
              </div>

              {/* Layers Console Toggle */}
              <button
                onClick={() => setShowLayerConsole(!showLayerConsole)}
                className="text-relic-silver hover:text-purple-500 transition-colors"
                title="Tree of Life Configuration"
              >
                <Cog6ToothIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="h-[calc(100vh-60px)]">
        {/* Radial Knowledge Graph View */}
        {viewMode === 'graph' && (
          isLoading ? (
            <div className="h-full flex items-center justify-center bg-[#fafbfc]">
              <div className="text-center">
                <div className="animate-spin w-5 h-5 border border-slate-300 border-t-slate-500 rounded-full mx-auto mb-2" />
                <p className="text-xs text-slate-400">loading graph...</p>
              </div>
            </div>
          ) : (
            <MindMapDiagramView
              userId={user?.id || null}
              nodes={filteredTopics as any}
              searchQuery={searchTerm}
            />
          )
        )}
        {viewMode === 'history' && (
          <MindMapHistoryView />
        )}
        {viewMode === 'report' && (
          <MindMapReportView
            userId={user?.id || null}
            selectedTopics={[]}
          />
        )}
      </main>

      {/* Layers Console */}
      <LayerConsole
        isOpen={showLayerConsole}
        onToggle={() => setShowLayerConsole(!showLayerConsole)}
      />
    </div>
  )
}
