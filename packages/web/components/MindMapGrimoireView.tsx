'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { PlusIcon, BookOpenIcon, SparklesIcon, ClockIcon } from '@heroicons/react/24/outline'
import { motion, AnimatePresence } from 'framer-motion'
import { useGrimoireStore } from '@/lib/stores/grimoire-store'
import { useSefirotStore } from '@/lib/stores/sefirot-store'
import { useSettingsStore } from '@/lib/stores/settings-store'

interface MindMapGrimoireViewProps {
  userId: string | null
  selectedTopics: string[]
  onTopicExpand?: (topicId: string) => void
}

interface GrimoireWithRelevance {
  id: string
  name: string
  instructions?: string
  memoryCount: number
  lastUsed?: number
  relevanceScore: number
  relatedTopics: string[]
}

/**
 * Grimoire View for MindMap
 *
 * Shows grimoires with topic associations:
 * - Create new grimoire from selected topics
 * - List existing grimoires with relevance scores
 * - Click to open grimoire with topic context
 *
 * Note: Sefirot Tree and Hermetic Lenses consoles are now in the
 * grimoire conversation page (not here).
 */
export default function MindMapGrimoireView({ userId, selectedTopics, onTopicExpand }: MindMapGrimoireViewProps) {
  const router = useRouter()
  const { grimoires, getMemories } = useGrimoireStore()
  const [relevantGrimoires, setRelevantGrimoires] = useState<GrimoireWithRelevance[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Calculate relevance scores for grimoires
    const grimoiresWithScores = grimoires.map((grimoire) => {
      const memories = getMemories(grimoire.id)

      // Calculate relevance based on topic mentions in memories
      let topicMentions = 0
      const relatedTopics: string[] = []

      selectedTopics.forEach((topicId) => {
        const mentionCount = memories.filter(m =>
          m.content.toLowerCase().includes(topicId.toLowerCase())
        ).length

        if (mentionCount > 0) {
          topicMentions += mentionCount
          relatedTopics.push(topicId)
        }
      })

      // Calculate relevance score (0-100)
      const relevanceScore = Math.min(
        100,
        (topicMentions / Math.max(selectedTopics.length, 1)) * 100
      )

      return {
        id: grimoire.id,
        name: grimoire.name,
        instructions: grimoire.instructions,
        memoryCount: memories.length,
        lastUsed: grimoire.updatedAt,
        relevanceScore,
        relatedTopics: relatedTopics.slice(0, 3), // Top 3 related topics
      }
    })

    // Sort by relevance score
    const sorted = grimoiresWithScores.sort((a, b) => b.relevanceScore - a.relevanceScore)
    setRelevantGrimoires(sorted)
    setLoading(false)
  }, [grimoires, selectedTopics, getMemories])

  const handleCreateGrimoire = () => {
    const { weights } = useSefirotStore.getState()
    const { settings } = useSettingsStore.getState()

    // Pass configs to grimoire creation
    const topicsQuery = selectedTopics.length > 0
      ? `?topics=${selectedTopics.join(',')}`
      : ''

    const sefirotQuery = `&sefirot=${encodeURIComponent(JSON.stringify(weights))}`
    const lensesQuery = `&lenses=${encodeURIComponent(JSON.stringify(settings.instinctConfig.activeLenses))}`

    router.push(`/grimoires${topicsQuery}${sefirotQuery}${lensesQuery}`)
  }

  const handleOpenGrimoire = (grimoireId: string, topics: string[]) => {
    // Navigate to grimoire with topic context
    const topicsQuery = topics.length > 0
      ? `&topics=${topics.join(',')}`
      : ''
    router.push(`/grimoires?selected=${grimoireId}${topicsQuery}`)
  }

  const formatLastUsed = (timestamp?: number) => {
    if (!timestamp) return 'Never'

    const now = Date.now()
    const diff = now - timestamp
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    if (days < 30) return `${days}d ago`
    return new Date(timestamp).toLocaleDateString()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-5 h-5 border-2 border-slate-200 dark:border-relic-slate border-t-blue-500 dark:border-t-blue-400 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto bg-slate-50 dark:bg-relic-void">
      <div className="p-4">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h2 className="text-lg font-mono text-relic-void dark:text-white">Grimoire Integration</h2>
              <p className="text-xs text-relic-silver dark:text-relic-ghost mt-1">
                Connect topics with knowledge repositories
              </p>
            </div>
            <button
              onClick={handleCreateGrimoire}
              className="flex items-center gap-2 px-4 py-2 bg-relic-void dark:bg-white text-white dark:text-relic-void text-sm font-mono rounded hover:bg-relic-slate dark:hover:bg-relic-ghost transition-colors"
            >
              <PlusIcon className="w-4 h-4" />
              New Grimoire
            </button>
          </div>

          {selectedTopics.length > 0 && (
            <div className="flex items-center gap-2 text-xs text-relic-silver dark:text-relic-ghost">
              <SparklesIcon className="w-3.5 h-3.5" />
              <span>{selectedTopics.length} topics selected</span>
            </div>
          )}
        </div>

        {/* Grimoires Grid */}
        {relevantGrimoires.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <BookOpenIcon className="w-12 h-12 text-relic-silver dark:text-relic-ghost opacity-50 mb-4" />
            <h3 className="text-sm font-mono text-relic-slate dark:text-relic-ghost mb-2">
              No Grimoires Yet
            </h3>
            <p className="text-xs text-relic-silver dark:text-relic-ghost mb-4 max-w-sm">
              Create your first grimoire to start organizing knowledge with AI-powered context
            </p>
            <button
              onClick={handleCreateGrimoire}
              className="px-4 py-2 bg-relic-void dark:bg-white text-white dark:text-relic-void text-xs font-mono rounded hover:bg-relic-slate dark:hover:bg-relic-ghost transition-colors"
            >
              Create Grimoire
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {relevantGrimoires.map((grimoire) => (
              <GrimoireCard
                key={grimoire.id}
                grimoire={grimoire}
                onOpen={() => handleOpenGrimoire(grimoire.id, grimoire.relatedTopics)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

interface GrimoireCardProps {
  grimoire: GrimoireWithRelevance
  onOpen: () => void
}

function GrimoireCard({ grimoire, onOpen }: GrimoireCardProps) {
  const getRelevanceColor = (score: number) => {
    if (score >= 70) return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20'
    if (score >= 40) return 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20'
    return 'text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/20'
  }

  return (
    <div className="bg-white dark:bg-relic-void/50 border border-relic-mist dark:border-relic-slate/30 rounded-lg p-4 hover:shadow-md transition-all group">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start gap-2 flex-1 min-w-0">
          <BookOpenIcon className="w-5 h-5 text-relic-slate dark:text-relic-ghost flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-mono text-relic-void dark:text-white truncate">
              {grimoire.name}
            </h3>
            {grimoire.instructions && (
              <p className="text-xs text-relic-silver dark:text-relic-ghost line-clamp-2 mt-1">
                {grimoire.instructions}
              </p>
            )}
          </div>
        </div>

        {grimoire.relevanceScore > 0 && (
          <div className={`px-2 py-0.5 rounded text-[10px] font-mono ${getRelevanceColor(grimoire.relevanceScore)}`}>
            {Math.round(grimoire.relevanceScore)}%
          </div>
        )}
      </div>

      {/* Related Topics */}
      {grimoire.relatedTopics.length > 0 && (
        <div className="mb-3">
          <p className="text-[10px] text-relic-silver dark:text-relic-ghost uppercase tracking-wider mb-1.5">
            Related Topics
          </p>
          <div className="flex flex-wrap gap-1">
            {grimoire.relatedTopics.map((topic, i) => (
              <span
                key={i}
                className="px-2 py-0.5 bg-relic-ghost dark:bg-relic-slate/20 text-[10px] text-relic-slate dark:text-relic-ghost rounded"
              >
                {topic}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="flex items-center gap-4 text-[10px] text-relic-silver dark:text-relic-ghost mb-3 pt-3 border-t border-relic-mist dark:border-relic-slate/30">
        <div className="flex items-center gap-1">
          <SparklesIcon className="w-3 h-3" />
          <span>{grimoire.memoryCount} memories</span>
        </div>
        <div className="flex items-center gap-1">
          <ClockIcon className="w-3 h-3" />
          <span>{formatLastUsed(grimoire.lastUsed)}</span>
        </div>
      </div>

      {/* Action Button */}
      <button
        onClick={onOpen}
        className="w-full py-2 px-3 bg-relic-ghost dark:bg-relic-slate/20 hover:bg-relic-void hover:text-white dark:hover:bg-white dark:hover:text-relic-void text-relic-void dark:text-white text-xs font-mono rounded transition-all group-hover:bg-relic-void group-hover:text-white dark:group-hover:bg-white dark:group-hover:text-relic-void"
      >
        Open Grimoire →
      </button>
    </div>
  )
}

function formatLastUsed(timestamp?: number) {
  if (!timestamp) return 'Never'

  const now = Date.now()
  const diff = now - timestamp
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 30) return `${days}d ago`
  return new Date(timestamp).toLocaleDateString()
}
