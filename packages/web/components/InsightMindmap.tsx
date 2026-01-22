'use client'

import { useState, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  SparklesIcon,
  LightBulbIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  LinkIcon
} from '@heroicons/react/24/outline'
import { Sefirah, SEPHIROTH_METADATA } from '@/lib/ascent-tracker'

interface ConceptNode {
  id: string
  label: string
  fullText: string
  category: string
  confidence: number
  relevance: number
  connections: string[]
  context: string
  insight: string
  sefirotMapping: Sefirah[] // Which Sephiroth this concept relates to
}

interface QueryInsight {
  intent: string
  keywords: string[]
  sefirotFocus: { sefirah: Sefirah; reason: string }[]
}

// Research link from dynamic discovery
interface ResearchLink {
  id: string
  url: string
  title: string
  snippet?: string
  relevance: number
  source: string
}

interface InsightMindmapProps {
  content: string
  query: string
  methodology?: string
  onSwitchToSefirot?: () => void
  onOpenMindMap?: () => void
}

// Map concepts to Sefirot based on content
function mapToSefirot(text: string, category: string): Sefirah[] {
  const textLower = text.toLowerCase()
  const sefirot: Sefirah[] = []

  // Kether (10) - Crown - Meta, integration, highest level
  if (textLower.includes('meta') || textLower.includes('integration') || textLower.includes('holistic') || textLower.includes('overview')) {
    sefirot.push(Sefirah.KETHER)
  }
  // Chokmah (9) - Wisdom - Abstract reasoning, principles
  if (textLower.includes('principle') || textLower.includes('theory') || textLower.includes('abstract') || textLower.includes('reasoning')) {
    sefirot.push(Sefirah.CHOKMAH)
  }
  // Binah (8) - Understanding - Patterns, analysis
  if (textLower.includes('pattern') || textLower.includes('structure') || textLower.includes('analysis') || textLower.includes('understand')) {
    sefirot.push(Sefirah.BINAH)
  }
  // Chesed (7) - Expansion - Growth, possibilities
  if (textLower.includes('expand') || textLower.includes('grow') || textLower.includes('possibilit') || textLower.includes('opportunity')) {
    sefirot.push(Sefirah.CHESED)
  }
  // Gevurah (6) - Constraint - Limits, rules, validation
  if (textLower.includes('limit') || textLower.includes('constrain') || textLower.includes('valid') || textLower.includes('rule')) {
    sefirot.push(Sefirah.GEVURAH)
  }
  // Tiferet (5) - Balance - Harmony, integration
  if (textLower.includes('balance') || textLower.includes('harmony') || textLower.includes('core') || category === 'core') {
    sefirot.push(Sefirah.TIFERET)
  }
  // Netzach (4) - Creativity - Generation, creation
  if (textLower.includes('creat') || textLower.includes('generat') || textLower.includes('design') || textLower.includes('innovate')) {
    sefirot.push(Sefirah.NETZACH)
  }
  // Hod (3) - Logic - Classification, logic
  if (textLower.includes('logic') || textLower.includes('classif') || textLower.includes('categor') || category === 'definition') {
    sefirot.push(Sefirah.HOD)
  }
  // Yesod (2) - Foundation - Implementation, execution
  if (textLower.includes('implement') || textLower.includes('execut') || textLower.includes('method') || category === 'method') {
    sefirot.push(Sefirah.YESOD)
  }
  // Malkuth (1) - Kingdom - Data, concrete
  if (textLower.includes('data') || textLower.includes('result') || textLower.includes('example') || category === 'data' || category === 'example') {
    sefirot.push(Sefirah.MALKUTH)
  }
  // Da'at (11) - Knowledge - Emergent insights
  if (textLower.includes('insight') || textLower.includes('emergent') || textLower.includes('discover') || category === 'insight') {
    sefirot.push(Sefirah.DAAT)
  }

  // Default to Tiferet (balance/core) if no match
  return sefirot.length > 0 ? sefirot.slice(0, 2) : [Sefirah.TIFERET]
}

