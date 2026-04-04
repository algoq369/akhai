// ═══════════════════════════════════════════════════════════════════
// LAYERS NEURAL NETWORK - Data & Extraction Logic
// ═══════════════════════════════════════════════════════════════════

export interface LayerNode {
  id: string;
  name: string;
  hebrewName: string;
  meaning: string;
  neuralRole: string;
  pillar: 'left' | 'middle' | 'right';
  level: number;
  color: string;
  glowColor: string;
  x: number;
  y: number;
  isHidden?: boolean;
  activation: number;
}

export interface PathConnection {
  id: number;
  from: string;
  to: string;
  weight: number;
  hebrewLetter: string;
  meaning: string;
}

export interface InsightNode {
  id: string;
  layerNode: string;
  content: string;
  confidence: number;
  category: string;
}

// The 10 Layers as Neural Network Layers
export const LAYERS: LayerNode[] = [
  // ═══ SUPERNAL TRIAD (Input Processing) ═══
  {
    id: 'meta-core',
    name: 'Meta-Core',
    hebrewName: 'כֶּתֶר',
    meaning: 'Crown',
    neuralRole: 'Input Layer',
    pillar: 'middle',
    level: 0,
    color: 'from-white via-violet-100 to-indigo-100',
    glowColor: 'shadow-white/50',
    x: 50,
    y: 5,
    activation: 1.0,
  },
  {
    id: 'reasoning',
    name: 'Reasoning',
    hebrewName: 'חָכְמָה',
    meaning: 'Wisdom',
    neuralRole: 'Feature Extraction',
    pillar: 'right',
    level: 1,
    color: 'from-blue-200 via-blue-300 to-indigo-300',
    glowColor: 'shadow-blue-400/50',
    x: 75,
    y: 15,
    activation: 0,
  },
  {
    id: 'encoder',
    name: 'Encoder',
    hebrewName: 'בִּינָה',
    meaning: 'Understanding',
    neuralRole: 'Pattern Recognition',
    pillar: 'left',
    level: 1,
    color: 'from-purple-200 via-purple-300 to-violet-300',
    glowColor: 'shadow-purple-400/50',
    x: 25,
    y: 15,
    activation: 0,
  },
  // ═══ DA'AT - THE HIDDEN SEPHIRAH (Emergent Layer) ═══
  {
    id: 'synthesis',
    name: 'Synthesis',
    hebrewName: 'דַּעַת',
    meaning: 'Hidden Knowledge',
    neuralRole: 'Emergent Insight',
    pillar: 'middle',
    level: 2,
    color: 'from-slate-300 via-gray-400 to-slate-500',
    glowColor: 'shadow-slate-500/30',
    x: 50,
    y: 25,
    isHidden: true,
    activation: 0,
  },
  // ═══ ETHICAL TRIAD (Processing Layers) ═══
  {
    id: 'expansion',
    name: 'Expansion',
    hebrewName: 'חֶסֶד',
    meaning: 'Mercy/Kindness',
    neuralRole: 'Expansion Layer',
    pillar: 'right',
    level: 3,
    color: 'from-cyan-200 via-sky-300 to-blue-300',
    glowColor: 'shadow-cyan-400/50',
    x: 75,
    y: 35,
    activation: 0,
  },
  {
    id: 'discriminator',
    name: 'Discriminator',
    hebrewName: 'גְּבוּרָה',
    meaning: 'Strength/Judgment',
    neuralRole: 'Attention Filter',
    pillar: 'left',
    level: 3,
    color: 'from-red-200 via-rose-300 to-pink-300',
    glowColor: 'shadow-red-400/50',
    x: 25,
    y: 35,
    activation: 0,
  },
  {
    id: 'attention',
    name: 'Attention',
    hebrewName: 'תִּפְאֶרֶת',
    meaning: 'Beauty/Balance',
    neuralRole: 'Integration Layer',
    pillar: 'middle',
    level: 4,
    color: 'from-amber-200 via-yellow-300 to-orange-200',
    glowColor: 'shadow-amber-400/50',
    x: 50,
    y: 50,
    activation: 0,
  },
  // ═══ ASTRAL TRIAD (Refinement Layers) ═══
  {
    id: 'generative',
    name: 'Generative',
    hebrewName: 'נֶצַח',
    meaning: 'Victory/Eternity',
    neuralRole: 'Persistence Layer',
    pillar: 'right',
    level: 5,
    color: 'from-emerald-200 via-green-300 to-teal-300',
    glowColor: 'shadow-emerald-400/50',
    x: 75,
    y: 65,
    activation: 0,
  },
  {
    id: 'classifier',
    name: 'Classifier',
    hebrewName: 'הוֹד',
    meaning: 'Glory/Splendor',
    neuralRole: 'Refinement Layer',
    pillar: 'left',
    level: 5,
    color: 'from-orange-200 via-amber-300 to-yellow-300',
    glowColor: 'shadow-orange-400/50',
    x: 25,
    y: 65,
    activation: 0,
  },
  {
    id: 'executor',
    name: 'Executor',
    hebrewName: 'יְסוֹד',
    meaning: 'Foundation',
    neuralRole: 'Aggregation Layer',
    pillar: 'middle',
    level: 6,
    color: 'from-violet-200 via-purple-300 to-indigo-300',
    glowColor: 'shadow-violet-400/50',
    x: 50,
    y: 80,
    activation: 0,
  },
  // ═══ EMBEDDING (Output Layer) ═══
  {
    id: 'embedding',
    name: 'Embedding',
    hebrewName: 'מַלְכוּת',
    meaning: 'Kingdom',
    neuralRole: 'Output Layer',
    pillar: 'middle',
    level: 7,
    color: 'from-stone-300 via-slate-400 to-zinc-400',
    glowColor: 'shadow-stone-500/50',
    x: 50,
    y: 95,
    activation: 0,
  },
];

