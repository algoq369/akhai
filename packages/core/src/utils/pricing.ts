/**
 * Per-model pricing (per 1K tokens) — ESTIMATES for local metrics/COGS only, never billing.
 * Verified live against platform.claude.com/docs/en/about-claude/models/overview on 2026-07-10.
 * Exact model match wins; unknown models degrade to the provider-family default (documented
 * approximation, previously the flat family rate mispriced every Anthropic model as Sonnet).
 */

export interface TokenRate {
  input: number;
  output: number;
}

export const MODEL_RATES: Record<string, TokenRate> = {
  'claude-fable-5': { input: 0.01, output: 0.05 }, // $10/$50 per M
  'claude-opus-4-8': { input: 0.005, output: 0.025 }, // $5/$25 per M
  'claude-opus-4-7': { input: 0.005, output: 0.025 },
  'claude-opus-4-6': { input: 0.005, output: 0.025 },
  'claude-opus-4-5': { input: 0.005, output: 0.025 },
  'claude-sonnet-5': { input: 0.003, output: 0.015 }, // $3/$15 sticker ($2/$10 intro to 2026-08-31)
  'claude-sonnet-4-6': { input: 0.003, output: 0.015 },
  'claude-haiku-4-5-20251001': { input: 0.001, output: 0.005 }, // $1/$5 per M
  'claude-haiku-4-5': { input: 0.001, output: 0.005 },
};

// Provider-family defaults for models not pinned above (anthropic default = Sonnet tier)
export const PROVIDER_DEFAULT_RATES: Record<string, TokenRate> = {
  deepseek: { input: 0.00055, output: 0.00219 },
  anthropic: { input: 0.003, output: 0.015 },
  mistral: { input: 0.0002, output: 0.0006 },
  xai: { input: 0.002, output: 0.01 },
};

/** Exact model match wins, else the provider-family default, else deepseek (historic fallback). */
export function getRate(providerName: string, model?: string): TokenRate {
  if (model) {
    if (MODEL_RATES[model]) return MODEL_RATES[model];
    // The API echoes dated snapshot ids for alias-configured models (e.g. claude-opus-4-5 →
    // claude-opus-4-5-20251101): strip the date suffix and retry before the family fallback.
    const dateless = model.replace(/-\d{8}$/, '');
    if (MODEL_RATES[dateless]) return MODEL_RATES[dateless];
  }
  const normalizedName = (providerName || '').toLowerCase();
  return PROVIDER_DEFAULT_RATES[normalizedName] || PROVIDER_DEFAULT_RATES.deepseek;
}
