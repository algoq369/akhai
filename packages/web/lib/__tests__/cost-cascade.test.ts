/**
 * Cost cascade (SB.3b).
 *
 * Simple factual queries (direct) route to the cheap fast model (Haiku 4.5),
 * while reasoning-heavy methodologies keep premium (Opus 4.8). Legend Mode
 * overrides the cascade. The cascade only applies when an Anthropic key is set.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { getProviderForMethodology } from '../provider-selector';

describe('cost cascade / getProviderForMethodology', () => {
  const original = process.env.ANTHROPIC_API_KEY;
  beforeAll(() => {
    process.env.ANTHROPIC_API_KEY = 'test-key';
  });
  afterAll(() => {
    if (original === undefined) delete process.env.ANTHROPIC_API_KEY;
    else process.env.ANTHROPIC_API_KEY = original;
  });

  it('routes direct queries to the budget model (Haiku 4.5)', () => {
    expect(getProviderForMethodology('direct').model).toBe('claude-haiku-4-5-20251001');
  });

  it('keeps tot on premium (Opus 4.8)', () => {
    expect(getProviderForMethodology('tot').model).toBe('claude-opus-4-8');
  });

  it('keeps react on premium (Opus 4.8)', () => {
    expect(getProviderForMethodology('react').model).toBe('claude-opus-4-8');
  });

  it('keeps sc on premium (Opus 4.8)', () => {
    expect(getProviderForMethodology('sc').model).toBe('claude-opus-4-8');
  });

  it('legendMode overrides the cascade — direct stays premium (Opus 4.8)', () => {
    expect(getProviderForMethodology('direct', true).model).toBe('claude-opus-4-8');
  });
});
