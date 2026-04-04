/**
 * WISDOM POINTS SYSTEM
 *
 * The Chokhmah (חכמה) Ranking System
 *
 * Users earn Wisdom Points through:
 * - Discovery: Quality queries and insights
 * - Contribution: Adding knowledge to memory base
 * - Research: Deep investigation and synthesis
 * - Tournament: Competitive excellence
 * - Exploration: Breadth of engagement
 *
 * Points determine user level (Embedding Seeker → Meta-Core Master)
 * and unlock features, tournament access, and DAO eligibility.
 *
 * @module wisdom-points
 */

import { Layer } from './layer-registry';
import { randomBytes } from 'crypto';
import {
  loadWisdomProfile,
  saveWisdomProfile,
  savePointTransaction,
  getPointTransactions,
  getLeaderboard,
} from './xp-system-db';
import { LEVEL_METADATA } from './xp-system-constants';
import { WisdomLevel, LEVEL_THRESHOLDS, POINT_RULES } from './xp-system-rules';

export { WisdomLevel, LEVEL_THRESHOLDS, POINT_RULES };

// =============================================================================
// POINT CATEGORIES
// =============================================================================

export type PointCategory =
  | 'discovery'
  | 'contribution'
  | 'research'
  | 'tournament'
  | 'exploration';

export interface DiscoveryPoints {
  points: number;
  queriesCount: number;
  avgQueryDepth: number;
  insightsGenerated: number;
  methodologiesExplored: number;
}

export interface ContributionPoints {
  points: number;
  knowledgeNodesAdded: number;
  topicsCreated: number;
  connectionsDiscovered: number;
  citationsReceived: number;
}

export interface ResearchPoints {
  points: number;
  researchSessionsCompleted: number;
  averageResearchDepth: number;
  uniqueSourcesUsed: number;
  synthesisQuality: number;
}

export interface TournamentPoints {
  points: number;
  tournamentsEntered: number;
  tournamentsWon: number;
  challengesCompleted: number;
  currentStreak: number;
  bestPlacement: number;
}

export interface ExplorationPoints {
  points: number;
  layersVisited: Layer[];
  methodologiesUsed: string[];
  domainsExplored: string[];
  featuresDiscovered: number;
}

// =============================================================================
// WISDOM PROFILE
// =============================================================================

export interface WisdomProfile {
  id: string;
  userId: string;

  // Total score
  totalPoints: number;
  currentLevel: WisdomLevel;

  // Category breakdown
  discovery: DiscoveryPoints;
  contribution: ContributionPoints;
  research: ResearchPoints;
  tournament: TournamentPoints;
  exploration: ExplorationPoints;

  // Temporal
  dailyPoints: number;
  weeklyPoints: number;
  monthlyPoints: number;

