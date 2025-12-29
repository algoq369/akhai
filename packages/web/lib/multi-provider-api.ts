/**
 * Multi-Provider API Caller
 *
 * Unified interface for calling different AI providers (Anthropic, DeepSeek, Mistral, xAI)
 * with proper request/response formatting for each provider.
 */

import type { ProviderFamily } from './provider-selector'
import { getProviderApiConfig, getProviderPricing } from './provider-selector'

export interface Message {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface CompletionRequest {
  messages: Message[]
  model: string
  maxTokens?: number
  temperature?: number
  systemPrompt?: string
}

export interface CompletionResponse {
  content: string
  usage: {
    inputTokens: number
    outputTokens: number
    totalTokens: number
  }
  model: string
  provider: ProviderFamily
  cost: number
  latencyMs: number
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
  const startTime = Date.now()

  switch (provider) {
    case 'anthropic':
      return await callAnthropic(request, startTime)
    case 'deepseek':
      return await callDeepSeek(request, startTime)
    case 'mistral':
      return await callMistral(request, startTime)
    case 'xai':
      return await callXAI(request, startTime)
    default:
      throw new Error(`Unsupported provider: ${provider}`)
  }
}

/**
 * Call Anthropic API (Claude)
 */
async function callAnthropic(
  request: CompletionRequest,
  startTime: number
): Promise<CompletionResponse> {
  const config = getProviderApiConfig('anthropic')

  if (!config.apiKey) {
    throw new Error('ANTHROPIC_API_KEY not configured')
  }

  // Anthropic uses separate system parameter
  const messages = request.messages.filter(m => m.role !== 'system')
  const systemPrompt = request.systemPrompt || request.messages.find(m => m.role === 'system')?.content

  const response = await fetch(config.baseUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': config.apiKey,
      'anthropic-version': config.versionHeader!,
    },
    body: JSON.stringify({
      model: request.model,
      max_tokens: request.maxTokens || 4096,
      temperature: request.temperature || 0.7,
      system: systemPrompt,
      messages: messages.map(m => ({
        role: m.role === 'system' ? 'user' : m.role,
        content: m.content,
      })),
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Anthropic API error: ${response.status} - ${error}`)
  }

  const data = await response.json()
  const latencyMs = Date.now() - startTime

  const inputTokens = data.usage?.input_tokens || 0
  const outputTokens = data.usage?.output_tokens || 0
  const pricing = getProviderPricing('anthropic')
  const cost = (inputTokens * pricing.input + outputTokens * pricing.output) / 1000

  return {
    content: data.content[0]?.text || '',
    usage: {
      inputTokens,
      outputTokens,
      totalTokens: inputTokens + outputTokens,
    },
    model: request.model,
    provider: 'anthropic',
    cost,
    latencyMs,
  }
}

/**
 * Call DeepSeek API
 */
async function callDeepSeek(
  request: CompletionRequest,
  startTime: number
): Promise<CompletionResponse> {
  const config = getProviderApiConfig('deepseek')

  if (!config.apiKey) {
    throw new Error('DEEPSEEK_API_KEY not configured')
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
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`DeepSeek API error: ${response.status} - ${error}`)
  }

  const data = await response.json()
  const latencyMs = Date.now() - startTime

  const inputTokens = data.usage?.prompt_tokens || 0
  const outputTokens = data.usage?.completion_tokens || 0
  const pricing = getProviderPricing('deepseek')
  const cost = (inputTokens * pricing.input + outputTokens * pricing.output) / 1000

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
  }
}

/**
 * Call Mistral API
 */
async function callMistral(
  request: CompletionRequest,
  startTime: number
): Promise<CompletionResponse> {
  const config = getProviderApiConfig('mistral')

  if (!config.apiKey) {
    throw new Error('MISTRAL_API_KEY not configured')
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
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Mistral API error: ${response.status} - ${error}`)
  }

  const data = await response.json()
  const latencyMs = Date.now() - startTime

  const inputTokens = data.usage?.prompt_tokens || 0
  const outputTokens = data.usage?.completion_tokens || 0
  const pricing = getProviderPricing('mistral')
  const cost = (inputTokens * pricing.input + outputTokens * pricing.output) / 1000

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
  }
}

/**
 * Call xAI API (Grok)
 */
async function callXAI(
  request: CompletionRequest,
  startTime: number
): Promise<CompletionResponse> {
  const config = getProviderApiConfig('xai')

  if (!config.apiKey) {
    throw new Error('XAI_API_KEY not configured')
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
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`xAI API error: ${response.status} - ${error}`)
  }

  const data = await response.json()
  const latencyMs = Date.now() - startTime

  const inputTokens = data.usage?.prompt_tokens || 0
  const outputTokens = data.usage?.completion_tokens || 0
  const pricing = getProviderPricing('xai')
  const cost = (inputTokens * pricing.input + outputTokens * pricing.output) / 1000

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
  }
}

/**
 * Validate provider availability
 *
 * @param provider - Provider to validate
 * @returns True if provider is configured and available
 */
export function isProviderAvailable(provider: ProviderFamily): boolean {
  try {
    const config = getProviderApiConfig(provider)
    return !!config.apiKey
  } catch {
    return false
  }
}
