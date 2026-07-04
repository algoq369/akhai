import { describe, it, expect } from 'vitest';
import { MODELS } from '../models';
import { getProviderPricing } from '../provider-selector';
import { shouldFableFallback } from '../multi-provider-api';

describe('fable-plumbing / MODELS', () => {
  it('exposes the frontier tier', () => {
    expect(MODELS.frontier).toBe('claude-fable-5');
  });
});

describe('fable-plumbing / model-aware pricing (per 1K)', () => {
  it('prices Opus 4.8 at $5/$25 per M', () => {
    expect(getProviderPricing('anthropic', 'claude-opus-4-8')).toEqual({
      input: 0.005,
      output: 0.025,
    });
  });

  it('prices Opus 4.6 at $5/$25 per M', () => {
    expect(getProviderPricing('anthropic', 'claude-opus-4-6')).toEqual({
      input: 0.005,
      output: 0.025,
    });
  });

  it('prices Haiku 4.5 at $1/$5 per M', () => {
    expect(getProviderPricing('anthropic', 'claude-haiku-4-5-20251001')).toEqual({
      input: 0.001,
      output: 0.005,
    });
  });

  it('prices Fable 5 at $10/$50 per M', () => {
    expect(getProviderPricing('anthropic', 'claude-fable-5')).toEqual({
      input: 0.01,
      output: 0.05,
    });
  });

  it('falls back to the provider default for unknown models and no model', () => {
    expect(getProviderPricing('anthropic', 'claude-unknown-model')).toEqual({
      input: 0.003,
      output: 0.015,
    });
    expect(getProviderPricing('anthropic')).toEqual({ input: 0.003, output: 0.015 });
  });

  it('leaves non-anthropic provider pricing unchanged', () => {
    expect(getProviderPricing('deepseek')).toEqual({ input: 0.00055, output: 0.00219 });
    expect(getProviderPricing('openrouter')).toEqual({ input: 0, output: 0 });
  });
});

describe('fable-plumbing / shouldFableFallback', () => {
  it('is true only for a refusal on the frontier model', () => {
    expect(shouldFableFallback('refusal', MODELS.frontier)).toBe(true);
  });

  it('is false for refusals on other models', () => {
    expect(shouldFableFallback('refusal', MODELS.premium)).toBe(false);
    expect(shouldFableFallback('refusal', MODELS.budget)).toBe(false);
  });

  it('is false for non-refusal stop reasons on the frontier model', () => {
    expect(shouldFableFallback('end_turn', MODELS.frontier)).toBe(false);
    expect(shouldFableFallback('max_tokens', MODELS.frontier)).toBe(false);
    expect(shouldFableFallback(undefined, MODELS.frontier)).toBe(false);
  });
});
