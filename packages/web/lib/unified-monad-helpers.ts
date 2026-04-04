/**
 * YECHIDAH MONAD - Helper Functions
 *
 * Internal processing helpers for the Metacognitive Monad Layer.
 * Extracted from unified-monad.ts to keep files under 500 lines.
 *
 * @module yechidah-monad-helpers
 */

import { Layer } from '@/lib/layer-registry';
import { db } from '@/lib/database';
import { randomBytes } from 'crypto';

import type {
  YechidahMonad,
  QuerySignature,
  ConceptNode,
  MethodEvaluation,
  UserGnosisState,
  Uncertainty,
  EmergentInsight,
  MonadReflection,
  WordAnalysis,
} from '@/lib/unified-monad-types';

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

export function updateMirrorConsciousness(monad: YechidahMonad, query: string): void {
  monad.mirrorConsciousness.currentThought = `Processing query: "${query.substring(0, 100)}..."`;
  monad.mirrorConsciousness.thoughtOrigin = 'User query received';
  monad.mirrorConsciousness.thoughtStream.push({
    timestamp: new Date(),
    content: `Received query with ${query.length} characters`,
    layerNodeOrigin: Layer.EMBEDDING,
    confidence: 1.0,
  });
}

export function analyzeQuerySignature(query: string): QuerySignature {
  const words = query.toLowerCase().split(/\s+/);
  const length = words.length;

  // Complexity based on length and structure
  const complexity = Math.min(1, length / 100);

  // Detect intent type
  let intentType: QuerySignature['intentType'] = 'informational';
  if (query.match(/\b(create|write|generate|make)\b/i)) intentType = 'creative';
  if (query.match(/\b(analyze|compare|evaluate|assess)\b/i)) intentType = 'analytical';
  if (query.match(/\b(how to|steps|guide|tutorial)\b/i)) intentType = 'procedural';
  if (query.match(/\b(hi|hello|hey|thanks|bye)\b/i) && length < 10) intentType = 'conversational';

  // Detect domains
  const domains: string[] = [];
  if (query.match(/\b(code|programming|software|api|function)\b/i)) domains.push('technology');
  if (query.match(/\b(money|investment|financial|budget)\b/i)) domains.push('finance');
  if (query.match(/\b(health|medical|symptom|treatment)\b/i)) domains.push('health');
  if (query.match(/\b(kabbala|layers|spiritual|gnostic)\b/i)) domains.push('esoteric');

  // Urgency detection
  const urgency = query.match(/\b(urgent|asap|quickly|immediately|now)\b/i) ? 0.9 : 0.5;

  // Required depth
  const depthMarkers = query.match(/\b(detailed|comprehensive|thorough|deep|complete)\b/i);
  const requiredDepth = depthMarkers ? 0.9 : 0.5;

  return {
    complexity,
    domain: domains.length > 0 ? domains : ['general'],
    intentType,
    emotionalTone: 'neutral',
    urgency,
    requiredDepth,
  };
}

export function extractConcepts(query: string): ConceptNode[] {
  // Simple concept extraction (in production, use NLP)
  const concepts: ConceptNode[] = [];
  const words = query.split(/\s+/).filter((w) => w.length > 3);

  // Extract nouns and key terms (simplified)
  const importantWords = words.filter(
    (w) => !['the', 'and', 'that', 'this', 'with', 'from', 'have', 'been'].includes(w.toLowerCase())
  );

  importantWords.slice(0, 10).forEach((word, index) => {
    concepts.push({
      id: `concept-${index}`,
      label: word,
      type: 'concept',
      weight: 1 - index * 0.1,
      sephiroticMapping: Layer.EMBEDDING,
      abstractionLevel: 0.5,
    });
  });

  return concepts;
}

export function evaluateMethods(
  signature: QuerySignature,
  userGnosis: UserGnosisState
): MethodEvaluation[] {
  const methods = ['direct', 'cod', 'sc', 'react', 'pas', 'tot', 'auto'];

  return methods.map((method) => {
    let score = 0.5;
    const strengths: string[] = [];
    const weaknesses: string[] = [];

    switch (method) {
      case 'direct':
        if (signature.intentType === 'conversational') {
          score = 0.9;
          strengths.push('Fast for simple queries');
        }
        if (signature.complexity > 0.7) {
          score = 0.3;
          weaknesses.push('Too simple for complex queries');
        }
        break;

      case 'cod':
        if (signature.intentType === 'creative') {
          score = 0.85;
          strengths.push('Iterative refinement for creative work');
        }
        break;

      case 'sc':
        if (signature.complexity > 0.5) {
          score = 0.8;
          strengths.push('Enhanced reasoning for complex queries');
        }
        break;

      case 'react':
        if (signature.intentType === 'procedural') {
          score = 0.85;
          strengths.push('Action-oriented for procedures');
        }
        break;

      case 'pas':
        if (signature.domain.includes('technology')) {
          score = 0.8;
          strengths.push('Code-based reasoning');
        }
        break;

      case 'tot':
        if (signature.complexity > 0.7 && signature.requiredDepth > 0.7) {
          score = 0.9;
          strengths.push('Multi-AI consensus for critical queries');
        }
        weaknesses.push('Higher latency');
        break;
    }

    // Adjust for user preferences
    if (userGnosis.learningPreferences?.breadthVsDepth) {
      if (userGnosis.learningPreferences.breadthVsDepth > 0.7 && method === 'tot') {
        score += 0.1;
      }
    }

    return {
      method,
      score: Math.min(1, Math.max(0, score)),
      strengths,
      weaknesses,
      sephiroticAlignment: Layer.ENCODER,
      estimatedTokens: method === 'tot' ? 3000 : 1000,
      estimatedLatency: method === 'tot' ? 5000 : 2000,
    };
  });
}

