/**
 * Canvas helper types, constants, and utility functions.
 * Extracted from CanvasWorkspace.tsx
 */

export type NodeType =
  | 'query'
  | 'topic'
  | 'note'
  | 'config'
  | 'stat'
  | 'diagram'
  | 'chart'
  | 'drawing'
  | 'table'
  | 'timeline'
  | 'radar'
  | 'goal'
  | 'milestone';

export interface CanvasNode {
  id: string;
  type: NodeType;
  x: number;
  y: number;
  w: number;
  h: number;
  data: any;
}

export interface Connection {
  from: string;
  to: string;
  color: string;
  label?: string;
  topics?: string[];
}
export interface DrawPoint {
  x: number;
  y: number;
}
export interface DrawStroke {
  points: DrawPoint[];
  color: string;
  width: number;
}

export const METHOD_COLORS: Record<string, string> = {
  auto: '#8b5cf6',
  direct: '#6366f1',
  cod: '#10b981',
  sc: '#f59e0b',
  react: '#ef4444',
  pas: '#0ea5e9',
  tot: '#ec4899',
};
export const TOPIC_COLORS = [
  '#6366f1',
  '#10b981',
  '#f59e0b',
  '#ec4899',
  '#0ea5e9',
  '#8b5cf6',
  '#ef4444',
  '#14b8a6',
];

export type VizType = 'diagram' | 'chart' | 'table' | 'timeline' | 'radar';

export const VIZ_TYPES: VizType[] = ['diagram', 'chart', 'table', 'timeline', 'radar'];
export const VIZ_COLORS: Record<VizType, string> = {
  diagram: '#8b5cf6',
  chart: '#10b981',
  table: '#f59e0b',
  timeline: '#0ea5e9',
  radar: '#ec4899',
};
export const VIZ_SIZES: Record<VizType, { w: number; h: number }> = {
  diagram: { w: 380, h: 280 },
  chart: { w: 300, h: 220 },
  table: { w: 440, h: 200 },
  timeline: { w: 460, h: 140 },
  radar: { w: 320, h: 280 },
};

const CATEGORY_KEYWORDS: Record<string, { keywords: string[]; color: string }> = {
  technical: {
    keywords: [
      'code',
      'api',
      'algorithm',
      'software',
      'database',
      'framework',
      'programming',
      'server',
      'deploy',
      'compiler',
      'runtime',
      'protocol',
    ],
    color: '#378ADD',
  },
  financial: {
    keywords: [
      'money',
      'market',
      'crypto',
      'btc',
      'bitcoin',
      'price',
      'trading',
      'stock',
      'investment',
      'economy',
      'finance',
      'currency',
    ],
    color: '#BA7517',
  },
  geopolitical: {
    keywords: [
      'country',
      'war',
      'policy',
      'regulation',
      'government',
      'election',
      'sanction',
      'nation',
      'political',
      'diplomacy',
    ],
    color: '#1D9E75',
  },
  scientific: {
    keywords: [
      'research',
      'study',
      'physics',
      'biology',
      'chemistry',
      'experiment',
      'data',
      'science',
      'hypothesis',
      'theory',
    ],
    color: '#7F77DD',
  },
};

export function getTopicColor(name: string): string {
  const lower = name.toLowerCase();
  for (const cat of Object.values(CATEGORY_KEYWORDS)) {
    if (cat.keywords.some((kw) => lower.includes(kw))) return cat.color;
  }
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return TOPIC_COLORS[Math.abs(hash) % TOPIC_COLORS.length];
}

export function extractTopics(text: string): string[] {
  const words = text.match(/[A-Z][a-z]+(?:\s[A-Z][a-z]+)*/g) || [];
  return [...new Set(words)]
    .filter(
      (w) =>
        w.length > 3 &&
        ![
          'This',
          'That',
          'These',
          'Those',
          'What',
          'When',
          'Where',
          'Which',
          'There',
          'Here',
          'Three',
          'Four',
          'Five',
          'Several',
          'Many',
          'Some',
          'Each',
          'Both',
          'Most',
          'Much',
          'Very',
          'Also',
          'However',
          'Therefore',
          'Furthermore',
          'Moreover',
          'Additionally',
          'Sorry',
          'Please',
          'Error',
        ].includes(w)
    )
    .slice(0, 5);
}