  // Streaks
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: Date | null;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

// =============================================================================
// POINT TRANSACTION
// =============================================================================

export interface PointTransaction {
  id: string;
  userId: string;
  points: number;
  category: PointCategory;
  action: string;
  description: string;
  multiplier: number;
  streakBonus: number;
  relatedEntityType?: string;
  relatedEntityId?: string;
  createdAt: Date;
}

// =============================================================================
// CORE FUNCTIONS
// =============================================================================

/**
 * Create a new wisdom profile for a user
 */
function createWisdomProfile(userId: string): WisdomProfile {
  const now = new Date();

  return {
    id: randomBytes(16).toString('hex'),
    userId,
    totalPoints: 0,
    currentLevel: WisdomLevel.EMBEDDING_SEEKER,

    discovery: {
      points: 0,
      queriesCount: 0,
      avgQueryDepth: 0,
      insightsGenerated: 0,
      methodologiesExplored: 0,
    },
    contribution: {
      points: 0,
      knowledgeNodesAdded: 0,
      topicsCreated: 0,
      connectionsDiscovered: 0,
      citationsReceived: 0,
    },
    research: {
      points: 0,
      researchSessionsCompleted: 0,
      averageResearchDepth: 0,
      uniqueSourcesUsed: 0,
      synthesisQuality: 0,
    },
    tournament: {
      points: 0,
      tournamentsEntered: 0,
      tournamentsWon: 0,
      challengesCompleted: 0,
      currentStreak: 0,
      bestPlacement: 0,
    },
    exploration: {
      points: 0,
      layersVisited: [],
      methodologiesUsed: [],
      domainsExplored: [],
      featuresDiscovered: 0,
    },

    dailyPoints: 0,
    weeklyPoints: 0,
    monthlyPoints: 0,

    currentStreak: 0,
    longestStreak: 0,
    lastActiveDate: null,

    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Calculate level from total points
 */
function calculateLevel(totalPoints: number): WisdomLevel {
  const levels = Object.entries(LEVEL_THRESHOLDS)
    .map(([level, threshold]) => ({ level: parseInt(level), threshold }))
    .sort((a, b) => b.threshold - a.threshold);

  for (const { level, threshold } of levels) {
    if (totalPoints >= threshold) {
      return level as WisdomLevel;
    }
  }

  return WisdomLevel.EMBEDDING_SEEKER;
}

/**
 * Calculate points for a query based on Layer level
 */
function calculateQueryPoints(layerNodeLevel: Layer): number {
  const rules = POINT_RULES.discovery;

  if (layerNodeLevel <= 2) return rules.simpleQuery.base;
  if (layerNodeLevel <= 4) return rules.analyticalQuery.base;
  if (layerNodeLevel === 5) return rules.syntheticQuery.base;
  if (layerNodeLevel <= 8) return rules.wisdomQuery.base;
  if (layerNodeLevel <= 10) return rules.crownQuery.base;
  if (layerNodeLevel === 11) return rules.synthesisEmergence.base; // Synthesis

  return 1;
}

/**
 * Award points to a user
 */
async function awardPoints(
  userId: string,
  category: PointCategory,
  action: string,
  basePoints: number,
  options: {
    description?: string;
    multiplier?: number;
    relatedEntityType?: string;
    relatedEntityId?: string;
  } = {}
): Promise<PointTransaction> {
  const { description = '', multiplier = 1, relatedEntityType, relatedEntityId } = options;

  // Load profile
  let profile = await loadWisdomProfile(userId);
  if (!profile) {
    profile = createWisdomProfile(userId);
  }

  // Calculate streak bonus
  const today = new Date().toDateString();
  const lastActive = profile.lastActiveDate?.toDateString();
  let streakBonus = 0;

  if (lastActive !== today) {
    // New day - check streak
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    if (lastActive === yesterday.toDateString()) {
      // Consecutive day
      profile.currentStreak++;
      streakBonus = Math.min(
        POINT_RULES.streaks.dailyLogin.base * POINT_RULES.streaks.dailyLogin.maxMultiplier,
        POINT_RULES.streaks.dailyLogin.base *
          (1 + profile.currentStreak * POINT_RULES.streaks.dailyLogin.perDayBonus)
      );
    } else if (lastActive) {
      // Streak broken
      profile.currentStreak = 1;
    } else {
      // First activity
      profile.currentStreak = 1;
    }

    if (profile.currentStreak > profile.longestStreak) {
      profile.longestStreak = profile.currentStreak;
    }

    profile.lastActiveDate = new Date();
    profile.dailyPoints = 0; // Reset daily
  }

  // Calculate final points
  const finalPoints = Math.round(basePoints * multiplier) + streakBonus;

  // Create transaction
  const transaction: PointTransaction = {
    id: randomBytes(16).toString('hex'),
    userId,
    points: finalPoints,
    category,
    action,
    description,
    multiplier,
    streakBonus,
    relatedEntityType,
    relatedEntityId,
    createdAt: new Date(),
  };

  // Update profile
  profile.totalPoints += finalPoints;
  profile[category].points += finalPoints;
  profile.dailyPoints += finalPoints;
  profile.weeklyPoints += finalPoints;
  profile.monthlyPoints += finalPoints;
  profile.currentLevel = calculateLevel(profile.totalPoints);
  profile.updatedAt = new Date();

  // Update category-specific metrics
  switch (category) {
    case 'discovery':
      profile.discovery.queriesCount++;
      break;
    case 'contribution':
      if (action === 'topic_added') profile.contribution.topicsCreated++;
      if (action === 'node_added') profile.contribution.knowledgeNodesAdded++;
      if (action === 'connection_discovered') profile.contribution.connectionsDiscovered++;
      break;
    case 'research':
      if (action === 'session_completed') profile.research.researchSessionsCompleted++;
      break;
    case 'tournament':
      if (action === 'entry') profile.tournament.tournamentsEntered++;
      if (action === 'win') profile.tournament.tournamentsWon++;
      if (action === 'challenge_completed') profile.tournament.challengesCompleted++;
      break;
  }

  // Save
  await saveWisdomProfile(profile);
  await savePointTransaction(transaction);

  return transaction;
}

/**
 * Award exploration points for visiting a new Layer
 */
async function awardLayerExploration(
  userId: string,
  layerNode: Layer
): Promise<PointTransaction | null> {
  const profile = await loadWisdomProfile(userId);
  if (!profile) return null;

  // Check if already visited
  if (profile.exploration.layersVisited.includes(layerNode)) {
    return null;
  }

  // First time bonus
  const isFirst = profile.exploration.layersVisited.length === 0;
  const multiplier = isFirst ? POINT_RULES.exploration.newLayer.firstTimeMultiplier : 1;

  // Update visited layers
  profile.exploration.layersVisited.push(layerNode);
  await saveWisdomProfile(profile);

  return awardPoints(
    userId,
    'exploration',
    'new_layerNode',
    POINT_RULES.exploration.newLayer.base,
    {
      description: `Reached ${Layer[layerNode]} for the first time`,
      multiplier,
      relatedEntityType: 'layerNode',
      relatedEntityId: layerNode.toString(),
    }
  );
}

/**
 * Award exploration points for using a new methodology
 */
async function awardMethodologyExploration(
  userId: string,
  methodology: string
): Promise<PointTransaction | null> {
  const profile = await loadWisdomProfile(userId);
  if (!profile) return null;

  // Check if already used
  if (profile.exploration.methodologiesUsed.includes(methodology)) {
    return null;
  }

  // Update used methodologies
  profile.exploration.methodologiesUsed.push(methodology);
  await saveWisdomProfile(profile);

  return awardPoints(
    userId,
    'exploration',
    'new_methodology',
    POINT_RULES.exploration.newMethodology.base,
    {
      description: `Used ${methodology} methodology for the first time`,
      relatedEntityType: 'methodology',
      relatedEntityId: methodology,
    }
  );
}

// =============================================================================
// EXPORTS
// =============================================================================

export {
  createWisdomProfile,
  calculateLevel,
  calculateQueryPoints,
  awardPoints,
  awardLayerExploration,
  awardMethodologyExploration,
};

// Re-export database operations from xp-system-db
export {
  loadWisdomProfile,
  saveWisdomProfile,
  getPointTransactions,
  getLeaderboard,
} from './xp-system-db';