export function selectBestMethod(evaluations: MethodEvaluation[]): {
  method: string;
  confidence: number;
  rationale: string;
} {
  const sorted = [...evaluations].sort((a, b) => b.score - a.score);
  const best = sorted[0];
  const secondBest = sorted[1];

  const confidence = best.score - (secondBest?.score || 0);

  return {
    method: best.method,
    confidence: Math.min(1, confidence + 0.5),
    rationale:
      `Selected ${best.method} (score: ${best.score.toFixed(2)}) ` +
      `because: ${best.strengths.join(', ') || 'best overall fit'}`,
  };
}

export function identifyUncertainties(query: string, monad: YechidahMonad): Uncertainty[] {
  const uncertainties: Uncertainty[] = [];

  // Check for ambiguous queries
  if (query.split(' ').length < 5) {
    uncertainties.push({
      topic: 'Query clarity',
      level: 0.6,
      reason: 'Short query may be ambiguous',
      resolutionStrategy: 'Make reasonable assumptions, offer to clarify',
    });
  }

  // Check for unknown user
  if (!monad.userGnosis.profileLoaded) {
    uncertainties.push({
      topic: 'User preferences',
      level: 0.5,
      reason: 'No user profile loaded',
      resolutionStrategy: 'Use default communication style',
    });
  }

  return uncertainties;
}

export function detectEmergentPatterns(
  concepts: ConceptNode[],
  monad: YechidahMonad
): EmergentInsight[] {
  const insights: EmergentInsight[] = [];

  // Look for Synthesis emergence (hidden connections)
  if (concepts.length >= 3) {
    // This is simplified - in production, use semantic analysis
    insights.push({
      id: randomBytes(8).toString('hex'),
      pattern: `Connected concepts: ${concepts
        .slice(0, 3)
        .map((c) => c.label)
        .join(' → ')}`,
      confidence: 0.6,
      novelty: 0.5,
      actionable: false,
      sourceNodes: concepts.slice(0, 3).map((c) => c.id),
      synthesisConnection: true,
    });
  }

  return insights;
}

export function assessResponseQuality(
  response: string,
  query: string
): MonadReflection['responseQuality'] {
  // Simplified quality assessment
  const length = response.length;
  const queryLength = query.length;

  return {
    coherence: 0.8, // Would use NLP in production
    relevance: Math.min(1, length / (queryLength * 5)),
    helpfulness: 0.8,
    sovereignty: 0.9, // Check for oracle patterns
  };
}

export function analyzeWordChoices(
  response: string,
  userGnosis: UserGnosisState
): { words: WordAnalysis[]; alignment: number; emotionalAccuracy: number } {
  // Simplified word analysis
  return {
    words: [],
    alignment: userGnosis.profileLoaded ? 0.8 : 0.5,
    emotionalAccuracy: 0.7,
  };
}

export function evaluateMethodologyChoice(
  used: string,
  recommended: string,
  quality: MonadReflection['responseQuality']
): MonadReflection['methodologyEvaluation'] {
  const wasOptimal = used === recommended || quality.helpfulness > 0.8;

  return {
    wasOptimal,
    alternativeWouldHaveBeen: wasOptimal ? null : recommended,
    lessonLearned: wasOptimal
      ? 'Methodology selection was appropriate'
      : `Consider ${recommended} for similar queries`,
  };
}

export function calculateEvolutionUpdate(
  query: string,
  response: string,
  quality: MonadReflection['responseQuality'],
  monad: YechidahMonad
): MonadReflection['evolutionUpdate'] {
  // Calculate experience based on interaction quality
  const baseXP = 10;
  const qualityBonus = quality.helpfulness * 10;
  const complexityBonus = query.length > 200 ? 5 : 0;

  return {
    experienceGained: Math.round(baseXP + qualityBonus + complexityBonus),
    newInsights: monad.conceptWeaver.emergentInsights.map((i) => i.pattern),
    adaptationsMade: [],
  };
}

export async function storeReflection(
  monad: YechidahMonad,
  reflection: MonadReflection
): Promise<void> {
  try {
    await db
      .prepare(
        `
      INSERT INTO monad_reflections (
        id, user_id, session_id, query_hash,
        mirror_consciousness, word_alchemy, method_oracle, concept_map,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `
      )
      .run(
        reflection.reflectionId,
        monad.userId,
        monad.sessionId,
        '', // Would hash query
        JSON.stringify(monad.mirrorConsciousness),
        JSON.stringify(reflection.wordAlchemyReport),
        JSON.stringify(reflection.methodologyEvaluation),
        JSON.stringify(monad.conceptWeaver),
        reflection.timestamp.toISOString()
      );
  } catch (error) {
    console.warn('[YechidahMonad] Failed to store reflection:', error);
  }
}
