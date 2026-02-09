/**
 * Antipattern System Types
 *
 * Anti-patterns represent imbalanced or distorted expressions of each AI processing layer.
 * Heritage: Inspired by Kabbalistic Antipatterns concept - the "shells" or shadows of the Layers.
 */

import { Layer } from '@/lib/layer-registry'

/**
 * An Antipattern monitor - the shadow of a processing Layer
 * Heritage: Antipattern (singular of Antipatterns)
 */
export interface Antipattern {
  id: number
  name: string
  hebrewName: string
  meaning: string
  sephirah: Layer
  layerName: string
  aiManifestation: string
  triggers: string[]
  suppressionStrategies: string[]
}

/**
 * Shadow activation in a response
 */
export interface ShadowActivation {
  antipattern: string
  sephirah: string
  reason: string
  intensity: number // 0-1
}

/**
 * Weight adjustment recommendation
 */
export interface WeightRecommendation {
  suggestion: string
  adjustWeight: {
    sephirah: number
    delta: number // positive = increase, negative = decrease
  }
}

/**
 * Processing path analysis
 */
export interface ProcessingPath {
  inputComplexity: number
  dominantSephirah: string
  activeLenses: string[]
  methodologyUsed: string
  weightInfluenceRatio: number
}

/**
 * Guard analysis results
 */
export interface GuardAnalysis {
  driftScore: number
  hypeScore: number
  hallucinationRisk: number
}

/**
 * Complete Antipattern Report
 * Generated after each response to provide annotation
 * Heritage: AntipatternReport
 */
export interface AntipatternReport {
  processingPath: ProcessingPath
  guardAnalysis: GuardAnalysis
  shadowsActivated: ShadowActivation[]
  recommendations: WeightRecommendation[]
  overallHealth: 'balanced' | 'minor_imbalance' | 'significant_imbalance' | 'critical'
  timestamp: number
}

/**
 * Antipattern configuration for a user
 * Heritage: AntipatternConfig
 */
export interface AntipatternConfig {
  suppressionLevels: Record<number, number> // antipattern id -> suppression level (0-1)
  autoAdjust: boolean // auto-adjust weights based on shadows
  notifyOnActivation: boolean // show warning when shadows activate
}
