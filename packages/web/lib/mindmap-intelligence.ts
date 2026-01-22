/**
 * MIND MAP INTELLIGENCE INTEGRATION
 *
 * Connects Intelligence Fusion data to Mind Map visualization:
 * - Extract nodes from intelligence.analysis.keywords
 * - Color nodes by dominant Sefirot activation
 * - Size nodes by relevance score
 * - Create edges between related topics
 *
 * @module mindmap-intelligence
 */

import { Sefirah } from './ascent-tracker'
import { IntelligenceFusionResult, SefirotActivation } from './intelligence-fusion'

// ============================================================
// SEFIROT COLOR MAPPING (Traditional Kabbalistic Colors)
// ============================================================

export const SEFIROT_COLORS: Record<Sefirah, { primary: string; secondary: string; name: string }> = {
  [Sefirah.KETHER]: { primary: '#FFFFFF', secondary: '#FFD700', name: 'Crown' },      // White/Gold
  [Sefirah.CHOKMAH]: { primary: '#808080', secondary: '#A9A9A9', name: 'Wisdom' },    // Grey
  [Sefirah.BINAH]: { primary: '#1a1a1a', secondary: '#2d2d2d', name: 'Understanding' }, // Black (adjusted for visibility)
  [Sefirah.CHESED]: { primary: '#0066FF', secondary: '#3388FF', name: 'Mercy' },      // Blue
  [Sefirah.GEVURAH]: { primary: '#FF3333', secondary: '#FF6666', name: 'Severity' },  // Red
  [Sefirah.TIFERET]: { primary: '#FFD700', secondary: '#FFEB3B', name: 'Beauty' },    // Yellow/Gold
  [Sefirah.NETZACH]: { primary: '#00DD00', secondary: '#44FF44', name: 'Victory' },   // Green
  [Sefirah.HOD]: { primary: '#FF8C00', secondary: '#FFA500', name: 'Glory' },         // Orange
  [Sefirah.YESOD]: { primary: '#8B008B', secondary: '#9932CC', name: 'Foundation' },  // Purple
  [Sefirah.MALKUTH]: { primary: '#8B4513', secondary: '#A0522D', name: 'Kingdom' },   // Brown/Earth
  [Sefirah.DAAT]: { primary: '#C0C0C0', secondary: '#D3D3D3', name: 'Knowledge' },    // Silver (hidden)
}

// ============================================================
// TYPES
// ============================================================

export interface IntelligenceNode {
  id: string
  label: string
  type: 'query' | 'keyword' | 'topic' | 'sefirah'
  size: number                    // 10-50 based on relevance
  color: string                   // Sefirot-based color
  borderColor: string             // Secondary Sefirot color
  dominantSefirah: Sefirah | null
  sefirotActivations: Partial<Record<Sefirah, number>>
  metadata: {
    queryId?: string
    tokens?: number
    methodology?: string
    timestamp?: number
    relevanceScore: number
    keywords?: string[]
  }
}

export interface IntelligenceEdge {
  id: string
  source: string
  target: string
  weight: number                  // 0-1 topic relevance
  type: 'query-topic' | 'topic-topic' | 'keyword-topic' | 'sefirot-path'
  color: string                   // Based on Sefirot path
  animated: boolean               // Animate active paths
}

export interface IntelligenceMindMapData {
  nodes: IntelligenceNode[]
  edges: IntelligenceEdge[]
  clusters: IntelligenceCluster[]
  metadata: {
    totalQueries: number
    totalTokens: number
    dominantSefirot: Sefirah[]
    methodologyBreakdown: Record<string, number>
    generatedAt: number
  }
}

export interface IntelligenceCluster {
  id: string
  sefirah: Sefirah
  name: string
  color: string
  nodeIds: string[]
  center?: { x: number; y: number }
}

// ============================================================
// CORE FUNCTIONS
// ============================================================

/**
 * Get color for a node based on its dominant Sefirah activation
 */
