import 'server-only';
import { MODELS } from '@/lib/models';

/**
 * Multi-Provider API Caller
 *
 * Unified interface for calling different AI providers (Anthropic, DeepSeek, Mistral, xAI)
 * with proper request/response formatting for each provider.
 */

import type { ProviderFamily } from './provider-selector';
import { getProviderApiConfig, getProviderPricing } from './provider-selector';
import { recordCall } from './cogs-scorecard';

/** Hard ceiling per provider HTTP call — hung sockets abort instead of hanging forever (WEBNA P1.5). Tunable via env. */
const PROVIDER_TIMEOUT_MS = Number(process.env.PROVIDER_TIMEOUT_MS) || 180_000;

export interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface CompletionRequest {
  messages: Message[];
  model: string;
  maxTokens?: number;
  temperature?: number;
  systemPrompt?: string;
  extendedThinking?: boolean;
  onThinkingDelta?: (chunk: string) => void;
  onTextDelta?: (chunk: string) => void;
  /** F1: Fable adaptive-thinking control — only sent when model is MODELS.frontier. */
  effort?: 'low' | 'medium' | 'high' | 'xhigh' | 'max';
  purpose?: string;
  queryId?: string;
  /** Gap-A: per-query content that must NOT be in the cached prefix (date/web/fusion/thinking). */
  dynamicContext?: string;
}

export interface CompletionResponse {
  content: string;
  rawThinking?: string;
  usage: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    cacheRead: number;
    cacheCreation: number;
  };
  model: string;
  provider: ProviderFamily;
  cost: number;
  latencyMs: number;
}

/** A system block for the Anthropic API: the stable prefix carries the cache breakpoint. */
type AnthropicSystemBlock = {
  type: 'text';
  text: string;
  cache_control?: { type: 'ephemeral' };
};

/**
 * Gap-A: build the Anthropic `system` as a CACHED stable prefix + an UNCACHED dynamic suffix.
 *
 * The cache_control breakpoint sits on block 0 (the stable ~9KB methodology prompt), so that prefix
 * is cached across queries. Per-query dynamic content (date/web/fusion/thinking) goes in block 1,
 * which is reprocessed each call but does NOT change — and therefore does NOT invalidate — the
 * cached prefix. This is the canonical Anthropic multi-block cache pattern; before this fix the
 * single block mutated every query and never cached.
 */
export function buildAnthropicSystem(
  systemPrompt: string | undefined,
  dynamicContext?: string
): AnthropicSystemBlock[] | undefined {
  if (!systemPrompt) return undefined;
  const blocks: AnthropicSystemBlock[] = [
    { type: 'text', text: systemPrompt, cache_control: { type: 'ephemeral' } },
  ];
  if (dynamicContext) blocks.push({ type: 'text', text: dynamicContext });
  return blocks;
}

/**
 * Call AI provider API with unified interface
 *
 * @param provider - Provider to call
 * @param request - Completion request
 * @returns Completion response
 */
export async function callProvider(
  provider: ProviderFamily,
  request: CompletionRequest
): Promise<CompletionResponse> {
  const startTime = Date.now();
  const queryId = request.queryId ?? 'unknown';
  const purpose = request.purpose ?? `${provider} call`;

  // Gap-A: only Anthropic caches a stable prefix + uncached dynamic block (see buildAnthropicSystem).
  // The other providers read their system prompt from request.messages, so fold the stable prefix +
  // dynamic context back into ONE system message here — keeps those builders untouched + behavior-identical.
  if (provider !== 'anthropic' && request.systemPrompt) {
    const full = [request.systemPrompt, request.dynamicContext].filter(Boolean).join('\n\n');
    const userMessages = request.messages.filter((m) => m.role !== 'system');
    request = {
      ...request,
      messages: [{ role: 'system', content: full }, ...userMessages],
      systemPrompt: undefined,
      dynamicContext: undefined,
    };
  }

  const dispatch = (): Promise<CompletionResponse> => {
    switch (provider) {
      case 'anthropic':
        return callAnthropic(request, startTime);
      case 'deepseek':
        return callDeepSeek(request, startTime);
      case 'mistral':
        return callMistral(request, startTime);
      case 'xai':
        return callXAI(request, startTime);
      case 'openrouter':
        return callOpenRouter(request, startTime);
      case 'groq':
        return callOpenAICompatible(request, startTime, 'groq');
      case 'google':
        return callOpenAICompatible(request, startTime, 'google');
      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }
  };

  // Central COGS instrument: record one reconciling row per call (B1).
  try {
    const res = await dispatch();
    recordCall({
      queryId,
      purpose,
      model: res.model,
      inTok: res.usage.inputTokens,
      cacheRead: res.usage.cacheRead,
      cacheCreation: res.usage.cacheCreation,
      outTok: res.usage.outputTokens,
      durationMs: res.latencyMs,
      costUSD: res.cost,
      outcome: res.content && res.content.trim() ? 'ok' : 'empty',
      objectiveMet: null,
    });
    return res;
  } catch (err) {
    recordCall({
      queryId,
      purpose,
      model: request.model,
      inTok: 0,
      cacheRead: 0,
      cacheCreation: 0,
      outTok: 0,
      durationMs: Date.now() - startTime,
      costUSD: 0,
      outcome: 'error',
      objectiveMet: null,
    });
    throw err;
  }
}

