import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/**
 * LEVELS STORE
 *
 * Manages conversation levels for the multi-level UI architecture.
 * Each level represents a query-response pair with associated metadata.
 */

// ═══════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════

/**
 * Insight extracted from a level's response
 */
export interface LevelInsight {
  id: string
  text: string
  category: 'strategy' | 'action' | 'data' | 'insight'
  dataPercent: number
  confidence: number
  metrics?: string[]
  phase?: number
  accuracyPercent?: number
  confidencePercent?: number
  metricsCount?: number
}

/**
 * Connection between elements across levels
 */
export interface LevelConnection {
  id: string
  fromLevelId: string
  fromElementId: string
  fromElementType: 'response' | 'insight' | 'layer'
  toLevelId: string
  toElementId: string
  toElementType: 'response' | 'insight' | 'layer'
}

/**
 * Layer correlation for AI Layers view
 */
export interface LayerCorrelation {
  layerA: number
  layerB: number
  strength: 'strong' | 'moderate' | 'weak'
  description: string
  correlation: number
}

/**
 * Node for Mindmap view
 */
export interface MindmapNode {
  id: string
  label: string
  type: 'query' | 'concept' | 'insight' | 'data'
  x: number
  y: number
  cluster?: string
  parentId?: string
}

/**
 * Edge for Mindmap view
 */
export interface MindmapEdge {
  id: string
  from: string
  to: string
  type: 'branch' | 'relation' | 'sequence'
}

/**
 * A single conversation level
 */
export interface Level {
  id: string
  number: number
  query: string
  response: string
  timestamp: Date
  methodology: string

  // AI Layers view data
  activeLayerWeights: Record<number, number> // layer id -> activation %
  layerCorrelations: LayerCorrelation[]
  dominantLayer: number | null

  // Insights view data
  insights: LevelInsight[]
  categoryBreakdown: { strategy: number; insight: number; data: number; action: number }
  semanticConnections: number
  dataPoints: number

  // Trees view data
  detectedAntiPatterns: string[]

  // Mindmap view data
  mindmapNodes: MindmapNode[]
  mindmapEdges: MindmapEdge[]

  // General metrics
  keyMetrics: string[]
  dataPercent: number
  confidence: number
}

/**
 * Levels Store State
 */
interface LevelsState {
  /** All conversation levels */
  levels: Level[]

  /** Connections between elements across levels */
  connections: LevelConnection[]

  /** Currently focused level ID */
  currentLevelId: string | null

  /** Add a new level with query, returns level ID */
  addLevel: (query: string, methodology: string) => string

  /** Update level with response and extracted insights */
  updateLevelResponse: (
    levelId: string,
    response: string,
    insights: LevelInsight[],
    activeWeights: Record<number, number>
  ) => void

  /** Add a connection between elements */
  addConnection: (connection: Omit<LevelConnection, 'id'>) => void

  /** Remove a connection */
  removeConnection: (connectionId: string) => void

  /** Set the current focused level */
  setCurrentLevel: (levelId: string | null) => void

  /** Get a level by ID */
  getLevelById: (levelId: string) => Level | undefined

  /** Get connections for a specific level */
  getConnectionsForLevel: (levelId: string) => LevelConnection[]

  /** Clear all levels and connections */
  clearAll: () => void

  /** Remove a specific level */
  removeLevel: (levelId: string) => void
}

// ═══════════════════════════════════════════════════════════════════
// UTILITIES
// ═══════════════════════════════════════════════════════════════════

/**
 * Generate a unique ID
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}

/**
 * Calculate data percent from response content
 */
function calculateDataPercent(response: string): number {
  // Count numbers, percentages, metrics in response
  const numberMatches = response.match(/\d+(\.\d+)?%?/g) || []
  const metricsMatches = response.match(/\b(increase|decrease|growth|decline|rate|ratio|average|total|sum|count)\b/gi) || []

  const dataIndicators = numberMatches.length + metricsMatches.length
  const words = response.split(/\s+/).length

  // Normalize to 0-100 scale
  return Math.min(100, Math.round((dataIndicators / Math.max(words, 1)) * 500))
}

/**
 * Calculate confidence from response structure
 */
function calculateConfidence(response: string, insights: LevelInsight[]): number {
  // Base confidence on response length and structure
  const hasHeaders = /^#+\s/m.test(response)
  const hasBullets = /^[-*•]\s/m.test(response)
  const hasNumbers = /\d/.test(response)
  const insightCount = insights.length

  let confidence = 50 // Base
  if (hasHeaders) confidence += 15
  if (hasBullets) confidence += 10
  if (hasNumbers) confidence += 10
  confidence += Math.min(15, insightCount * 3)

  return Math.min(100, confidence)
}