export function getSefirotColor(
  activations: Partial<Record<Sefirah, number>> | SefirotActivation[] | Record<number, number>
): { primary: string; secondary: string; dominant: Sefirah | null } {
  // Convert array to record if needed
  let activationMap: Record<number, number> = {}

  if (Array.isArray(activations)) {
    activations.forEach(a => {
      activationMap[a.sefirah] = a.effectiveWeight || a.activation
    })
  } else {
    activationMap = activations as Record<number, number>
  }

  // Find dominant Sefirah
  let maxActivation = 0
  let dominant: Sefirah | null = null

  for (const [sefirah, activation] of Object.entries(activationMap)) {
    const sefirahNum = parseInt(sefirah) as Sefirah
    if (activation > maxActivation) {
      maxActivation = activation
      dominant = sefirahNum
    }
  }

  if (dominant !== null && SEFIROT_COLORS[dominant]) {
    return {
      primary: SEFIROT_COLORS[dominant].primary,
      secondary: SEFIROT_COLORS[dominant].secondary,
      dominant
    }
  }

  // Default to Malkuth (grounding)
  return {
    primary: SEFIROT_COLORS[Sefirah.MALKUTH].primary,
    secondary: SEFIROT_COLORS[Sefirah.MALKUTH].secondary,
    dominant: Sefirah.MALKUTH
  }
}

/**
 * Calculate node size based on relevance and token usage
 */
export function calculateNodeSize(
  relevance: number,
  tokens: number = 0,
  baseSize: number = 20
): number {
  // Size range: 10-50
  const relevanceBoost = relevance * 20
  const tokenBoost = Math.min(15, Math.log10(tokens + 1) * 5)
  return Math.min(50, Math.max(10, baseSize + relevanceBoost + tokenBoost))
}

/**
 * Extract intelligence nodes from a query response
 */
export function extractIntelligenceNodes(
  queryId: string,
  query: string,
  intelligence: IntelligenceFusionResult,
  tokens: number = 0
): IntelligenceNode[] {
  const nodes: IntelligenceNode[] = []

  // Create query node
  const sefirotActivationMap: Partial<Record<Sefirah, number>> = {}
  intelligence.sefirotActivations.forEach(a => {
    sefirotActivationMap[a.sefirah] = a.effectiveWeight
  })

  const queryColor = getSefirotColor(sefirotActivationMap)

  nodes.push({
    id: `query-${queryId}`,
    label: query.length > 50 ? query.substring(0, 47) + '...' : query,
    type: 'query',
    size: calculateNodeSize(1, tokens, 30),
    color: queryColor.primary,
    borderColor: queryColor.secondary,
    dominantSefirah: queryColor.dominant,
    sefirotActivations: sefirotActivationMap,
    metadata: {
      queryId,
      tokens,
      methodology: intelligence.selectedMethodology,
      timestamp: intelligence.timestamp,
      relevanceScore: 1,
      keywords: intelligence.analysis.keywords
    }
  })

  // Create keyword nodes
  intelligence.analysis.keywords.forEach((keyword, index) => {
    const keywordId = `keyword-${queryId}-${index}`
    const relevance = 1 - (index * 0.1) // First keyword = 1, decreasing

    nodes.push({
      id: keywordId,
      label: keyword,
      type: 'keyword',
      size: calculateNodeSize(relevance, 0, 15),
      color: queryColor.primary,
      borderColor: queryColor.secondary,
      dominantSefirah: queryColor.dominant,
      sefirotActivations: sefirotActivationMap,
      metadata: {
        relevanceScore: relevance,
        queryId
      }
    })
  })

  return nodes
}

/**
 * Create edges between nodes based on relationships
 */
