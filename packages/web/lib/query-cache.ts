import 'server-only';
import { LRUCache } from './intelligence-fusion-types';

/**
 * Response cache (WEBNA B5) — NORMALIZED-QUERY tier.
 *
 * Repeat cacheable queries skip the LLM entirely ($0, near-zero latency). This
 * is the conservative EXACT + NEAR-EXACT matcher (lowercase / whitespace /
 * punctuation normalization), NOT embedding similarity. Embedding-similarity
 * caching (semantically-close-but-not-identical queries) is a documented FUTURE
 * upgrade tier. This tier still captures the common case: re-asks, refreshes,
 * demos, back-to-back identical questions.
 *
 * Correctness rule: a wrong cache hit is worse than a miss. We only cache
 * answers that are a pure function of (query, methodology, mode) — see
 * isCacheable — and bound staleness with a 1h TTL.
 */

/** 1 hour — bounds staleness of cached answers. */
export const TTL_MS = 60 * 60 * 1000;

/** LRU capacity — number of distinct cached responses held at once. */
const MAX_ENTRIES = 200;

interface CacheEntry {
  response: unknown;
  ts: number;
}

const store = new LRUCache<string, CacheEntry>(MAX_ENTRIES);

/** Methodologies whose answer is a pure function of (query, mode) — safe to cache. */
const CACHEABLE_METHODOLOGIES = new Set(['direct', 'cod', 'sc', 'pas', 'tot']);

/**
 * Near-exact matcher: lowercase, collapse internal whitespace to single spaces,
 * trim, then strip leading/trailing SENTENCE punctuation (. , ; : ! ?). So
 * "What is entropy?", "what is entropy", and "  What is  entropy?! " all
 * normalize identically. We deliberately strip only sentence punctuation — NOT
 * the full Unicode punctuation class — so identifier-bearing queries like "C#"
 * do not collapse into "C" (a wrong cache hit is worse than a miss).
 */
export function normalizeQuery(q: string): string {
  return q
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^[.,;:!?]+|[.,;:!?]+$/g, '')
    .trim();
}

/**
 * Stable cache key: normalized query + methodology + legendMode + extendedThinking.
 * Different methodology/mode → different answer → different key (correctly a miss).
 */
export function cacheKey(params: {
  query: string;
  methodology: string;
  legendMode: boolean;
  extendedThinking?: boolean;
}): string {
  const { query, methodology, legendMode, extendedThinking } = params;
  return `${normalizeQuery(query)}|${methodology}|${legendMode}|${extendedThinking ?? false}`;
}

/** Return the stored response if present AND fresh (within TTL); else undefined (expired = miss). */
export function getCached(key: string): unknown {
  const entry = store.get(key);
  if (!entry) return undefined;
  if (Date.now() - entry.ts >= TTL_MS) return undefined;
  return entry.response;
}

/** Store a response under key, stamped with the current time. */
export function setCached(key: string, response: unknown): void {
  store.set(key, { response, ts: Date.now() });
}

/**
 * Cacheable ONLY for {direct, cod, sc, pas, tot} AND when no live/contextual
 * signal is present. Excludes 'react' (answer depends on live web search — must
 * stay fresh) and 'auto' (resolves unpredictably; be conservative). Any URL in
 * the query, live refinement, grimoire context, or instinct mode makes the
 * answer non-time-invariant, so it is not cacheable.
 */
export function isCacheable(params: {
  methodology: string;
  hasUrlContext: boolean;
  hasLiveRefinements: boolean;
  hasGrimoire: boolean;
  instinctMode: boolean;
}): boolean {
  const { methodology, hasUrlContext, hasLiveRefinements, hasGrimoire, instinctMode } = params;
  if (!CACHEABLE_METHODOLOGIES.has(methodology)) return false;
  if (hasUrlContext || hasLiveRefinements || hasGrimoire || instinctMode) return false;
  return true;
}

/** Empty the cache (tests). */
export function clearQueryCache(): void {
  store.clear();
}
