/**
 * Grounding Guard Module
 *
 * "Cognitive Immune System" for multi-AI conversations
 *
 * @packageDocumentation
 */

// Main orchestrator
export { GroundingGuard } from './GroundingGuard.js';

// Types
export type {
  Message,
  GroundingConfig,
  GroundingAlert,
  GroundingResult,
  AlertType,
  AlertSeverity,
  TriggerConfig,
  TriggerPriority,
} from './types.js';

export { DEFAULT_GROUNDING_CONFIG, DEFAULT_TRIGGER_CONFIG } from './types.js';

// Individual detectors (for advanced usage)
export { detectHype } from './detectors/HypeDetector.js';
export { detectEcho, clearEmbeddingCache } from './detectors/EchoDetector.js';
export { detectDrift } from './detectors/DriftDetector.js';
export {
  detectFactuality,
  checkFactualityServiceHealth,
  configureFactualityService,
} from './detectors/FactualityDetector.js';
