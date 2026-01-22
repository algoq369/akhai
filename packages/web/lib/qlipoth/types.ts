/**
 * Qlipoth System Types
 *
 * The Qlipoth are the "shells" or shadows of the Sephiroth.
 * They represent imbalanced or distorted expressions of each divine quality.
 */

import { Sefirah } from '@/lib/ascent-tracker'

/**
 * A Qlipah (singular of Qlipoth) - the shadow of a Sephirah
 */
export interface Qlipah {
  id: number
  name: string
  hebrewName: string
  meaning: string
  sephirah: Sefirah
  sephirahName: string
  aiManifestation: string
  triggers: string[]
  suppressionStrategies: string[]
}

/**
 * Shadow activation in a response
 */
export interface ShadowActivation {
  qlipah: string
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
 * Complete Qlipoth Report
 * Generated after each response to provide gnostic annotation
 */
export interface QlipothReport {
  processingPath: ProcessingPath
  guardAnalysis: GuardAnalysis
  shadowsActivated: ShadowActivation[]
  recommendations: WeightRecommendation[]
  overallHealth: 'balanced' | 'minor_imbalance' | 'significant_imbalance' | 'critical'
  timestamp: number
}

/**
 * Qlipoth configuration for a user
 */
export interface QlipothConfig {
  suppressionLevels: Record<number, number> // qlipah id -> suppression level (0-1)
  autoAdjust: boolean // auto-adjust weights based on shadows
  notifyOnActivation: boolean // show warning when shadows activate
}