export function createIntelligenceEdges(
  nodes: IntelligenceNode[],
  pathActivations: Array<{ from: Sefirah; to: Sefirah; weight: number }>
): IntelligenceEdge[] {
  const edges: IntelligenceEdge[] = []
  const queryNodes = nodes.filter(n => n.type === 'query')
  const keywordNodes = nodes.filter(n => n.type === 'keyword')

  // Connect queries to their keywords
  queryNodes.forEach(query => {
    const queryKeywords = keywordNodes.filter(k =>
      k.metadata.queryId === query.metadata.queryId
    )

    queryKeywords.forEach(keyword => {
      edges.push({
        id: `edge-${query.id}-${keyword.id}`,
        source: query.id,
        target: keyword.id,
        weight: keyword.metadata.relevanceScore,
        type: 'query-topic',
        color: query.color,
        animated: false
      })
    })
  })

  // Connect queries with shared keywords (topic-topic)
  for (let i = 0; i < queryNodes.length; i++) {
    for (let j = i + 1; j < queryNodes.length; j++) {
      const query1 = queryNodes[i]
      const query2 = queryNodes[j]

      // Check for shared keywords
      const keywords1 = new Set(query1.metadata.keywords || [])
      const keywords2 = query2.metadata.keywords || []
      const shared = keywords2.filter(k => keywords1.has(k))

      if (shared.length > 0) {
        const weight = shared.length / Math.max(keywords1.size, keywords2.length)

        edges.push({
          id: `edge-${query1.id}-${query2.id}`,
          source: query1.id,
          target: query2.id,
          weight,
          type: 'topic-topic',
          color: blendColors(query1.color, query2.color),
          animated: weight > 0.5
        })
      }
    }
  }

  // Add Sefirot path edges if significant
  pathActivations.forEach(path => {
    if (path.weight > 0.3) {
      const fromColor = SEFIROT_COLORS[path.from]
      const toColor = SEFIROT_COLORS[path.to]

      edges.push({
        id: `sefirot-path-${path.from}-${path.to}`,
        source: `sefirah-${path.from}`,
        target: `sefirah-${path.to}`,
        weight: path.weight,
        type: 'sefirot-path',
        color: blendColors(fromColor.primary, toColor.primary),
        animated: true
      })
    }
  })

  return edges
}

/**
 * Cluster nodes by dominant Sefirah
 */
export function clusterBySefirot(nodes: IntelligenceNode[]): IntelligenceCluster[] {
  const clusters: Map<Sefirah, IntelligenceCluster> = new Map()

  nodes.forEach(node => {
    if (node.dominantSefirah === null) return

    const sefirah = node.dominantSefirah
    if (!clusters.has(sefirah)) {
      clusters.set(sefirah, {
        id: `cluster-${sefirah}`,
        sefirah,
        name: SEFIROT_COLORS[sefirah]?.name || 'Unknown',
        color: SEFIROT_COLORS[sefirah]?.primary || '#888888',
        nodeIds: []
      })
    }

    clusters.get(sefirah)!.nodeIds.push(node.id)
  })

  return Array.from(clusters.values())
}

/**
 * Build complete mind map data from query history with intelligence
 */
export function buildIntelligenceMindMap(
  queries: Array<{
    id: string
    query: string
    intelligence: IntelligenceFusionResult | null
    tokens: number
  }>
): IntelligenceMindMapData {
  const allNodes: IntelligenceNode[] = []
  const methodologyBreakdown: Record<string, number> = {}
  let totalTokens = 0
  const allPathActivations: Array<{ from: Sefirah; to: Sefirah; weight: number }> = []

  // Process each query
  queries.forEach(({ id, query, intelligence, tokens }) => {
    if (!intelligence) return

    // Extract nodes
    const nodes = extractIntelligenceNodes(id, query, intelligence, tokens)
    allNodes.push(...nodes)

    // Track methodology
    const method = intelligence.selectedMethodology
    methodologyBreakdown[method] = (methodologyBreakdown[method] || 0) + 1

    // Track tokens
    totalTokens += tokens

    // Collect path activations
    allPathActivations.push(...intelligence.pathActivations)
  })

  // Create edges
  const edges = createIntelligenceEdges(allNodes, allPathActivations)

  // Create clusters
  const clusters = clusterBySefirot(allNodes)

  // Find dominant Sefirot across all queries
  const sefirotCounts: Record<number, number> = {}
  allNodes.forEach(node => {
    if (node.dominantSefirah !== null) {
      sefirotCounts[node.dominantSefirah] = (sefirotCounts[node.dominantSefirah] || 0) + 1
    }
  })

  const dominantSefirot = Object.entries(sefirotCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([s]) => parseInt(s) as Sefirah)

  return {
    nodes: allNodes,
    edges,
    clusters,
    metadata: {
      totalQueries: queries.length,
      totalTokens,
      dominantSefirot,
      methodologyBreakdown,
      generatedAt: Date.now()
    }
  }
}

