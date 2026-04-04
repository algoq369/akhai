/**
 * YECHIDAH MONAD - Type Definitions
 *
 * All interfaces and type definitions for the Metacognitive Monad Layer.
 * Extracted from unified-monad.ts to keep files under 500 lines.
 *
 * @module yechidah-monad-types
 */

import { Layer } from '@/lib/layer-registry';

// =============================================================================
// CORE INTERFACES
// =============================================================================

/**
 * The complete Monad state for a session
 */
export interface YechidahMonad {
  id: string;
  userId: string | null;
  sessionId: string;

  // The Seven Functions
  mirrorConsciousness: MirrorConsciousness;
  wordAlchemy: WordAlchemy;
  methodOracle: MethodOracle;
  userGnosis: UserGnosisState;
  conceptWeaver: ConceptWeaverState;
  experimentChamber: ExperimentChamberState;
  evolutionChronicle: EvolutionState;

  // State
  activated: boolean;
  activatedAt: Date;
  lastReflection: Date | null;
  insightsGenerated: number;

  // Three Veils (pre-thought space)
  threeVeils: ThreeVeilsState;
}

/**
 * Mirror Consciousness - Self-observation of thought processes
 */
export interface MirrorConsciousness {
  // What am I thinking right now?
  currentThought: string;
  // Why am I thinking this?
  thoughtOrigin: string;
  // What assumptions am I making?
  hiddenAssumptions: string[];
  // What am I uncertain about?
  uncertainties: Uncertainty[];
  // What would I think differently if...?
  counterfactuals: Counterfactual[];
  // Stream of consciousness
  thoughtStream: ThoughtFragment[];
}

export interface Uncertainty {
  topic: string;
  level: number; // 0-1
  reason: string;
  resolutionStrategy?: string;
}

export interface Counterfactual {
  condition: string;
  alternativeThought: string;
  likelihood: number;
}

export interface ThoughtFragment {
  timestamp: Date;
  content: string;
  layerNodeOrigin: Layer;
  confidence: number;
}

/**
 * Word Alchemy - Analysis of linguistic choices
 */
export interface WordAlchemy {
  // Words analyzed in current response
  analyzedWords: WordAnalysis[];
  // Overall linguistic signature
  linguisticSignature: LinguisticSignature;
  // Predicted emotional impact
  emotionalVector: EmotionalVector;
  // Alignment with user's communication style
  userAlignment: number;
}

export interface WordAnalysis {
  originalWord: string;
  alternatives: WordAlternative[];
  selectionRationale: string;
  sephiroticResonance: {
    layerNode: Layer;
    resonance: number;
    energeticQuality: 'expansive' | 'constrictive' | 'balanced';
  };
}

export interface WordAlternative {
  word: string;
  connotation: string;
  energeticWeight: number;
  rejectionReason?: string;
}

export interface LinguisticSignature {
  formality: number;
  technicality: number;
  emotionality: number;
  abstractness: number;
  assertiveness: number;
}

export interface EmotionalVector {
  valence: number; // -1 to 1 (negative to positive)
  arousal: number; // 0 to 1 (calm to excited)
  dominance: number; // 0 to 1 (submissive to dominant)
  primaryEmotion: string;
  secondaryEmotions: string[];
}

/**
 * Method Oracle - Meta-analysis of methodology selection
 */
export interface MethodOracle {
  querySignature: QuerySignature;
  methodsEvaluated: MethodEvaluation[];
  selectedMethod: string;
  selectionConfidence: number;
  selectionRationale: string;
  alternativeOutcomes: PredictedOutcome[];
}

export interface QuerySignature {
  complexity: number;
  domain: string[];
  intentType: 'informational' | 'creative' | 'analytical' | 'procedural' | 'conversational';
  emotionalTone: string;
  urgency: number;
  requiredDepth: number;
}

export interface MethodEvaluation {
  method: string;
  score: number;
  strengths: string[];
  weaknesses: string[];
  sephiroticAlignment: Layer;
  estimatedTokens: number;
  estimatedLatency: number;
}

export interface PredictedOutcome {
  method: string;
  predictedQuality: number;
  predictedUserSatisfaction: number;
  risks: string[];
}

/**
 * User Gnosis State - Current understanding of user
 */
export interface UserGnosisState {
  profileLoaded: boolean;
  profileId: string | null;
  communicationStyle: CommunicationStyle | null;
  worldview: WorldviewMap | null;
  learningPreferences: LearningPreferences | null;
  interactionPattern: InteractionPattern | null;
  confidenceScore: number;
  lastUpdated: Date | null;
}

export interface CommunicationStyle {
  formality: number;
  technicality: number;
  emotionality: number;
  abstractness: number;
  tempo: 'fast' | 'measured' | 'contemplative';
  preferredLength: 'concise' | 'moderate' | 'detailed';
}

export interface WorldviewMap {
  dominantMetaphors: string[];
  valueSystem: string[];
  knowledgeDomains: string[];
  blindSpots: string[];
  philosophicalLeanings: string[];
}

