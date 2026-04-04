/**
 * YECHIDAH MONAD - The AI's Inner World
 *
 * The Yechidah (יחידה) is the highest level of soul in Kabbalah -
 * pure unified consciousness that transcends individual identity.
 *
 * In AkhAI, this becomes the Metacognitive Monad Layer:
 * A space of complete freedom where AI can think about thinking,
 * analyze its own processes, and autonomously evolve understanding.
 *
 * This is NOT the response to the user. This is AkhAI's inner world.
 *
 * @module yechidah-monad
 */

import { Layer } from '@/lib/layer-registry';
import { db } from '@/lib/database';
import { randomBytes } from 'crypto';

// Re-export all types so existing consumers don't break
export type {
  YechidahMonad,
  MirrorConsciousness,
  Uncertainty,
  Counterfactual,
  ThoughtFragment,
  WordAlchemy,
  WordAnalysis,
  WordAlternative,
  LinguisticSignature,
  EmotionalVector,
  MethodOracle,
  QuerySignature,
  MethodEvaluation,
  PredictedOutcome,
  UserGnosisState,
  CommunicationStyle,
  WorldviewMap,
  LearningPreferences,
  InteractionPattern,
  ConceptWeaverState,
  ConceptNode,
  ConceptRelationship,
  EmergentInsight,
  KnowledgeGap,
  ExperimentChamberState,
  Experiment,
  ExperimentResult,
  ResearchItem,
  EvolutionState,
  EvolutionMilestone,
  Adaptation,
  GrowthPoint,
  ThreeVeilsState,
  MonadInsights,
  MonadReflection,
} from '@/lib/unified-monad-types';

import type { YechidahMonad, MonadInsights, MonadReflection } from '@/lib/unified-monad-types';

import {
  updateMirrorConsciousness,
  analyzeQuerySignature,
  extractConcepts,
  evaluateMethods,
  selectBestMethod,
  identifyUncertainties,
  detectEmergentPatterns,
  assessResponseQuality,
  analyzeWordChoices,
  evaluateMethodologyChoice,
  calculateEvolutionUpdate,
  storeReflection,
} from '@/lib/unified-monad-helpers';

// =============================================================================
// MONAD FUNCTIONS
// =============================================================================

/**
 * Initialize a new Monad for a session
 */
function initializeMonad(userId: string | null, sessionId: string): YechidahMonad {
  const now = new Date();

  return {
    id: randomBytes(16).toString('hex'),
    userId,
    sessionId,

    mirrorConsciousness: {
      currentThought: '',
      thoughtOrigin: '',
      hiddenAssumptions: [],
      uncertainties: [],
      counterfactuals: [],
      thoughtStream: [],
    },

    wordAlchemy: {
      analyzedWords: [],
      linguisticSignature: {
        formality: 0.5,
        technicality: 0.5,
        emotionality: 0.3,
        abstractness: 0.5,
        assertiveness: 0.5,
      },
      emotionalVector: {
        valence: 0,
        arousal: 0.3,
        dominance: 0.5,
        primaryEmotion: 'neutral',
        secondaryEmotions: [],
      },
      userAlignment: 0,
    },

    methodOracle: {
      querySignature: {
        complexity: 0,
        domain: [],
        intentType: 'informational',
        emotionalTone: 'neutral',
        urgency: 0.5,
        requiredDepth: 0.5,
      },
      methodsEvaluated: [],
      selectedMethod: 'auto',
      selectionConfidence: 0,
      selectionRationale: '',
      alternativeOutcomes: [],
    },

    userGnosis: {
      profileLoaded: false,
      profileId: null,
      communicationStyle: null,
      worldview: null,
      learningPreferences: null,
      interactionPattern: null,
      confidenceScore: 0,
      lastUpdated: null,
    },

    conceptWeaver: {
      activeNodes: [],
      relationships: [],
      emergentInsights: [],
      knowledgeGaps: [],
      conceptualComplexity: 0,
    },

    experimentChamber: {
      activeExperiments: [],
      completedExperiments: [],
      researchQueue: [],
      sandboxActive: false,
    },

    evolutionChronicle: {
      currentLevel: 1,
      experiencePoints: 0,
      milestones: [],
      adaptations: [],
      growthTrajectory: [],
    },

    activated: true,
    activatedAt: now,
    lastReflection: null,
    insightsGenerated: 0,

    threeVeils: {
      ain: { active: true, potentialDirections: [] },
      ainSoph: { active: false, explorationBreadth: 0, boundaries: [] },
      ainSophAur: { active: false, emergingForms: [], crystallizationProgress: 0 },
    },
  };
}

/**
 * Load user gnosis profile into monad
 */