// ============================================================
// REAL-TIME UPDATE FUNCTIONS
// ============================================================

/**
 * Add a new query to existing mind map data (incremental update)
 */
export function addQueryToMindMap(
  existingData: IntelligenceMindMapData,
  queryId: string,
  query: string,
  intelligence: IntelligenceFusionResult,
  tokens: number
): IntelligenceMindMapData {
  // Extract new nodes
  const newNodes = extractIntelligenceNodes(queryId, query, intelligence, tokens)

  // Merge with existing nodes
  const allNodes = [...existingData.nodes, ...newNodes]

  // Recreate edges with new nodes
  const allPathActivations = intelligence.pathActivations
  const edges = createIntelligenceEdges(allNodes, allPathActivations)

  // Update clusters
  const clusters = clusterBySefirot(allNodes)

  // Update methodology breakdown
  const methodologyBreakdown = { ...existingData.metadata.methodologyBreakdown }
  methodologyBreakdown[intelligence.selectedMethodology] =
    (methodologyBreakdown[intelligence.selectedMethodology] || 0) + 1

  return {
    nodes: allNodes,
    edges,
    clusters,
    metadata: {
      totalQueries: existingData.metadata.totalQueries + 1,
      totalTokens: existingData.metadata.totalTokens + tokens,
      dominantSefirot: existingData.metadata.dominantSefirot, // Recalculate if needed
      methodologyBreakdown,
      generatedAt: Date.now()
    }
  }
}

// ============================================================
// EXPORT FUNCTIONS
// ============================================================

/**
 * Export mind map data as JSON
 */
export function exportMindMapJSON(data: IntelligenceMindMapData): string {
  return JSON.stringify(data, null, 2)
}

/**
 * Import mind map data from JSON
 */
export function importMindMapJSON(json: string): IntelligenceMindMapData | null {
  try {
    const data = JSON.parse(json)
    // Validate structure
    if (!data.nodes || !data.edges || !data.metadata) {
      return null
    }
    return data as IntelligenceMindMapData
  } catch {
    return null
  }
}

/**
 * Generate shareable summary of mind map
 */
export function generateMindMapSummary(data: IntelligenceMindMapData): string {
  const dominantNames = data.metadata.dominantSefirot
    .map(s => SEFIROT_COLORS[s]?.name || 'Unknown')
    .join(', ')

  const methodologies = Object.entries(data.metadata.methodologyBreakdown)
    .sort((a, b) => b[1] - a[1])
    .map(([m, count]) => `${m}: ${count}`)
    .join(', ')

  return `
AkhAI Mind Map Summary
======================
Generated: ${new Date(data.metadata.generatedAt).toISOString()}

Statistics:
- Total Queries: ${data.metadata.totalQueries}
- Total Tokens: ${data.metadata.totalTokens.toLocaleString()}
- Nodes: ${data.nodes.length}
- Edges: ${data.edges.length}
- Clusters: ${data.clusters.length}

Dominant Sefirot: ${dominantNames}

Methodology Usage: ${methodologies}

Clusters:
${data.clusters.map(c => `- ${c.name}: ${c.nodeIds.length} nodes`).join('\n')}
`.trim()
}

// ============================================================
// UTILITY FUNCTIONS
// ============================================================

/**
 * Blend two hex colors
 */
