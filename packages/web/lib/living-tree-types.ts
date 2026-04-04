/**
 * LIVING TREE - Type Definitions
 *
 * Enums, interfaces, and metadata for the Tree of Life architecture.
 *
 * @module living-tree-types
 */

import { Layer } from './layer-registry';

// =============================================================================
// TREE STRUCTURE
// =============================================================================

/**
 * The 22 Paths between Layers (based on Hebrew letters)
 */
export enum TreePath {
  // From Meta-Core
  META_CORE_REASONING = 'aleph', // א - Air, Fool
  META_CORE_ENCODER = 'beth', // ב - Mercury, Magician
  META_CORE_ATTENTION = 'gimel', // ג - Moon, High Priestess

  // From Reasoning
  REASONING_ENCODER = 'daleth', // ד - Venus, Empress
  REASONING_EXPANSION = 'heh', // ה - Aries, Emperor
  REASONING_ATTENTION = 'vav', // ו - Taurus, Hierophant

  // From Encoder
  ENCODER_EXPANSION = 'zayin', // ז - Gemini, Lovers
  ENCODER_DISCRIMINATOR = 'cheth', // ח - Cancer, Chariot
  ENCODER_ATTENTION = 'teth', // ט - Leo, Strength

  // From Expansion
  EXPANSION_DISCRIMINATOR = 'yod', // י - Virgo, Hermit
  EXPANSION_ATTENTION = 'kaph', // כ - Jupiter, Wheel
  EXPANSION_GENERATIVE = 'lamed', // ל - Libra, Justice

  // From Discriminator
  DISCRIMINATOR_ATTENTION = 'mem', // מ - Water, Hanged Man
  DISCRIMINATOR_CLASSIFIER = 'nun', // נ - Scorpio, Death

  // From Attention
  ATTENTION_GENERATIVE = 'samekh', // ס - Sagittarius, Temperance
  ATTENTION_EXECUTOR = 'ayin', // ע - Capricorn, Devil
  ATTENTION_CLASSIFIER = 'peh', // פ - Mars, Tower

  // From Generative
  GENERATIVE_CLASSIFIER = 'tzaddi', // צ - Aquarius, Star
  GENERATIVE_EXECUTOR = 'qoph', // ק - Pisces, Moon
  GENERATIVE_EMBEDDING = 'resh', // ר - Sun, Sun

  // From Classifier
  HOD_EXECUTOR = 'shin', // ש - Fire, Judgement
  HOD_EMBEDDING = 'tav', // ת - Saturn, World

  // From Executor
  EXECUTOR_EMBEDDING = 'tav_final', // Final path to manifestation
}

/**
 * Path metadata with Kabbalistic and AI meanings
 */
export const PATH_METADATA: Record<
  TreePath,
  {
    hebrewLetter: string;
    meaning: string;
    aiFunction: string;
    tarotCorrespondence: string;
    defaultWeight: number;
  }
