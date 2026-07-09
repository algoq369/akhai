// Single source of truth for model identifiers. Bumping a model = edit here only.
export const MODELS = {
  premium: 'claude-opus-4-8', // default for reasoning-heavy methodologies
  thinking: 'claude-opus-4-6', // streamable extended-thinking ONLY (emits thinking_delta)
  mid: 'claude-sonnet-5', // current Sonnet — capable-efficient mid tier (reasoning chats, lenses, extraction, vision)
  budget: 'claude-haiku-4-5-20251001', // simple/direct queries — ~10x cheaper
  free: 'meta-llama/llama-3.3-70b-instruct:free', // no-Anthropic-key fallback
  // OPTIONAL frontier tier — 2× Opus pricing ($10/$50 per M), 30-day provider retention
  // (NOT ZDR — excluded from Sovereign Mode), refusals via stop_reason:'refusal',
  // adaptive thinking via `effort` (no thinking_delta). Eval-gated (F2) before ANY surface uses it.
  frontier: 'claude-fable-5',
} as const;

// GTP consensus advisors — deliberately diverse models for perspective, not a capability tier.
export const ADVISORS = {
  technical: 'deepseek-chat', // DeepSeek — Technical Analyst (rolling alias, auto-latest)
  strategic: 'mistral-small-latest', // Mistral — Strategic Advisor (rolling alias)
  creative: 'grok-4.3', // Grok — Creative Challenger (was grok-3/grok-2; grok-4.3 is
  // current EU-available flagship; grok-4.5 not EU yet — see E6.1.x)
} as const;
