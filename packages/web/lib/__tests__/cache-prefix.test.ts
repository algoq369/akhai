/**
 * Gap-A prompt-cache prefix stability.
 *
 * Proves buildAnthropicSystem emits a CACHED stable prefix (block 0, with the cache_control
 * breakpoint) plus an UNCACHED dynamic block (block 1, no cache_control). Because block 0 is exactly
 * the stable methodology string and never mutates per-query, the Anthropic prompt cache actually
 * hits — the fix for cache-miss-every-query.
 */
import { describe, it, expect } from 'vitest';
import { buildAnthropicSystem } from '../multi-provider-api';

const STABLE = 'STABLE METHODOLOGY BLOCK — fixed instructions that must be the cached prefix';
const DYNAMIC = 'Current date: Monday\n\nLive web context (searched as of today):\n- foo: bar';

describe('buildAnthropicSystem — gap-A stable cache prefix', () => {
  it('emits 2 blocks when dynamicContext is present; cache_control ONLY on the stable block', () => {
    const blocks = buildAnthropicSystem(STABLE, DYNAMIC);
    expect(blocks).toHaveLength(2);
    expect(blocks![0].cache_control).toEqual({ type: 'ephemeral' });
    expect(blocks![1].cache_control).toBeUndefined();
    // the cached prefix is EXACTLY the stable methodology string — proves it does not mutate per-query
    expect(blocks![0].text).toBe(STABLE);
    expect(blocks![1].text).toBe(DYNAMIC);
  });

  it('emits 1 cached block when dynamicContext is absent', () => {
    const blocks = buildAnthropicSystem(STABLE);
    expect(blocks).toHaveLength(1);
    expect(blocks![0].cache_control).toEqual({ type: 'ephemeral' });
    expect(blocks![0].text).toBe(STABLE);
  });

  it('treats empty dynamicContext as absent (single cached block)', () => {
    const blocks = buildAnthropicSystem(STABLE, '');
    expect(blocks).toHaveLength(1);
    expect(blocks![0].cache_control).toEqual({ type: 'ephemeral' });
  });

  it('returns undefined when there is no system prompt', () => {
    expect(buildAnthropicSystem(undefined, DYNAMIC)).toBeUndefined();
    expect(buildAnthropicSystem('')).toBeUndefined();
  });
});
