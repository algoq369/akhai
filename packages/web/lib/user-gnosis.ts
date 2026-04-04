/**
 * USER GNOSIS ENGINE - Deep User Understanding
 *
 * Gnosis (γνῶσις) means "knowledge through experience"
 *
 * This module builds a deep understanding of each user through:
 * - Communication style analysis
 * - Worldview mapping
 * - Learning preference detection
 * - Interaction pattern recognition
 * - Evolution tracking over time
 *
 * The goal: AkhAI should understand users better with each interaction,
 * adapting its responses to serve them more effectively.
 *
 * @module user-gnosis
 */

import { db } from './database';
import { randomBytes } from 'crypto';

// Re-export all types
export type {
  UserGnosisProfile,
  CommunicationStyle,
  WorldviewMap,
  MetaphorPattern,
  ValueIndicator,
  KnowledgeDomain,
  LearningPreferences,
  InteractionPattern,
  ConfidenceScores,
  EvolutionRecord,
} from './user-gnosis-types';

import type { UserGnosisProfile, EvolutionRecord } from './user-gnosis-types';

// Re-export analysis functions
export {
  analyzeCommunicationStyle,
  analyzeWorldview,
  analyzeLearningPreferences,
  analyzeInteractionPattern,
} from './user-gnosis-analysis';

import { analyzeCommunicationStyle, analyzeWorldview } from './user-gnosis-analysis';

// =============================================================================
// PROFILE MANAGEMENT
// =============================================================================

/**
 * Create a new user gnosis profile
 */
function createUserGnosisProfile(userId: string): UserGnosisProfile {
  const now = new Date();

  return {
    id: randomBytes(16).toString('hex'),
    userId,

    communicationStyle: {
      formality: 0.5,
      technicality: 0.5,
      emotionality: 0.3,
      abstractness: 0.5,
      tempo: 'measured',
      preferredLength: 'moderate',
      languagePatterns: {
        usesEmojis: false,
        usesSlang: false,
        usesJargon: [],
        averageSentenceLength: 15,
        questionFrequency: 0.3,
      },
    },

    worldview: {
      dominantMetaphors: [],
      valueSystem: [],
      knowledgeDomains: [],
      blindSpots: [],
      philosophicalLeanings: [],
      culturalContext: {
        timeZoneRegion: null,
        languageStyle: 'neutral',
        referenceFrameworks: [],
      },
    },

    learningPreferences: {
      visualVsTextual: 0.5,
      theoreticalVsPractical: 0.5,
      breadthVsDepth: 0.5,
      structuredVsOrganic: 0.5,
      examplesPreference: 'moderate',
      codePreference: {
        prefersFunctional: false,
        prefersTypes: false,
        preferredLanguages: [],
      },
      explanationStyle: {
        prefersAnalogies: true,
        prefersStepByStep: true,
        prefersHighLevelFirst: true,
        toleratesAmbiguity: 0.5,
      },
    },

    interactionPattern: {
      trustLevel: 0.5,
      expectedRole: 'assistant',
      preferredSovereignty: 0.5,
      feedbackStyle: 'direct',
      challengeReceptivity: 0.5,
      sessionPatterns: {
        averageSessionLength: 10,
        messagesPerSession: 5,
        topicSwitchingFrequency: 0.3,
        followUpFrequency: 0.2,
      },
      emotionalPatterns: {
        frustrationTriggers: [],
        appreciationTriggers: [],
        engagementIndicators: [],
      },
    },

    confidenceScores: {
      communicationStyle: 0.1,
      worldview: 0.1,
      learningPreferences: 0.1,
      interactionPattern: 0.1,
      overall: 0.1,
    },

    interactionCount: 0,
    totalTokensExchanged: 0,
    firstInteraction: now,
    lastInteraction: now,
    lastProfileUpdate: now,
  };
}

/**
 * Update profile with new interaction data
 */
