import 'server-only';
// Standard import — server suites run in the node test project (vitest.config projects);
// if this file ever fails collection again, the env split regressed.
import { createHash } from 'node:crypto';
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

/**
 * Methodologies whose answer is a pure function of (query, mode) — safe to cache.
 * 'tot' is deliberately EXCLUDED: consensus success early-returns before the cache
 * populate, so the only answers that could ever be stored under a '|tot|' key are
 * degraded single-model fallbacks from a consensus outage — pure poison surface.
 */
const CACHEABLE_METHODOLOGIES = new Set(['direct', 'cod', 'sc', 'pas']);

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
 * Collision-resistant context fingerprint (sha256/128-bit) — partitions the key by page
 * context without storing it. NOT fnv1a: a 32-bit hash admits offline-crafted collisions,
 * and a colliding pageContext would SHARE a key across different contexts (a wrong hit —
 * cache poisoning). sha256 makes collisions cryptographically negligible.
 */
function hashContext(s: string): string {
  return createHash('sha256').update(s).digest('hex').slice(0, 32);
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
  /** Custom AI-layer weights (0-1 per Layer id). Non-default weights change the answer's
   *  calibration, so they must partition the cache: 50% (default) layers are omitted, so
   *  default-config traffic keeps sharing entries while each custom config gets its own. */
  layersWeights?: Record<number, number>;
  /** Page context shapes the answer (deictic "this"/"it" queries) — differing contexts must
   *  partition the key. Falsy values hash identically to the context-free key, mirroring the
   *  route's `if (pageContext)` injection gate: the key covers exactly what the model saw. */
  pageContext?: string;
}): string {
  const { query, methodology, legendMode, extendedThinking, layersWeights, pageContext } = params;
  const wPart = layersWeights
    ? Object.entries(layersWeights)
        .map(([id, v]) => [Number(id), Math.round((v ?? 0.5) * 100)] as const)
        .filter(([, pct]) => pct !== 50)
        .sort((a, b) => a[0] - b[0])
        .map(([id, pct]) => `${id}:${pct}`)
        .join(',')
    : '';
  // `pageContext ? String(pageContext) : ''` mirrors the route's injection gate exactly:
  // falsy values (0, '', undefined) are never injected → context-free key; truthy non-strings
  // (schema is z.any) hash as the same String() the prompt template renders.
  return `${normalizeQuery(query)}|${methodology}|${legendMode}|${extendedThinking ?? false}|W:${wPart}|P:${hashContext(pageContext ? String(pageContext) : '')}`;
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
 * Cacheable ONLY for {direct, cod, sc, pas} AND when no live/contextual
 * signal is present. Excludes 'react' (answer depends on live web search — must
 * stay fresh) and 'auto' (resolves unpredictably; be conservative). Any URL in
 * the query, live refinement, grimoire context, instinct mode, or conversation
 * history makes the answer non-time-invariant, so it is not cacheable.
 */
export function isCacheable(params: {
  methodology: string;
  hasUrlContext: boolean;
  hasLiveRefinements: boolean;
  hasGrimoire: boolean;
  instinctMode: boolean;
  /** Answers incorporate conversationHistory.slice(-6), so only history-FREE requests are a
   *  pure function of the query — a cached "explain more" must never cross conversations. */
  hasHistory: boolean;
}): boolean {
  const { methodology, hasUrlContext, hasLiveRefinements, hasGrimoire, instinctMode, hasHistory } =
    params;
  if (!CACHEABLE_METHODOLOGIES.has(methodology)) return false;
  if (hasUrlContext || hasLiveRefinements || hasGrimoire || instinctMode || hasHistory)
    return false;
  return true;
}

/** Empty the cache (tests). */
export function clearQueryCache(): void {
  store.clear();
}
