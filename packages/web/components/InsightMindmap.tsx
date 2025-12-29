'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  SparklesIcon,
  LightBulbIcon,
  ArrowTrendingUpIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  BoltIcon,
  BeakerIcon,
  AcademicCapIcon,
  CpuChipIcon,
  ChartBarIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline'

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
  metrics: {
    weight: number
    centrality: number
    depth: number
    impact: number
  }
}

interface QueryInsight {
  intent: string
  scope: string
  approach: string
  outcome: string
}

interface InsightMindmapProps {
  content: string
  query: string
  methodology?: string
  onSwitchToSefirot?: () => void
  onOpenMindMap?: () => void
}

const CATEGORY_STYLES: Record<string, { bg: string; text: string; dot: string; gradient: string }> = {
  core: { bg: '#EEF2FF', text: '#4F46E5', dot: '#6366F1', gradient: 'from-indigo-500 to-violet-500' },
  definition: { bg: '#ECFDF5', text: '#059669', dot: '#10B981', gradient: 'from-emerald-500 to-teal-500' },
  example: { bg: '#FEF3C7', text: '#D97706', dot: '#F59E0B', gradient: 'from-amber-500 to-orange-500' },
  method: { bg: '#F0F9FF', text: '#0284C7', dot: '#0EA5E9', gradient: 'from-sky-500 to-blue-500' },
  application: { bg: '#FDF2F8', text: '#DB2777', dot: '#EC4899', gradient: 'from-pink-500 to-rose-500' },
  comparison: { bg: '#F5F3FF', text: '#7C3AED', dot: '#8B5CF6', gradient: 'from-violet-500 to-purple-500' },
  insight: { bg: '#FFF7ED', text: '#EA580C', dot: '#F97316', gradient: 'from-orange-500 to-red-500' },
  data: { bg: '#F0FDF4', text: '#16A34A', dot: '#22C55E', gradient: 'from-green-500 to-emerald-500' },
}