function blendColors(color1: string, color2: string): string {
  const hex1 = color1.replace('#', '')
  const hex2 = color2.replace('#', '')

  const r1 = parseInt(hex1.substring(0, 2), 16)
  const g1 = parseInt(hex1.substring(2, 4), 16)
  const b1 = parseInt(hex1.substring(4, 6), 16)

  const r2 = parseInt(hex2.substring(0, 2), 16)
  const g2 = parseInt(hex2.substring(2, 4), 16)
  const b2 = parseInt(hex2.substring(4, 6), 16)

  const r = Math.round((r1 + r2) / 2)
  const g = Math.round((g1 + g2) / 2)
  const b = Math.round((b1 + b2) / 2)

  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
}

/**
 * Generate SVG for mind map export
 */
export function generateMindMapSVG(
  data: IntelligenceMindMapData,
  width: number = 800,
  height: number = 600
): string {
  // Simple force-directed layout positions
  const positions = calculateNodePositions(data.nodes, data.edges, width, height)

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="3" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>
  <rect width="100%" height="100%" fill="#0f172a"/>
  `

  // Draw edges
  data.edges.forEach(edge => {
    const sourcePos = positions.get(edge.source)
    const targetPos = positions.get(edge.target)
    if (sourcePos && targetPos) {
      const opacity = Math.max(0.2, edge.weight)
      svg += `  <line x1="${sourcePos.x}" y1="${sourcePos.y}" x2="${targetPos.x}" y2="${targetPos.y}" stroke="${edge.color}" stroke-width="${1 + edge.weight * 2}" stroke-opacity="${opacity}"/>\n`
    }
  })

  // Draw nodes
  data.nodes.forEach(node => {
    const pos = positions.get(node.id)
    if (pos) {
      const radius = node.size / 2
      svg += `  <circle cx="${pos.x}" cy="${pos.y}" r="${radius}" fill="${node.color}" stroke="${node.borderColor}" stroke-width="2" filter="url(#glow)"/>\n`
      // Add label
      svg += `  <text x="${pos.x}" y="${pos.y + radius + 12}" text-anchor="middle" fill="#94a3b8" font-size="10">${escapeXml(node.label.substring(0, 20))}</text>\n`
    }
  })

  svg += '</svg>'
  return svg
}

/**
 * Simple force-directed layout calculation
 */
function calculateNodePositions(
  nodes: IntelligenceNode[],
  edges: IntelligenceEdge[],
  width: number,
  height: number
): Map<string, { x: number; y: number }> {
  const positions = new Map<string, { x: number; y: number }>()

  // Initial random positions
  nodes.forEach(node => {
    positions.set(node.id, {
      x: Math.random() * (width - 100) + 50,
      y: Math.random() * (height - 100) + 50
    })
  })

  // Simple force simulation (10 iterations)
  for (let iter = 0; iter < 10; iter++) {
    // Repulsion between all nodes
    nodes.forEach(node1 => {
      nodes.forEach(node2 => {
        if (node1.id === node2.id) return

        const pos1 = positions.get(node1.id)!
        const pos2 = positions.get(node2.id)!

        const dx = pos2.x - pos1.x
        const dy = pos2.y - pos1.y
        const dist = Math.max(1, Math.sqrt(dx * dx + dy * dy))

        const force = 500 / (dist * dist)
        pos1.x -= (dx / dist) * force
        pos1.y -= (dy / dist) * force
      })
    })

    // Attraction along edges
    edges.forEach(edge => {
      const pos1 = positions.get(edge.source)
      const pos2 = positions.get(edge.target)
      if (!pos1 || !pos2) return

      const dx = pos2.x - pos1.x
      const dy = pos2.y - pos1.y
      const dist = Math.sqrt(dx * dx + dy * dy)

      const force = dist * 0.01 * edge.weight
      pos1.x += (dx / dist) * force
      pos1.y += (dy / dist) * force
      pos2.x -= (dx / dist) * force
      pos2.y -= (dy / dist) * force
    })

    // Keep nodes in bounds
    nodes.forEach(node => {
      const pos = positions.get(node.id)!
      pos.x = Math.max(50, Math.min(width - 50, pos.x))
      pos.y = Math.max(50, Math.min(height - 50, pos.y))
    })
  }

  return positions
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}
