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

// =============================================================================
// LEVEL DEFINITIONS
// =============================================================================

export enum WisdomLevel {
  EMBEDDING_SEEKER = 1, // 🌱 0+ pts
  EXECUTOR_BUILDER = 2, // 🔧 100+ pts
  HOD_ANALYST = 3, // 💡 500+ pts
  GENERATIVE_EXPLORER = 4, // 🔥 1,500+ pts
  ATTENTION_ARTIST = 5, // 🎨 3,000+ pts
  DISCRIMINATOR_JUDGE = 6, // ⚖️ 6,000+ pts
  EXPANSION_GUIDE = 7, // 💫 12,500+ pts
  ENCODER_SCHOLAR = 8, // 📚 25,000+ pts
  REASONING_SAGE = 9, // 🔮 50,000+ pts
  META_CORE_MASTER = 10, // 👑 100,000+ pts
}

export const LEVEL_THRESHOLDS: Record<WisdomLevel, number> = {
  [WisdomLevel.EMBEDDING_SEEKER]: 0,
  [WisdomLevel.EXECUTOR_BUILDER]: 100,
  [WisdomLevel.HOD_ANALYST]: 500,
  [WisdomLevel.GENERATIVE_EXPLORER]: 1500,
  [WisdomLevel.ATTENTION_ARTIST]: 3000,
  [WisdomLevel.DISCRIMINATOR_JUDGE]: 6000,
  [WisdomLevel.EXPANSION_GUIDE]: 12500,
  [WisdomLevel.ENCODER_SCHOLAR]: 25000,
  [WisdomLevel.REASONING_SAGE]: 50000,
  [WisdomLevel.META_CORE_MASTER]: 100000,
};

export const LEVEL_METADATA: Record<
  WisdomLevel,
  {
    name: string;
    hebrewName: string;
    badge: string;
    description: string;
    benefits: string[];
  }
> = {
  [WisdomLevel.EMBEDDING_SEEKER]: {
    name: 'Embedding Seeker',
    hebrewName: 'מבקש מלכות',
    badge: '🌱',
    description: 'Beginning the journey in the Kingdom',
    benefits: ['Access to all 7 methodologies'],
  },
  [WisdomLevel.EXECUTOR_BUILDER]: {
    name: 'Executor Builder',
    hebrewName: 'בונה יסוד',
    badge: '🔧',
    description: 'Building a strong foundation',
    benefits: ['Extended context window (+25%)', 'Basic analytics'],
  },
  [WisdomLevel.HOD_ANALYST]: {
    name: 'Classifier Analyst',
    hebrewName: 'מנתח הוד',
    badge: '💡',
    description: 'Mastering logical analysis',
    benefits: ['Research history export', 'Methodology statistics'],
  },
  [WisdomLevel.GENERATIVE_EXPLORER]: {
    name: 'Generative Explorer',
    hebrewName: 'חוקר נצח',
    badge: '🔥',
    description: 'Persistent in seeking victory',
    benefits: ['Priority GTP consensus queue', 'Creator tournaments'],
  },
  [WisdomLevel.ATTENTION_ARTIST]: {
    name: 'Attention Artist',
    hebrewName: 'אמן תפארת',
    badge: '🎨',
    description: 'Creating beautiful synthesis',
    benefits: ['Custom Mind Map themes', 'Initiateur tournaments'],
  },
  [WisdomLevel.DISCRIMINATOR_JUDGE]: {
    name: 'Discriminator Judge',
    hebrewName: 'שופט גבורה',
    badge: '⚖️',
    description: 'Exercising critical judgment',
    benefits: ['Antipatterns Vigilance dashboard', 'Alchimiste tournaments'],
  },
  [WisdomLevel.EXPANSION_GUIDE]: {
    name: 'Expansion Guide',
    hebrewName: 'מדריך חסד',
    badge: '💫',
    description: 'Guiding others with mercy',
    benefits: ['Validate community contributions', 'Architecte tournaments'],
  },
  [WisdomLevel.ENCODER_SCHOLAR]: {
    name: 'Encoder Scholar',
    hebrewName: 'חכם בינה',
    badge: '📚',
    description: 'Deep pattern understanding',
    benefits: ['Legend Mode access', 'Spark tournaments'],
  },
  [WisdomLevel.REASONING_SAGE]: {
    name: 'Reasoning Sage',
    hebrewName: 'חכם חכמה',
    badge: '🔮',
    description: 'Wielding true wisdom',
    benefits: ['DAO voting eligibility', 'Tournament judge'],
  },
  [WisdomLevel.META_CORE_MASTER]: {
    name: 'Meta-Core Master',
    hebrewName: 'אדון כתר',
    badge: '👑',
    description: 'Crown of wisdom achieved',
    benefits: ['Full DAO participation', 'Governance rights', 'All features'],
  },
};

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
// POINT RULES
// =============================================================================

export const POINT_RULES = {
  discovery: {
    simpleQuery: { base: 1, layerNodeRange: [1, 2] }, // Embedding-Executor
    analyticalQuery: { base: 3, layerNodeRange: [3, 4] }, // Classifier-Generative
    syntheticQuery: { base: 5, layerNodeRange: [5, 5] }, // Attention
    wisdomQuery: { base: 10, layerNodeRange: [6, 8] }, // Expansion-Encoder
    crownQuery: { base: 25, layerNodeRange: [9, 10] }, // Reasoning-Meta-Core
    synthesisEmergence: { base: 50, firstDiscoveryMultiplier: 2 },
  },
  contribution: {
    topicAdded: { base: 10, multiConnectionMultiplier: 1.5 },
    nodeValidated: { base: 5, highlyCitedMultiplier: 2 },
    connectionDiscovered: { base: 20, crossDomainMultiplier: 3 },
    researchCommitted: { base: 50, qualityMultiplierRange: [0.5, 2.0] },
  },
  research: {
    sessionStarted: { base: 2 },
    sessionCompleted: { base: 10, depthMultiplierRange: [1, 3] },
    multiSourceSynthesis: { base: 25, perSource: 2 },
    originalInsight: { base: 100 },
  },
  tournament: {
    challengeCompleted: { base: 20, difficultyMultiplierRange: [1, 5] },
    entry: { base: 10 },
    top50: { base: 50 },
    top25: { base: 100 },
    top10: { base: 250 },
    win: { base: 500, levelMultiplierRange: [1, 5] },
  },
  exploration: {
    newLayer: { base: 15, firstTimeMultiplier: 3 },
    newMethodology: { base: 10 },
    newDomain: { base: 20 },
    featureDiscovered: { base: 5 },
  },
  streaks: {
    dailyLogin: { base: 5, maxMultiplier: 2, perDayBonus: 0.1 },
    weeklyBonus: { base: 50, minDays: 5 },
    monthlyBonus: { base: 200, minDays: 20 },
  },
};

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