// Generate query-specific insight with Sefirot focus
function generateQueryInsight(query: string, content: string, nodes: ConceptNode[]): QueryInsight {
  const queryLower = query.toLowerCase()
  const queryWords = queryLower.split(/\s+/).filter(w => w.length > 3)

  // Extract key phrases (capitalized or quoted)
  const keyPhrases = query.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g) || []
  const keywords = [...new Set([...keyPhrases, ...queryWords.slice(0, 5)])].slice(0, 6)

  // Determine intent
  let intent = ''
  if (queryLower.includes('how')) intent = 'Understand methodology and process'
  else if (queryLower.includes('what')) intent = 'Define and clarify concepts'
  else if (queryLower.includes('why')) intent = 'Explore reasoning and causation'
  else if (queryLower.includes('compare')) intent = 'Analyze differences and trade-offs'
  else intent = 'Explore and synthesize information'

  // Determine Sefirot focus based on query type
  const sefirotFocus: { sefirah: Sefirah; reason: string }[] = []

  if (queryLower.includes('how') || queryLower.includes('implement') || queryLower.includes('build')) {
    sefirotFocus.push({ sefirah: Sefirah.YESOD, reason: 'Implementation focus' })
  }
  if (queryLower.includes('what') || queryLower.includes('define') || queryLower.includes('explain')) {
    sefirotFocus.push({ sefirah: Sefirah.HOD, reason: 'Classification & definition' })
  }
  if (queryLower.includes('why') || queryLower.includes('reason') || queryLower.includes('cause')) {
    sefirotFocus.push({ sefirah: Sefirah.BINAH, reason: 'Pattern understanding' })
  }
  if (queryLower.includes('create') || queryLower.includes('design') || queryLower.includes('generate')) {
    sefirotFocus.push({ sefirah: Sefirah.NETZACH, reason: 'Creative generation' })
  }
  if (queryLower.includes('compare') || queryLower.includes('limit') || queryLower.includes('constraint')) {
    sefirotFocus.push({ sefirah: Sefirah.GEVURAH, reason: 'Boundaries & evaluation' })
  }

  // Default to Tiferet if no specific focus
  if (sefirotFocus.length === 0) {
    sefirotFocus.push({ sefirah: Sefirah.TIFERET, reason: 'Balanced integration' })
  }

  return { intent, keywords, sefirotFocus: sefirotFocus.slice(0, 2) }
}

// Generate node-specific context and insight
function generateNodeInsight(text: string, category: string, query: string): { context: string; insight: string } {
  const textLower = text.toLowerCase()
  const queryWords = query.toLowerCase().split(/\s+/).filter(w => w.length > 3)
  const matchedWords = queryWords.filter(w => textLower.includes(w))

  const context = matchedWords.length > 0
    ? `Connects "${matchedWords.slice(0, 2).join(', ')}" from your query`
    : `${category.charAt(0).toUpperCase() + category.slice(1)} concept extracted`

  const insight = text.length > 60
    ? text.substring(0, 57) + '...'
    : text

  return { context, insight }
}