function updateUserGnosisProfile(
  profile: UserGnosisProfile,
  message: string,
  response: string
): UserGnosisProfile {
  const now = new Date();

  // Analyze communication style
  const styleAnalysis = analyzeCommunicationStyle(message, profile.communicationStyle);

  // Merge with existing (weighted average favoring recent)
  const weight = Math.min(0.3, 1 / (profile.interactionCount + 1));

  if (styleAnalysis.formality !== undefined) {
    profile.communicationStyle.formality =
      profile.communicationStyle.formality * (1 - weight) + styleAnalysis.formality * weight;
  }
  if (styleAnalysis.technicality !== undefined) {
    profile.communicationStyle.technicality =
      profile.communicationStyle.technicality * (1 - weight) + styleAnalysis.technicality * weight;
  }
  if (styleAnalysis.emotionality !== undefined) {
    profile.communicationStyle.emotionality =
      profile.communicationStyle.emotionality * (1 - weight) + styleAnalysis.emotionality * weight;
  }
  if (styleAnalysis.abstractness !== undefined) {
    profile.communicationStyle.abstractness =
      profile.communicationStyle.abstractness * (1 - weight) + styleAnalysis.abstractness * weight;
  }

  // Analyze worldview
  const worldviewAnalysis = analyzeWorldview(message, profile.worldview);

  if (worldviewAnalysis.dominantMetaphors) {
    // Merge metaphors
    for (const newMetaphor of worldviewAnalysis.dominantMetaphors) {
      const existing = profile.worldview.dominantMetaphors.find(
        (m) => m.domain === newMetaphor.domain
      );
      if (existing) {
        existing.frequency += newMetaphor.frequency;
        existing.examples = [...new Set([...existing.examples, ...newMetaphor.examples])].slice(
          0,
          5
        );
      } else {
        profile.worldview.dominantMetaphors.push(newMetaphor);
      }
    }
  }

  if (worldviewAnalysis.valueSystem) {
    for (const newValue of worldviewAnalysis.valueSystem) {
      const existing = profile.worldview.valueSystem.find((v) => v.value === newValue.value);
      if (existing) {
        existing.strength = Math.min(1, existing.strength + 0.1);
        existing.evidence = [...new Set([...existing.evidence, ...newValue.evidence])].slice(0, 5);
      } else {
        profile.worldview.valueSystem.push(newValue);
      }
    }
  }

  if (worldviewAnalysis.knowledgeDomains) {
    for (const newDomain of worldviewAnalysis.knowledgeDomains) {
      const existing = profile.worldview.knowledgeDomains.find(
        (d) => d.domain === newDomain.domain
      );
      if (existing) {
        existing.lastDiscussed = now;
        // Could upgrade expertise based on demonstrated knowledge
      } else {
        profile.worldview.knowledgeDomains.push(newDomain);
      }
    }
  }

  // Update confidence scores
  profile.confidenceScores.communicationStyle = Math.min(
    0.95,
    profile.confidenceScores.communicationStyle + 0.05
  );
  profile.confidenceScores.worldview = Math.min(0.95, profile.confidenceScores.worldview + 0.03);
  profile.confidenceScores.overall =
    (profile.confidenceScores.communicationStyle +
      profile.confidenceScores.worldview +
      profile.confidenceScores.learningPreferences +
      profile.confidenceScores.interactionPattern) /
    4;

  // Update metadata
  profile.interactionCount++;
  profile.totalTokensExchanged += message.length + response.length;
  profile.lastInteraction = now;
  profile.lastProfileUpdate = now;

  return profile;
}

// =============================================================================
// DATABASE OPERATIONS
// =============================================================================

/**
 * Load user gnosis profile from database
 */