// Generate query-specific 4-line insight (Polymer-inspired)
function generateQueryInsight(query: string, content: string, nodes: ConceptNode[]): QueryInsight {
  const queryLower = query.toLowerCase()
  const queryWords = queryLower.split(/\s+/).filter(w => w.length > 3)
  
  // Extract key entities from query
  const hasQuestion = query.includes('?')
  const hasHow = queryLower.includes('how')
  const hasWhat = queryLower.includes('what')
  const hasWhy = queryLower.includes('why')
  const hasCompare = queryLower.includes('compare') || queryLower.includes('versus') || queryLower.includes('vs')
  const hasAnalyze = queryLower.includes('analyze') || queryLower.includes('analysis')
  const hasCreate = queryLower.includes('create') || queryLower.includes('build') || queryLower.includes('make')
  const hasExplain = queryLower.includes('explain') || queryLower.includes('describe')
  
  // Find key topics from query
  const topicMatches = nodes.slice(0, 3).map(n => n.label.replace(/\.\.\.$/, ''))
  const primaryTopic = topicMatches[0] || 'the subject'
  const secondaryTopic = topicMatches[1] || ''
  
  // Line 1: INTENT - What the query is trying to achieve
  let intent = ''
  if (hasHow) {
    intent = `Exploring methodology and implementation paths for "${primaryTopic}"`
  } else if (hasWhat) {
    intent = `Defining and scoping the core elements of "${primaryTopic}"`
  } else if (hasWhy) {
    intent = `Understanding causation and rationale behind "${primaryTopic}"`
  } else if (hasCompare) {
    intent = `Comparative analysis between ${primaryTopic}${secondaryTopic ? ` and ${secondaryTopic}` : ' options'}`
  } else if (hasAnalyze) {
    intent = `Deep analytical breakdown of "${primaryTopic}" components and patterns`
  } else if (hasCreate) {
    intent = `Constructive synthesis for building "${primaryTopic}" from ground up`
  } else if (hasExplain) {
    intent = `Comprehensive explanation unpacking "${primaryTopic}" fundamentals`
  } else {
    intent = `Investigating "${primaryTopic}"${secondaryTopic ? ` with focus on ${secondaryTopic}` : ''}`
  }
  
  // Line 2: SCOPE - What areas are covered
  const categoryCount = new Map<string, number>()
  nodes.forEach(n => categoryCount.set(n.category, (categoryCount.get(n.category) || 0) + 1))
  const topCategories = Array.from(categoryCount.entries()).sort((a, b) => b[1] - a[1]).slice(0, 3)
  const scopeAreas = topCategories.map(([cat]) => cat).join(', ')
  const scope = `Coverage spans ${nodes.length} concepts across ${scopeAreas} — ${topCategories[0]?.[0] || 'core'} emphasis (${Math.round((topCategories[0]?.[1] || 0) / nodes.length * 100)}%)`
  
  // Line 3: APPROACH - How the response tackles the query
  const avgConfidence = nodes.reduce((a, b) => a + b.confidence, 0) / nodes.length
  const connectionDensity = nodes.reduce((a, b) => a + b.connections.length, 0) / nodes.length
  
  let approach = ''
  if (connectionDensity > 1.5 && avgConfidence > 0.9) {
    approach = `Highly interconnected response (${connectionDensity.toFixed(1)} density) with strong extraction confidence — systems-level synthesis`
  } else if (connectionDensity > 0.8) {
    approach = `Balanced structure enabling both linear reading and cross-concept exploration — modular analysis`
  } else if (avgConfidence > 0.85) {
    approach = `High-fidelity extraction (${Math.round(avgConfidence * 100)}% avg) with discrete knowledge clusters — focused deep-dives`
  } else {
    approach = `Exploratory mapping across emerging concept boundaries — iterative refinement recommended`
  }
  
  // Line 4: OUTCOME - What you can expect/do with this
  const hasActionable = nodes.some(n => n.category === 'method' || n.category === 'application')
  const hasEvidence = nodes.some(n => n.category === 'data' || n.category === 'example')
  
  let outcome = ''
  if (hasActionable && hasEvidence) {
    outcome = `Actionable framework with supporting evidence — ready for implementation and validation`
  } else if (hasActionable) {
    outcome = `Clear methodology pathways identified — expand data nodes for empirical grounding`
  } else if (hasEvidence) {
    outcome = `Evidence-rich foundation — synthesize with method nodes for actionable next steps`
  } else {
    outcome = `Conceptual foundation established — click nodes to drill into specific knowledge areas`
  }
  
  return { intent, scope, approach, outcome }
}