function extractInsights(content: string, query: string): ConceptNode[] {
  const nodes: ConceptNode[] = []
  const categories = ['core', 'definition', 'example', 'method', 'application', 'comparison', 'insight', 'data']

  const boldPattern = /\*\*([^*]+)\*\*/g
  const headerPattern = /^#+\s*(.+)$/gm
  const bulletPattern = /^[-•*]\s*(.+)$/gm

  const allMatches: { text: string; type: string }[] = []

  let match
  while ((match = boldPattern.exec(content)) !== null) {
    const text = match[1].trim()
    if (text.length > 3 && text.length < 100) allMatches.push({ text, type: 'bold' })
  }

  while ((match = headerPattern.exec(content)) !== null) {
    const text = match[1].trim().replace(/[#*]/g, '')
    if (text.length > 3 && text.length < 80) allMatches.push({ text, type: 'header' })
  }

  while ((match = bulletPattern.exec(content)) !== null) {
    const text = match[1].trim().replace(/\*\*/g, '')
    if (text.length > 10 && text.length < 120) allMatches.push({ text, type: 'bullet' })
  }

  const seen = new Set<string>()
  allMatches.forEach((item, index) => {
    const key = item.text.toLowerCase().substring(0, 30)
    if (seen.has(key)) return
    seen.add(key)

    let category = categories[index % categories.length]
    const textLower = item.text.toLowerCase()

    if (textLower.includes('example') || textLower.includes('such as')) category = 'example'
    else if (textLower.includes('define') || textLower.includes('is a')) category = 'definition'
    else if (textLower.includes('method') || textLower.includes('step')) category = 'method'
    else if (textLower.includes('use') || textLower.includes('apply')) category = 'application'
    else if (textLower.includes('data') || textLower.includes('metric')) category = 'data'
    else if (textLower.includes('compare') || textLower.includes('versus')) category = 'comparison'
    else if (textLower.includes('insight') || textLower.includes('key')) category = 'insight'

    const baseConfidence = item.type === 'bold' ? 0.9 : item.type === 'header' ? 0.85 : 0.75
    const confidence = Math.min(0.98, baseConfidence + Math.random() * 0.08)

    const queryWords = query.toLowerCase().split(/\s+/)
    const matchWords = queryWords.filter(w => w.length > 3 && textLower.includes(w)).length
    const relevance = Math.min(0.98, 0.6 + (matchWords / Math.max(1, queryWords.length)) * 0.4)

    const { context, insight } = generateNodeInsight(item.text, category, query)
    const sefirotMapping = mapToSefirot(item.text, category)

    nodes.push({
      id: `insight-${nodes.length}`,
      label: item.text.length > 32 ? item.text.substring(0, 29) + '...' : item.text,
      fullText: item.text,
      category,
      confidence,
      relevance,
      connections: [],
      context,
      insight,
      sefirotMapping
    })
  })

  // Build connections
  nodes.forEach((node, i) => {
    nodes.forEach((other, j) => {
      if (i !== j) {
        const words1 = node.fullText.toLowerCase().split(/\s+/)
        const words2 = other.fullText.toLowerCase().split(/\s+/)
        const common = words1.filter(w => w.length > 4 && words2.includes(w))
        if (common.length >= 2) node.connections.push(other.id)
      }
    })
  })

  return nodes.slice(0, 10)
}

/**
 * Dynamically discover research links
 */
async function discoverResearchLinks(query: string, content: string): Promise<{
  links: ResearchLink[]
  metacognition: { confidence: number; reasoning: string } | null
}> {
  try {
    const capitalizedWords = content.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*/g) || []
    const topics = [...new Set(capitalizedWords.map(w => w.toLowerCase()))].slice(0, 5)

    const response = await fetch('/api/enhanced-links', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query,
        conversationContext: content.substring(0, 1500),
        topics
      })
    })

    if (response.ok) {
      const data = await response.json()
      if (data.success && data.insightLinks) {
        return {
          links: data.insightLinks.slice(0, 2).map((link: any) => ({
            id: link.id,
            url: link.url,
            title: link.title,
            snippet: link.snippet,
            relevance: link.relevance,
            source: link.source
          })),
          metacognition: data.metacognition || null
        }
      }
    }

    return { links: [], metacognition: null }
  } catch {
    return { links: [], metacognition: null }
  }
}

// Sefirah colors
const SEFIRAH_COLORS: Record<number, string> = {
  1: '#f59e0b', // Malkuth - amber
  2: '#8b5cf6', // Yesod - violet
  3: '#f97316', // Hod - orange
  4: '#22c55e', // Netzach - green
  5: '#eab308', // Tiferet - yellow
  6: '#ef4444', // Gevurah - red
  7: '#3b82f6', // Chesed - blue
  8: '#6366f1', // Binah - indigo
  9: '#64748b', // Chokmah - slate
  10: '#ffffff', // Kether - white
  11: '#06b6d4', // Da'at - cyan
}

