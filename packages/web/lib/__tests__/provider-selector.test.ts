/**
 * Provider Selector — engine tests.
 *
 * Covers the deterministic provider routing surface: methodology→provider,
 * fallback hierarchy, fallback model specs, and pricing lookup.
 * No network — pure function discrimination.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  getFallbackModelSpec,
  getFallbackProvider,
  getProviderPricing,
  validateProviderApiKey,
  getAvailableProviders,
  type ProviderFamily,
} from '../provider-selector';

const ALL: ProviderFamily[] = [
  'anthropic',
  'deepseek',
  'mistral',
  'xai',
  'openrouter',
  'groq',
  'google',
];

describe('provider-selector / fallback model specs', () => {
  it('returns a non-empty model string for every provider family', () => {
    for (const p of ALL) {
      const spec = getFallbackModelSpec(p);
      expect(spec.model).toBeTruthy();
      expect(typeof spec.model).toBe('string');
    }
  });

  it('maps the free provider (openrouter) to a :free model', () => {
    expect(getFallbackModelSpec('openrouter').model).toContain(':free');
  });

  it('falls back to the free model for an unknown provider', () => {
    // @ts-expect-error — intentionally invalid to test the default branch
    expect(getFallbackModelSpec('bogus').model).toContain(':free');
  });
});

describe('provider-selector / fallback hierarchy', () => {
  const KEY_VARS = [
    'ANTHROPIC_API_KEY',
    'OPENROUTER_API_KEY',
    'GROQ_API_KEY',
    'GOOGLE_API_KEY',
    'GOOGLE_GENERATIVE_AI_API_KEY',
    'DEEPSEEK_API_KEY',
    'MISTRAL_API_KEY',
    'XAI_API_KEY',
  ];
  const saved: Record<string, string | undefined> = {};

  beforeEach(() => {
    for (const k of KEY_VARS) {
      saved[k] = process.env[k];
      delete process.env[k];
    }
  });
  afterEach(() => {
    for (const k of KEY_VARS) {
      if (saved[k] === undefined) delete process.env[k];
      else process.env[k] = saved[k];
    }
  });

  it('skips providers without keys and returns the next keyed one', () => {
    process.env.OPENROUTER_API_KEY = 'sk-test';
    // primary = anthropic (no key) → next keyed in hierarchy is openrouter
    expect(getFallbackProvider('anthropic')).toBe('openrouter');
  });

  it('wraps to the beginning if no later provider has a key', () => {
    process.env.ANTHROPIC_API_KEY = 'sk-test';
    // primary = xai (last) → no later → wrap → anthropic
    expect(getFallbackProvider('xai')).toBe('anthropic');
  });

  it('defaults to anthropic when nothing is configured', () => {
    expect(getFallbackProvider('anthropic')).toBe('anthropic');
  });

  it('validateProviderApiKey is false when no key present', () => {
    expect(validateProviderApiKey('anthropic')).toBe(false);
  });

  it('getAvailableProviders returns only keyed providers', () => {
    process.env.ANTHROPIC_API_KEY = 'sk-a';
    process.env.GROQ_API_KEY = 'sk-g';
    const avail = getAvailableProviders();
    expect(avail).toContain('anthropic');
    expect(avail).toContain('groq');
    expect(avail).not.toContain('mistral');
  });
});

describe('provider-selector / pricing', () => {
  it('returns numeric input/output pricing for every provider', () => {
    for (const p of ALL) {
      const pricing = getProviderPricing(p);
      expect(typeof pricing.input).toBe('number');
      expect(typeof pricing.output).toBe('number');
      expect(pricing.input).toBeGreaterThanOrEqual(0);
    }
  });

  it('prices the free provider (openrouter) at zero', () => {
    const pricing = getProviderPricing('openrouter');
    expect(pricing.input).toBe(0);
    expect(pricing.output).toBe(0);
  });
});
