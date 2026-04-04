/**
 * WISDOM POINTS SYSTEM — Constants & Metadata
 *
 * Extracted from xp-system.ts.
 * Contains level metadata descriptions and point rules.
 */

import { WisdomLevel } from './xp-system';

// =============================================================================
// LEVEL METADATA
// =============================================================================

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
