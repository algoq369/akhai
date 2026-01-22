/**
 * Qlipoth System
 *
 * The Qlipoth are the "shells" or shadows of the Sephiroth.
 * This module provides tools for detecting shadow activations
 * and generating gnostic annotations.
 */

// Types
export type {
  Qlipah,
  QlipothReport,
  QlipothConfig,
  ShadowActivation,
  WeightRecommendation,
  ProcessingPath,
  GuardAnalysis,
} from './types'

// Mapping
export {
  QLIPOTH_MAP,
  getQlipahBySephirah,
  getQlipahByName,
  getAllQlipoth,
} from './mapping'

// Report Generation
export { generateQlipothReport } from './generate-report'

// Formatting
export {
  formatGnosticAnnotation,
  formatCompactAnnotation,
  formatConsoleAnnotation,
  formatJSONAnnotation,
} from './format-annotation'
