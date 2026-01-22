import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Sefirah, SEPHIROTH_METADATA } from '@/lib/ascent-tracker'
import { getDefaultWeights, type PresetName } from '@/lib/sefirot-presets'

/**
 * Processing mode for Sefirot configuration
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
 * Sefirot State Interface
 * Manages Tree of Life configuration across all components
 */
interface SefirotState {
  /** Weight for each Sefirah (0.0 to 1.0) */
  weights: Record<number, number>

  /** Weight history over time (max 100 snapshots) */
  weightHistory: WeightSnapshot[]

  /** Qliphoth suppression levels (0.0 to 1.0) */
  qliphothSuppression: Record<number, number>

  /** Processing mode */
  processingMode: ProcessingMode

  /** Currently active preset name */
  activePreset: string | null

  /** Per-Sefirah comments/notes */
  comments: Record<number, string>

  /** Custom AI skills per Sefirah (future feature) */
  customSkills: Record<number, any[]>

  /** Workflow mode: Auto (AI-selected) or Manual (user-configured) */
  workflowMode: 'auto' | 'manual'

  /** Last methodology used (for Auto mode tracking) */
  lastMethodologyUsed: string | null

  /** Methodology selection metadata (reasoning, weights snapshot) */
  methodologyMetadata: any | null

  /** Show gnostic annotation in responses */
  showGnosticAnnotation: boolean

  // Actions
  /** Set weight for a specific Sefirah */
  setWeight: (sefirah: number, weight: number) => void

  /** Set Qliphoth suppression for a specific Qliphah */
  setQliphothSuppression: (id: number, suppression: number) => void

  /** Set processing mode */
  setProcessingMode: (mode: ProcessingMode) => void

  /** Set active preset name */
  setActivePreset: (name: string | null) => void

  /** Apply a preset configuration */
  applyPreset: (weights: Record<number, number>, name: string) => void

  /** Reset all to defaults */
  resetToDefaults: () => void

  /** Set comment for a specific Sefirah */
  setSefirahComment: (sefirah: number, comment: string) => void

  /** Set workflow mode */
  setWorkflowMode: (mode: 'auto' | 'manual') => void

  /** Set methodology metadata (Auto mode selection info) */
  setMethodologyMetadata: (metadata: any) => void

  /** Toggle gnostic annotation display */
  setShowGnosticAnnotation: (show: boolean) => void
}

/**
 * Default weights - from shared presets (balanced)
 */
const defaultWeights: Record<number, number> = getDefaultWeights()

/**
 * Sefirot Store
 *
 * Zustand store with localStorage persistence for Tree of Life configuration.
 * Shared across SefirotConsole and SefirotDashboard components.
 */
export const useSefirotStore = create<SefirotState>()(
  persist(
    (set) => ({
      weights: defaultWeights,
      weightHistory: [],
      qliphothSuppression: {},
      processingMode: 'weighted',
      activePreset: 'balanced' as PresetName | null,
      comments: {},
      customSkills: {},
      workflowMode: 'auto',
      lastMethodologyUsed: null,
      methodologyMetadata: null,
      showGnosticAnnotation: true,

      setWeight: (sefirah, weight) =>
        set((state) => {
          const newWeights = { ...state.weights, [sefirah]: weight }
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

      setQliphothSuppression: (id, suppression) =>
        set((state) => ({
          qliphothSuppression: { ...state.qliphothSuppression, [id]: suppression }
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
          qliphothSuppression: {},
          processingMode: 'weighted',
          activePreset: 'balanced',
          comments: {},
          customSkills: {},
          workflowMode: 'auto',
          lastMethodologyUsed: null,
          methodologyMetadata: null,
          showGnosticAnnotation: true
        }),

      setSefirahComment: (sefirah, comment) =>
        set((state) => ({
          comments: { ...state.comments, [sefirah]: comment }
        })),

      setWorkflowMode: (mode) => set({ workflowMode: mode }),

      setMethodologyMetadata: (metadata) =>
        set({
          methodologyMetadata: metadata,
          lastMethodologyUsed: metadata?.methodology || null
        }),

      setShowGnosticAnnotation: (show) => set({ showGnosticAnnotation: show })
    }),
    {
      name: 'sefirot-config',
      version: 4, // Incremented for showGnosticAnnotation
      migrate: (persistedState: any, version: number) => {
        // Handle migrations from older versions
        const state = persistedState as Partial<SefirotState>

        // Migrate from v0-3 to v4: add showGnosticAnnotation
        if (version < 4) {
          state.showGnosticAnnotation = true
        }

        // Ensure all required fields exist with defaults
        return {
          weights: state.weights ?? defaultWeights,
          weightHistory: state.weightHistory ?? [],
          qliphothSuppression: state.qliphothSuppression ?? {},
          processingMode: state.processingMode ?? 'weighted',
          activePreset: state.activePreset ?? 'balanced',
          comments: state.comments ?? {},
          customSkills: state.customSkills ?? {},
          workflowMode: state.workflowMode ?? 'auto',
          lastMethodologyUsed: state.lastMethodologyUsed ?? null,
          methodologyMetadata: state.methodologyMetadata ?? null,
          showGnosticAnnotation: state.showGnosticAnnotation ?? true,
        }
      }
    }
  )
)