/** Parse Anthropic SSE stream, invoking callbacks per thinking/text delta. */
async function parseAnthropicStream(
  response: Response,
  request: CompletionRequest,
  startTime: number,
  pricingModel?: string // F1: the model actually called (thinking override swaps it) — for cost only
): Promise<CompletionResponse> {
  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let rawThinking = '';
  let textContent = '';
  let inputTokens = 0;
  let outputTokens = 0;
  let cacheRead = 0;
  let cacheCreation = 0;

  try {
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
        let ev: any;
        try {
          ev = JSON.parse(json);
        } catch {
          continue;
        }
        if (ev.type === 'message_start') {
          inputTokens = ev.message?.usage?.input_tokens || 0;
          cacheRead = ev.message?.usage?.cache_read_input_tokens || 0;
          cacheCreation = ev.message?.usage?.cache_creation_input_tokens || 0;
        } else if (ev.type === 'content_block_delta') {
          const dt = ev.delta?.type;
          if (dt === 'thinking_delta') {
            const t = ev.delta.thinking || '';
            rawThinking += t;
            request.onThinkingDelta?.(t);
          } else if (dt === 'text_delta') {
            const t = ev.delta.text || '';
            textContent += t;
            request.onTextDelta?.(t);
          }
          // signature_delta is a verification hash — skip
        } else if (ev.type === 'message_delta') {
          outputTokens = ev.usage?.output_tokens || 0;
        }
      }
    }
  } catch (err) {
    // Stream interrupted — return whatever accumulated so far
    console.warn('[Anthropic] Stream interrupted:', (err as Error).message?.slice(0, 100));
  }

  if (!textContent && !rawThinking) throw new Error('Anthropic stream produced no content');

  const latencyMs = Date.now() - startTime;
  const pricing = getProviderPricing('anthropic', pricingModel ?? request.model);
  // Cache economics: uncached input at 1x, cache reads at 0.1x, cache writes (5-min ephemeral) at 1.25x.
  const cost =
    (inputTokens * pricing.input +
      cacheRead * pricing.input * 0.1 +
      cacheCreation * pricing.input * 1.25 +
      outputTokens * pricing.output) /
    1000;

  return {
    content: textContent,
    rawThinking: rawThinking || undefined,
    usage: { inputTokens, outputTokens, totalTokens: inputTokens + outputTokens, cacheRead, cacheCreation },
    model: request.model,
    provider: 'anthropic',
    cost,
    latencyMs,
  };
}

/** F1: Fable refusals arrive as HTTP 200 + stop_reason:'refusal' — retry once on Opus. */
export function shouldFableFallback(stopReason: string | undefined, model: string): boolean {
  return stopReason === 'refusal' && model === MODELS.frontier;
}

/**
 * Call Anthropic API (Claude)
 */