export default function InsightMindmap({ content, query, onSwitchToSefirot, onOpenMindMap }: InsightMindmapProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [selectedNode, setSelectedNode] = useState<ConceptNode | null>(null)
  const [researchLinks, setResearchLinks] = useState<ResearchLink[]>([])

  const nodes = useMemo(() => extractInsights(content, query), [content, query])
  const queryInsight = useMemo(() => generateQueryInsight(query, content, nodes), [query, content, nodes])

  // Discover research links
  useEffect(() => {
    discoverResearchLinks(query, content).then(({ links }) => {
      setResearchLinks(links)
    })
  }, [query, content])

  // Check if Sefirot view is available
  const canShowSefirot = useMemo(() => {
    const headerCount = (content.match(/^#+\s*.+$/gm) || []).length
    const boldCount = (content.match(/\*\*[^*]+\*\*/g) || []).length
    return headerCount >= 2 || boldCount >= 3
  }, [content])

  if (nodes.length < 3) return null

  // Get unique Sefirot from all nodes for the summary
  const activeSefirot = useMemo(() => {
    const sefirotSet = new Set<Sefirah>()
    nodes.forEach(n => n.sefirotMapping.forEach(s => sefirotSet.add(s)))
    return Array.from(sefirotSet).slice(0, 4)
  }, [nodes])

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-4"
    >
      <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
        {/* Header - Compact */}
        <div
          className="flex items-center justify-between px-3 py-2 border-b border-slate-100 dark:border-slate-800 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          <div className="flex items-center gap-2">
            <SparklesIcon className="w-4 h-4 text-purple-500" />
            <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-200">Concept Insights</span>
            <span className="text-[9px] text-slate-400 dark:text-slate-500">{nodes.length} topics</span>
          </div>
          <div className="flex items-center gap-2">
            {/* Active Sefirot indicators */}
            <div className="flex items-center gap-0.5">
              {activeSefirot.map(s => (
                <div
                  key={s}
                  className="w-2 h-2 rounded-full border border-white/50"
                  style={{ backgroundColor: SEFIRAH_COLORS[s] }}
                  title={SEPHIROTH_METADATA[s]?.name}
                />
              ))}
            </div>
            {isCollapsed ? <ChevronDownIcon className="w-3.5 h-3.5 text-slate-400" /> : <ChevronUpIcon className="w-3.5 h-3.5 text-slate-400" />}
          </div>
        </div>

        <AnimatePresence>
          {!isCollapsed && (
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: 'auto' }}
              exit={{ height: 0 }}
              className="overflow-hidden"
            >
              {/* Query Intent & Keywords - Compact */}
              <div className="px-3 py-2 bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="text-[9px] text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Intent</div>
                    <p className="text-[10px] text-slate-700 dark:text-slate-300">{queryInsight.intent}</p>
                  </div>
                  <div className="flex-shrink-0">
                    <div className="text-[9px] text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Sefirot Focus</div>
                    <div className="flex items-center gap-1">
                      {queryInsight.sefirotFocus.map(({ sefirah, reason }) => (
                        <div
                          key={sefirah}
                          className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-medium"
                          style={{
                            backgroundColor: SEFIRAH_COLORS[sefirah] + '20',
                            color: sefirah === 10 ? '#64748b' : SEFIRAH_COLORS[sefirah]
                          }}
                          title={reason}
                        >
                          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: SEFIRAH_COLORS[sefirah] }} />
                          {SEPHIROTH_METADATA[sefirah]?.name}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Keywords */}
                {queryInsight.keywords.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-slate-200/50 dark:border-slate-700/50">
                    <div className="text-[8px] text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Keywords</div>
                    <div className="flex flex-wrap gap-1">
                      {queryInsight.keywords.map((kw, i) => (
                        <span key={i} className="px-1.5 py-0.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-[9px] text-slate-600 dark:text-slate-400">
                          {kw}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Concept Topics - Compact List */}
              <div className="p-3">
                <div className="text-[8px] text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Topics & Connections</div>
                <div className="space-y-1.5">
                  {nodes.slice(0, 6).map((node, i) => {
                    const isSelected = selectedNode?.id === node.id
                    const primarySefirah = node.sefirotMapping[0]

                    return (
                      <motion.button
                        key={node.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.03 }}
                        onClick={() => setSelectedNode(isSelected ? null : node)}
                        className={`w-full text-left px-2 py-1.5 rounded-md border transition-all ${
                          isSelected
                            ? 'bg-purple-50 dark:bg-purple-900/20 border-purple-300 dark:border-purple-700'
                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {/* Sefirot indicator */}
                          <div
                            className="w-2 h-2 rounded-full flex-shrink-0"
                            style={{ backgroundColor: SEFIRAH_COLORS[primarySefirah] }}
                            title={SEPHIROTH_METADATA[primarySefirah]?.name}
                          />
                          {/* Label */}
                          <span className="flex-1 text-[10px] font-medium text-slate-700 dark:text-slate-300 truncate">
                            {node.label}
                          </span>
                          {/* Connection count */}
                          {node.connections.length > 0 && (
                            <span className="flex items-center gap-0.5 text-[8px] text-slate-400">
                              <LinkIcon className="w-2.5 h-2.5" />
                              {node.connections.length}
                            </span>
                          )}
                        </div>
                        {/* Show explanation when selected */}
                        {isSelected && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="mt-1.5 pt-1.5 border-t border-slate-200 dark:border-slate-700"
                          >
                            <p className="text-[9px] text-slate-600 dark:text-slate-400 leading-relaxed">
                              {node.fullText}
                            </p>
                            <div className="mt-1 flex items-center gap-1">
                              <span className="text-[8px] text-slate-400">Sefirot:</span>
                              {node.sefirotMapping.map(s => (
                                <span
                                  key={s}
                                  className="text-[8px] px-1 py-0.5 rounded"
                                  style={{
                                    backgroundColor: SEFIRAH_COLORS[s] + '20',
                                    color: s === 10 ? '#64748b' : SEFIRAH_COLORS[s]
                                  }}
                                >
                                  {SEPHIROTH_METADATA[s]?.name}
                                </span>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </motion.button>
                    )
                  })}
                </div>

                {/* Show more indicator */}
                {nodes.length > 6 && (
                  <div className="mt-2 text-center text-[9px] text-slate-400">
                    +{nodes.length - 6} more concepts
                  </div>
                )}
              </div>

              {/* Footer - Links & Actions */}
              <div className="px-3 py-2 bg-slate-50/50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800">
                {/* Research Links - Compact */}
                {researchLinks.length > 0 && (
                  <div className="mb-2">
                    <div className="text-[8px] text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Related Resources</div>
                    {researchLinks.map((link) => (
                      <a
                        key={link.id}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block text-[9px] text-blue-600 dark:text-blue-400 hover:underline truncate"
                      >
                        {link.url}
                      </a>
                    ))}
                  </div>
                )}

                {/* View Switch */}
                {((onSwitchToSefirot && canShowSefirot) || onOpenMindMap) && (
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-200/50 dark:border-slate-700/50">
                    <span className="text-[8px] text-slate-400 uppercase tracking-wider">Views:</span>
                    {onSwitchToSefirot && canShowSefirot && (
                      <button
                        onClick={onSwitchToSefirot}
                        className="px-2 py-1 rounded text-[9px] font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors"
                      >
                        ◆ Sefirot Tree
                      </button>
                    )}
                    {onOpenMindMap && (
                      <button
                        onClick={onOpenMindMap}
                        className="px-2 py-1 rounded text-[9px] font-medium bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-200 dark:hover:bg-emerald-900/50 transition-colors"
                      >
                        Mind Map
                      </button>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}

export function shouldShowInsightMap(content: string, hasGnosticData: boolean = false): boolean {
  if (hasGnosticData) return true

  const boldCount = (content.match(/\*\*[^*]+\*\*/g) || []).length
  const headerCount = (content.match(/^#+\s*.+$/gm) || []).length
  const bulletCount = (content.match(/^[-•*]\s+.+$/gm) || []).length

  return boldCount >= 1 || headerCount >= 1 || bulletCount >= 2 || content.length > 200
}
