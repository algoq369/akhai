// Single source of truth for model identifiers. Bumping a model = edit here only.
export const MODELS = {
  premium: 'claude-opus-4-8', // default for reasoning-heavy methodologies
  thinking: 'claude-opus-4-6', // streamable extended-thinking ONLY (emits thinking_delta)
  budget: 'claude-haiku-4-5-20251001', // simple/direct queries — ~10x cheaper
  free: 'meta-llama/llama-3.3-70b-instruct:free', // no-Anthropic-key fallback
  // OPTIONAL frontier tier — 2× Opus pricing ($10/$50 per M), 30-day provider retention
  // (NOT ZDR — excluded from Sovereign Mode), refusals via stop_reason:'refusal',
  // adaptive thinking via `effort` (no thinking_delta). Eval-gated (F2) before ANY surface uses it.
  frontier: 'claude-fable-5',
} as const;