async function callAnthropic(
  request: CompletionRequest,
  startTime: number
): Promise<CompletionResponse> {
  const config = getProviderApiConfig('anthropic');

  if (!config.apiKey) {
    throw new Error('ANTHROPIC_API_KEY not configured');
  }

  // F1 hard guard: Fable has no thinking_delta — the opus-4-6 streaming override must never fire.
  // Keep the pre-guard request so a refusal fallback retries Opus WITH the caller's original
  // thinking intent (a direct premium+extendedThinking call would use the thinking override).
  const preGuardRequest = request;
  if (request.model === MODELS.frontier && request.extendedThinking) {
    request = { ...request, extendedThinking: false, onThinkingDelta: undefined };
  }

  // Anthropic uses separate system parameter
  const messages = request.messages.filter((m) => m.role !== 'system');
  const systemPrompt =
    request.systemPrompt || request.messages.find((m) => m.role === 'system')?.content;

  // Build request body — extended thinking requires NO temperature/top_p/top_k
  const body: Record<string, any> = {
    model: request.model,
    max_tokens: request.maxTokens || 4096,
    // V6-Block2: prompt caching — methodology system prompt is a stable prefix; cache reads bill at
    // ~10% of input price and cut TTFT. cache_control is harmlessly ignored below min cacheable size.
    system: buildAnthropicSystem(systemPrompt, request.dynamicContext),
    messages: messages.map((m) => ({
      role: m.role === 'system' ? 'user' : m.role,
      content: m.content,
    })),
  };

  if (request.extendedThinking) {
    // Opus 4.8 adaptive thinking does not emit visible thinking_delta events (verified Apr 2026).
    // Use Opus 4.6 with enabled thinking for streamable extended thinking content.
    body.model = MODELS.thinking;
    body.thinking = { type: 'enabled', budget_tokens: 10000 };
    body.max_tokens = 16000; // must exceed budget_tokens
    // Anthropic 400s if temperature/top_p/top_k present with extended thinking
    delete body.temperature;
    delete body.top_p;
    delete body.top_k;
    if (request.onThinkingDelta || request.onTextDelta) body.stream = true;
  }

  // live-words: stream real answer tokens when a text-delta consumer is attached — works WITHOUT
  // extended thinking (direct/cod/sc/pas). Skip the frontier model: it emits no thinking_delta and
  // its refusal→Opus fallback lives on the non-streamed JSON path below.
  if (request.onTextDelta && request.model !== MODELS.frontier) {
    body.stream = true;
  }

  // F1: Fable adaptive thinking is controlled by effort, which the Messages API takes INSIDE
  // output_config — a top-level `effort` field is rejected with a 400 (frontier-only; omit →
  // API default 'high').
  if (request.model === MODELS.frontier && request.effort) {
    body.output_config = { effort: request.effort };
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-api-key': config.apiKey,
    'anthropic-version': config.versionHeader!,
  };
  const response = await fetch(config.baseUrl, {
    method: 'POST',
    signal: AbortSignal.timeout(PROVIDER_TIMEOUT_MS),
    headers,
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Anthropic API error: ${response.status} - ${error}`);
  }

  // Streaming path: parse SSE events and invoke callbacks live (thinking and/or text deltas).
  if (body.stream && response.body && (request.onThinkingDelta || request.onTextDelta)) {
    return parseAnthropicStream(response, request, startTime, body.model as string);
  }

  const data = await response.json();
  const latencyMs = Date.now() - startTime;

  // F1 refusal auto-fallback: Fable's safety layer declined (HTTP 200 + stop_reason:'refusal',
  // content may be empty) — retry once on Opus. One-shot by construction (premium !== frontier).
  // Billing per API docs: pre-output refusals bill NOTHING (usage reports zeros); a refusal after
  // generation started bills the generated output — record whatever usage reports, at Fable rates,
  // so COGS reconciles in both cases. durationMs stays 0: the retry's row spans the whole call.
  if (shouldFableFallback(data.stop_reason, request.model)) {
    const refusalIn = data.usage?.input_tokens || 0;
    const refusalOut = data.usage?.output_tokens || 0;
    const refusalCacheRead = data.usage?.cache_read_input_tokens || 0;
    const refusalCacheCreation = data.usage?.cache_creation_input_tokens || 0;
    const refusalRates = getProviderPricing('anthropic', MODELS.frontier);
    recordCall({
      queryId: request.queryId ?? 'unknown',
      purpose: `${request.purpose ?? 'anthropic call'} [FABLE REFUSAL→OPUS]`,
      model: MODELS.frontier,
      inTok: refusalIn,
      cacheRead: refusalCacheRead,
      cacheCreation: refusalCacheCreation,
      outTok: refusalOut,
      durationMs: 0,
      costUSD:
        (refusalIn * refusalRates.input +
          refusalCacheRead * refusalRates.input * 0.1 +
          refusalCacheCreation * refusalRates.input * 1.25 +
          refusalOut * refusalRates.output) /
        1000,
      outcome: 'ok',
      objectiveMet: false,
    });
    return callAnthropic({ ...preGuardRequest, model: MODELS.premium }, startTime);
  }

  const inputTokens = data.usage?.input_tokens || 0;
  const outputTokens = data.usage?.output_tokens || 0;
  const cacheRead = data.usage?.cache_read_input_tokens || 0;
  const cacheCreation = data.usage?.cache_creation_input_tokens || 0;
  const pricing = getProviderPricing('anthropic', body.model as string);
  // Cache economics: uncached input at 1x, cache reads at 0.1x, cache writes (5-min ephemeral) at 1.25x.
  const cost =
    (inputTokens * pricing.input +
      cacheRead * pricing.input * 0.1 +
      cacheCreation * pricing.input * 1.25 +
      outputTokens * pricing.output) /
    1000;

  // Extract thinking + text content blocks
  let textContent = '';
  let rawThinking: string | undefined;
  if (Array.isArray(data.content)) {
    for (const block of data.content) {
      if (block.type === 'thinking') {
        rawThinking = block.thinking || '';
      } else if (block.type === 'text') {
        textContent = block.text || '';
      }
    }
  }
  if (!textContent) textContent = data.content?.[0]?.text || '';

  return {
    content: textContent,
    rawThinking,
    usage: {
      inputTokens,
      outputTokens,
      totalTokens: inputTokens + outputTokens,
      cacheRead,
      cacheCreation,
    },
    model: request.model,
    provider: 'anthropic',
    cost,
    latencyMs,
  };
}

/**
 * Call DeepSeek API
 */
async function callDeepSeek(
  request: CompletionRequest,
  startTime: number
): Promise<CompletionResponse> {
  const config = getProviderApiConfig('deepseek');

  if (!config.apiKey) {
    throw new Error('DEEPSEEK_API_KEY not configured');
  }

  const response = await fetch(config.baseUrl, {
    method: 'POST',
    signal: AbortSignal.timeout(PROVIDER_TIMEOUT_MS),
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: request.model,
      messages: request.messages,
      max_tokens: request.maxTokens || 4096,
      temperature: request.temperature || 0.7,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`DeepSeek API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  const latencyMs = Date.now() - startTime;

  const inputTokens = data.usage?.prompt_tokens || 0;
  const outputTokens = data.usage?.completion_tokens || 0;
  const pricing = getProviderPricing('deepseek');
  const cost = (inputTokens * pricing.input + outputTokens * pricing.output) / 1000;

  return {
    content: data.choices[0]?.message?.content || '',
    usage: {
      inputTokens,
      outputTokens,
      totalTokens: inputTokens + outputTokens,
      cacheRead: 0,
      cacheCreation: 0,
    },
    model: request.model,
    provider: 'deepseek',
    cost,
    latencyMs,
  };
}

/**
 * Call Mistral API
 */
async function callMistral(
  request: CompletionRequest,
  startTime: number
): Promise<CompletionResponse> {
  const config = getProviderApiConfig('mistral');

  if (!config.apiKey) {
    throw new Error('MISTRAL_API_KEY not configured');
  }

  const response = await fetch(config.baseUrl, {
    method: 'POST',
    signal: AbortSignal.timeout(PROVIDER_TIMEOUT_MS),
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: request.model,
      messages: request.messages,
      max_tokens: request.maxTokens || 4096,
      temperature: request.temperature || 0.7,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Mistral API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  const latencyMs = Date.now() - startTime;

  const inputTokens = data.usage?.prompt_tokens || 0;
  const outputTokens = data.usage?.completion_tokens || 0;
  const pricing = getProviderPricing('mistral');
  const cost = (inputTokens * pricing.input + outputTokens * pricing.output) / 1000;

  return {
    content: data.choices[0]?.message?.content || '',
    usage: {
      inputTokens,
      outputTokens,
      totalTokens: inputTokens + outputTokens,
      cacheRead: 0,
      cacheCreation: 0,
    },
    model: request.model,
    provider: 'mistral',
    cost,
    latencyMs,
  };
}

/**
 * Call xAI API (Grok)
 */
async function callXAI(request: CompletionRequest, startTime: number): Promise<CompletionResponse> {
  const config = getProviderApiConfig('xai');

  if (!config.apiKey) {
    throw new Error('XAI_API_KEY not configured');
  }

  const response = await fetch(config.baseUrl, {
    method: 'POST',
    signal: AbortSignal.timeout(PROVIDER_TIMEOUT_MS),
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: request.model,
      messages: request.messages,
      max_tokens: request.maxTokens || 4096,
      temperature: request.temperature || 0.7,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`xAI API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  const latencyMs = Date.now() - startTime;

  const inputTokens = data.usage?.prompt_tokens || 0;
  const outputTokens = data.usage?.completion_tokens || 0;
  const pricing = getProviderPricing('xai');
  const cost = (inputTokens * pricing.input + outputTokens * pricing.output) / 1000;

  return {
    content: data.choices[0]?.message?.content || '',
    usage: {
      inputTokens,
      outputTokens,
      totalTokens: inputTokens + outputTokens,
      cacheRead: 0,
      cacheCreation: 0,
    },
    model: request.model,
    provider: 'xai',
    cost,
    latencyMs,
  };
}

/**
 * Call OpenRouter API (OpenAI-compatible, free models)
 */
async function callOpenRouter(
  request: CompletionRequest,
  startTime: number
): Promise<CompletionResponse> {
  const config = getProviderApiConfig('openrouter');

  if (!config.apiKey) {
    throw new Error('OPENROUTER_API_KEY not configured');
  }

  const messages = request.messages.map((m) => ({
    role: m.role,
    content: m.content,
  }));

  const response = await fetch(config.baseUrl, {
    method: 'POST',
    signal: AbortSignal.timeout(PROVIDER_TIMEOUT_MS),
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.apiKey}`,
      'HTTP-Referer': 'https://akhai.app',
      'X-Title': 'AkhAI',
    },
    body: JSON.stringify({
      model: 'nvidia/nemotron-3-super-120b-a12b:free',
      messages,
      max_tokens: request.maxTokens || 500,
      temperature: request.temperature ?? 0.7,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenRouter API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  const latencyMs = Date.now() - startTime;

  const inputTokens = data.usage?.prompt_tokens || 0;
  const outputTokens = data.usage?.completion_tokens || 0;

  return {
    content: data.choices?.[0]?.message?.content || '',
    usage: {
      inputTokens,
      outputTokens,
      totalTokens: inputTokens + outputTokens,
      cacheRead: 0,
      cacheCreation: 0,
    },
    model: 'nvidia/nemotron-3-super-120b-a12b:free',
    provider: 'openrouter',
    cost: 0,
    latencyMs,
  };
}

/**
 * Call OpenAI-compatible API (Groq, Google Gemini, etc.)
 */
async function callOpenAICompatible(
  request: CompletionRequest,
  startTime: number,
  provider: ProviderFamily
): Promise<CompletionResponse> {
  const config = getProviderApiConfig(provider);

  if (!config.apiKey) {
    throw new Error(`${provider.toUpperCase()} API key not configured`);
  }

  const response = await fetch(config.baseUrl, {
    method: 'POST',
    signal: AbortSignal.timeout(PROVIDER_TIMEOUT_MS),
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: request.model,
      messages: request.messages,
      max_tokens: request.maxTokens || 4096,
      temperature: request.temperature || 0.7,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`${provider} API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  const latencyMs = Date.now() - startTime;

  const inputTokens = data.usage?.prompt_tokens || 0;
  const outputTokens = data.usage?.completion_tokens || 0;
  const pricing = getProviderPricing(provider);
  const cost = (inputTokens * pricing.input + outputTokens * pricing.output) / 1000;

  return {
    content: data.choices?.[0]?.message?.content || '',
    usage: {
      inputTokens,
      outputTokens,
      totalTokens: inputTokens + outputTokens,
      cacheRead: 0,
      cacheCreation: 0,
    },
    model: request.model,
    provider,
    cost,
    latencyMs,
  };
}

/**
 * Validate provider availability
 *
 * @param provider - Provider to validate
 * @returns True if provider is configured and available
 */
export function isProviderAvailable(provider: ProviderFamily): boolean {
  try {
    const config = getProviderApiConfig(provider);
    return !!config.apiKey;
  } catch {
    return false;
  }
}