async function loadUserGnosisProfile(userId: string): Promise<UserGnosisProfile | null> {
  try {
    const row = (await db
      .prepare(
        `
      SELECT * FROM user_gnosis_profiles WHERE user_id = ?
    `
      )
      .get(userId)) as any;

    if (!row) return null;

    return {
      id: row.id,
      userId: row.user_id,
      communicationStyle: JSON.parse(row.communication_style || '{}'),
      worldview: JSON.parse(row.worldview || '{}'),
      learningPreferences: JSON.parse(row.learning_preferences || '{}'),
      interactionPattern: JSON.parse(row.interaction_pattern || '{}'),
      confidenceScores: JSON.parse(row.confidence_scores || '{}'),
      interactionCount: row.interaction_count || 0,
      totalTokensExchanged: row.total_tokens || 0,
      firstInteraction: new Date(row.first_interaction || Date.now()),
      lastInteraction: new Date(row.last_interaction || Date.now()),
      lastProfileUpdate: new Date(row.updated_at || Date.now()),
    };
  } catch (error) {
    console.warn('[UserGnosis] Failed to load profile:', error);
    return null;
  }
}

/**
 * Save user gnosis profile to database
 */
async function saveUserGnosisProfile(profile: UserGnosisProfile): Promise<void> {
  try {
    await db
      .prepare(
        `
      INSERT INTO user_gnosis_profiles (
        id, user_id, communication_style, worldview, learning_preferences,
        interaction_pattern, confidence_scores, interaction_count, total_tokens,
        first_interaction, last_interaction, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(user_id) DO UPDATE SET
        communication_style = excluded.communication_style,
        worldview = excluded.worldview,
        learning_preferences = excluded.learning_preferences,
        interaction_pattern = excluded.interaction_pattern,
        confidence_scores = excluded.confidence_scores,
        interaction_count = excluded.interaction_count,
        total_tokens = excluded.total_tokens,
        last_interaction = excluded.last_interaction,
        updated_at = excluded.updated_at
    `
      )
      .run(
        profile.id,
        profile.userId,
        JSON.stringify(profile.communicationStyle),
        JSON.stringify(profile.worldview),
        JSON.stringify(profile.learningPreferences),
        JSON.stringify(profile.interactionPattern),
        JSON.stringify(profile.confidenceScores),
        profile.interactionCount,
        profile.totalTokensExchanged,
        profile.firstInteraction.toISOString(),
        profile.lastInteraction.toISOString(),
        profile.firstInteraction.toISOString(),
        profile.lastProfileUpdate.toISOString()
      );
  } catch (error) {
    console.warn('[UserGnosis] Failed to save profile:', error);
  }
}

/**
 * Record an evolution event
 */
async function recordEvolution(
  userId: string,
  eventType: EvolutionRecord['eventType'],
  eventData: EvolutionRecord['eventData'],
  impact: number
): Promise<void> {
  try {
    await db
      .prepare(
        `
      INSERT INTO user_evolution_records (
        id, user_id, event_type, event_data, insight, impact_score, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `
      )
      .run(
        randomBytes(16).toString('hex'),
        userId,
        eventType,
        JSON.stringify(eventData),
        eventData.description,
        impact,
        new Date().toISOString()
      );
  } catch (error) {
    console.warn('[UserGnosis] Failed to record evolution:', error);
  }
}

/**
 * Get evolution history for a user
 */
async function getEvolutionHistory(userId: string, limit: number = 50): Promise<EvolutionRecord[]> {
  try {
    const rows = (await db
      .prepare(
        `
      SELECT * FROM user_evolution_records
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT ?
    `
      )
      .all(userId, limit)) as any[];

    return rows.map((row) => ({
      id: row.id,
      userId: row.user_id,
      timestamp: new Date(row.created_at),
      eventType: row.event_type,
      eventData: JSON.parse(row.event_data || '{}'),
      impact: row.impact_score,
    }));
  } catch (error) {
    console.warn('[UserGnosis] Failed to get evolution history:', error);
    return [];
  }
}

// =============================================================================
// EXPORTS
// =============================================================================

export {
  createUserGnosisProfile,
  updateUserGnosisProfile,
  loadUserGnosisProfile,
  saveUserGnosisProfile,
  recordEvolution,
  getEvolutionHistory,
};
