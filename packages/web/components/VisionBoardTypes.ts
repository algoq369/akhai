'use client';

// ── Types ──────────────────────────────────────────────────────────────────────

export type BoardNodeType =
  | 'conversation'
  | 'note'
  | 'goal'
  | 'milestone'
  | 'insight'
  | 'drawing'
  | 'diagram'
  | 'chart'
  | 'table'
  | 'timelineViz'
  | 'radar';

export interface BoardNode {
  id: string;
  type: BoardNodeType;
  x: number;
  y: number;
  w: number;
  h: number;
  data: {
    title?: string;
    body?: string;
    color?: string;
    done?: boolean;
    points?: { x: number; y: number }[];
    source?: string;
    vizData?: any;
  };
  createdAt: number;
}

export interface Objective {
  id: string;
  text: string;
  done: boolean;
  createdAt: number;
}

export interface TopicProgress {
  name: string;
  category: string;
  queryCount: number;
  description: string;
  connected: string[];
}

export interface BoardState {
  nodes: BoardNode[];
  objectives: Objective[];
  camera: { x: number; y: number; zoom: number };
}

export const STORAGE_KEY = 'akhai-vision-board';

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

export const NODE_COLORS: Record<BoardNodeType, { bg: string; border: string; label: string }> = {
  conversation: { bg: '#f8fafc', border: '#94a3b8', label: 'conv' },
  note: { bg: '#fefce8', border: '#ca8a04', label: 'note' },
  goal: { bg: '#ecfdf5', border: '#059669', label: 'goal' },
  milestone: { bg: '#ede9fe', border: '#7c3aed', label: 'mile' },
  insight: { bg: '#fdf2f8', border: '#db2777', label: 'ai' },
  drawing: { bg: '#f0f9ff', border: '#0284c7', label: 'draw' },
  diagram: { bg: '#eef2ff', border: '#6366f1', label: 'diagram' },
  chart: { bg: '#ecfdf5', border: '#10b981', label: 'chart' },
  table: { bg: '#fef3c7', border: '#f59e0b', label: 'table' },
  timelineViz: { bg: '#fdf4ff', border: '#c026d3', label: 'timeline' },
  radar: { bg: '#f0f9ff', border: '#0ea5e9', label: 'radar' },
};

export const VIZ_SIZES: Partial<Record<BoardNodeType, { w: number; h: number }>> = {
  diagram: { w: 380, h: 280 },
  chart: { w: 320, h: 240 },
  table: { w: 300, h: 200 },
  timelineViz: { w: 380, h: 160 },
  radar: { w: 300, h: 280 },
};
