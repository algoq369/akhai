import { TOPIC_COLORS } from './VisionBoardTypes';

// ── Viz payload shapes (produced locally below or by /api/canvas-viz) ──────────
// Fields are optional where the API/LLM payload may omit them; renderers guard.

export interface DiagramVizNode {
  id: string;
  label?: string;
  color?: string;
}

export interface DiagramVizEdge {
  from: string;
  to: string;
  label?: string;
}

export interface DiagramViz {
  title?: string;
  type?: string;
  nodes?: DiagramVizNode[];
  edges?: DiagramVizEdge[];
}

export interface ChartVizBar {
  label?: string;
  value?: number;
  color?: string;
}

export interface ChartViz {
  title?: string;
  xLabel?: string;
  yLabel?: string;
  data?: ChartVizBar[];
}

export interface TableViz {
  title?: string;
  columns?: string[];
  rows?: Array<Record<string, unknown> | unknown[]>;
}

export interface TimelineVizEvent {
  label?: string;
  description?: string;
  color?: string;
}

export interface TimelineViz {
  title?: string;
  events?: TimelineVizEvent[];
}

export interface RadarVizAxis {
  label?: string;
  value: number;
}

export interface RadarViz {
  title?: string;
  color?: string;
  axes?: RadarVizAxis[];
}

// Combined payload — which sections are present depends on the viz type.
export interface VizData extends DiagramViz, ChartViz, TableViz, TimelineViz, RadarViz {}

// ── Viz Helpers (from CanvasWorkspace) ──────────────────────────────────────────

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
          'Sorry',
          'Please',
          'Error',
        ].includes(w)
    )
    .slice(0, 5);
}

export function generateLocalDiagram(query: string, response: string): DiagramViz {
  const topics = extractTopics(response);
  if (topics.length === 0) topics.push(query.split(' ').slice(0, 3).join(' '));
  const nodes = topics.map((t, i) => ({
    id: `n${i}`,
    label: t,
    color: TOPIC_COLORS[i % TOPIC_COLORS.length],
  }));
  const central = { id: 'nc', label: query.slice(0, 32), color: '#6366f1' };
  const edges = nodes.map((n) => ({ from: 'nc', to: n.id, label: '' }));
  return { title: query.slice(0, 60), type: 'mindmap', nodes: [central, ...nodes], edges };
}

export function generateLocalChart(query: string, response: string): ChartViz {
  const numMatches = response.match(/\d+(\.\d+)?%?/g)?.slice(0, 8) || [];
  const topics = extractTopics(response).slice(0, 6);
  if (topics.length === 0) topics.push('Main', 'Secondary', 'Other');
  return {
    title: query.slice(0, 60),
    xLabel: 'Topics',
    yLabel: 'Relevance',
    data: topics.map((t, i) => ({
      label: t,
      value: numMatches[i]
        ? parseFloat(numMatches[i].replace('%', ''))
        : Math.round(20 + Math.random() * 60),
      color: TOPIC_COLORS[i % TOPIC_COLORS.length],
    })),
  };
}

export function generateLocalTable(query: string, response: string): TableViz {
  const topics = extractTopics(response).slice(0, 5);
  if (topics.length === 0) topics.push('Item 1', 'Item 2', 'Item 3');
  return {
    title: query.slice(0, 60),
    columns: ['Entity', 'Relevance', 'Category'],
    rows: topics.map((t, i) => ({
      entity: t,
      relevance: Math.round(60 + Math.random() * 40) + '%',
      category: ['Primary', 'Secondary', 'Tertiary'][i % 3],
    })),
  };
}

export function generateLocalTimeline(query: string, response: string): TimelineViz {
  const topics = extractTopics(response).slice(0, 6);
  if (topics.length === 0) topics.push('Start', 'Middle', 'End');
  return {
    title: query.slice(0, 60),
    events: topics.map((t, i) => ({
      label: t,
      description: '',
      color: TOPIC_COLORS[i % TOPIC_COLORS.length],
    })),
  };
}

export function generateLocalRadar(query: string, response: string): RadarViz {
  const topics = extractTopics(response).slice(0, 6);
  if (topics.length < 3) topics.push('Dimension A', 'Dimension B', 'Dimension C');
  return {
    title: query.slice(0, 60),
    axes: topics.map((t) => ({ label: t, value: Math.round(30 + Math.random() * 70) })),
  };
}

export type VizType = 'diagram' | 'chart' | 'table' | 'timeline' | 'radar';

export async function generateVisualization(
  query: string,
  response: string,
  type: VizType
): Promise<VizData> {
  try {
    const res = await fetch('/api/canvas-viz', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, response: response.slice(0, 800), type }),
    });
    if (!res.ok) throw new Error(`API ${res.status}`);
    const data = (await res.json()) as { error?: string; viz?: VizData };
    if (data.error) throw new Error(data.error);
    if (data.viz) return data.viz;
  } catch (e) {
    console.error('Viz API failed, using local fallback:', e);
  }
  const fallbacks: Record<VizType, () => VizData> = {
    diagram: () => generateLocalDiagram(query, response),
    chart: () => generateLocalChart(query, response),
    table: () => generateLocalTable(query, response),
    timeline: () => generateLocalTimeline(query, response),
    radar: () => generateLocalRadar(query, response),
  };
  return fallbacks[type]();
}
