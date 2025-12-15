import { BaseProvider } from './base';
import { AnthropicProvider } from './anthropic';
import { DeepSeekProvider } from './deepseek';
import { MistralProvider } from './mistral';
import { XAIProvider } from './xai';
import { ModelFamily, CompletionRequest, CompletionResponse } from '../models/types';

// Export all providers
export { BaseProvider } from './base';
export { AnthropicProvider } from './anthropic';
export { DeepSeekProvider } from './deepseek';
export { MistralProvider } from './mistral';
export { XAIProvider } from './xai';

/**
 * Factory function to get the appropriate provider for a model family
 * @param family - The model family to use
 * @param apiKey - API key for the provider (required)
 * @param model - Specific model to use (optional, will use default)
 * @returns Provider instance
 */
export function getProvider(
  family: ModelFamily,
  apiKey?: string,
  model?: string
): BaseProvider {
  // Validate API key
  if (!apiKey) {
    throw new Error(`API key required for ${family} provider`);
  }

  // Return real provider for supported families
  switch (family) {
    case 'anthropic':
      return new AnthropicProvider(family, apiKey, model);

    case 'deepseek':
      return new DeepSeekProvider(family, apiKey, model);

    case 'mistral':
      return new MistralProvider(family, apiKey, model);

    case 'xai':
      return new XAIProvider(family, apiKey, model);

    default:
      throw new Error(`Unsupported model family: ${family}`);
  }
}
