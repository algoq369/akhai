import type { QueryHistoryItem, TopicCluster } from './MindMapHistoryView.types';

/**
 * Cluster hover handler — fetches AI-generated insights on hover.
 * Extracted from MindMapHistoryView for file-size compliance.
 */
export function createClusterHoverHandlers(
  clusterInsightCache: React.MutableRefObject<Record<string, string>>,
  clusterHoverTimeout: React.MutableRefObject<NodeJS.Timeout | null>,
  setClusterInsight: (val: { topic: string; text: string; x: number; y: number } | null) => void
) {
  const handleClusterHover = (e: React.MouseEvent, cluster: TopicCluster) => {
    const x = e.clientX,
      y = e.clientY;
    if (clusterHoverTimeout.current) clearTimeout(clusterHoverTimeout.current);
    clusterHoverTimeout.current = setTimeout(async () => {
      // Check cache first
      if (clusterInsightCache.current[cluster.topic]) {
        setClusterInsight({
          topic: cluster.topic,
          text: clusterInsightCache.current[cluster.topic],
          x,
          y,
        });
        return;
      }
      setClusterInsight({ topic: cluster.topic, text: '...', x, y });
      try {
        const queryTexts = cluster.queries
          .slice(0, 3)
          .map((q) => q.query)
          .join('; ');
        const res = await fetch('/api/quick-query', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: `In 2 sentences (max 30 words), summarize what the user explored about: ${cluster.topic}. Queries: ${queryTexts}`,
          }),
        });
        if (!res.ok) throw new Error('API error');
        const data = await res.json();
        const text = data.response || data.text || data.result || 'No insight available';
        clusterInsightCache.current[cluster.topic] = text;
        setClusterInsight({ topic: cluster.topic, text, x, y });
      } catch {
        clusterInsightCache.current[cluster.topic] = 'Could not generate insight';
        setClusterInsight({ topic: cluster.topic, text: 'Could not generate insight', x, y });
      }
    }, 400);
  };
  const handleClusterHoverLeave = () => {
    if (clusterHoverTimeout.current) clearTimeout(clusterHoverTimeout.current);
    setClusterInsight(null);
  };

  return { handleClusterHover, handleClusterHoverLeave };
}