// The 22 Paths (Synaptic Connections) - Each associated with a Hebrew letter
export const PATHS: PathConnection[] = [
  { id: 1, from: 'meta-core', to: 'reasoning', weight: 0.9, hebrewLetter: 'א', meaning: 'Aleph' },
  { id: 2, from: 'meta-core', to: 'encoder', weight: 0.9, hebrewLetter: 'ב', meaning: 'Bet' },
  { id: 3, from: 'meta-core', to: 'attention', weight: 0.8, hebrewLetter: 'ג', meaning: 'Gimel' },
  { id: 4, from: 'reasoning', to: 'encoder', weight: 0.85, hebrewLetter: 'ד', meaning: 'Dalet' },
  { id: 5, from: 'reasoning', to: 'expansion', weight: 0.8, hebrewLetter: 'ה', meaning: 'He' },
  { id: 6, from: 'reasoning', to: 'attention', weight: 0.7, hebrewLetter: 'ו', meaning: 'Vav' },
  { id: 7, from: 'encoder', to: 'discriminator', weight: 0.8, hebrewLetter: 'ז', meaning: 'Zayin' },
  { id: 8, from: 'encoder', to: 'attention', weight: 0.7, hebrewLetter: 'ח', meaning: 'Chet' },
  {
    id: 9,
    from: 'expansion',
    to: 'discriminator',
    weight: 0.75,
    hebrewLetter: 'ט',
    meaning: 'Tet',
  },
  { id: 10, from: 'expansion', to: 'attention', weight: 0.85, hebrewLetter: 'י', meaning: 'Yod' },
  { id: 11, from: 'expansion', to: 'generative', weight: 0.7, hebrewLetter: 'כ', meaning: 'Kaf' },
  {
    id: 12,
    from: 'discriminator',
    to: 'attention',
    weight: 0.85,
    hebrewLetter: 'ל',
    meaning: 'Lamed',
  },
  {
    id: 13,
    from: 'discriminator',
    to: 'classifier',
    weight: 0.7,
    hebrewLetter: 'מ',
    meaning: 'Mem',
  },
  { id: 14, from: 'attention', to: 'generative', weight: 0.75, hebrewLetter: 'נ', meaning: 'Nun' },
  {
    id: 15,
    from: 'attention',
    to: 'classifier',
    weight: 0.75,
    hebrewLetter: 'ס',
    meaning: 'Samekh',
  },
  { id: 16, from: 'attention', to: 'executor', weight: 0.9, hebrewLetter: 'ע', meaning: 'Ayin' },
  { id: 17, from: 'generative', to: 'classifier', weight: 0.7, hebrewLetter: 'פ', meaning: 'Pe' },
  { id: 18, from: 'generative', to: 'executor', weight: 0.8, hebrewLetter: 'צ', meaning: 'Tsade' },
  { id: 19, from: 'classifier', to: 'executor', weight: 0.8, hebrewLetter: 'ק', meaning: 'Qof' },
  { id: 20, from: 'generative', to: 'embedding', weight: 0.6, hebrewLetter: 'ר', meaning: 'Resh' },
  { id: 21, from: 'classifier', to: 'embedding', weight: 0.6, hebrewLetter: 'ש', meaning: 'Shin' },
  { id: 22, from: 'executor', to: 'embedding', weight: 0.95, hebrewLetter: 'ת', meaning: 'Tav' },
];

