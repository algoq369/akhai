// Single source of truth for model identifiers. Bumping a model = edit here only.
export const MODELS = {
  premium: 'claude-opus-4-8', // default for reasoning-heavy methodologies
  thinking: 'claude-opus-4-6', // streamable extended-thinking ONLY (emits thinking_delta)
  budget: 'claude-haiku-4-5-20251001', // simple/direct queries — ~10x cheaper
  free: 'meta-llama/llama-3.3-70b-instruct:free', // no-Anthropic-key fallback
} as const;
