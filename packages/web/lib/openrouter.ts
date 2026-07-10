import 'server-only';
import { recordCall } from './cogs-scorecard';

/**
 * OpenRouter chat-completions plumbing for the GTP consensus advisors (free-consensus).
 * All advisors run on :free slugs — zero-priced by OpenRouter, verified live before pinning.
 * Free-tier budget ≈ 20 req/min shared across all :free models: one consensus = 3 advisor calls
 * (+3 more if round 2 runs, + at most 1 fallback retry each) — no throttling code needed yet.
 */

export const OPENROUTER_ENDPOINT = 'https://openrouter.ai/api/v1/chat/completions';

/** OpenRouter's official free auto-router — used when a pinned :free slug is unavailable. */
export const FREE_AUTO_ROUTER = 'openrouter/free';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

function postChat(
  apiKey: string,
  model: string,
  messages: ChatMessage[],
  signal: AbortSignal
): Promise<Response> {
  return fetch(OPENROUTER_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
      // OpenRouter-recommended attribution headers
      'HTTP-Referer': 'https://akhai.app',
      'X-Title': 'AkhAI',
    },
    body: JSON.stringify({ model, messages, max_tokens: 2048, temperature: 0.7 }),
    signal,
  });
}

/**
 * Free slugs rotate weekly without notice: 404, 429, or 400 model-not-found ⇒ worth one retry.
 * 402 too: upstreams serving a :free slug sometimes demand payment ("Provider returned error"
 * code 402) — the auto-router picks a different upstream (observed live 2026-07-10).
 */
function shouldFallback(status: number, body: string): boolean {
  return (
    status === 404 || status === 429 || status === 402 || (status === 400 && /model/i.test(body))
  );
}

export interface FreeChatResult {
  response: Response;
  modelUsed: string;
}

/**
 * Call a pinned :free model; if it 404s/429s (or 400 model-not-found), retry ONCE with the free
 * auto-router. onFallback fires before the retry so callers can emit an honest live event.
 */
export async function callFreeChatWithFallback(
  apiKey: string,
  model: string,
  messages: ChatMessage[],
  signal: AbortSignal,
  onFallback: () => void
): Promise<FreeChatResult> {
  const first = await postChat(apiKey, model, messages, signal);
  if (first.ok) return { response: first, modelUsed: model };
  const body = await first.text();
  if (!shouldFallback(first.status, body)) {
    // Preserve the failure for the caller's normal error path (body already consumed above)
    return { response: new Response(body, { status: first.status }), modelUsed: model };
  }
  onFallback();
  const second = await postChat(apiKey, FREE_AUTO_ROUTER, messages, signal);
  return { response: second, modelUsed: FREE_AUTO_ROUTER };
}

/** One reconciling COGS row per advisor call — costUSD 0 is honest: :free models are zero-priced. */
export function recordAdvisorCogs(
  streamQueryId: string | undefined,
  advisor: string,
  modelUsed: string,
  usage: { prompt_tokens?: number; completion_tokens?: number } | undefined,
  durationMs: number,
  outcome: 'ok' | 'empty' | 'error'
): void {
  recordCall({
    queryId: streamQueryId || 'tot-consensus',
    purpose: `tot-advisor-${advisor}`,
    model: modelUsed,
    inTok: usage?.prompt_tokens || 0,
    cacheRead: 0,
    cacheCreation: 0,
    outTok: usage?.completion_tokens || 0,
    durationMs,
    costUSD: 0,
    outcome,
    objectiveMet: null,
  });
}
