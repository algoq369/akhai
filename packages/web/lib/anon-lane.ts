import 'server-only';

/**
 * anon-lane: safety net for the anonymous free-model path.
 *
 * Free `:free` models — especially reasoning-class ones (nemotron) — sometimes emit their own
 * chain-of-thought or the system prompt itself as the "answer" instead of answering. Audit II
 * measured this at ~20-25% of anon queries on nemotron:free. A user must NEVER see the raw
 * prompt/reasoning, so callOpenRouter runs a head leak-gate on the stream and, on a hit, retries
 * clean once before falling back to an honest message.
 */

/** Shown when the free model can't produce a clean answer after a retry. Never the leaked text. */
export const ANON_FREE_FALLBACK =
  "The free model tripped over that one and couldn't answer cleanly. Try again in a moment — or sign in to run it on the full engine.";

/** Shown when the free tier is at capacity (429 / daily cap) — not a billing problem. */
export const ANON_FREE_CAPACITY =
  'The free model is at capacity right now — try again shortly, or sign in to run it on the full engine.';

/**
 * anon-lane-2: EXPLICIT allowlist of general-purpose free INSTRUCT/chat models on OpenRouter,
 * tried IN ORDER on 429 / unavailable / unsuitable output. Replaces the generic 'openrouter/free'
 * auto-router, whose unbounded selection was serving specialized models — a content-safety
 * CLASSIFIER answered every question with "User Safety: safe" on ~20% of anon queries.
 *
 * Every entry is a general chat model (NOT a classifier / vision / safety / embedding / code-only /
 * music / reasoning-leak model), verified live against the OpenRouter models API + a general Q&A
 * probe (2026-07-19). Ordered flagship-first; availability rotates, so several are listed.
 */
export const ANON_FREE_MODELS: readonly string[] = [
  'meta-llama/llama-3.3-70b-instruct:free', // Meta flagship general instruct — the declared default
  'google/gemma-4-31b-it:free', // Google Gemma instruct-tuned (it) — general chat
  'google/gemma-4-26b-a4b-it:free', // Gemma instruct — verified general (Oslo / 8 legs)
  'qwen/qwen3-next-80b-a3b-instruct:free', // Qwen general instruct (explicit -instruct variant)
  'meta-llama/llama-3.2-3b-instruct:free', // small Meta instruct — reliable general fallback
  'nvidia/nemotron-nano-9b-v2:free', // NVIDIA nano general instruct — verified clean (non-reasoning)
  'tencent/hy3:free', // Tencent Hunyuan general chat — verified general (Oslo / 8 legs)
];

// A classifier / moderation model returns a bare verdict ("User Safety: safe") instead of an
// answer. Anchored to the WHOLE response so a real answer never matches: only fires when the
// entire output IS a single label:value verdict using a classification term. A legit short answer
// ("Copenhagen.", "Seven.", "351") has no such label; an answer ABOUT safety is a full sentence.
const CLASSIFIER_VERDICT =
  /^\s*(user\s+)?(content[-\s]?safety|safety|moderation|toxicity|category|classification|verdict|label|policy|risk|refusal|harm(ful)?)\s*[:=]\s*[^\n.]{1,40}\.?\s*$/i;

/**
 * True when a free-model "answer" is structurally not an answer — a classifier/moderation verdict,
 * or empty/degenerate. Cheap + precise; must NOT fire on legitimate short answers or on answers
 * genuinely about safety/classification.
 */
export function looksUnsuitable(text: string | undefined | null): boolean {
  const t = (text || '').trim();
  if (!t) return true; // empty / degenerate
  return CLASSIFIER_VERDICT.test(t);
}

// Verbatim reasoning-preamble / system-prompt fragments that appear ONLY when a free model
// regurgitates its instructions instead of answering. Deliberately narrow so a legitimate answer
// (even one ABOUT Marcus Aurelius or about prompts) does not match: these are the model talking
// to itself, not to the user. The reasoning leak always sits at the very head of the output.
const LEAK_MARKERS: RegExp[] = [
  /\bWe need to (answer|decide|figure|determine|craft)\b/i,
  /\b(Okay|Alright|So),?\s+the user (is asking|wants|asked|needs)\b/i,
  /\bthe user is asking\b/i,
  /\baccording to the mode selection\b/i,
  /\bmode selection rules\b/i,
  /\bLet me (craft|decide|think about which mode|figure out which)\b/i,
  /\bYou are AkhAI\b/,
  /\bWRITING RULES\b/,
  /\bECONOMY RULES ALL\b/,
  /a pure fact ends at the fact/i,
  /this is Jul's moment/i,
  /\bStraight into the answer\b/i,
];

/**
 * True when a free-model "answer" is actually its prompt/reasoning leaking through, or is empty.
 * Cheap + precise: empty content, or a verbatim marker in the head (leaks front-load their tells).
 */
export function looksLikePromptLeak(text: string | undefined | null): boolean {
  const t = (text || '').trim();
  if (!t) return true;
  const head = t.slice(0, 400);
  return LEAK_MARKERS.some((re) => re.test(head));
}
