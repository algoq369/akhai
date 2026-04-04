/**
 * Shared callback builders for AkhAI Flow A / Flow B event streaming.
 * Extracted from akhai-executor for file-size compliance.
 */
import type { QueryEvent } from './query-store';
import { addQueryEvent } from './query-store';
import { emitQueryEvent } from './event-emitter';

/**
 * Helper to emit events to both query-store and event-emitter (SSE)
 */
export function emitEvent(queryId: string, type: QueryEvent['type'], data: any) {
  const event = { type, data, timestamp: Date.now() };

  // Store in query-store for persistence
  addQueryEvent(queryId, type, data);

  // Emit to SSE subscribers for real-time updates
  emitQueryEvent(queryId, event);
}

/**
 * Build the standard callbacks object shared by Flow A and Flow B.
 * Flow B extends these with sub-agent callbacks.
 */
export function buildBaseCallbacks(queryId: string) {
  return {
    onAdvisorStart: (slot: number, family: string, round: number) => {
      emitEvent(queryId, 'advisor-start', {
        round,
        slot,
        family,
        status: 'thinking',
        response: `${family} is analyzing...`,
      });
    },
    onAdvisorComplete: (slot: number, family: string, round: number, output: string) => {
      emitEvent(queryId, 'advisor-complete', {
        round,
        slot,
        family,
        status: 'complete',
        response: output,
      });
    },
    onConsensusCheck: (round: number, reached: boolean) => {
      if (reached) {
        emitEvent(queryId, 'consensus-reached', {
          round,
        });
      }
    },
    onRoundComplete: (round: number, totalRounds: number) => {
      emitEvent(queryId, 'round-complete', {
        round,
        totalRounds,
      });
    },
    onRedactorStart: () => {
      emitEvent(queryId, 'redactor-start', {
        status: 'analyzing',
        output: 'Redactor is synthesizing advisor outputs...',
      });
    },
    onRedactorComplete: (synthesis: string, family: string) => {
      emitEvent(queryId, 'redactor-complete', {
        status: 'complete',
        output: synthesis,
        family,
      });
    },
    onMotherBaseReview: (exchange: number, approved: boolean, response: string) => {
      emitEvent(queryId, 'mother-base-review', {
        exchange,
        approved,
        decision: response,
      });
    },
  };
}
