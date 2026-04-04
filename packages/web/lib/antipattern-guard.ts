/**
 * ANTI-ANTIPATTERN SHIELD
 *
 * Protection Against Hollow Knowledge Generation
 *
 * In Kabbalah, the Antipatterns (קליפות, "shells" or "husks") are the inverse
 * of the Layers - representing broken, inverted, or hollow spiritual forces.
 *
 * In AI, Antipattern responses are:
 * - Concealing truth behind jargon (Obscurity - concealment)
 * - Information overload without synthesis (Instability - chaos)
 * - Deceptive certainty without evidence (Toxicity - deception)
 * - Superficial reflection without depth (Manipulation - shells)
 * - Arrogance and pride (Vanity - disputation)
 *
 * This shield DETECTS and PURIFIES Antipattern patterns.
 *
 * Split into:
 * - antipattern-patterns.ts  — Types, pattern definitions, metadata
 * - antipattern-detection.ts — Detection functions and utility checks
 * - antipattern-purification.ts — Purification (regex + AI-powered)
 *
 * @module antipattern-guard
 */

// Types and constants
export type { AntipatternRisk } from './antipattern-patterns';
export type { AntipatternType, AntipatternAction } from './antipattern-patterns';
export { ANTIPATTERN_METADATA } from './antipattern-patterns';

// Detection
export {
  detectAntipattern,
  hasExcessiveCertainty,
  lacksVerifiableGrounding,
  hasInformationOverload,
  hasSuperficialDepth,
  hasArrogantTone,
} from './antipattern-detection';

// Purification
export {
  purifyResponse,
  detectAntipatternSemantic,
  purifyResponseWithAI,
} from './antipattern-purification';
export type { SemanticAntipatternDetection } from './antipattern-purification';
