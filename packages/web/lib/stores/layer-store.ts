import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Layer, LAYER_METADATA } from '@/lib/layer-registry'
import { getDefaultWeights, type PresetName } from '@/lib/layer-presets'

/**
 * Processing mode for layer configuration
 */
type ProcessingMode = 'weighted' | 'parallel' | 'adaptive'

/**
 * Weight history snapshot
 */
interface WeightSnapshot {
  timestamp: number
  weights: Record<number, number>
  preset?: string
}

/**
 * Layer State Interface
 * Manages computational layer configuration across all components
 */
interface LayerState {
  /** Weight for each layer (0.0 to 1.0) */
  weights: Record<number, number>

  /** Weight history over time (max 100 snapshots) */
  weightHistory: WeightSnapshot[]

  /** Anti-pattern suppression levels (0.0 to 1.0) */
  antipatternSuppression: Record<number, number>

  /** Processing mode */
  processingMode: ProcessingMode

  /** Currently active preset name */
  activePreset: string | null

  /** Per-layer comments/notes */
  comments: Record<number, string>

  /** Custom AI skills per layer (future feature) */
  customSkills: Record<number, any[]>

  /** Workflow mode: Auto (AI-selected) or Manual (user-configured) */
  workflowMode: 'auto' | 'manual'

  /** Last methodology used (for Auto mode tracking) */
  lastMethodologyUsed: string | null

  /** Methodology selection metadata (reasoning, weights snapshot) */
  methodologyMetadata: any | null

  /** Show processing annotation in responses */
  showProcessingAnnotation: boolean

  // Actions
  /** Set weight for a specific layer */
  setWeight: (layerNode: number, weight: number) => void

  /** Set anti-pattern suppression level */
  setAntipatternSuppression: (id: number, suppression: number) => void

  /** Set processing mode */
  setProcessingMode: (mode: ProcessingMode) => void

  /** Set active preset name */
  setActivePreset: (name: string | null) => void

  /** Apply a preset configuration */
  applyPreset: (weights: Record<number, number>, name: string) => void

  /** Reset all to defaults */
  resetToDefaults: () => void

  /** Set comment for a specific layer */
  setLayerComment: (layerNode: number, comment: string) => void

  /** Set workflow mode */
  setWorkflowMode: (mode: 'auto' | 'manual') => void

  /** Set methodology metadata (Auto mode selection info) */
  setMethodologyMetadata: (metadata: any) => void

  /** Toggle processing annotation display */
  setShowProcessingAnnotation: (show: boolean) => void
}

/**
 * Default weights - from shared presets (balanced)
 */
const defaultWeights: Record<number, number> = getDefaultWeights()

/**
 * Layer Store
 *
 * Zustand store with localStorage persistence for computational layer configuration.
 * Shared across LayerConsole and LayerDashboard components.
 */
export const useLayerStore = create<LayerState>()(
  persist(
    (set) => ({
      weights: defaultWeights,
      weightHistory: [],
      antipatternSuppression: {},
      processingMode: 'weighted',
      activePreset: 'balanced' as PresetName | null,
      comments: {},
      customSkills: {},
      workflowMode: 'auto',
      lastMethodologyUsed: null,
      methodologyMetadata: null,
      showProcessingAnnotation: true,

      setWeight: (layerNode, weight) =>
        set((state) => {
          const newWeights = { ...state.weights, [layerNode]: weight }
          const newHistory = [
            ...state.weightHistory,
            {
              timestamp: Date.now(),
              weights: newWeights,
              preset: state.activePreset || undefined
            }
          ].slice(-100) // Keep last 100 snapshots

          return {
            weights: newWeights,
            weightHistory: newHistory,
            activePreset: null // Clear preset when manually adjusted
          }
        }),

      setAntipatternSuppression: (id, suppression) =>
        set((state) => ({
          antipatternSuppression: { ...state.antipatternSuppression, [id]: suppression }
        })),

      setProcessingMode: (mode) => set({ processingMode: mode }),

      setActivePreset: (name) => set({ activePreset: name }),

      applyPreset: (weights, name) =>
        set((state) => ({
          weights,
          activePreset: name,
          weightHistory: [
            ...state.weightHistory,
            {
              timestamp: Date.now(),
              weights,
              preset: name
            }
          ].slice(-100)
        })),

      resetToDefaults: () =>
        set({
          weights: defaultWeights,
          weightHistory: [],
          antipatternSuppression: {},
          processingMode: 'weighted',
          activePreset: 'balanced',
          comments: {},
          customSkills: {},
          workflowMode: 'auto',
          lastMethodologyUsed: null,
          methodologyMetadata: null,
          showProcessingAnnotation: true
        }),

      setLayerComment: (layerNode, comment) =>
        set((state) => ({
          comments: { ...state.comments, [layerNode]: comment }
        })),

      setWorkflowMode: (mode) => set({ workflowMode: mode }),

      setMethodologyMetadata: (metadata) =>
        set({
          methodologyMetadata: metadata,
          lastMethodologyUsed: metadata?.methodology || null
        }),

      setShowProcessingAnnotation: (show) => set({ showProcessingAnnotation: show })
    }),
    {
      name: 'layer-config',
      version: 5,
      migrate: (persistedState: any, version: number) => {
        // Migrate from older versions
        const state = persistedState as Partial<LayerState>

        // v5: migrate from layers-config localStorage key and renamed fields
        if (typeof window !== 'undefined' && version < 5) {
          const oldData = localStorage.getItem('layers-config')
          if (oldData) {
            try {
              const parsed = JSON.parse(oldData)
              const oldState = parsed.state || parsed
              // Migrate renamed fields
              if (oldState.antipatternSuppression && !oldState.antipatternSuppression) {
                oldState.antipatternSuppression = oldState.antipatternSuppression
                delete oldState.antipatternSuppression
              }
              if (oldState.showGnosticAnnotation !== undefined && oldState.showProcessingAnnotation === undefined) {
                oldState.showProcessingAnnotation = oldState.showGnosticAnnotation
                delete oldState.showGnosticAnnotation
              }
              // Migrate old action names
              if (oldState.setAntipatternsSuppression) delete oldState.setAntipatternsSuppression
              if (oldState.setLayerComment) delete oldState.setLayerComment
              if (oldState.setShowGnosticAnnotation) delete oldState.setShowGnosticAnnotation
              localStorage.removeItem('layers-config')
              Object.assign(state, oldState)
            } catch { /* fall through to defaults */ }
          }
        }

        // Ensure all required fields exist with defaults
        return {
          weights: state.weights ?? defaultWeights,
          weightHistory: state.weightHistory ?? [],
          antipatternSuppression: state.antipatternSuppression ?? {},
          processingMode: state.processingMode ?? 'weighted',
          activePreset: state.activePreset ?? 'balanced',
          comments: state.comments ?? {},
          customSkills: state.customSkills ?? {},
          workflowMode: state.workflowMode ?? 'auto',
          lastMethodologyUsed: state.lastMethodologyUsed ?? null,
          methodologyMetadata: state.methodologyMetadata ?? null,
          showProcessingAnnotation: state.showProcessingAnnotation ?? true,
        }
      }
    }
  )
)