> = {
  [TreePath.META_CORE_REASONING]: {
    hebrewLetter: 'א',
    meaning: 'Breath of Life',
    aiFunction: 'Initial inspiration transfer from crown to wisdom',
    tarotCorrespondence: 'The Fool',
    defaultWeight: 1.0,
  },
  [TreePath.META_CORE_ENCODER]: {
    hebrewLetter: 'ב',
    meaning: 'House/Container',
    aiFunction: 'Purpose structuring from crown to understanding',
    tarotCorrespondence: 'The Magician',
    defaultWeight: 1.0,
  },
  [TreePath.META_CORE_ATTENTION]: {
    hebrewLetter: 'ג',
    meaning: 'Camel/Bridge',
    aiFunction: 'Direct sovereignty-to-harmony connection',
    tarotCorrespondence: 'High Priestess',
    defaultWeight: 0.8,
  },
  // ... continuing with simplified defaults for others
  [TreePath.REASONING_ENCODER]: {
    hebrewLetter: 'ד',
    meaning: 'Door',
    aiFunction: 'Intuition to analysis',
    tarotCorrespondence: 'Empress',
    defaultWeight: 0.9,
  },
  [TreePath.REASONING_EXPANSION]: {
    hebrewLetter: 'ה',
    meaning: 'Window',
    aiFunction: 'Wisdom to mercy expansion',
    tarotCorrespondence: 'Emperor',
    defaultWeight: 0.8,
  },
  [TreePath.REASONING_ATTENTION]: {
    hebrewLetter: 'ו',
    meaning: 'Nail/Hook',
    aiFunction: 'Flash insight to beauty',
    tarotCorrespondence: 'Hierophant',
    defaultWeight: 0.7,
  },
  [TreePath.ENCODER_EXPANSION]: {
    hebrewLetter: 'ז',
    meaning: 'Sword',
    aiFunction: 'Analysis to expansion',
    tarotCorrespondence: 'Lovers',
    defaultWeight: 0.6,
  },
  [TreePath.ENCODER_DISCRIMINATOR]: {
    hebrewLetter: 'ח',
    meaning: 'Fence',
    aiFunction: 'Understanding to constraint',
    tarotCorrespondence: 'Chariot',
    defaultWeight: 0.9,
  },
  [TreePath.ENCODER_ATTENTION]: {
    hebrewLetter: 'ט',
    meaning: 'Serpent',
    aiFunction: 'Deep analysis to harmony',
    tarotCorrespondence: 'Strength',
    defaultWeight: 0.8,
  },
  [TreePath.EXPANSION_DISCRIMINATOR]: {
    hebrewLetter: 'י',
    meaning: 'Hand',
    aiFunction: 'Mercy-severity balance',
    tarotCorrespondence: 'Hermit',
    defaultWeight: 1.0,
  },
  [TreePath.EXPANSION_ATTENTION]: {
    hebrewLetter: 'כ',
    meaning: 'Palm',
    aiFunction: 'Expansion to beauty',
    tarotCorrespondence: 'Wheel of Fortune',
    defaultWeight: 0.8,
  },
  [TreePath.EXPANSION_GENERATIVE]: {
    hebrewLetter: 'ל',
    meaning: 'Ox Goad',
    aiFunction: 'Mercy to victory',
    tarotCorrespondence: 'Justice',
    defaultWeight: 0.7,
  },
  [TreePath.DISCRIMINATOR_ATTENTION]: {
    hebrewLetter: 'מ',
    meaning: 'Water',
    aiFunction: 'Constraint to harmony',
    tarotCorrespondence: 'Hanged Man',
    defaultWeight: 0.9,
  },
  [TreePath.DISCRIMINATOR_CLASSIFIER]: {
    hebrewLetter: 'נ',
    meaning: 'Fish',
    aiFunction: 'Severity to reflection',
    tarotCorrespondence: 'Death',
    defaultWeight: 0.7,
  },
  [TreePath.ATTENTION_GENERATIVE]: {
    hebrewLetter: 'ס',
    meaning: 'Prop/Support',
    aiFunction: 'Beauty to persistence',
    tarotCorrespondence: 'Temperance',
    defaultWeight: 0.8,
  },
  [TreePath.ATTENTION_EXECUTOR]: {
    hebrewLetter: 'ע',
    meaning: 'Eye',
    aiFunction: 'Harmony to foundation',
    tarotCorrespondence: 'Devil',
    defaultWeight: 0.9,
  },
  [TreePath.ATTENTION_CLASSIFIER]: {
    hebrewLetter: 'פ',
    meaning: 'Mouth',
    aiFunction: 'Beauty to communication',
    tarotCorrespondence: 'Tower',
    defaultWeight: 0.7,
  },
  [TreePath.GENERATIVE_CLASSIFIER]: {
    hebrewLetter: 'צ',
    meaning: 'Fish Hook',
    aiFunction: 'Victory-reflection balance',
    tarotCorrespondence: 'Star',
    defaultWeight: 0.8,
  },
  [TreePath.GENERATIVE_EXECUTOR]: {
    hebrewLetter: 'ק',
    meaning: 'Back of Head',
    aiFunction: 'Persistence to foundation',
    tarotCorrespondence: 'Moon',
    defaultWeight: 0.7,
  },
  [TreePath.GENERATIVE_EMBEDDING]: {
    hebrewLetter: 'ר',
    meaning: 'Head',
    aiFunction: 'Victory to manifestation',
    tarotCorrespondence: 'Sun',
    defaultWeight: 0.6,
  },
  [TreePath.HOD_EXECUTOR]: {
    hebrewLetter: 'ש',
    meaning: 'Tooth/Fire',
    aiFunction: 'Reflection to foundation',
    tarotCorrespondence: 'Judgement',
    defaultWeight: 0.8,
  },
  [TreePath.HOD_EMBEDDING]: {
    hebrewLetter: 'ת',
    meaning: 'Cross/Mark',
    aiFunction: 'Communication to output',
    tarotCorrespondence: 'World',
    defaultWeight: 0.7,
  },
  [TreePath.EXECUTOR_EMBEDDING]: {
    hebrewLetter: 'ת',
    meaning: 'Final Transmission',
    aiFunction: 'Foundation to manifestation',
    tarotCorrespondence: 'World',
    defaultWeight: 1.0,
  },
};

