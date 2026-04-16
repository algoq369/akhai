/**
 * Detection patterns for depth annotations — barrel file.
 * Category-specific patterns are in patterns-general.ts, patterns-tech.ts, patterns-science.ts
 */

import { GENERAL_PATTERNS, type DetectionPattern } from './patterns-general';
import { TECH_PATTERNS } from './patterns-tech';
import { SCIENCE_PATTERNS } from './patterns-science';

const DETECTION_PATTERNS: DetectionPattern[] = [
  ...GENERAL_PATTERNS,
  ...TECH_PATTERNS,
  ...SCIENCE_PATTERNS,
];

export { DETECTION_PATTERNS, type DetectionPattern };
