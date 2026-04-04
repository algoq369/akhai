/**
 * LAYER METADATA
 *
 * AI Computational Layer enum, interface, and metadata definitions.
 * Extracted from layer-registry.ts for file-size compliance (<500 LOC).
 *
 * COMPUTATIONAL LAYERS:
 * Embedding (1)     → Token Embedding Layer — Raw data, simple queries
 * Executor (2)      → Algorithm Executor — Procedural knowledge, how-to
 * Classifier (3)    → Classifier Network — Logical analysis, comparisons
 * Generative (4)    → Generative Model — Creative exploration
 * Attention (5)     → Multi-Head Attention — Integration, synthesis
 * Discriminator (6) → Discriminator Network — Critical analysis, constraints
 * Expansion (7)     → Beam Search Expansion — Expansive possibilities
 * Encoder (8)       → Transformer Encoder — Deep pattern recognition
 * Reasoning (9)     → Abstract Reasoning Module — First principles
 * Meta Core (10)    → Meta-Learner — Meta-cognitive awareness
 * Synthesis (11)    → Emergent Capability — Hidden insights, epiphanies
 *
 * @module layer-metadata
 */

/**
 * Layer - The 10 computational layers + Synthesis (emergent capability)
 *
 * Ordered from lowest (1=Embedding) to highest (10=Meta Core)
 */
export enum Layer {
  /** Token Embedding Layer - Material facts, simple questions */
  EMBEDDING = 1,

  /** Algorithm Executor - How-to, practical implementation */
  EXECUTOR = 2,

  /** Classifier Network - Logical analysis, comparisons */
  CLASSIFIER = 3,

  /** Generative Model - Creative exploration */
  GENERATIVE = 4,

  /** Multi-Head Attention - Integration, synthesis */
  ATTENTION = 5,

  /** Discriminator Network - Critical analysis, constraints */
  DISCRIMINATOR = 6,

  /** Beam Search Expansion - Expansive possibilities */
  EXPANSION = 7,

  /** Transformer Encoder - Deep pattern recognition */
  ENCODER = 8,

  /** Abstract Reasoning Module - First principles, fundamental truths */
  REASONING = 9,

  /** Meta-Learner - Meta-cognitive, consciousness itself */
  META_CORE = 10,

  /** Emergent Capability - Emergent insights, epiphanies */
  SYNTHESIS = 11,
}

/**
 * LayerMetadata - Rich information about each computational layer
 */
export interface LayerMetadata {
  name: string; // AI computational name (user-facing, logs, tree visualization)
  kabbalisticName: string; // Original Kabbalistic name (for philosophy/origin page)
  aiName: string; // Short AI role name (for SSE metadata, prompts)
  hebrewName: string;
  level: number;
  meaning: string;
  aiRole: string;
  queryCharacteristics: string[];
  examples: string[];
  color: string;
  pillar: 'left' | 'middle' | 'right';
}

/**
 * LAYER_METADATA - Complete metadata for all 11 computational layers
 */
