import type { LevelInsight, LayerCorrelation, MindmapNode, MindmapEdge } from './levels-store';

/**
 * Generate a unique ID
 */
export function generateId(): string {
  return `${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;
}

/**
 * Calculate data percent from response content
 */
export function calculateDataPercent(response: string): number {
  // Count numbers, percentages, metrics in response
  const numberMatches = response.match(/\d+(\.\d+)?%?/g) || [];
  const metricsMatches =
    response.match(/\b(increase|decrease|growth|decline|rate|ratio|average|total|sum|count)\b/gi) ||
    [];

  const dataIndicators = numberMatches.length + metricsMatches.length;
  const words = response.split(/\s+/).length;

  // Normalize to 0-100 scale
  return Math.min(100, Math.round((dataIndicators / Math.max(words, 1)) * 500));
}

/**
 * Calculate confidence from response structure
 */
export function calculateConfidence(response: string, insights: LevelInsight[]): number {
  // Base confidence on response length and structure
  const hasHeaders = /^#+\s/m.test(response);
  const hasBullets = /^[-*•]\s/m.test(response);
  const hasNumbers = /\d/.test(response);
  const insightCount = insights.length;

  let confidence = 50; // Base
  if (hasHeaders) confidence += 15;
  if (hasBullets) confidence += 10;
  if (hasNumbers) confidence += 10;
  confidence += Math.min(15, insightCount * 3);

  return Math.min(100, confidence);
}

/**
 * Extract key metrics from response
 */
export function extractKeyMetrics(response: string): string[] {
  const metrics: string[] = [];

  // Match patterns like "X%" or "$X" or "X units"
  const percentMatches = response.match(/\d+(\.\d+)?%/g) || [];
  const dollarMatches = response.match(/\$[\d,]+(\.\d+)?/g) || [];
  const numberWithUnit =
    response.match(
      /\d+(\.\d+)?\s*(users|customers|items|orders|views|clicks|days|hours|minutes)/gi
    ) || [];

  metrics.push(...percentMatches.slice(0, 3));
  metrics.push(...dollarMatches.slice(0, 2));
  metrics.push(...numberWithUnit.slice(0, 2));

  return [...new Set(metrics)].slice(0, 5); // Unique, max 5
}

/**
 * Calculate layer correlations from active weights
 */
export function calculateLayerCorrelations(weights: Record<number, number>): LayerCorrelation[] {
  const LAYER_NAMES: Record<number, string> = {
    10: 'meta-cognition',
    9: 'first-principles',
    8: 'pattern-recognition',
    7: 'expansion',
    6: 'critical-analysis',
    5: 'synthesis',
    4: 'persistence',
    3: 'communication',
    2: 'foundation',
    1: 'manifestation',
  };

  // Get top 3 active layers
  const sortedLayers = Object.entries(weights)
    .map(([id, weight]) => ({ layerId: parseInt(id), weight }))
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 3);

  const correlations: LayerCorrelation[] = [];

  for (let i = 0; i < sortedLayers.length - 1; i++) {
    for (let j = i + 1; j < sortedLayers.length; j++) {
      const a = sortedLayers[i];
      const b = sortedLayers[j];
      const combined = (a.weight + b.weight) * 50; // Convert to percentage

      correlations.push({
        layerA: a.layerId,
        layerB: b.layerId,
        strength: combined > 75 ? 'strong' : combined > 50 ? 'moderate' : 'weak',
        description: `${LAYER_NAMES[a.layerId] || `L${a.layerId}`} + ${LAYER_NAMES[b.layerId] || `L${b.layerId}`}`,
        correlation: Math.round(combined),
      });
    }
  }

  return correlations;
}

/**
 * Calculate category breakdown from insights
 */
export function calculateCategoryBreakdown(insights: LevelInsight[]): {
  strategy: number;
  insight: number;
  data: number;
  action: number;
} {
  const breakdown = { strategy: 0, insight: 0, data: 0, action: 0 };
  insights.forEach((i) => {
    if (i.category in breakdown) {
      breakdown[i.category as keyof typeof breakdown]++;
    }
  });
  return breakdown;
}

/**
 * Generate mindmap nodes and edges from insights
 */
export function generateMindmapData(
  query: string,
  insights: LevelInsight[]
): { nodes: MindmapNode[]; edges: MindmapEdge[] } {
  const nodes: MindmapNode[] = [
    {
      id: 'query',
      label: query.length > 25 ? query.slice(0, 25) + '...' : query,
      type: 'query',
      x: 200,
      y: 30,
    },
  ];

  const count = Math.min(insights.length, 8);
  insights.slice(0, 8).forEach((insight, idx) => {
    const angle = (idx / count) * Math.PI * 2 - Math.PI / 2;
    const radius = 100;
    nodes.push({
      id: insight.id,
      label: insight.text.length > 25 ? insight.text.slice(0, 25) + '...' : insight.text,
      type: insight.category === 'data' ? 'data' : 'concept',
      x: 200 + Math.cos(angle) * radius,
      y: 150 + Math.sin(angle) * radius,
      parentId: 'query',
      cluster: insight.category,
    });
  });

  const edges: MindmapEdge[] = nodes
    .filter((n) => n.parentId)
    .map((n) => ({
      id: `edge-${n.id}`,
      from: n.parentId!,
      to: n.id,
      type: 'branch' as const,
    }));

  return { nodes, edges };
}
