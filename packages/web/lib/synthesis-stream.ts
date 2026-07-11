import 'server-only';
import { emitThought } from './thought-stream';

/**
 * tot-live-words: streaming Mother Base synthesis for GTP Flash consensus.
 *
 * The synthesis used to be one non-streamed fetch — the user watched a silent multi-second
 * gap while the unified answer built invisibly. streamSynthesis POSTs the Anthropic Messages
 * API with stream:true and re-emits the answer's text_deltas as the SAME coalesced
 * 'generating' chunk events the single-pass methodologies use (flush at ~40 chars or ~250ms,
 * each event carrying ONLY the chunk since the last flush — the client accumulates), so tot's
 * answer flows word-by-word in the live panel. REAL tokens only, nothing invented.
 *
 * Returns null on ANY failure (non-ok response, missing body, parse error, abort/timeout) —
 * the caller falls back to the existing non-streamed fetch, which stays byte-equivalent.
 * The 90s AbortController covers the WHOLE body read, not just the headers (a stalled SSE
 * body must not hang the route — the 69d6f3d lesson).
 */

/** Anthropic SSE event fields we read — mirrors lib/multi-provider-api.ts parsing. */
interface AnthropicSseEvent {
  type?: string;
  message?: { usage?: { input_tokens?: number } };
  delta?: { type?: string; text?: string };
  usage?: { output_tokens?: number };
}

/** The Mother Base prompt — single source for BOTH the streamed and non-streamed paths. */
export function buildSynthesisPrompt(
  query: string,
  synthesisContext: string,
  advisorCount: number
): { system: string; userContent: string } {
  return {
    system: `You are Mother Base, the synthesizer in AkhAI's multi-AI consensus system.

Synthesize insights from ${advisorCount} AI advisors into a unified response.

Guidelines:
- Integrate all perspectives coherently
- Highlight strong agreements
- Note important disagreements
- Provide clear, actionable conclusions
- Be concise but complete`,
    userContent: `# Query\n${query}\n\n# Advisor Insights\n\n${synthesisContext}\n\n# Task\nSynthesize into a comprehensive response.`,
  };
}

export async function streamSynthesis(args: {
  apiKey: string;
  model: string;
  system: string;
  userContent: string;
  maxTokens: number;
  streamQueryId: string | undefined;
  startTime: number;
}): Promise<{ text: string; usage: { input: number; output: number } } | null> {
  const { apiKey, model, system, userContent, maxTokens, streamQueryId, startTime } = args;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 90_000);
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        max_tokens: maxTokens,
        stream: true,
        system,
        messages: [{ role: 'user', content: userContent }],
      }),
      signal: controller.signal,
    });
    if (!res.ok || !res.body) {
      console.warn(`[TOT_SYNTHESIS] stream HTTP ${res.status} — falling back to non-streamed`);
      return null;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let text = '';
    let inputTokens = 0;
    let outputTokens = 0;

    // Coalesced live-words (simple-query flushGen pattern): sequential ids, chunk-only payloads.
    let genSeq = 0;
    let genBuf = '';
    let genLastFlush = Date.now();
    const flushGen = (force: boolean) => {
      if (!streamQueryId || !genBuf) return;
      if (!force && genBuf.length < 40 && Date.now() - genLastFlush < 250) return;
      emitThought(streamQueryId, {
        id: `${streamQueryId}-gen-syn-${genSeq++}`,
        queryId: streamQueryId,
        stage: 'generating',
        timestamp: Date.now() - startTime,
        data: 'Combining the advisors into one answer...',
        details: { narrative: genBuf },
      });
      genBuf = '';
      genLastFlush = Date.now();
    };

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';
      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const json = line.slice(6);
        if (!json || json === '[DONE]') continue;
        let ev: AnthropicSseEvent;
        try {
          ev = JSON.parse(json) as AnthropicSseEvent;
        } catch {
          continue;
        }
        if (ev.type === 'message_start') {
          inputTokens = ev.message?.usage?.input_tokens || 0;
        } else if (ev.type === 'content_block_delta' && ev.delta?.type === 'text_delta') {
          const t = ev.delta.text || '';
          text += t;
          genBuf += t;
          flushGen(false);
        } else if (ev.type === 'message_delta') {
          outputTokens = ev.usage?.output_tokens || 0;
        }
      }
    }
    flushGen(true); // tail — the last sub-40-char chunk must not vanish

    if (!text) return null;
    return { text, usage: { input: inputTokens, output: outputTokens } };
  } catch (err) {
    console.warn(
      `[TOT_SYNTHESIS] stream failed — falling back to non-streamed: ${(err as Error).message?.slice(0, 120)}`
    );
    return null;
  } finally {
    clearTimeout(timeout);
  }
}
