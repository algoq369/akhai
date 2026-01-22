/**
 * Provider Selector - Multi-Provider per Methodology
 *
 * Maps each methodology to its optimal AI provider for best performance,
 * cost-efficiency, and accuracy.
 */

export type CoreMethodology = 'direct' | 'cod' | 'bot' | 'react' | 'pot' | 'gtp' | 'auto'
export type ProviderFamily = 'anthropic' | 'deepseek' | 'mistral' | 'xai'

export interface ProviderConfig {
  family: ProviderFamily
  model: string
  apiKey: string
  baseUrl?: string
}

export interface ModelSpec {
  provider: ProviderFamily
  model: string
  reasoning: string
}

/**
 * Methodology-to-Provider mapping
 *
 * Strategy:
 * - ALL methodologies (except GTP): Claude Opus 4.5 for maximum quality
 * - GTP ONLY: Multi-AI consensus using all 4 providers (Anthropic, DeepSeek, Mistral, xAI)
 *
 * This ensures:
 * - Consistent premium quality across all standard methodologies
 * - Multi-perspective consensus ONLY for GTP (where it adds value)
 * - Simpler configuration and predictable behavior
 */
export const METHODOLOGY_PROVIDER_MAP: Record<CoreMethodology, ModelSpec> = {
  direct: {
    provider: 'anthropic',
    model: 'claude-opus-4-5-20251101',
    reasoning: 'Premium Claude Opus 4.5 for all queries',
  },
  cod: {
    provider: 'anthropic',
    model: 'claude-opus-4-5-20251101',
    reasoning: 'Premium Claude Opus 4.5 for all queries',
  },
  bot: {
    provider: 'anthropic',
    model: 'claude-opus-4-5-20251101',
    reasoning: 'Premium Claude Opus 4.5 for all queries',
  },
  react: {
    provider: 'anthropic',
    model: 'claude-opus-4-5-20251101',
    reasoning: 'Premium Claude Opus 4.5 for all queries',
  },
  pot: {
    provider: 'anthropic',
    model: 'claude-opus-4-5-20251101',
    reasoning: 'Premium Claude Opus 4.5 for all queries',
  },
  gtp: {
    provider: 'anthropic', // Mother Base synthesis uses Anthropic
    model: 'claude-opus-4-5-20251101',
    reasoning: 'Multi-AI consensus: Anthropic + DeepSeek + Mistral + xAI advisors',
  },
  auto: {
    provider: 'anthropic',
    model: 'claude-opus-4-5-20251101',
    reasoning: 'Premium Claude Opus 4.5 for all queries',
  },
}

/**
 * Get provider configuration for a methodology
 *
 * @param methodology - The methodology to get provider for
 * @param legendMode - Whether Legend Mode is active (uses Opus)
 * @returns Provider configuration
 */
export function getProviderForMethodology(
  methodology: CoreMethodology,
  legendMode: boolean = false
): ModelSpec {
  // Legend Mode overrides to always use Claude Opus 4
  if (legendMode) {
    return {
      provider: 'anthropic',
      model: 'claude-opus-4-5-20251101',
      reasoning: 'Legend Mode: Premium R&D with Claude Opus 4.5',
    }
  }

  return METHODOLOGY_PROVIDER_MAP[methodology]
}

/**
 * Get API configuration for a provider
 *
 * @param provider - Provider family
 * @returns API configuration with key and base URL
 */
export function getProviderApiConfig(provider: ProviderFamily): {
  apiKey: string | undefined
  baseUrl: string
  versionHeader?: string
} {
  switch (provider) {
    case 'anthropic':
      return {
        apiKey: process.env.ANTHROPIC_API_KEY,
        baseUrl: 'https://api.anthropic.com/v1/messages',
        versionHeader: '2023-06-01',
      }
    case 'deepseek':
      return {
        apiKey: process.env.DEEPSEEK_API_KEY,
        baseUrl: 'https://api.deepseek.com/chat/completions',
      }
    case 'mistral':
      return {
        apiKey: process.env.MISTRAL_API_KEY,
        baseUrl: 'https://api.mistral.ai/v1/chat/completions',
      }
    case 'xai':
      return {
        apiKey: process.env.XAI_API_KEY,
        baseUrl: 'https://api.x.ai/v1/chat/completions',
      }
  }
}

/**
 * Validate that API key exists for a provider
 *
 * @param provider - Provider to validate
 * @returns True if API key exists
 */
export function validateProviderApiKey(provider: ProviderFamily): boolean {
  const config = getProviderApiConfig(provider)
  return !!config.apiKey
}

/**
 * Get fallback provider if primary is unavailable
 *
 * @param primary - Primary provider
 * @returns Fallback provider
 */
export function getFallbackProvider(primary: ProviderFamily): ProviderFamily {
  // Fallback hierarchy: Anthropic > DeepSeek > Mistral > xAI
  const fallbackOrder: ProviderFamily[] = ['anthropic', 'deepseek', 'mistral', 'xai']
  const primaryIndex = fallbackOrder.indexOf(primary)

  // Try next provider in hierarchy
  for (let i = primaryIndex + 1; i < fallbackOrder.length; i++) {
    if (validateProviderApiKey(fallbackOrder[i])) {
      return fallbackOrder[i]
    }
  }

  // If no fallback found, try from beginning
  for (let i = 0; i < primaryIndex; i++) {
    if (validateProviderApiKey(fallbackOrder[i])) {
      return fallbackOrder[i]
    }
  }

  // Default to anthropic (will error if not available)
  return 'anthropic'
}

/**
 * Get all available providers with API keys configured
 *
 * @returns Array of available provider families
 */
export function getAvailableProviders(): ProviderFamily[] {
  const providers: ProviderFamily[] = ['anthropic', 'deepseek', 'mistral', 'xai']
  return providers.filter(validateProviderApiKey)
}

/**
 * Get pricing for a provider (per 1K tokens)
 *
 * @param provider - Provider family
 * @returns Input and output pricing
 */
export function getProviderPricing(provider: ProviderFamily): {
  input: number
  output: number
} {
  const rates: Record<ProviderFamily, { input: number; output: number }> = {
    deepseek: { input: 0.00055, output: 0.00219 },
    anthropic: { input: 0.003, output: 0.015 },
    mistral: { input: 0.0002, output: 0.0006 },
    xai: { input: 0.002, output: 0.01 },
  }

  return rates[provider]
}