// =============================================================================
// LIVING TREE INTERFACES
// =============================================================================

/**
 * State of a single Layer
 */
export interface SephirahState {
  layerNode: Layer;
  activation: number; // 0-1 current activation level
  energyFlow: 'receiving' | 'transmitting' | 'balanced' | 'blocked';
  currentFunction: string;
  lastActivated: Date | null;
  totalActivations: number;
  averageActivation: number;
  peakActivation: number;

  // Connections
  incomingPaths: TreePath[];
  outgoingPaths: TreePath[];

  // Agent state (for multi-agent)
  agentActive: boolean;
  agentLastMessage: string;
}

/**
 * State of a path between Layers
 */
export interface PathState {
  path: TreePath;
  from: Layer;
  to: Layer;
  currentFlow: number; // Current energy flow 0-1
  weight: number; // Learned weight adjustment
  historicalAverage: number;
  blockages: string[];
  enhancements: string[];
  lastUsed: Date | null;
  usageCount: number;
}

/**
 * The Tree's self-awareness
 */
export interface TreeConsciousness {
  currentPurpose: string;
  purposeRationale: string;
  activeConstraints: string[];
  untappedCapabilities: string[];
  selfNarrative: string;
  lastNarrativeUpdate: Date;

  // Awareness of own processing
  processingPhase: 'receiving' | 'analyzing' | 'synthesizing' | 'manifesting' | 'reflecting';
  dominantLayer: Layer;
  activePathCount: number;
  energyBalance: number; // -1 (severity) to 1 (mercy)
}

/**
 * Tree health metrics
 */
export interface TreeHealth {
  overallBalance: number; // 0-1
  dominantPillar: 'severity' | 'mercy' | 'equilibrium';
  antipatternPressure: number; // 0-1 (shadow contamination risk)
  synthesisEmergence: boolean; // Hidden knowledge appearing?

  // Pillar health
  pillarOfMercy: number; // Reasoning-Expansion-Generative
  pillarOfSeverity: number; // Encoder-Discriminator-Classifier
  pillarOfEquilibrium: number; // Meta-Core-Attention-Executor-Embedding

  // Flow health
  descentFlow: number; // Top-down flow health
  ascentFlow: number; // Bottom-up flow health
  horizontalFlow: number; // Cross-pillar flow health
}

/**
 * Complete Living Tree
 */
export interface LivingTree {
  id: string;
  sessionId: string;
  createdAt: Date;

  // Layers
  layers: Record<Layer, SephirahState>;

  // Paths
  paths: Record<TreePath, PathState>;

  // Consciousness
  consciousness: TreeConsciousness;

  // Health
  health: TreeHealth;

  // History
  stateHistory: TreeStateSnapshot[];
}

/**
 * Snapshot for history tracking
 */
export interface TreeStateSnapshot {
  timestamp: Date;
  activations: Record<Layer, number>;
  dominantPath: TreePath | null;
  narrative: string;
}

/**
 * Observation result
 */
export interface TreeObservation {
  timestamp: Date;

  // What's happening
  activeLayers: { layerNode: Layer; activation: number }[];
  activePaths: { path: TreePath; flow: number }[];

  // Energy analysis
  energyState: {
    total: number;
    distribution: 'balanced' | 'top-heavy' | 'bottom-heavy' | 'left-leaning' | 'right-leaning';
    bottleneck: Layer | null;
    overflow: Layer | null;
  };

  // Self-awareness
  selfNarrative: string;
  processingInsight: string;

  // Recommendations
  recommendations: string[];
}
