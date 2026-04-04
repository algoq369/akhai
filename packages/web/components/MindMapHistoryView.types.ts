export interface QueryHistoryItem {
  id: string;
  query: string;
  flow: string;
  status: string;
  created_at: number;
  tokens_used: number;
  cost: number;
}

export interface TopicCluster {
  topic: string;
  queries: QueryHistoryItem[];
  totalCost: number;
  totalTokens: number;
  lastActivity: number;
}

export type ViewMode = 'grid' | 'list';
export type SortBy = 'recent' | 'queries' | 'cost' | 'name';
export type TimeFilter = 'all' | 'today' | 'week' | 'month';

// Methodology colors
export const METHODOLOGY_COLORS: Record<string, string> = {
  direct: '#EF4444',
  cod: '#F97316',
  sc: '#EAB308',
  react: '#22C55E',
  pas: '#3B82F6',
  tot: '#6366F1',
  auto: '#8B5CF6',
};
