/**
 * Antipattern System
 *
 * Anti-patterns represent imbalanced or distorted expressions of AI processing layers.
 * Heritage: Inspired by Kabbalistic Antipatterns - the "shells" or shadows of the Layers.
 * This module provides tools for detecting shadow activations
 * and generating annotations.
 */

// Types
export type {
  Antipattern,
  AntipatternReport,
  AntipatternConfig,
  ShadowActivation,
  WeightRecommendation,
  ProcessingPath,
  GuardAnalysis,
} from './types'

// Mapping
export {
  ANTIPATTERN_MAP,
  getAntipatternBySephirah,
  getAntipatternByName,
  getAllAntipatterns,
} from './mapping'

// Report Generation
export { generateAntipatternReport } from './generate-report'

// Formatting
export {
  formatGnosticAnnotation,
  formatCompactAnnotation,
  formatConsoleAnnotation,
  formatJSONAnnotation,
} from './format-annotation'
