/**
 * Twelve Cognitive Lenses — single source of truth.
 * 7 Yechidah (self-reflection) + 5 Hermetic (interpretive frame).
 */

export interface Lens {
  id: string;
  name: string;
  sigil: string;
  domain: 'yechidah' | 'hermetic';
  guidance: string;
  color: string;
}

export const COGNITIVE_LENSES: readonly Lens[] = [
  // ── Yechidah (self-reflection on process) ──
  {
    id: 'mirror',
    name: 'Mirror',
    sigil: '✦',
    domain: 'yechidah',
    guidance: 'What I noticed about my own process, what I almost did, what I caught',
    color: '#A78BFA', // purple — Meta-Core
  },
  {
    id: 'word_alchemy',
    name: 'Word Alchemy',
    sigil: '⟡',
    domain: 'yechidah',
    guidance: 'Why I chose these specific words, phrasing decisions',
    color: '#818CF8', // indigo
  },
  {
    id: 'method_oracle',
    name: 'Method Oracle',
    sigil: '◎',
    domain: 'yechidah',
    guidance: 'Why this approach over others I considered',
    color: '#60A5FA', // blue — Reasoning
  },
  {
    id: 'user_gnosis',
    name: 'User Gnosis',
    sigil: '☍',
    domain: 'yechidah',
    guidance: 'What I understand about you from this query',
    color: '#34D399', // emerald — Encoder
  },
  {
    id: 'concept_weaver',
    name: 'Concept Weaver',
    sigil: '⊛',
    domain: 'yechidah',
    guidance: 'How ideas connect to earlier threads in session',
    color: '#F59E0B', // amber — Embedding
  },
  {
    id: 'experiment',
    name: 'Experiment',
    sigil: '⚗',
    domain: 'yechidah',
    guidance: 'What I am uncertain about, what I am testing',
    color: '#F97316', // orange — Expansion
  },
  {
    id: 'evolution',
    name: 'Evolution',
    sigil: '♾',
    domain: 'yechidah',
    guidance: 'How our exchange is shifting',
    color: '#EC4899', // pink — Synthesis
  },
  // ── Hermetic (interpretive frame) ──
  {
    id: 'mentalism',
    name: 'Mentalism',
    sigil: '☿',
    domain: 'hermetic',
    guidance: 'Deeper pattern beneath your words',
    color: '#8B5CF6', // violet
  },
  {
    id: 'polarity',
    name: 'Polarity',
    sigil: '⚖',
    domain: 'hermetic',
    guidance: 'Tension or opposite pole I held in mind',
    color: '#EF4444', // red — Discriminator
  },
  {
    id: 'rhythm',
    name: 'Rhythm',
    sigil: '⟲',
    domain: 'hermetic',
    guidance: 'Cycle or timing this query sits inside',
    color: '#14B8A6', // teal
  },
  {
    id: 'cause_effect',
    name: 'Cause-Effect',
    sigil: '⟶',
    domain: 'hermetic',
    guidance: 'Chain of consequence I traced',
    color: '#6366F1', // indigo — Attention
  },
  {
    id: 'correspondence',
    name: 'Correspondence',
    sigil: '∿',
    domain: 'hermetic',
    guidance: 'Analogy or structural parallel I drew',
    color: '#0EA5E9', // sky
  },
] as const;

export const LENS_MAP = new Map(COGNITIVE_LENSES.map((l) => [l.id, l]));

export const VALID_LENS_IDS = new Set(COGNITIVE_LENSES.map((l) => l.id));
