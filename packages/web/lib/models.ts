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

// FREE OpenRouter advisors — slugs rotate, verify at openrouter.ai/models (last verified
// 2026-07-10). Diversity = 3 different labs, not a capability tier. Free-only by decision.
export const ADVISORS = {
  technical: 'openai/gpt-oss-120b:free', // OpenAI lab — Technical Analyst
  strategic: 'cohere/north-mini-code:free', // Cohere — Strategic Advisor (nemotron pin timed out
  // 3/3 runs 2026-07-10 @35s/0 tok; north live-verified same day — the only third-lab free slug
  // answering with content; qwen3-next/gemma-4 both upstream-429, retry them off-peak)
  creative: 'meta-llama/llama-3.3-70b-instruct:free', // Meta — Creative Challenger
} as const;
