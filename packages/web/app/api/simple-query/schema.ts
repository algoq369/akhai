import { z } from 'zod';
import { emitThought } from '@/lib/thought-stream';
import { addEvent } from '@/lib/database';

// ============================================================================
// ZOD INPUT VALIDATION SCHEMA
// ============================================================================
export const QuerySchema = z.object({
  query: z.string().min(1).max(10000),
  methodology: z.enum(['direct', 'cod', 'sc', 'react', 'pas', 'tot', 'auto']).default('auto'),
  conversationHistory: z.array(z.object({ role: z.string(), content: z.string() })).default([]),
  pageContext: z.any().optional(),
  legendMode: z.boolean().default(false),
  layersWeights: z
    .record(z.string(), z.number())
    .optional()
    .transform((w) =>
      w
        ? (Object.fromEntries(Object.entries(w).map(([k, v]) => [Number(k), v])) as Record<
            number,
            number
          >)
        : undefined
    ),
  instinctMode: z.boolean().optional(),
  instinctConfig: z.any().optional(),
  liveRefinements: z.array(z.object({ type: z.string(), text: z.string() })).optional(),
  grimoireContext: z.any().optional(),
  queryId: z.string().optional(),
});

/** Emit thought to SSE AND persist to DB for history replay */
export function emitAndPersist(
  queryId: string,
  event: import('@/lib/thought-stream').ThoughtEvent
) {
  emitThought(queryId, event);
  try {
    addEvent(queryId, `pipeline:${event.stage}`, {
      id: event.id,
      stage: event.stage,
      timestamp: event.timestamp,
      data: event.data,
      details: event.details || null,
    });
  } catch (e) {
    // DB write failure is non-critical — SSE already delivered
  }
}
