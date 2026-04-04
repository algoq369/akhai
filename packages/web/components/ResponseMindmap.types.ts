export interface MindmapNode {
  id: string;
  label: string;
  fullText: string;
  level: number;
  parentId?: string;
  category?: string;
  x?: number;
  y?: number;
}

export interface ResponseMindmapProps {
  content: string;
  topics?: Array<{ id: string; name: string; category?: string }>;
  isVisible: boolean;
  onToggle: () => void;
  methodology?: string;
  query?: string;
}

// Beautiful gradient colors
export const NODE_GRADIENTS = [
  { from: '#667eea', to: '#764ba2' },
  { from: '#f093fb', to: '#f5576c' },
  { from: '#4facfe', to: '#00f2fe' },
  { from: '#43e97b', to: '#38f9d7' },
  { from: '#fa709a', to: '#fee140' },
  { from: '#a8edea', to: '#fed6e3' },
  { from: '#ff9a9e', to: '#fecfef' },
  { from: '#ffecd2', to: '#fcb69f' },
];

// Methodology colors
export const METHODOLOGY_COLORS: Record<string, { from: string; to: string }> = {
  direct: { from: '#ef4444', to: '#f97316' },
  cod: { from: '#f97316', to: '#eab308' },
  sc: { from: '#eab308', to: '#84cc16' },
  react: { from: '#22c55e', to: '#14b8a6' },
  pas: { from: '#3b82f6', to: '#6366f1' },
  tot: { from: '#8b5cf6', to: '#a855f7' },
  auto: { from: '#64748b', to: '#475569' },
};