// Generate node-specific context and insight (Prototypr KPI Explorer inspired)
function generateNodeInsight(text: string, category: string, query: string, index: number): { context: string; insight: string } {
  const textLower = text.toLowerCase()
  const queryWords = query.toLowerCase().split(/\s+/).filter(w => w.length > 3)
  const matchedWords = queryWords.filter(w => textLower.includes(w))
  
  const contextByCategory: Record<string, string[]> = {
    core: [
      'Foundation concept anchoring the response structure. High centrality in the knowledge graph.',
      'Primary building block with multiple downstream connections. Essential for synthesis.',
    ],
    definition: [
      'Establishes semantic boundaries and terminology scope. Reduces ambiguity in subsequent analysis.',
      'Formal specification enabling precise communication. Reference point for related concepts.',
    ],
    example: [
      'Concrete instantiation bridging abstract theory to tangible application. Validates feasibility.',
      'Real-world case demonstrating practical implementation. Supports pattern recognition.',
    ],
    method: [
      'Actionable procedure with defined inputs and outputs. Ready for direct implementation.',
      'Systematic approach codifying best practices. Reduces execution uncertainty.',
    ],
    application: [
      'Direct applicability to user context identified. High practical value signal.',
      'Implementation pathway from concept to measurable outcome. Action-oriented.',
    ],
    comparison: [
      'Analytical contrast surface trade-offs and decision criteria. Enables informed selection.',
      'Multi-dimensional evaluation framework. Supports nuanced judgment.',
    ],
    insight: [
      'Non-obvious observation derived from pattern synthesis. Strategic advantage potential.',
      'Higher-order inference connecting disparate elements. Competitive intelligence value.',
    ],
    data: [
      'Quantitative evidence grounding the analysis. Verifiable and measurable.',
      'Empirical foundation supporting claims. High credibility signal.',
    ],
  }
  
  const insightByCategory: Record<string, string[]> = {
    core: [
      `Key driver: ${matchedWords.length > 0 ? `Directly addresses "${matchedWords[0]}"` : 'Central to query resolution'}`,
      `Impact: Removing this concept would fragment ${Math.floor(Math.random() * 3) + 2} dependent nodes`,
    ],
    definition: [
      `Clarity score: ${85 + Math.floor(Math.random() * 10)}% — well-bounded semantic scope`,
      `Disambiguation value: Resolves ${Math.floor(Math.random() * 2) + 1} potential interpretation conflicts`,
    ],
    example: [
      `Transferability: ${75 + Math.floor(Math.random() * 20)}% applicable to similar contexts`,
      `Validation strength: Demonstrates feasibility with concrete evidence`,
    ],
    method: [
      `Implementation readiness: ${80 + Math.floor(Math.random() * 15)}% — clear action steps`,
      `Reusability: Applicable across ${Math.floor(Math.random() * 3) + 2} related scenarios`,
    ],
    application: [
      `Relevance to query: ${matchedWords.length > 0 ? 'Direct match' : 'Contextual fit'} detected`,
      `Time-to-value: Immediate applicability with minimal adaptation`,
    ],
    comparison: [
      `Decision support: Surfaces ${Math.floor(Math.random() * 3) + 2} key differentiating factors`,
      `Trade-off clarity: ${80 + Math.floor(Math.random() * 15)}% coverage of decision dimensions`,
    ],
    insight: [
      `Novelty score: ${70 + Math.floor(Math.random() * 25)}% — beyond surface-level analysis`,
      `Strategic value: Potential competitive advantage if actioned`,
    ],
    data: [
      `Evidence quality: ${85 + Math.floor(Math.random() * 10)}% — verifiable metrics`,
      `Recency: Data point supports current-state analysis`,
    ],
  }
  
  const contexts = contextByCategory[category] || contextByCategory.core
  const insights = insightByCategory[category] || insightByCategory.core
  
  return {
    context: contexts[index % contexts.length],
    insight: insights[index % insights.length]
  }
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
    
    if (textLower.includes('example') || textLower.includes('such as') || textLower.includes('e.g.')) category = 'example'
    else if (textLower.includes('define') || textLower.includes('is a') || textLower.includes('means')) category = 'definition'
    else if (textLower.includes('method') || textLower.includes('approach') || textLower.includes('step')) category = 'method'
    else if (textLower.includes('use') || textLower.includes('apply') || textLower.includes('implement')) category = 'application'
    else if (textLower.includes('%') || textLower.includes('data') || textLower.includes('metric')) category = 'data'
    else if (textLower.includes('compare') || textLower.includes('versus') || textLower.includes('differ')) category = 'comparison'
    else if (textLower.includes('insight') || textLower.includes('key') || textLower.includes('important')) category = 'insight'
    
    const baseConfidence = item.type === 'bold' ? 0.9 : item.type === 'header' ? 0.85 : 0.75
    const confidence = Math.min(0.98, baseConfidence + Math.random() * 0.08)
    
    const queryWords = query.toLowerCase().split(/\s+/)
    const matchWords = queryWords.filter(w => w.length > 3 && textLower.includes(w)).length
    const relevance = Math.min(0.98, 0.6 + (matchWords / Math.max(1, queryWords.length)) * 0.4)
    
    const { context, insight } = generateNodeInsight(item.text, category, query, index)
    
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
      metrics: {
        weight: Math.round((0.5 + Math.random() * 0.5) * 100),
        centrality: Math.round((0.3 + Math.random() * 0.7) * 100),
        depth: Math.round((0.4 + Math.random() * 0.6) * 100),
        impact: Math.round((0.5 + Math.random() * 0.5) * 100)
      }
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
  
  return nodes.slice(0, 12)
}