// === LOCAL FALLBACK GENERATORS ===
function generateLocalDiagram(query: string, response: string): any {
  const topics = extractTopics(response);
  if (topics.length === 0) topics.push(query.split(' ').slice(0, 3).join(' '));
  const nodes = topics.map((t, i) => ({
    id: `n${i}`,
    label: t,
    color: TOPIC_COLORS[i % TOPIC_COLORS.length],
  }));
  // Central node from query
  const central = { id: 'nc', label: query.slice(0, 32), color: '#6366f1' };
  const edges = nodes.map((n) => ({ from: 'nc', to: n.id, label: '' }));
  return { title: query.slice(0, 60), type: 'mindmap', nodes: [central, ...nodes], edges };
}

function generateLocalChart(query: string, response: string): any {
  // Extract numbers from response, or estimate topic relevance
  const numMatches = response.match(/\d+(\.\d+)?%?/g)?.slice(0, 8) || [];
  const topics = extractTopics(response).slice(0, 6);
  if (topics.length === 0) topics.push('Main', 'Secondary', 'Other');
  const data = topics.map((t, i) => ({
    label: t,
    value: numMatches[i]
      ? parseFloat(numMatches[i].replace('%', ''))
      : Math.round(20 + Math.random() * 60),
    color: TOPIC_COLORS[i % TOPIC_COLORS.length],
  }));
  return { title: query.slice(0, 60), xLabel: 'Topics', yLabel: 'Relevance', data };
}

function generateLocalTable(query: string, response: string): any {
  const topics = extractTopics(response).slice(0, 5);
  if (topics.length === 0) topics.push('Item 1', 'Item 2', 'Item 3');
  const rows = topics.map((t, i) => ({
    entity: t,
    relevance: Math.round(60 + Math.random() * 40) + '%',
    category: ['Primary', 'Secondary', 'Tertiary'][i % 3],
  }));
  return { title: query.slice(0, 60), columns: ['Entity', 'Relevance', 'Category'], rows };
}

function generateLocalTimeline(query: string, response: string): any {
  const topics = extractTopics(response).slice(0, 6);
  if (topics.length === 0) topics.push('Start', 'Middle', 'End');
  const events = topics.map((t, i) => ({
    label: t,
    description: '',
    color: TOPIC_COLORS[i % TOPIC_COLORS.length],
  }));
  return { title: query.slice(0, 60), events };
}

function generateLocalRadar(query: string, response: string): any {
  const topics = extractTopics(response).slice(0, 6);
  if (topics.length < 3) topics.push('Dimension A', 'Dimension B', 'Dimension C');
  const axes = topics.map((t) => ({ label: t, value: Math.round(30 + Math.random() * 70) }));
  return { title: query.slice(0, 60), axes };
}

// === DIAGRAM/CHART GENERATION ===
export async function generateVisualization(
  query: string,
  response: string,
  type: VizType
): Promise<any> {
  try {
    const res = await fetch('/api/canvas-viz', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, response: response.slice(0, 800), type }),
    });
    if (!res.ok) throw new Error(`API ${res.status}`);
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    if (data.viz) return data.viz;
  } catch (e) {
    console.error('Viz API failed, using local fallback:', e);
  }
  // Local fallback — always produce something
  const fallbacks: Record<VizType, () => any> = {
    diagram: () => generateLocalDiagram(query, response),
    chart: () => generateLocalChart(query, response),
    table: () => generateLocalTable(query, response),
    timeline: () => generateLocalTimeline(query, response),
    radar: () => generateLocalRadar(query, response),
  };
  return fallbacks[type]();
}
