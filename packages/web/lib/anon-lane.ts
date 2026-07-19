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