/**
 * Extract key metrics from response
 */
function extractKeyMetrics(response: string): string[] {
  const metrics: string[] = []

  // Match patterns like "X%" or "$X" or "X units"
  const percentMatches = response.match(/\d+(\.\d+)?%/g) || []
  const dollarMatches = response.match(/\$[\d,]+(\.\d+)?/g) || []
  const numberWithUnit = response.match(/\d+(\.\d+)?\s*(users|customers|items|orders|views|clicks|days|hours|minutes)/gi) || []

  metrics.push(...percentMatches.slice(0, 3))
  metrics.push(...dollarMatches.slice(0, 2))
  metrics.push(...numberWithUnit.slice(0, 2))

  return [...new Set(metrics)].slice(0, 5) // Unique, max 5
}

/**
 * Calculate layer correlations from active weights
 */
function calculateLayerCorrelations(
  weights: Record<number, number>
): LayerCorrelation[] {
  const LAYER_NAMES: Record<number, string> = {
    10: 'meta-cognition',
    9: 'first-principles',
    8: 'pattern-recognition',
    7: 'expansion',
    6: 'critical-analysis',
    5: 'synthesis',
    4: 'persistence',
    3: 'communication',
    2: 'foundation',
    1: 'manifestation',
  }

  // Get top 3 active layers
  const sortedLayers = Object.entries(weights)
    .map(([id, weight]) => ({ layerId: parseInt(id), weight }))
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 3)

  const correlations: LayerCorrelation[] = []

  for (let i = 0; i < sortedLayers.length - 1; i++) {
    for (let j = i + 1; j < sortedLayers.length; j++) {
      const a = sortedLayers[i]
      const b = sortedLayers[j]
      const combined = (a.weight + b.weight) * 50 // Convert to percentage

      correlations.push({
        layerA: a.layerId,
        layerB: b.layerId,
        strength: combined > 75 ? 'strong' : combined > 50 ? 'moderate' : 'weak',
        description: `${LAYER_NAMES[a.layerId] || `L${a.layerId}`} + ${LAYER_NAMES[b.layerId] || `L${b.layerId}`}`,
        correlation: Math.round(combined),
      })
    }
  }

  return correlations
}

/**
 * Calculate category breakdown from insights
 */
function calculateCategoryBreakdown(
  insights: LevelInsight[]
): { strategy: number; insight: number; data: number; action: number } {
  const breakdown = { strategy: 0, insight: 0, data: 0, action: 0 }
  insights.forEach((i) => {
    if (i.category in breakdown) {
      breakdown[i.category as keyof typeof breakdown]++
    }
  })
  return breakdown
}

/**
 * Generate mindmap nodes and edges from insights
 */
function generateMindmapData(
  query: string,
  insights: LevelInsight[]
): { nodes: MindmapNode[]; edges: MindmapEdge[] } {
  const nodes: MindmapNode[] = [
    {
      id: 'query',
      label: query.length > 25 ? query.slice(0, 25) + '...' : query,
      type: 'query',
      x: 200,
      y: 30,
    },
  ]

  const count = Math.min(insights.length, 8)
  insights.slice(0, 8).forEach((insight, idx) => {
    const angle = (idx / count) * Math.PI * 2 - Math.PI / 2
    const radius = 100
    nodes.push({
      id: insight.id,
      label: insight.text.length > 25 ? insight.text.slice(0, 25) + '...' : insight.text,
      type: insight.category === 'data' ? 'data' : 'concept',
      x: 200 + Math.cos(angle) * radius,
      y: 150 + Math.sin(angle) * radius,
      parentId: 'query',
      cluster: insight.category,
    })
  })

  const edges: MindmapEdge[] = nodes
    .filter((n) => n.parentId)
    .map((n) => ({
      id: `edge-${n.id}`,
      from: n.parentId!,
      to: n.id,
      type: 'branch' as const,
    }))

  return { nodes, edges }
}

// ═══════════════════════════════════════════════════════════════════
// STORE
// ═══════════════════════════════════════════════════════════════════

