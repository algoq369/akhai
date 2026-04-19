/**
 * Multi-Provider API Caller
 *
 * Unified interface for calling different AI providers (Anthropic, DeepSeek, Mistral, xAI)
 * with proper request/response formatting for each provider.
 */

import type { ProviderFamily } from './provider-selector';
import { getProviderApiConfig, getProviderPricing } from './provider-selector';

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
}

export interface CompletionResponse {
  content: string;
  rawThinking?: string;
  usage: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  };
  model: string;
  provider: ProviderFamily;
  cost: number;
  latencyMs: number;
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

  switch (provider) {
    case 'anthropic':
      return await callAnthropic(request, startTime);
    case 'deepseek':
      return await callDeepSeek(request, startTime);
    case 'mistral':
      return await callMistral(request, startTime);
    case 'xai':
      return await callXAI(request, startTime);
    case 'openrouter':
      return await callOpenRouter(request, startTime);
    case 'groq':
      return await callOpenAICompatible(request, startTime, 'groq');
    case 'google':
      return await callOpenAICompatible(request, startTime, 'google');
    default:
      throw new Error(`Unsupported provider: ${provider}`);
  }
}

/** Parse Anthropic SSE stream, invoking callbacks per thinking/text delta. */
async function parseAnthropicStream(
  response: Response,
  request: CompletionRequest,
  startTime: number
): Promise<CompletionResponse> {
  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let rawThinking = '';
  let textContent = '';
  let inputTokens = 0;
  let outputTokens = 0;

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
        if (ev.type === 'content_block_delta') {
          if (ev.delta?.type === 'thinking_delta') {
            const t = ev.delta.thinking || '';
            rawThinking += t;
            request.onThinkingDelta?.(t);
          } else if (ev.delta?.type === 'text_delta') {
            const t = ev.delta.text || '';
            textContent += t;
            request.onTextDelta?.(t);
          }
        } else if (ev.type === 'message_start') {
          inputTokens = ev.message?.usage?.input_tokens || 0;
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
  const pricing = getProviderPricing('anthropic');
  const cost = (inputTokens * pricing.input + outputTokens * pricing.output) / 1000;

  return {
    content: textContent,
    rawThinking: rawThinking || undefined,
    usage: { inputTokens, outputTokens, totalTokens: inputTokens + outputTokens },
    model: request.model,
    provider: 'anthropic',
    cost,
    latencyMs,
  };
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

  // Anthropic uses separate system parameter
  const messages = request.messages.filter((m) => m.role !== 'system');
  const systemPrompt =
    request.systemPrompt || request.messages.find((m) => m.role === 'system')?.content;

  // Build request body — extended thinking requires NO temperature/top_p/top_k
  const body: Record<string, any> = {
    model: request.model,
    max_tokens: request.maxTokens || 4096,
    system: systemPrompt,
    messages: messages.map((m) => ({
      role: m.role === 'system' ? 'user' : m.role,
      content: m.content,
    })),
  };

  if (request.extendedThinking) {
    body.thinking = { type: 'enabled', budget_tokens: 10000 };
    // Anthropic 400s if temperature/top_p/top_k present with extended thinking
    delete body.temperature;
    delete body.top_p;
    delete body.top_k;
    if (request.onThinkingDelta) body.stream = true;
  }

  const response = await fetch(config.baseUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': config.apiKey,
      'anthropic-version': config.versionHeader!,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Anthropic API error: ${response.status} - ${error}`);
  }

  // Streaming path: parse SSE events and invoke callbacks live
  if (request.extendedThinking && request.onThinkingDelta && response.body) {
    return parseAnthropicStream(response, request, startTime);
  }

  const data = await response.json();
  const latencyMs = Date.now() - startTime;

  const inputTokens = data.usage?.input_tokens || 0;
  const outputTokens = data.usage?.output_tokens || 0;
  const pricing = getProviderPricing('anthropic');
  const cost = (inputTokens * pricing.input + outputTokens * pricing.output) / 1000;

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
