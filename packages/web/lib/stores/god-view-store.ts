/**
 * God View Store
 * State management for the God View panel and live activation data.
 * Fed by SSE metadata during query processing.
 */

import { create } from 'zustand'
import { Layer } from '@/lib/layer-registry'

export interface GodViewPathActivation {
  from: Layer
  to: Layer
  strength: number
}

export interface GodViewActivationData {
  layerWeights: Record<Layer, number>
  dominantLayers: Layer[]
  pathActivations: GodViewPathActivation[]
  guardReasons: string[]
  methodology: string | null
  confidence: number
  processingMode: string | null
}

export interface GodViewState {
  // Panel UI
  panelOpen: boolean
  togglePanel: () => void
  openPanel: () => void
  closePanel: () => void

  // Live activation data (updated during SSE streaming)
  activations: GodViewActivationData
  isProcessing: boolean

  // Actions
  setActivations: (data: Partial<GodViewActivationData>) => void
  setProcessing: (v: boolean) => void
  resetActivations: () => void
}

const EMPTY_ACTIVATIONS: GodViewActivationData = {
  layerWeights: {
    [Layer.EMBEDDING]: 0,
    [Layer.EXECUTOR]: 0,
    [Layer.CLASSIFIER]: 0,
    [Layer.GENERATIVE]: 0,
    [Layer.ATTENTION]: 0,
    [Layer.DISCRIMINATOR]: 0,
    [Layer.EXPANSION]: 0,
    [Layer.ENCODER]: 0,
    [Layer.REASONING]: 0,
    [Layer.META_CORE]: 0,
    [Layer.SYNTHESIS]: 0,
  } as Record<Layer, number>,
  dominantLayers: [],
  pathActivations: [],
  guardReasons: [],
  methodology: null,
  confidence: 0,
  processingMode: null,
}

export const useGodViewStore = create<GodViewState>((set) => ({
  panelOpen: false,
  togglePanel: () => set((s) => ({ panelOpen: !s.panelOpen })),
  openPanel: () => set({ panelOpen: true }),
  closePanel: () => set({ panelOpen: false }),

  activations: { ...EMPTY_ACTIVATIONS },
  isProcessing: false,

  setActivations: (data) =>
    set((s) => ({
      activations: { ...s.activations, ...data },
    })),

  setProcessing: (v) => set({ isProcessing: v }),

  resetActivations: () =>
    set({ activations: { ...EMPTY_ACTIVATIONS }, isProcessing: false }),
}))
