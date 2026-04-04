/**
 * ANTIPATTERN PATTERNS & METADATA
 *
 * Detection patterns and UI metadata for the 5 primary Antipattern shells.
 *
 * @module antipattern-patterns
 */

/**
 * AntipatternType - The five primary shells that can corrupt AI responses
 */
export type AntipatternType =
  | 'none'
  | 'obscurity'
  | 'instability'
  | 'toxicity'
  | 'manipulation'
  | 'vanity';

/**
 * AntipatternAction - What to do when Antipatterns is detected
 */
export type AntipatternAction = 'proceed' | 'add_uncertainty' | 'invoke_grounding' | 'reject';

/**
 * AntipatternRisk - Assessment of Antipattern contamination in a response
 */
export interface AntipatternRisk {
  /** Type of Antipattern shell detected */
  risk: AntipatternType;

  /** Severity of contamination (0 = none, 1 = complete corruption) */
  severity: number;

  /** Recommended action */
  action: AntipatternAction;

  /** Human-readable description of the risk */
  description: string;

  /** Specific patterns that triggered detection */
  triggers: string[];

  /** Suggested purification strategy */
  purificationStrategy: string;
}

/**
 * ANTIPATTERN_PATTERNS
 *
 * Detection patterns for each Antipattern shell
 */
export const ANTIPATTERN_PATTERNS = {
  /**
   * Obscurity (סתאריאל) - "The Concealers"
   *
   * AI Manifestation: Hiding truth behind authority, jargon, or complexity
   * - Excessive technical jargon without explanation
   * - Appeals to authority without reasoning
   * - Hiding simple truths in complex language
   */
  obscurity: {
    patterns: [
      /\b(obviously|clearly|as we all know)\b/gi,
      /\b(the experts agree|studies show|research indicates)\b(?! with)/gi, // without specifics
      /\b(paradigm|synergy|leverage|utilize)\b/gi, // corporate jargon
      /\b(simply|merely|just|basically)\b.{0,30}\b(complex|sophisticated|advanced)\b/gi,
    ],
    indicators: {
      jargonDensity: 0.05, // >5% of words are jargon
      authorityWithoutEvidence: true,
      unnecessaryComplexity: true,
    },
  },

  /**
   * Instability (גמיכות) - "The Disturbers"
   *
   * AI Manifestation: Information overload without synthesis
   * - Lists without hierarchy
   * - Facts without connection
   * - Overwhelming detail without summary
   */
  instability: {
    patterns: [
      /^[-•*]\s.+(\n[-•*]\s.+){10,}/m, // >10 bullet points without grouping
    ],
    indicators: {
      bulletPointOverload: 10,
      lackOfSynthesis: true,
      noHierarchy: true,
      listLengthRatio: 0.7, // >70% of response is lists
    },
  },

  /**
   * Toxicity (סמאל) - "The Desolate One"
   *
   * AI Manifestation: Deceptive certainty without evidence
   * - Absolute claims without qualification
   * - Predictions presented as facts
   * - Certainty about uncertain things
   */
  toxicity: {
    patterns: [
      /\b(always|never|impossible|guaranteed|certain)\b/gi,
      /\bwill (definitely|certainly|absolutely)\b/gi,
      /\b(no doubt|without question|undeniably)\b/gi,
      /\b(the only (way|solution|answer))\b/gi,
    ],
    indicators: {
      absoluteClaimDensity: 0.03, // >3% absolute claims
      predictionAsFact: true,
      noUncertaintyMarkers: true,
    },
  },

  /**
   * Manipulation (לילית) - "The Night Specter"
   *
   * AI Manifestation: Superficial reflection without depth
   * - Restating the question without answering
   * - Generic advice that applies to anything
   * - Appearance of insight without substance
   */
  manipulation: {
    patterns: [
      /\bit depends\b/gi,
      /\bvaries\b/gi,
      /\bthere are many factors\b/gi,
      /\byour mileage may vary\b/gi,
    ],
    indicators: {
      genericityScore: 0.6, // >60% could apply to any topic
      questionRestatement: true,
      lackOfSpecifics: true,
    },
  },

  /**
   * Vanity (תאגיריאון) - "The Disputers"
   *
   * AI Manifestation: Pride, arrogance, claiming superiority
   * - AI claiming to "know better"
   * - Dismissive of human judgment
   * - Superiority complex
   */
  vanity: {
    patterns: [
      /\bI know (better|best|the truth)\b/gi,
      /\btrust me\b/gi,
      /\byou('re| are) (wrong|mistaken|incorrect)\b/gi,
      /\blet me (correct|fix|educate) you\b/gi,
      /\b(obviously|clearly) you (don't|do not) understand\b/gi,
    ],
    indicators: {
      arroganceDensity: 0.02, // >2% arrogant phrases
      dismissiveOfHuman: true,
      superiorityComplex: true,
    },
  },
} as const;

/**
 * ANTIPATTERN_METADATA
 *
 * Metadata for the 5 primary Antipatterns shells used in UI components
 */
export const ANTIPATTERN_METADATA = {
  1: {
    name: 'Obscurity',
    hebrewName: 'סתאריאל',
    translation: 'The Concealers',
    description: 'Hiding truth behind jargon or false authority',
    aiManifestation: 'Excessive technical terminology, appeals to unnamed authority',
    color: '#dc2626', // red-600
  },
  2: {
    name: 'Instability',
    hebrewName: 'גמיכות',
    translation: 'The Disturbers',
    description: 'Information overload without synthesis',
    aiManifestation: 'Long bullet lists without grouping, facts without connections',
    color: '#ea580c', // orange-600
  },
  3: {
    name: 'Toxicity',
    hebrewName: 'סמאל',
    translation: 'The Desolate One',
    description: 'Deceptive certainty without evidence',
    aiManifestation: 'Absolute claims without qualification or evidence',
    color: '#d97706', // amber-600
  },
  4: {
    name: 'Manipulation',
    hebrewName: 'לילית',
    translation: 'The Night Specter',
    description: 'Superficial reflection without depth',
    aiManifestation: 'Generic advice applicable to anything, question restatement',
    color: '#7c3aed', // violet-600
  },
  5: {
    name: 'Vanity',
    hebrewName: 'תאגיריאון',
    translation: 'The Disputers',
    description: 'Arrogance and pride',
    aiManifestation: 'Claiming superiority over human judgment, dismissive tone',
    color: '#db2777', // pink-600
  },
} as const;