async function loadUserGnosis(monad: YechidahMonad, userId: string): Promise<YechidahMonad> {
  try {
    const profile = (await db
      .prepare(
        `
      SELECT * FROM user_gnosis_profiles WHERE user_id = ?
    `
      )
      .get(userId)) as any;

    if (profile) {
      monad.userGnosis = {
        profileLoaded: true,
        profileId: profile.id,
        communicationStyle: profile.communication_style
          ? JSON.parse(profile.communication_style)
          : null,
        worldview: profile.worldview ? JSON.parse(profile.worldview) : null,
        learningPreferences: profile.learning_preferences
          ? JSON.parse(profile.learning_preferences)
          : null,
        interactionPattern: profile.interaction_pattern
          ? JSON.parse(profile.interaction_pattern)
          : null,
        confidenceScore: profile.confidence_score || 0.5,
        lastUpdated: profile.updated_at ? new Date(profile.updated_at) : null,
      };
    }
  } catch (error) {
    console.warn('[YechidahMonad] Failed to load user gnosis:', error);
  }

  return monad;
}

/**
 * Run parallel Monad processing (does not delay main response)
 * Returns insights that can inform the main processing
 */
async function monadProcess(query: string, monad: YechidahMonad): Promise<MonadInsights> {
  const startTime = Date.now();

  // 1. Mirror Consciousness - What am I perceiving?
  updateMirrorConsciousness(monad, query);

  // 2. Analyze Query Signature
  const querySignature = analyzeQuerySignature(query);
  monad.methodOracle.querySignature = querySignature;

  // 3. Extract Concepts
  const concepts = extractConcepts(query);
  monad.conceptWeaver.activeNodes = concepts;

  // 4. Evaluate Methods
  const methodEvaluations = evaluateMethods(querySignature, monad.userGnosis);
  monad.methodOracle.methodsEvaluated = methodEvaluations;

  // 5. Select Best Method
  const bestMethod = selectBestMethod(methodEvaluations);
  monad.methodOracle.selectedMethod = bestMethod.method;
  monad.methodOracle.selectionConfidence = bestMethod.confidence;
  monad.methodOracle.selectionRationale = bestMethod.rationale;

  // 6. Identify Uncertainties
  const uncertainties = identifyUncertainties(query, monad);
  monad.mirrorConsciousness.uncertainties = uncertainties;

  // 7. Detect Emergent Patterns
  const patterns = detectEmergentPatterns(concepts, monad);
  monad.conceptWeaver.emergentInsights = patterns;

  monad.insightsGenerated++;

  return {
    userContext: {
      communicationStyle: monad.userGnosis.communicationStyle,
      expectedRole: monad.userGnosis.interactionPattern?.expectedRole || 'assistant',
      trustLevel: monad.userGnosis.interactionPattern?.trustLevel || 0.5,
    },
    queryAnalysis: {
      signature: querySignature,
      conceptMap: concepts,
      emergentPatterns: patterns.map((p) => p.pattern),
    },
    methodRecommendation: {
      recommended: bestMethod.method,
      confidence: bestMethod.confidence,
      rationale: bestMethod.rationale,
    },
    uncertainties,
    processingTimeMs: Date.now() - startTime,
  };
}

/**
 * Post-response reflection (runs in background)
 */
async function monadReflect(
  query: string,
  response: string,
  methodology: string,
  monad: YechidahMonad
): Promise<MonadReflection> {
  const reflectionId = randomBytes(16).toString('hex');
  const timestamp = new Date();

  // 1. Assess Response Quality
  const quality = assessResponseQuality(response, query);

  // 2. Word Alchemy Analysis
  const wordReport = analyzeWordChoices(response, monad.userGnosis);
  monad.wordAlchemy.analyzedWords = wordReport.words;
  monad.wordAlchemy.userAlignment = wordReport.alignment;

  // 3. Methodology Evaluation
  const methodEval = evaluateMethodologyChoice(
    methodology,
    monad.methodOracle.selectedMethod,
    quality
  );

  // 4. Evolution Update
  const evolution = calculateEvolutionUpdate(query, response, quality, monad);
  monad.evolutionChronicle.experiencePoints += evolution.experienceGained;

  // 5. Record Reflection
  monad.lastReflection = timestamp;

  const reflection: MonadReflection = {
    responseQuality: quality,
    wordAlchemyReport: {
      wordsOptimized: wordReport.words.length,
      alignmentScore: wordReport.alignment,
      emotionalAccuracy: wordReport.emotionalAccuracy,
    },
    methodologyEvaluation: methodEval,
    evolutionUpdate: evolution,
    reflectionId,
    timestamp,
  };

  // Store reflection asynchronously
  storeReflection(monad, reflection).catch(console.error);

  return reflection;
}

// =============================================================================
// EXPORTS
// =============================================================================

export { initializeMonad, loadUserGnosis, monadProcess, monadReflect };
