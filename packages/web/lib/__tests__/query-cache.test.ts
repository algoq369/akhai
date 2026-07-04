// @vitest-environment node
// query-cache imports node:crypto (sha256 context fingerprint) — a server-only builtin the
// default browser-mode environment externalizes at collection. Server modules test under node.
/**
 * Response cache (WEBNA B5) — NORMALIZED-QUERY tier.
 *
 * Verifies the near-exact matcher, key stability, TTL expiry, and the
 * cacheability policy that keeps time-sensitive answers (react / url /
 * contextual) out of the cache. Correctness rule under test: a wrong cache hit
 * is worse than a miss.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  normalizeQuery,
  cacheKey,
  getCached,
  setCached,
  isCacheable,
  clearQueryCache,
  TTL_MS,
} from '../query-cache';

describe('query-cache / normalizeQuery', () => {
  it('collapses case, whitespace, and edge punctuation to one canonical form', () => {
    const a = normalizeQuery('What is entropy?');
    const b = normalizeQuery('what is entropy');
    const c = normalizeQuery('  What is  entropy?! ');
    expect(a).toBe('what is entropy');
    expect(a).toBe(b);
    expect(b).toBe(c);
  });

  it('cacheKey partitions by non-default layersWeights; defaults share the no-weights key', () => {
    const base = { query: 'q', methodology: 'direct', legendMode: false };
    const none = cacheKey(base);
    const allDefault = cacheKey({ ...base, layersWeights: { 4: 0.5, 9: 0.5 } });
    const custom = cacheKey({ ...base, layersWeights: { 9: 0.98, 4: 0.02 } });
    const customSameReordered = cacheKey({ ...base, layersWeights: { 4: 0.02, 9: 0.98 } });
    const otherCustom = cacheKey({ ...base, layersWeights: { 9: 0.02, 4: 0.98 } });
    expect(allDefault).toBe(none);
    expect(custom).toBe(customSameReordered);
    expect(custom).not.toBe(none);
    expect(custom).not.toBe(otherCustom);
  });

  it('does NOT collapse identifier punctuation — "C#" stays distinct from "C" (no wrong-topic hit)', () => {
    expect(normalizeQuery('C#')).toBe('c#');
    expect(normalizeQuery('C#')).not.toBe(normalizeQuery('C'));
    expect(normalizeQuery('C++')).toBe('c++');
    expect(normalizeQuery('#tag')).not.toBe(normalizeQuery('tag'));
  });
});

describe('query-cache / cacheKey', () => {
  const base = { query: 'What is entropy?', legendMode: false, extendedThinking: false };

  it('differs when methodology differs (same query)', () => {
    expect(cacheKey({ ...base, methodology: 'direct' })).not.toBe(
      cacheKey({ ...base, methodology: 'cod' })
    );
  });

  it('differs when legendMode differs (same query, same methodology)', () => {
    expect(cacheKey({ query: base.query, methodology: 'direct', legendMode: false, extendedThinking: false })).not.toBe(
      cacheKey({ query: base.query, methodology: 'direct', legendMode: true, extendedThinking: false })
    );
  });

  it('matches across punctuation / whitespace / case variants of the same query', () => {
    const k1 = cacheKey({ query: 'What is entropy?', methodology: 'direct', legendMode: false, extendedThinking: false });
    const k2 = cacheKey({ query: '  what is  ENTROPY ', methodology: 'direct', legendMode: false, extendedThinking: false });
    expect(k1).toBe(k2);
  });

  it('does NOT collide semantically-different identifiers ("C#" vs "C")', () => {
    expect(cacheKey({ query: 'C#', methodology: 'direct', legendMode: false, extendedThinking: false })).not.toBe(
      cacheKey({ query: 'C', methodology: 'direct', legendMode: false, extendedThinking: false })
    );
  });

  it('partitions by pageContext; empty and undefined share the context-free key (E7/D2)', () => {
    const noCtx = cacheKey({ ...base, methodology: 'direct' });
    const emptyCtx = cacheKey({ ...base, methodology: 'direct', pageContext: '' });
    const ctxA = cacheKey({ ...base, methodology: 'direct', pageContext: 'viewing node about entropy' });
    const ctxB = cacheKey({ ...base, methodology: 'direct', pageContext: 'viewing node about enthalpy' });
    expect(emptyCtx).toBe(noCtx);
    expect(ctxA).not.toBe(noCtx);
    expect(ctxA).not.toBe(ctxB);
  });
});

describe('query-cache / get + set', () => {
  beforeEach(() => clearQueryCache());

  it('set then get returns the stored response', () => {
    setCached('k1', { response: 'hello' });
    expect(getCached('k1')).toEqual({ response: 'hello' });
  });

  it('get on a missing key returns undefined', () => {
    expect(getCached('does-not-exist')).toBeUndefined();
  });
});

describe('query-cache / TTL', () => {
  beforeEach(() => {
    clearQueryCache();
    vi.useFakeTimers();
  });
  afterEach(() => vi.useRealTimers());

  it('fresh entries (within TTL) hit', () => {
    vi.setSystemTime(1_000_000);
    setCached('k', { v: 1 });
    vi.setSystemTime(1_000_000 + TTL_MS - 1);
    expect(getCached('k')).toEqual({ v: 1 });
  });

  it('entries older than TTL_MS are treated as a miss (expired)', () => {
    vi.setSystemTime(1_000_000);
    setCached('k', { v: 1 });
    vi.setSystemTime(1_000_000 + TTL_MS + 1);
    expect(getCached('k')).toBeUndefined();
  });
});

describe('query-cache / isCacheable', () => {
  const clean = {
    hasUrlContext: false,
    hasLiveRefinements: false,
    hasGrimoire: false,
    instinctMode: false,
    hasHistory: false,
  };

  it('is true for direct/cod/sc/pas with clean flags', () => {
    for (const m of ['direct', 'cod', 'sc', 'pas']) {
      expect(isCacheable({ methodology: m, ...clean })).toBe(true);
    }
  });

  it('is false for react (live web search — must stay fresh)', () => {
    expect(isCacheable({ methodology: 'react', ...clean })).toBe(false);
  });

  it('is false for tot (only consensus-failure fallbacks could ever be stored)', () => {
    expect(isCacheable({ methodology: 'tot', ...clean })).toBe(false);
  });

  it('is false for auto (resolves unpredictably — be conservative)', () => {
    expect(isCacheable({ methodology: 'auto', ...clean })).toBe(false);
  });

  it('is false when any live/contextual signal is set', () => {
    expect(isCacheable({ methodology: 'direct', ...clean, hasUrlContext: true })).toBe(false);
    expect(isCacheable({ methodology: 'direct', ...clean, hasLiveRefinements: true })).toBe(false);
    expect(isCacheable({ methodology: 'direct', ...clean, hasGrimoire: true })).toBe(false);
    expect(isCacheable({ methodology: 'direct', ...clean, instinctMode: true })).toBe(false);
  });

  it('is false with conversation history — follow-ups must never cross conversations (E7/D1)', () => {
    expect(isCacheable({ methodology: 'direct', ...clean, hasHistory: true })).toBe(false);
  });
});

describe('query-cache / clearQueryCache', () => {
  it('empties the store', () => {
    setCached('k', { v: 1 });
    expect(getCached('k')).toEqual({ v: 1 });
    clearQueryCache();
    expect(getCached('k')).toBeUndefined();
  });
});
