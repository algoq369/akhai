import type { Node } from './MindMap';

export interface MindMapDiagramViewProps {
  userId: string | null;
  nodes?: Node[];
  searchQuery?: string;
  onNodeSelect?: (node: { id: string; name: string; category?: string } | null) => void;
  onNodeAction?: (query: string, nodeId: string) => void;
  onContinueToChat?: (query: string) => void;
  propTopicLinks?: TopicLink[];
}

export interface Discussion {
  id: string;
  text: string;
  fullText: string;
  methodology: string | null;
  createdAt: number;
  conversationId: string | null;
}

export interface TopicLink {
  source: string;
  target: string;
  type: string;
  strength: number;
}

export interface ClusterData {
  category: string;
  nodes: Node[];
  cx: number;
  cy: number;
  rx: number;
  ry: number;
}

export interface LayoutNode {
  id: string;
  x: number;
  y: number;
  isShared: boolean;
  sharedCategories: string[];
  queryCount: number;
  connections: number;
}

// Golden angle in radians
export const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));

// Cluster palette — muted, professional
export const CLUSTER_COLORS: Record<string, { fill: string; stroke: string; text: string }> = {};
export const PALETTE = [
  { fill: 'rgba(99,102,241,0.35)', stroke: 'rgba(99,102,241,0.35)', text: '#6366f1' },
  { fill: 'rgba(16,185,129,0.35)', stroke: 'rgba(16,185,129,0.35)', text: '#10b981' },
  { fill: 'rgba(245,158,11,0.35)', stroke: 'rgba(245,158,11,0.35)', text: '#f59e0b' },
  { fill: 'rgba(239,68,68,0.35)', stroke: 'rgba(239,68,68,0.35)', text: '#ef4444' },
  { fill: 'rgba(139,92,246,0.35)', stroke: 'rgba(139,92,246,0.35)', text: '#8b5cf6' },
  { fill: 'rgba(6,182,212,0.35)', stroke: 'rgba(6,182,212,0.35)', text: '#06b6d4' },
  { fill: 'rgba(236,72,153,0.35)', stroke: 'rgba(236,72,153,0.35)', text: '#ec4899' },
  { fill: 'rgba(107,114,128,0.35)', stroke: 'rgba(107,114,128,0.35)', text: '#6b7280' },
];

export function getClusterColor(category: string, idx: number) {
  if (!CLUSTER_COLORS[category]) {
    CLUSTER_COLORS[category] = PALETTE[idx % PALETTE.length];
  }
  return CLUSTER_COLORS[category];
}

export function formatTimeAgo(timestamp: number): string {
  const now = Math.floor(Date.now() / 1000);
  const diff = now - timestamp;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(timestamp * 1000).toLocaleDateString();
}

// Node size from queryCount
export const getNodeRadius = (qc: number) => Math.max(6, Math.min(16, 3 + Math.sqrt(qc) * 3));
