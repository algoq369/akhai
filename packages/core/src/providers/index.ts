import { BaseProvider } from './base';
import { AnthropicProvider } from './anthropic';
import { DeepSeekProvider } from './deepseek';
import { ModelFamily, CompletionRequest, CompletionResponse } from '../models/types';

// Export all providers
export { BaseProvider } from './base';
export { AnthropicProvider } from './anthropic';
export { DeepSeekProvider } from './deepseek';

/**
 * Mock provider for unsupported model families
 */
class MockProvider extends BaseProvider {
  protected getDefaultModel(): string {
    return 'mock-model';
  }

  protected async callAPI(request: CompletionRequest): Promise<CompletionResponse> {
    console.log(`[${this.family}] Using mock provider - real API not yet implemented`);

    const messages = this.buildMessages(request);
    const lastMessage = messages[messages.length - 1]?.content || '';

    // Simple mock response
    const mockContent = `Mock response from ${this.family} for: "${lastMessage.substring(0, 50)}..."`;

    return {
      content: mockContent,
      usage: {
        inputTokens: this.estimateTokens(messages.map(m => m.content).join(' ')),
        outputTokens: this.estimateTokens(mockContent)
      },
      model: this.model,
      family: this.family
    };
  }
}

/**
 * Factory function to get the appropriate provider for a model family
 * @param family - The model family to use
 * @param apiKey - API key for the provider (optional for mock providers)
 * @param model - Specific model to use (optional, will use default)
 * @returns Provider instance
 */
export function getProvider(
  family: ModelFamily,
  apiKey?: string,
  model?: string
): BaseProvider {
  // Handle missing API key
  if (!apiKey) {
    console.warn(`[${family}] No API key provided, using mock provider`);
    return new MockProvider(family, '', model);
  }

  // Return real provider for supported families
  switch (family) {
    case 'anthropic':
      return new AnthropicProvider(family, apiKey, model);

    case 'deepseek':
      return new DeepSeekProvider(family, apiKey, model);

    // Add more providers here as they are implemented
    case 'openai':
    case 'qwen':
    case 'google':
    case 'mistral':
    case 'openrouter':
    case 'ollama':
    case 'groq':
    case 'xai':
      console.log(`[${family}] Provider not yet implemented, using mock`);
      return new MockProvider(family, apiKey, model);

    default:
      console.warn(`[${family}] Unknown model family, using mock`);
      return new MockProvider(family, apiKey, model);
  }
}
