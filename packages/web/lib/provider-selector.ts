/**
 * Provider Selector - Multi-Provider per Methodology
 *
 * Maps each methodology to its optimal AI provider for best performance,
 * cost-efficiency, and accuracy.
 */

export type CoreMethodology = 'direct' | 'cod' | 'sc' | 'react' | 'pas' | 'tot' | 'auto';
export type ProviderFamily =
  | 'anthropic'
  | 'deepseek'
  | 'mistral'
  | 'xai'
  | 'openrouter'
  | 'groq'
  | 'google';

export interface ProviderConfig {
  family: ProviderFamily;
  model: string;
  apiKey: string;
  baseUrl?: string;
}

export interface ModelSpec {
  provider: ProviderFamily;
  model: string;
  reasoning: string;
}

/**
 * Methodology-to-Provider mapping
 *
 * Strategy:
 * - ALL methodologies (except GTP): Claude Opus 4.6 for maximum quality
 * - GTP ONLY: Multi-AI consensus using all 4 providers (Anthropic, DeepSeek, Mistral, xAI)
 *
 * This ensures:
 * - Consistent premium quality across all standard methodologies
 * - Multi-perspective consensus ONLY for GTP (where it adds value)
 * - Simpler configuration and predictable behavior
 */
const FREE_PROVIDER: ModelSpec = {
  provider: 'openrouter',
  model: 'meta-llama/llama-3.3-70b-instruct:free',
  reasoning: 'Free tier: Llama 3.3 70B via OpenRouter (GPT-4 class, $0 cost)',
};

const PREMIUM_PROVIDER: ModelSpec = {
  provider: 'anthropic',
  model: 'claude-opus-4-7',
  reasoning: 'Premium Claude Opus 4.6 for all queries',
};

// Evaluated lazily at call time: Next.js dev server loads env *after* some
// module imports complete, so reading process.env at module scope locks us
// into the free tier for the life of the process.
function getDefaultProvider(): ModelSpec {
  return process.env.ANTHROPIC_API_KEY ? PREMIUM_PROVIDER : FREE_PROVIDER;
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
  // Legend Mode overrides to always use Claude Opus 4.6
  if (legendMode) {
    return {
      provider: 'anthropic',
      model: 'claude-opus-4-7',
      reasoning: 'Legend Mode: Premium R&D with Claude Opus 4.6',
    };
  }

  const defaultProvider = getDefaultProvider();

  if (methodology === 'tot') {
    return {
      provider: defaultProvider.provider,
      model: defaultProvider.model,
      reasoning: process.env.ANTHROPIC_API_KEY
        ? 'Multi-AI consensus: Anthropic + DeepSeek + Mistral + xAI advisors'
        : 'Free tier: Multi-methodology via Llama 3.3 70B',
    };
  }

  return defaultProvider;
}

/**
 * Get API configuration for a provider
 *
 * @param provider - Provider family
 * @returns API configuration with key and base URL
 */
export function getProviderApiConfig(provider: ProviderFamily): {
  apiKey: string | undefined;
  baseUrl: string;
  versionHeader?: string;
} {
  switch (provider) {
    case 'anthropic':
      return {
        apiKey: process.env.ANTHROPIC_API_KEY,
        baseUrl: 'https://api.anthropic.com/v1/messages',
        versionHeader: '2023-06-01',
      };
    case 'deepseek':
      return {
        apiKey: process.env.DEEPSEEK_API_KEY,
        baseUrl: 'https://api.deepseek.com/chat/completions',
      };
    case 'mistral':
      return {
        apiKey: process.env.MISTRAL_API_KEY,
        baseUrl: 'https://api.mistral.ai/v1/chat/completions',
      };
    case 'xai':
      return {
        apiKey: process.env.XAI_API_KEY,
        baseUrl: 'https://api.x.ai/v1/chat/completions',
      };
    case 'openrouter':
      return {
        apiKey: process.env.OPENROUTER_API_KEY,
        baseUrl: 'https://openrouter.ai/api/v1/chat/completions',
      };
    case 'groq':
      return {
        apiKey: process.env.GROQ_API_KEY,
        baseUrl: 'https://api.groq.com/openai/v1/chat/completions',
      };
    case 'google':
      return {
        apiKey: process.env.GOOGLE_API_KEY,
        baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
      };
  }
}

/**
 * Get fallback model spec for a provider (used when primary fails)
 */
export function getFallbackModelSpec(provider: ProviderFamily): { model: string } {
  switch (provider) {
    case 'openrouter':
      return { model: 'meta-llama/llama-3.3-70b-instruct:free' };
    case 'deepseek':
      return { model: 'deepseek-chat' };
    case 'mistral':
      return { model: 'mistral-large-latest' };
    case 'xai':
      return { model: 'grok-2' };
    case 'anthropic':
      return { model: 'claude-sonnet-4-20250514' };
    case 'groq':
      return { model: 'llama-3.3-70b-versatile' };
    case 'google':
      return { model: 'gemini-2.0-flash' };
    default:
      return { model: 'meta-llama/llama-3.3-70b-instruct:free' };
  }
}

/**
 * Validate that API key exists for a provider
 *
 * @param provider - Provider to validate
 * @returns True if API key exists
 */
export function validateProviderApiKey(provider: ProviderFamily): boolean {
  const config = getProviderApiConfig(provider);
  return !!config.apiKey;
}

/**
 * Get fallback provider if primary is unavailable
 *
 * @param primary - Primary provider
 * @returns Fallback provider
 */
export function getFallbackProvider(primary: ProviderFamily): ProviderFamily {
  // Fallback hierarchy: Anthropic > OpenRouter > DeepSeek > Mistral > xAI
  const fallbackOrder: ProviderFamily[] = [
    'anthropic',
    'openrouter',
    'groq',
    'google',
    'deepseek',
    'mistral',
    'xai',
  ];
  const primaryIndex = fallbackOrder.indexOf(primary);

  // Try next provider in hierarchy
  for (let i = primaryIndex + 1; i < fallbackOrder.length; i++) {
    if (validateProviderApiKey(fallbackOrder[i])) {
      return fallbackOrder[i];
    }
  }

  // If no fallback found, try from beginning
  for (let i = 0; i < primaryIndex; i++) {
    if (validateProviderApiKey(fallbackOrder[i])) {
      return fallbackOrder[i];
    }
  }

  // Default to anthropic (will error if not available)
  return 'anthropic';
}

/**
 * Get all available providers with API keys configured
 *
 * @returns Array of available provider families
 */
export function getAvailableProviders(): ProviderFamily[] {
  const providers: ProviderFamily[] = [
    'anthropic',
    'openrouter',
    'groq',
    'google',
    'deepseek',
    'mistral',
    'xai',
  ];
  return providers.filter(validateProviderApiKey);
}

/**
 * Get pricing for a provider (per 1K tokens)
 *
 * @param provider - Provider family
 * @returns Input and output pricing
 */
export function getProviderPricing(provider: ProviderFamily): {
  input: number;
  output: number;
} {
  const rates: Record<ProviderFamily, { input: number; output: number }> = {
    deepseek: { input: 0.00055, output: 0.00219 },
    anthropic: { input: 0.003, output: 0.015 },
    mistral: { input: 0.0002, output: 0.0006 },
    xai: { input: 0.002, output: 0.01 },
    openrouter: { input: 0, output: 0 },
    groq: { input: 0, output: 0 },
    google: { input: 0, output: 0 },
  };

  return rates[provider];
}
