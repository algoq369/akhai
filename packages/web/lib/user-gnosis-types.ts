/**
 * USER GNOSIS ENGINE - Type Definitions
 *
 * All interfaces and type definitions for the User Gnosis system.
 *
 * @module user-gnosis-types
 */

// =============================================================================
// INTERFACES
// =============================================================================

/**
 * Complete User Gnosis Profile
 */
export interface UserGnosisProfile {
  id: string;
  userId: string;

  // Communication Analysis
  communicationStyle: CommunicationStyle;

  // Worldview Mapping
  worldview: WorldviewMap;

  // Learning Preferences
  learningPreferences: LearningPreferences;

  // Interaction Patterns
  interactionPattern: InteractionPattern;

  // Confidence in each assessment
  confidenceScores: ConfidenceScores;

  // Metadata
  interactionCount: number;
  totalTokensExchanged: number;
  firstInteraction: Date;
  lastInteraction: Date;
  lastProfileUpdate: Date;
}

/**
 * How the user communicates
 */
export interface CommunicationStyle {
  // Formality level (0 = casual, 1 = formal)
  formality: number;

  // Technical depth (0 = layman, 1 = expert)
  technicality: number;

  // Emotional expression (0 = reserved, 1 = expressive)
  emotionality: number;

  // Abstract vs concrete (0 = concrete, 1 = abstract)
  abstractness: number;

  // Response tempo preference
  tempo: 'fast' | 'measured' | 'contemplative';

  // Preferred response length
  preferredLength: 'concise' | 'moderate' | 'detailed';

  // Language patterns
  languagePatterns: {
    usesEmojis: boolean;
    usesSlang: boolean;
    usesJargon: string[]; // Domain-specific terms they use
    averageSentenceLength: number;
    questionFrequency: number; // How often they ask questions
  };
}

/**
 * How the user sees the world
 */
export interface WorldviewMap {
  // Dominant metaphors they use
  dominantMetaphors: MetaphorPattern[];

  // Core values detected
  valueSystem: ValueIndicator[];

  // Knowledge domains (expertise areas)
  knowledgeDomains: KnowledgeDomain[];

  // Potential blind spots
  blindSpots: string[];

  // Philosophical leanings
  philosophicalLeanings: string[];

  // Cultural context indicators
  culturalContext: {
    timeZoneRegion: string | null;
    languageStyle: string;
    referenceFrameworks: string[]; // e.g., "tech startup", "academic", "spiritual"
  };
}

export interface MetaphorPattern {
  domain: string; // e.g., "war", "journey", "building"
  frequency: number;
  examples: string[];
}

export interface ValueIndicator {
  value: string;
  strength: number;
  evidence: string[];
}

export interface KnowledgeDomain {
  domain: string;
  expertise: 'novice' | 'intermediate' | 'advanced' | 'expert';
  topics: string[];
  lastDiscussed: Date;
}

/**
 * How the user prefers to learn
 */
export interface LearningPreferences {
  // Visual vs textual learning
  visualVsTextual: number; // 0 = textual, 1 = visual

  // Theoretical vs practical
  theoreticalVsPractical: number; // 0 = practical, 1 = theoretical

  // Breadth vs depth
  breadthVsDepth: number; // 0 = depth, 1 = breadth

  // Structured vs organic
  structuredVsOrganic: number; // 0 = organic, 1 = structured

  // Examples preference
  examplesPreference: 'few' | 'moderate' | 'many';

  // Code preference (for technical users)
  codePreference: {
    prefersFunctional: boolean;
    prefersTypes: boolean;
    preferredLanguages: string[];
  };

  // Explanation style
  explanationStyle: {
    prefersAnalogies: boolean;
    prefersStepByStep: boolean;
    prefersHighLevelFirst: boolean;
    toleratesAmbiguity: number; // 0 = needs certainty, 1 = comfortable with ambiguity
  };
}

/**
 * How the user interacts with AI
 */
export interface InteractionPattern {
  // Trust level in AI
  trustLevel: number; // 0 = skeptical, 1 = trusting

  // Expected AI role
  expectedRole: 'tool' | 'assistant' | 'collaborator' | 'teacher' | 'peer';

  // How much guidance vs autonomy they prefer
  preferredSovereignty: number; // 0 = AI leads, 1 = human leads

  // Feedback style preference
  feedbackStyle: 'direct' | 'gentle' | 'socratic';

  // Receptivity to being challenged
  challengeReceptivity: number; // 0 = prefers agreement, 1 = welcomes challenge

  // Session patterns
  sessionPatterns: {
    averageSessionLength: number; // minutes
    messagesPerSession: number;
    topicSwitchingFrequency: number;
    followUpFrequency: number;
  };

  // Emotional patterns
  emotionalPatterns: {
    frustrationTriggers: string[];
    appreciationTriggers: string[];
    engagementIndicators: string[];
  };
}

/**
 * Confidence in each assessment
 */
export interface ConfidenceScores {
  communicationStyle: number;
  worldview: number;
  learningPreferences: number;
  interactionPattern: number;
  overall: number;
}

/**
 * Evolution record - tracks growth over time
 */
export interface EvolutionRecord {
  id: string;
  userId: string;
  timestamp: Date;
  eventType: 'milestone' | 'adaptation' | 'insight' | 'preference_change';
  eventData: {
    description: string;
    previousValue?: any;
    newValue?: any;
    trigger?: string;
  };
  impact: number; // How much this changed understanding
}
