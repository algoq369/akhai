import 'server-only';
import type { QueryType } from './intelligence-fusion-types';

/**
 * Grounding checks whether an answer's factual claims are supported by sources. That lens only
 * applies to query types that MAKE verifiable factual claims. For generative/subjective types the
 * answer is EXPECTED to diverge from any sources (you are inventing or strategizing, not
 * reporting), so a low grounding score would be a false alarm — skip grounding there.
 */
const NON_FACTUAL_TYPES: ReadonlySet<QueryType> = new Set(['creative', 'planning']);

export function shouldGround(queryType: QueryType): boolean {
  return !NON_FACTUAL_TYPES.has(queryType);
}
// Conservative for a factuality-first product: only clearly generative/subjective types
// (creative brainstorming, strategy/planning) skip. Everything that reports facts
// (factual/comparative/research/analytical/procedural/troubleshooting) still grounds.
