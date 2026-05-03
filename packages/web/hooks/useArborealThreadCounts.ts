'use client';

import { useEffect, useState } from 'react';

export function useArborealThreadCounts(queryId: string): Record<number, number> {
  const [threadCounts, setThreadCounts] = useState<Record<number, number>>({});

  useEffect(() => {
    if (!queryId) return;
    fetch(`/api/arboreal-chat?queryId=${encodeURIComponent(queryId)}&listAll=true`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { threads?: Array<{ layer: number; messageCount: number }> } | null) => {
        if (!d?.threads) return;
        const counts: Record<number, number> = {};
        for (const t of d.threads) counts[t.layer] = t.messageCount;
        setThreadCounts(counts);
      })
      .catch(() => {});
  }, [queryId]);

  return threadCounts;
}
