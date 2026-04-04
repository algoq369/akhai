/**
 * XP SYSTEM RULES
 *
 * Point rules and level definitions for the Chokhmah Ranking System.
 * Extracted from xp-system.ts for modularity.
 *
 * @module xp-system-rules
 */

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
