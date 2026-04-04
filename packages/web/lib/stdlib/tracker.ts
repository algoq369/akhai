/**
 * Lightweight operation tracker — stdlib pattern.
 * Tracks duration, tokens, and cost for AI operations.
 */

interface TrackedOp {
  op: string;
  duration: number;
  tokens?: number;
  cost?: number;
}

export function createTracker(name: string) {
  const ops: TrackedOp[] = [];

  return {
    track: (op: string, data: { duration: number; tokens?: number; cost?: number }) => {
      ops.push({ op, ...data });
    },
    getSummary: () => ({
      name,
      totalOps: ops.length,
      totalDuration: ops.reduce((s, o) => s + o.duration, 0),
      totalTokens: ops.reduce((s, o) => s + (o.tokens || 0), 0),
      totalCost: ops.reduce((s, o) => s + (o.cost || 0), 0),
    }),
    getOps: () => [...ops],
  };
}