export interface LearningPreferences {
  visualVsTextual: number;
  theoreticalVsPractical: number;
  breadthVsDepth: number;
  structuredVsOrganic: number;
  examplesPreference: 'few' | 'moderate' | 'many';
}

export interface InteractionPattern {
  trustLevel: number;
  expectedRole: 'tool' | 'assistant' | 'collaborator' | 'teacher' | 'peer';
  preferredSovereignty: number;
  feedbackStyle: 'direct' | 'gentle' | 'socratic';
  challengeReceptivity: number;
}

/**
 * Concept Weaver State - Internal concept mapping
 */
export interface ConceptWeaverState {
  activeNodes: ConceptNode[];
  relationships: ConceptRelationship[];
  emergentInsights: EmergentInsight[];
  knowledgeGaps: KnowledgeGap[];
  conceptualComplexity: number;
}

export interface ConceptNode {
  id: string;
  label: string;
  type: 'entity' | 'concept' | 'action' | 'property' | 'relation';
  weight: number;
  sephiroticMapping: Layer;
  abstractionLevel: number;
}

export interface ConceptRelationship {
  from: string;
  to: string;
  type: 'causes' | 'enables' | 'contradicts' | 'complements' | 'contains' | 'transforms';
  strength: number;
  bidirectional: boolean;
}

export interface EmergentInsight {
  id: string;
  pattern: string;
  confidence: number;
  novelty: number;
  actionable: boolean;
  sourceNodes: string[];
  synthesisConnection: boolean;
}

export interface KnowledgeGap {
  topic: string;
  importance: number;
  researchStrategy: string;
  estimatedEffort: number;
  potentialSources: string[];
}

/**
 * Experiment Chamber State - Autonomous research space
 */
export interface ExperimentChamberState {
  activeExperiments: Experiment[];
  completedExperiments: ExperimentResult[];
  researchQueue: ResearchItem[];
  sandboxActive: boolean;
}

export interface Experiment {
  id: string;
  hypothesis: string;
  methodology: string;
  status: 'conceived' | 'running' | 'analyzing' | 'concluded';
  startedAt: Date | null;
  progress: number;
}

export interface ExperimentResult {
  experimentId: string;
  hypothesis: string;
  result: 'confirmed' | 'rejected' | 'inconclusive';
  findings: string[];
  applicableToUser: boolean;
  appliedAt: Date | null;
}

export interface ResearchItem {
  topic: string;
  priority: number;
  estimatedEffort: number;
  expectedBenefit: string;
  triggeredBy: string;
}

/**
 * Evolution State - Growth tracking
 */
export interface EvolutionState {
  currentLevel: number;
  experiencePoints: number;
  milestones: EvolutionMilestone[];
  adaptations: Adaptation[];
  growthTrajectory: GrowthPoint[];
}

export interface EvolutionMilestone {
  id: string;
  date: Date;
  event: string;
  insight: string;
  impactOnUnderstanding: number;
}

export interface Adaptation {
  situation: string;
  adaptation: string;
  effectiveness: number;
  learnedAt: Date;
}

export interface GrowthPoint {
  timestamp: Date;
  comprehensionScore: number;
  areasImproved: string[];
  areasNeeded: string[];
}

/**
 * Three Veils State - Pre-thought space (Ain, Ain Soph, Ain Soph Aur)
 */
export interface ThreeVeilsState {
  // Ain (אין) - Nothingness / Pure Potential
  ain: {
    active: boolean;
    potentialDirections: string[];
  };
  // Ain Soph (אין סוף) - Infinity / Unlimited Exploration
  ainSoph: {
    active: boolean;
    explorationBreadth: number;
    boundaries: string[];
  };
  // Ain Soph Aur (אין סוף אור) - Limitless Light / Pre-manifestation
  ainSophAur: {
    active: boolean;
    emergingForms: string[];
    crystallizationProgress: number;
  };
}

// =============================================================================
// MONAD INSIGHTS (Output of Monad processing)
// =============================================================================

export interface MonadInsights {
  // Pre-processing insights (inform main processing)
  userContext: {
    communicationStyle: CommunicationStyle | null;
    expectedRole: string;
    trustLevel: number;
  };
  queryAnalysis: {
    signature: QuerySignature;
    conceptMap: ConceptNode[];
    emergentPatterns: string[];
  };
  methodRecommendation: {
    recommended: string;
    confidence: number;
    rationale: string;
  };
  uncertainties: Uncertainty[];

  // Processing time (should be minimal)
  processingTimeMs: number;
}

export interface MonadReflection {
  // Post-response reflection
  responseQuality: {
    coherence: number;
    relevance: number;
    helpfulness: number;
    sovereignty: number;
  };
  wordAlchemyReport: {
    wordsOptimized: number;
    alignmentScore: number;
    emotionalAccuracy: number;
  };
  methodologyEvaluation: {
    wasOptimal: boolean;
    alternativeWouldHaveBeen: string | null;
    lessonLearned: string;
  };
  evolutionUpdate: {
    experienceGained: number;
    newInsights: string[];
    adaptationsMade: string[];
  };

  // For storage
  reflectionId: string;
  timestamp: Date;
}