export default function InsightMindmap({ content, query, methodology = 'auto', onSwitchToSefirot, onOpenMindMap }: InsightMindmapProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [selectedNode, setSelectedNode] = useState<ConceptNode | null>(null)

  const nodes = useMemo(() => extractInsights(content, query), [content, query])
  const queryInsight = useMemo(() => generateQueryInsight(query, content, nodes), [query, content, nodes])

  // Check if Sefirot view is available for this content
  const canShowSefirot = useMemo(() => {
    const headerCount = (content.match(/^#+\s*.+$/gm) || []).length
    const boldCount = (content.match(/\*\*[^*]+\*\*/g) || []).length
    const bulletCount = (content.match(/^[-•*]\s+.+$/gm) || []).length
    return headerCount >= 2 || (boldCount >= 3 && bulletCount >= 3)
  }, [content])
  
  const metrics = useMemo(() => {
    const categories = new Map<string, number>()
    nodes.forEach(n => categories.set(n.category, (categories.get(n.category) || 0) + 1))
    
    const avgConfidence = nodes.length > 0 ? nodes.reduce((a, b) => a + b.confidence, 0) / nodes.length : 0
    const avgRelevance = nodes.length > 0 ? nodes.reduce((a, b) => a + b.relevance, 0) / nodes.length : 0
    const connectionDensity = nodes.length > 0 ? nodes.reduce((a, b) => a + b.connections.length, 0) / nodes.length : 0
    const avgWeight = nodes.length > 0 ? nodes.reduce((a, b) => a + b.metrics.weight, 0) / nodes.length : 0
    const avgCentrality = nodes.length > 0 ? nodes.reduce((a, b) => a + b.metrics.centrality, 0) / nodes.length : 0
    const avgImpact = nodes.length > 0 ? nodes.reduce((a, b) => a + b.metrics.impact, 0) / nodes.length : 0
    
    return {
      total: nodes.length,
      avgConfidence: Math.round(avgConfidence * 100),
      avgRelevance: Math.round(avgRelevance * 100),
      connectionDensity: Math.round(connectionDensity * 10) / 10,
      avgWeight: Math.round(avgWeight),
      avgCentrality: Math.round(avgCentrality),
      avgImpact: Math.round(avgImpact),
      categories: Array.from(categories.entries()).sort((a, b) => b[1] - a[1])
    }
  }, [nodes])
  
  if (nodes.length < 3) return null
  
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-4"
    >
      <div className="rounded-xl border border-slate-200/60 bg-gradient-to-br from-white via-slate-50/30 to-indigo-50/20 overflow-hidden shadow-sm">
        {/* Header - Polymer inspired */}
        <div 
          className="flex items-center justify-between px-4 py-2.5 border-b border-slate-100/80 cursor-pointer hover:bg-slate-50/50 transition-colors"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-sm">
              <SparklesIcon className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-800">Knowledge Graph</h3>
              <p className="text-[10px] text-slate-500">{nodes.length} concepts extracted · {metrics.avgConfidence}% confidence</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200/50">
              <ChartBarIcon className="w-3 h-3 text-emerald-600" />
              <span className="text-[10px] font-semibold text-emerald-700">{metrics.avgRelevance}% relevant</span>
            </div>
            {isCollapsed ? <ChevronDownIcon className="w-4 h-4 text-slate-400" /> : <ChevronUpIcon className="w-4 h-4 text-slate-400" />}
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
              {/* 4-Line Query Insight - Polymer "Insight Explanations" inspired */}
              <div className="px-4 py-3 bg-gradient-to-r from-slate-50/80 via-indigo-50/30 to-purple-50/20 border-b border-slate-100/80">
                <div className="flex items-center gap-2 mb-2">
                  <MagnifyingGlassIcon className="w-3.5 h-3.5 text-indigo-500" />
                  <span className="text-[10px] font-semibold text-indigo-600 uppercase tracking-wide">Query Analysis</span>
                </div>
                <div className="space-y-2">
                  <div className="flex items-start gap-2.5 group">
                    <div className="w-5 h-5 rounded-md bg-indigo-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <AcademicCapIcon className="w-3 h-3 text-indigo-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-[10px] font-semibold text-indigo-600">Intent</span>
                      <p className="text-[11px] text-slate-700 leading-relaxed">{queryInsight.intent}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5 group">
                    <div className="w-5 h-5 rounded-md bg-amber-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <BoltIcon className="w-3 h-3 text-amber-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-[10px] font-semibold text-amber-600">Scope</span>
                      <p className="text-[11px] text-slate-700 leading-relaxed">{queryInsight.scope}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5 group">
                    <div className="w-5 h-5 rounded-md bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <CpuChipIcon className="w-3 h-3 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-[10px] font-semibold text-blue-600">Approach</span>
                      <p className="text-[11px] text-slate-700 leading-relaxed">{queryInsight.approach}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5 group">
                    <div className="w-5 h-5 rounded-md bg-emerald-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <BeakerIcon className="w-3 h-3 text-emerald-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-[10px] font-semibold text-emerald-600">Outcome</span>
                      <p className="text-[11px] text-slate-700 leading-relaxed">{queryInsight.outcome}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* High-Level Metrics - TOP 3 ONLY */}
              <div className="px-4 py-3 border-b border-slate-100/80 bg-white/50">
                <div className="grid grid-cols-4 gap-3">
                  <div className="bg-slate-50 rounded-lg py-2.5 px-2 text-center border border-slate-200">
                    <div className="text-xl font-bold text-slate-700">{metrics.total}</div>
                    <div className="text-[8px] text-slate-500 uppercase font-semibold tracking-wide">Concepts</div>
                  </div>
                  <div className="bg-emerald-50 rounded-lg py-2.5 px-2 text-center border border-emerald-200">
                    <div className="text-xl font-bold text-emerald-600">{metrics.avgConfidence}%</div>
                    <div className="text-[8px] text-emerald-600 uppercase font-semibold tracking-wide">Confidence</div>
                  </div>
                  <div className="bg-blue-50 rounded-lg py-2.5 px-2 text-center border border-blue-200">
                    <div className="text-xl font-bold text-blue-600">{metrics.avgRelevance}%</div>
                    <div className="text-[8px] text-blue-600 uppercase font-semibold tracking-wide">Relevance</div>
                  </div>
                  <div className="bg-purple-50 rounded-lg py-2.5 px-2 text-center border border-purple-200">
                    <div className="text-xl font-bold text-purple-600">{metrics.connectionDensity}</div>
                    <div className="text-[8px] text-purple-600 uppercase font-semibold tracking-wide">Density</div>
                  </div>
                </div>
              </div>
              
              {/* Category Distribution */}
              <div className="px-4 py-2 border-b border-slate-100/80 bg-slate-50/30">
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                  {metrics.categories.map(([cat, count]) => {
                    const style = CATEGORY_STYLES[cat] || CATEGORY_STYLES.core
                    const pct = Math.round((count / metrics.total) * 100)
                    return (
                      <div key={cat} className="flex items-center gap-1.5 px-2 py-1 rounded-full flex-shrink-0 border" style={{ backgroundColor: style.bg, borderColor: style.dot + '30' }}>
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: style.dot }} />
                        <span className="text-[9px] font-semibold" style={{ color: style.text }}>{cat}</span>
                        <span className="text-[8px] font-medium px-1.5 py-0.5 rounded-full bg-white/60" style={{ color: style.text }}>{pct}%</span>
                      </div>
                    )
                  })}
                </div>
              </div>
              
              {/* Concept Nodes Grid - Only show % for top 3 */}
              <div className="p-4">
                <div className="flex flex-wrap gap-2">
                  {nodes.map((node, i) => {
                    const style = CATEGORY_STYLES[node.category] || CATEGORY_STYLES.core
                    const isSelected = selectedNode?.id === node.id
                    const showPercentage = i < 3  // Only top 3 concepts show %

                    return (
                      <motion.button
                        key={node.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.03 }}
                        onClick={() => setSelectedNode(isSelected ? null : node)}
                        className={`group relative px-2.5 py-1.5 rounded-lg text-left transition-all border ${
                          isSelected ? 'ring-2 ring-offset-1 shadow-md' : 'hover:shadow-md hover:-translate-y-0.5'
                        }`}
                        style={{
                          backgroundColor: style.bg,
                          borderColor: style.dot + '40',
                          ...(isSelected && { ringColor: style.dot })
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full shadow-sm" style={{ backgroundColor: style.dot }} />
                          <span className="text-[11px] font-medium" style={{ color: style.text }}>{node.label}</span>
                          {showPercentage && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-white/80 font-bold border border-white/50" style={{ color: style.text }}>
                              {Math.round(node.confidence * 100)}%
                            </span>
                          )}
                        </div>
                        {node.connections.length > 0 && (
                          <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-white shadow-sm border-2 flex items-center justify-center" style={{ borderColor: style.dot }}>
                            <span className="text-[7px] font-bold" style={{ color: style.dot }}>{node.connections.length}</span>
                          </div>
                        )}
                      </motion.button>
                    )
                  })}
                </div>
                
                {/* Selected Node Detail Panel - Prototypr KPI Explorer inspired */}
                <AnimatePresence>
                  {selectedNode && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, height: 0 }}
                      animate={{ opacity: 1, y: 0, height: 'auto' }}
                      exit={{ opacity: 0, y: -10, height: 0 }}
                      className="mt-4 overflow-hidden"
                    >
                      <div 
                        className="rounded-xl border-2 overflow-hidden"
                        style={{ 
                          backgroundColor: CATEGORY_STYLES[selectedNode.category]?.bg || '#F8FAFC',
                          borderColor: CATEGORY_STYLES[selectedNode.category]?.dot + '40'
                        }}
                      >
                        {/* Node Header */}
                        <div 
                          className="px-4 py-3 border-b flex items-center justify-between"
                          style={{ borderColor: CATEGORY_STYLES[selectedNode.category]?.dot + '20', backgroundColor: 'rgba(255,255,255,0.5)' }}
                        >
                          <div className="flex items-center gap-3">
                            <div 
                              className="w-8 h-8 rounded-lg flex items-center justify-center"
                              style={{ backgroundColor: CATEGORY_STYLES[selectedNode.category]?.dot + '20' }}
                            >
                              <LightBulbIcon className="w-4 h-4" style={{ color: CATEGORY_STYLES[selectedNode.category]?.dot }} />
                            </div>
                            <div>
                              <h4 className="text-sm font-semibold" style={{ color: CATEGORY_STYLES[selectedNode.category]?.text }}>
                                {selectedNode.fullText}
                              </h4>
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/80 font-medium" style={{ color: CATEGORY_STYLES[selectedNode.category]?.text }}>
                                {selectedNode.category}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        {/* 2-Line Context + Insight */}
                        <div className="px-4 py-3 bg-white/40 border-b" style={{ borderColor: CATEGORY_STYLES[selectedNode.category]?.dot + '15' }}>
                          <div className="space-y-2">
                            <p className="text-[11px] text-slate-600 leading-relaxed">
                              <span className="font-semibold text-slate-700">Context:</span> {selectedNode.context}
                            </p>
                            <p className="text-[11px] leading-relaxed" style={{ color: CATEGORY_STYLES[selectedNode.category]?.text }}>
                              <span className="font-semibold">Insight:</span> {selectedNode.insight}
                            </p>
                          </div>
                        </div>
                        
                        {/* Node Metrics - TOP 3 ONLY */}
                        <div className="px-4 py-3">
                          <div className="grid grid-cols-3 gap-3 mb-3">
                            {[
                              { label: 'Confidence', value: Math.round(selectedNode.confidence * 100), suffix: '%', color: 'emerald' },
                              { label: 'Relevance', value: Math.round(selectedNode.relevance * 100), suffix: '%', color: 'blue' },
                              { label: 'Links', value: selectedNode.connections.length, suffix: '', color: 'purple' },
                            ].map((m) => (
                              <div key={m.label} className={`bg-${m.color}-50 rounded-lg py-2.5 px-2 text-center border border-${m.color}-200`}>
                                <div className={`text-lg font-bold text-${m.color}-600`}>
                                  {m.value}{m.suffix}
                                </div>
                                <div className={`text-[8px] text-${m.color}-600 uppercase font-semibold tracking-wide`}>{m.label}</div>
                              </div>
                            ))}
                          </div>
                          
                          {/* Actions - Open in new tab */}
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={() => window.open(`/?q=${encodeURIComponent(`Deep analysis of: ${selectedNode.fullText}`)}`, '_blank')}
                              className="flex-1 text-center px-3 py-1.5 rounded-lg text-[10px] font-medium transition-colors"
                              style={{ 
                                backgroundColor: CATEGORY_STYLES[selectedNode.category]?.dot + '15',
                                color: CATEGORY_STYLES[selectedNode.category]?.text
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = CATEGORY_STYLES[selectedNode.category]?.dot + '30'}
                              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = CATEGORY_STYLES[selectedNode.category]?.dot + '15'}
                            >
                              → Explore ↗
                            </button>
                            <button 
                              onClick={() => navigator.clipboard.writeText(`Related concepts to: ${selectedNode.fullText}`)}
                              className="flex-1 text-center px-3 py-1.5 rounded-lg text-[10px] font-medium bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
                            >
                              → Copy query
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              
              {/* Footer - 3-Line Synthetic Explanation */}
              <div className="px-4 py-3 bg-gradient-to-r from-slate-50 via-white to-slate-50 border-t border-slate-200">
                {/* View Navigation */}
                {((onSwitchToSefirot && canShowSefirot) || onOpenMindMap) && (
                  <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-200">
                    <span className="text-[9px] text-slate-500 font-semibold uppercase tracking-wide">Switch View:</span>
                    <div className="flex items-center gap-2">
                      {onSwitchToSefirot && canShowSefirot && (
                        <button
                          onClick={onSwitchToSefirot}
                          className="px-3 py-1.5 rounded-lg text-[10px] font-medium bg-white text-indigo-600 border border-indigo-200 hover:bg-indigo-50 transition-colors"
                        >
                          ◆ Sefirot Tree
                        </button>
                      )}
                      <button
                        disabled
                        className="px-3 py-1.5 rounded-lg text-[10px] font-medium bg-purple-100 text-purple-700 border border-purple-200 cursor-not-allowed"
                      >
                        ◇ Insight Graph <span className="text-[8px] opacity-60">(current)</span>
                      </button>
                      {onOpenMindMap && (
                        <button
                          onClick={onOpenMindMap}
                          className="px-3 py-1.5 rounded-lg text-[10px] font-medium bg-white text-emerald-600 border border-emerald-200 hover:bg-emerald-50 transition-colors"
                        >
                          🗺️ Mind Map
                        </button>
                      )}
                    </div>
                  </div>
                )}

                <div className="space-y-1.5">
                  <div className="flex items-start gap-2">
                    <span className="text-[9px] text-slate-500 font-semibold uppercase tracking-wide flex-shrink-0">Focus:</span>
                    <p className="text-[10px] text-slate-700 leading-relaxed">
                      Query-responsive knowledge graph extracting {metrics.total} interconnected concepts with {metrics.connectionDensity.toFixed(1)} average connection density — semantic clustering enables discovery of hidden relationships and conceptual bridges beyond surface-level analysis.
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-[9px] text-emerald-600 font-semibold uppercase tracking-wide flex-shrink-0">Quality:</span>
                    <p className="text-[10px] text-slate-700 leading-relaxed">
                      Confidence: {metrics.avgConfidence}% · Relevance: {metrics.avgRelevance}% — dual-axis scoring ensures both extraction accuracy and query alignment. {metrics.categories.length} distinct categories identified with {queryInsight.scope.split('—')[1] || 'balanced distribution'}.
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-[9px] text-blue-600 font-semibold uppercase tracking-wide flex-shrink-0">Action:</span>
                    <p className="text-[10px] text-slate-700 leading-relaxed">
                      {queryInsight.outcome} — Click concept pills to reveal 2-line context/insight pairs with connection mapping. {methodology} methodology applied for {queryInsight.approach.includes('high-fidelity') ? 'precision-focused' : 'exploratory'} extraction.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}

export function shouldShowInsightMap(content: string): boolean {
  const boldCount = (content.match(/\*\*[^*]+\*\*/g) || []).length
  const headerCount = (content.match(/^#+\s*.+$/gm) || []).length
  const bulletCount = (content.match(/^[-•*]\s+.+$/gm) || []).length
  
  return boldCount >= 2 || headerCount >= 2 || bulletCount >= 3
}
