/**
 * Live-price detection (WEBNA B5 cache-poisoning guard).
 *
 * isLivePriceQuery is the single-source predicate shared by the CoinGecko path
 * and the response cache. Any query it flags must never be cached: on a transient
 * CoinGecko failure the query falls through to the LLM, and caching that stale
 * answer would pin a wrong price for the whole TTL.
 */
import { describe, it, expect } from 'vitest';
import { isLivePriceQuery } from '../query-pipeline';

describe('query-pipeline / isLivePriceQuery', () => {
  it('flags crypto symbol + price keyword (these must stay live, never cached)', () => {
    expect(isLivePriceQuery('btc price')).toBe(true);
    expect(isLivePriceQuery('bitcoin price')).toBe(true);
    expect(isLivePriceQuery('what is eth worth')).toBe(true);
    expect(isLivePriceQuery('sol value right now')).toBe(true);
    expect(isLivePriceQuery('cost of cardano')).toBe(true);
  });

  it('does NOT flag a symbol without a price keyword (safe to cache)', () => {
    expect(isLivePriceQuery('explain bitcoin')).toBe(false);
    expect(isLivePriceQuery('how does ethereum work')).toBe(false);
  });

  it('does NOT flag a price keyword without a crypto symbol', () => {
    expect(isLivePriceQuery('what is the value of pi')).toBe(false);
    expect(isLivePriceQuery('the price of tea in china')).toBe(false);
  });
});