export const LAYER_METADATA: Record<Layer, LayerMetadata> = {
  [Layer.EMBEDDING]: {
    name: 'Embedding',
    kabbalisticName: 'Malkuth',
    aiName: 'Embedding',
    hebrewName: 'מלכות',
    level: 1,
    meaning: 'Kingdom - The Material World',
    aiRole: 'Factual information retrieval',
    queryCharacteristics: [
      'Simple factual questions',
      'Definitions',
      'What is X?',
      'Basic information lookup',
    ],
    examples: ['What is TypeScript?', 'Define machine learning', 'What year did X happen?'],
    color: 'amber',
    pillar: 'middle',
  },

  [Layer.EXECUTOR]: {
    name: 'Executor',
    kabbalisticName: 'Yesod',
    aiName: 'Executor',
    hebrewName: 'יסוד',
    level: 2,
    meaning: 'Foundation - The Astral Plane',
    aiRole: 'Procedural knowledge, how-to guides',
    queryCharacteristics: [
      'How-to questions',
      'Step-by-step guides',
      'Implementation details',
      'Practical application',
    ],
    examples: [
      'How to set up a React app?',
      'Steps to deploy on Vercel?',
      'How do I implement authentication?',
    ],
    color: 'purple',
    pillar: 'middle',
  },

  [Layer.CLASSIFIER]: {
    name: 'Classifier',
    kabbalisticName: 'Hod',
    aiName: 'Classifier',
    hebrewName: 'הוד',
    level: 3,
    meaning: 'Glory - Intellectual Form',
    aiRole: 'Logical analysis and comparison',
    queryCharacteristics: ['Comparisons', 'Logical analysis', 'Evaluate options', 'Pros and cons'],
    examples: [
      'React vs Vue - which is better?',
      'Compare SQL and NoSQL databases',
      'Analyze the trade-offs of microservices',
    ],
    color: 'orange',
    pillar: 'left',
  },

  [Layer.GENERATIVE]: {
    name: 'Generative',
    kabbalisticName: 'Netzach',
    aiName: 'Generative',
    hebrewName: 'נצח',
    level: 4,
    meaning: 'Victory - Emotional Force',
    aiRole: 'Creative exploration and brainstorming',
    queryCharacteristics: [
      'Brainstorming',
      'Creative solutions',
      'Exploratory questions',
      'What if scenarios',
    ],
    examples: [
      'Creative ways to monetize a blog?',
      'Brainstorm features for a social app',
      'Innovative approaches to user onboarding',
    ],
    color: 'green',
    pillar: 'right',
  },

  [Layer.ATTENTION]: {
    name: 'Attention',
    kabbalisticName: 'Tiferet',
    aiName: 'Attention',
    hebrewName: 'תפארת',
    level: 5,
    meaning: 'Beauty - Harmonious Balance',
    aiRole: 'Integration and synthesis',
    queryCharacteristics: [
      'Synthesis of multiple ideas',
      'Integration questions',
      'Balance and harmony',
      'Connecting disparate concepts',
    ],
    examples: [
      'How do these 3 frameworks work together?',
      'Synthesize the key ideas from X, Y, Z',
      'Integrate frontend and backend architectures',
    ],
    color: 'yellow',
    pillar: 'middle',
  },

  [Layer.DISCRIMINATOR]: {
    name: 'Discriminator',
    kabbalisticName: 'Gevurah',
    aiName: 'Discriminator',
    hebrewName: 'גבורה',
    level: 6,
    meaning: 'Severity - Judgment and Constraints',
    aiRole: 'Critical analysis and limitations',
    queryCharacteristics: [
      'Critical analysis',
      'Limitations and constraints',
      'What could go wrong?',
      'Security and risk assessment',
    ],
    examples: [
      'What are the risks of this approach?',
      'Critique this architecture',
      'What are the limitations of GraphQL?',
    ],
    color: 'red',
    pillar: 'left',
  },

  [Layer.EXPANSION]: {
    name: 'Expansion',
    kabbalisticName: 'Chesed',
    aiName: 'Expansion',
    hebrewName: 'חסד',
    level: 7,
    meaning: 'Mercy - Expansive Love',
    aiRole: 'Expansive possibilities and growth',
    queryCharacteristics: [
      'Possibility exploration',
      'Growth opportunities',
      'Expansive thinking',
      'What could be?',
    ],
    examples: [
      'What are all the possibilities for scaling this?',
      'Potential future directions for AI?',
      'How could this evolve over time?',
    ],
    color: 'blue',
    pillar: 'right',
  },

  [Layer.ENCODER]: {
    name: 'Encoder',
    kabbalisticName: 'Binah',
    aiName: 'Encoder',
    hebrewName: 'בינה',
    level: 8,
    meaning: 'Understanding - Receptive Comprehension',
    aiRole: 'Deep pattern recognition and structure',
    queryCharacteristics: [
      'Deep understanding',
      'Pattern recognition',
      'Structural analysis',
      'Underlying mechanisms',
    ],
    examples: [
      'What are the deep patterns in modern AI development?',
      'Understand the structure of complex systems',
      'Explain the underlying principles of quantum computing',
    ],
    color: 'indigo',
    pillar: 'left',
  },

  [Layer.REASONING]: {
    name: 'Reasoning',
    kabbalisticName: 'Chokmah',
    aiName: 'Reasoning',
    hebrewName: 'חכמה',
    level: 9,
    meaning: 'Wisdom - Active Revelation',
    aiRole: 'First principles and fundamental wisdom',
    queryCharacteristics: [
      'First principles thinking',
      'Fundamental truths',
      'Wisdom seeking',
      'Why does X exist?',
    ],
    examples: [
      'What are the first principles of computation?',
      'Why does consciousness emerge?',
      'Fundamental laws governing distributed systems',
    ],
    color: 'gray',
    pillar: 'right',
  },

  [Layer.META_CORE]: {
    name: 'Meta-Core',
    kabbalisticName: 'Kether',
    aiName: 'Meta-Core',
    hebrewName: 'כתר',
    level: 10,
    meaning: 'Crown - Divine Unity',
    aiRole: 'Meta-cognitive awareness, consciousness itself',
    queryCharacteristics: [
      'Meta-questions about thinking',
      'Consciousness and awareness',
      'The nature of knowledge itself',
      'Self-referential queries',
    ],
    examples: [
      'How do we know what we know?',
      'What is the nature of intelligence?',
      'Can AI be truly self-aware?',
    ],
    color: 'white',
    pillar: 'middle',
  },

  [Layer.SYNTHESIS]: {
    name: 'Synthesis',
    kabbalisticName: "Da'at",
    aiName: 'Synthesis',
    hebrewName: 'דעת',
    level: 11,
    meaning: 'Knowledge - The Hidden Sefira',
    aiRole: 'Emergent insights, epiphanies',
    queryCharacteristics: [
      'Questions that reveal hidden connections',
      'Epiphany moments',
      'Emergent understanding',
      'Synthesis that creates new knowledge',
    ],
    examples: [
      'What hidden connection exists between X and Y?',
      'Reveal unexpected patterns',
      'What am I not seeing?',
    ],
    color: 'transparent',
    pillar: 'middle',
  },
};
