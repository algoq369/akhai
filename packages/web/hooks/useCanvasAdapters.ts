import { useMemo } from 'react';
import { Message } from '@/lib/chat-store';
import type { QueryCard } from '@/components/canvas/QueryCardsPanel';
import type { VisualNode, VisualEdge } from '@/components/canvas/VisualsPanel';

/**
 * Canvas data adapters — converts messages into QueryCards, VisualNodes, VisualEdges.
 * Extracted from useHomePageState for file-size compliance.
 */
export function useCanvasAdapters(messages: Message[], methodology: string) {
  const queryCards = useMemo<QueryCard[]>(() => {
    return messages
      .filter((m) => m.role === 'user')
      .map((m, idx) => {
        const userIndex = messages.indexOf(m);
        const nextAssistant = messages.find((r, i) => r.role === 'assistant' && i > userIndex);
        return {
          id: m.id,
          query: m.content,
          response: nextAssistant?.content || '',
          timestamp: new Date(),
          methodology: methodology,
        };
      });
  }, [messages, methodology]);

  const visualNodes = useMemo<VisualNode[]>(() => {
    const nodes: VisualNode[] = [];
    messages.forEach((m, idx) => {
      if (m.role === 'assistant' && m.content.length > 50) {
        nodes.push({
          id: `node-${m.id}`,
          label: m.content.slice(0, 40) + '...',
          type: 'concept',
          x: 100 + (idx % 3) * 150,
          y: 100 + Math.floor(idx / 3) * 120,
        });
      }
    });
    return nodes;
  }, [messages]);

  const visualEdges = useMemo<VisualEdge[]>(() => {
    return visualNodes.slice(1).map((node, idx) => ({
      id: `edge-${idx}`,
      source: visualNodes[idx].id,
      target: node.id,
    }));
  }, [visualNodes]);

  return { queryCards, visualNodes, visualEdges };
}
