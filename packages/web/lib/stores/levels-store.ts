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
// UTILITIES (extracted to levels-utils.ts)
// ═══════════════════════════════════════════════════════════════════
import {
  generateId,
  calculateDataPercent,
  calculateConfidence,
  extractKeyMetrics,
  calculateLayerCorrelations,
  calculateCategoryBreakdown,
  generateMindmapData,
} from './levels-utils'

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