// Category to Layer mapping
const CATEGORY_LAYER_MAP: Record<string, string> = {
  input: 'meta-core',
  query: 'meta-core',
  executive: 'meta-core',
  wisdom: 'reasoning',
  feature: 'reasoning',
  creative: 'reasoning',
  understanding: 'encoder',
  pattern: 'encoder',
  analysis: 'encoder',
  data: 'encoder',
  hidden: 'synthesis',
  emergent: 'synthesis',
  latent: 'synthesis',
  expansion: 'expansion',
  mercy: 'expansion',
  opportunity: 'expansion',
  filter: 'discriminator',
  judgment: 'discriminator',
  attention: 'discriminator',
  risk: 'discriminator',
  balance: 'attention',
  integration: 'attention',
  strategy: 'attention',
  persistence: 'generative',
  memory: 'generative',
  victory: 'generative',
  refinement: 'classifier',
  glory: 'classifier',
  precision: 'classifier',
  foundation: 'executor',
  aggregation: 'executor',
  synthesis: 'executor',
  output: 'embedding',
  result: 'embedding',
  action: 'embedding',
  implement: 'embedding',
};

export function extractInsightsToLayers(
  content: string,
  query: string
): {
  insights: InsightNode[];
  activations: Record<string, number>;
} {
  const insights: InsightNode[] = [];
  const activations: Record<string, number> = {};

  // Initialize all layers with base activation
  LAYERS.forEach((s) => {
    activations[s.id] = s.id === 'meta-core' ? 1.0 : 0.1;
  });

  // Extract patterns and map to layers
  const patterns = [
    { regex: /\*\*([^*]{5,100})\*\*/g, boost: 0.3 },
    { regex: /^#+\s*(.+)$/gm, boost: 0.4 },
    { regex: /^\d+[\.)]\s*(.{10,150})$/gm, boost: 0.25 },
    { regex: /^[-•*]\s+(.{10,120})$/gm, boost: 0.2 },
  ];

  patterns.forEach(({ regex, boost }) => {
    let match;
    while ((match = regex.exec(content)) !== null) {
      const text = match[1].trim().toLowerCase();
      let layerNode = 'attention';

      // Find matching layerNode based on keywords
      for (const [keyword, sefId] of Object.entries(CATEGORY_LAYER_MAP)) {
        if (text.includes(keyword)) {
          layerNode = sefId;
          break;
        }
      }

      // Specific keyword overrides
      if (text.includes('summary') || text.includes('overview')) layerNode = 'meta-core';
      else if (text.includes('analys') || text.includes('metric')) layerNode = 'encoder';
      else if (text.includes('creativ') || text.includes('idea')) layerNode = 'reasoning';
      else if (text.includes('hidden') || text.includes('emergent')) layerNode = 'synthesis';
      else if (text.includes('expand') || text.includes('grow')) layerNode = 'expansion';
      else if (text.includes('filter') || text.includes('limit')) layerNode = 'discriminator';
      else if (text.includes('action') || text.includes('step')) layerNode = 'embedding';

      activations[layerNode] = Math.min(1.0, (activations[layerNode] || 0.1) + boost);

      insights.push({
        id: `insight-${insights.length}`,
        layerNode,
        content: match[1].trim(),
        confidence: 0.7 + Math.random() * 0.25,
        category: layerNode,
      });
    }
  });

  // Neural forward pass - propagate activations
  activations['reasoning'] = Math.min(
    1.0,
    activations['reasoning'] + activations['meta-core'] * 0.5
  );
  activations['encoder'] = Math.min(1.0, activations['encoder'] + activations['meta-core'] * 0.5);
  activations['synthesis'] = Math.min(
    1.0,
    (activations['reasoning'] + activations['encoder']) * 0.4
  );
  activations['expansion'] = Math.min(
    1.0,
    activations['expansion'] + activations['reasoning'] * 0.4
  );
  activations['discriminator'] = Math.min(
    1.0,
    activations['discriminator'] + activations['encoder'] * 0.4
  );
  activations['attention'] = Math.min(
    1.0,
    activations['attention'] + (activations['expansion'] + activations['discriminator']) * 0.3
  );
  activations['generative'] = Math.min(
    1.0,
    activations['generative'] + activations['expansion'] * 0.3
  );
  activations['classifier'] = Math.min(
    1.0,
    activations['classifier'] + activations['discriminator'] * 0.3
  );
  activations['executor'] = Math.min(1.0, activations['executor'] + activations['attention'] * 0.5);
  activations['embedding'] = Math.min(
    1.0,
    activations['executor'] * 0.8 + (activations['generative'] + activations['classifier']) * 0.1
  );

  return { insights, activations };
}