export const useLevelsStore = create<LevelsState>()(
  persist(
    (set, get) => ({
      levels: [],
      connections: [],
      currentLevelId: null,

      addLevel: (query: string, methodology: string) => {
        const id = generateId()
        const newLevel: Level = {
          id,
          number: get().levels.length + 1,
          query,
          response: '',
          timestamp: new Date(),
          methodology,
          // AI Layers view
          activeLayerWeights: {},
          layerCorrelations: [],
          dominantLayer: null,
          // Insights view
          insights: [],
          categoryBreakdown: { strategy: 0, insight: 0, data: 0, action: 0 },
          semanticConnections: 0,
          dataPoints: 0,
          // Trees view
          detectedAntiPatterns: [],
          // Mindmap view
          mindmapNodes: [],
          mindmapEdges: [],
          // General metrics
          keyMetrics: [],
          dataPercent: 0,
          confidence: 0,
        }

        set((state) => ({
          levels: [...state.levels, newLevel],
          currentLevelId: id,
        }))

        return id
      },

      updateLevelResponse: (
        levelId: string,
        response: string,
        insights: LevelInsight[],
        activeWeights: Record<number, number>
      ) => {
        // Calculate derived data
        const layerCorrelations = calculateLayerCorrelations(activeWeights)
        const categoryBreakdown = calculateCategoryBreakdown(insights)
        const { nodes: mindmapNodes, edges: mindmapEdges } = generateMindmapData(
          get().levels.find((l) => l.id === levelId)?.query || '',
          insights
        )

        // Find dominant layer (highest weight)
        const dominantLayer = Object.entries(activeWeights).length > 0
          ? parseInt(
              Object.entries(activeWeights).sort(([, a], [, b]) => b - a)[0]?.[0] || '0'
            )
          : null

        // Count data points (numbers, percentages, metrics)
        const dataPoints = (response.match(/\d+(\.\d+)?%?|\$[\d,]+/g) || []).length

        set((state) => ({
          levels: state.levels.map((level) =>
            level.id === levelId
              ? {
                  ...level,
                  response,
                  // AI Layers view
                  activeLayerWeights: activeWeights,
                  layerCorrelations,
                  dominantLayer,
                  // Insights view
                  insights,
                  categoryBreakdown,
                  semanticConnections: Math.min(insights.length - 1, 5), // Simplified
                  dataPoints,
                  // Mindmap view
                  mindmapNodes,
                  mindmapEdges,
                  // General metrics
                  keyMetrics: extractKeyMetrics(response),
                  dataPercent: calculateDataPercent(response),
                  confidence: calculateConfidence(response, insights),
                }
              : level
          ),
        }))
      },

      addConnection: (connection: Omit<LevelConnection, 'id'>) => {
        const newConnection: LevelConnection = {
          ...connection,
          id: generateId()
        }

        set((state) => ({
          connections: [...state.connections, newConnection]
        }))
      },

      removeConnection: (connectionId: string) => {
        set((state) => ({
          connections: state.connections.filter((c) => c.id !== connectionId)
        }))
      },

      setCurrentLevel: (levelId: string | null) => {
        set({ currentLevelId: levelId })
      },

      getLevelById: (levelId: string) => {
        return get().levels.find((l) => l.id === levelId)
      },

      getConnectionsForLevel: (levelId: string) => {
        return get().connections.filter(
          (c) => c.fromLevelId === levelId || c.toLevelId === levelId
        )
      },

      clearAll: () => {
        set({
          levels: [],
          connections: [],
          currentLevelId: null
        })
      },

      removeLevel: (levelId: string) => {
        set((state) => {
          // Remove level
          const newLevels = state.levels
            .filter((l) => l.id !== levelId)
            .map((l, idx) => ({ ...l, number: idx + 1 })) // Re-number

          // Remove connections involving this level
          const newConnections = state.connections.filter(
            (c) => c.fromLevelId !== levelId && c.toLevelId !== levelId
          )

          return {
            levels: newLevels,
            connections: newConnections,
            currentLevelId:
              state.currentLevelId === levelId
                ? newLevels.length > 0
                  ? newLevels[newLevels.length - 1].id
                  : null
                : state.currentLevelId
          }
        })
      }
    }),
    {
      name: 'akhai-levels',
      version: 2, // Bump for new Level structure
      // Custom serialization for Date objects
      partialize: (state) => ({
        levels: state.levels.map((l) => ({
          ...l,
          timestamp: l.timestamp.toISOString()
        })),
        connections: state.connections,
        currentLevelId: state.currentLevelId
      }),
      // Custom deserialization for Date objects
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.levels = state.levels.map((l: any) => ({
            ...l,
            timestamp: new Date(l.timestamp)
          }))
        }
      }
    }
  )
)

export default useLevelsStore
