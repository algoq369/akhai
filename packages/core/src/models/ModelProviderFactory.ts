import { ModelFamily, ProviderConfig, ModelConfig, CompletionRequest, CompletionResponse } from './types.js';
import { getProvider, BaseProvider } from '../providers/index.js';

/**
 * Provider configurations for all 10 supported model families
 *
 * Each provider has:
 * - family: Model family identifier
 * - models: List of available models
 * - defaultModel: Default model to use if not specified
 * - requiresApiKey: Whether an API key is needed
 * - baseUrl: Optional custom base URL for API requests
 */
const PROVIDER_CONFIGS: Record<ModelFamily, ProviderConfig> = {
  anthropic: {
    family: 'anthropic',
    models: ['claude-sonnet-4-20250514', 'claude-3-5-haiku-20241022'],
    defaultModel: 'claude-sonnet-4-20250514',
    requiresApiKey: true,
  },
  openai: {
    family: 'openai',
    models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo'],
    defaultModel: 'gpt-4o',
    requiresApiKey: true,
  },
  deepseek: {
    family: 'deepseek',
    models: ['deepseek-chat', 'deepseek-reasoner'],
    defaultModel: 'deepseek-chat',
    requiresApiKey: true,
    baseUrl: 'https://api.deepseek.com',
  },
  qwen: {
    family: 'qwen',
    models: ['qwen-plus', 'qwen-turbo', 'qwen-max'],
    defaultModel: 'qwen-plus',
    requiresApiKey: true,
  },
  google: {
    family: 'google',
    models: ['gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-2.0-flash-exp'],
    defaultModel: 'gemini-1.5-pro',
    requiresApiKey: true,
  },
  mistral: {
    family: 'mistral',
    models: ['mistral-large-latest', 'mistral-medium-latest', 'mistral-small-latest'],
    defaultModel: 'mistral-large-latest',
    requiresApiKey: true,
  },
  openrouter: {
    family: 'openrouter',
    models: [
      'anthropic/claude-3.5-sonnet',
      'openai/gpt-4o',
      'google/gemini-pro-1.5',
      'meta-llama/llama-3.1-70b-instruct',
    ],
    defaultModel: 'anthropic/claude-3.5-sonnet',
    requiresApiKey: true,
    baseUrl: 'https://openrouter.ai/api/v1',
  },
  ollama: {
    family: 'ollama',
    models: ['llama3.1', 'mistral', 'phi3', 'qwen2.5'],
    defaultModel: 'llama3.1',
    requiresApiKey: false,
    baseUrl: 'http://localhost:11434',
  },
  groq: {
    family: 'groq',
    models: [
      'llama-3.1-70b-versatile',
      'llama-3.1-8b-instant',
      'mixtral-8x7b-32768',
      'gemma2-9b-it',
    ],
    defaultModel: 'llama-3.1-70b-versatile',
    requiresApiKey: true,
  },
  xai: {
    family: 'xai',
    models: ['grok-beta', 'grok-vision-beta'],
    defaultModel: 'grok-beta',
    requiresApiKey: true,
  },
};

/**
 * IModelProvider interface
 *
 * All model providers must implement this interface
 */
export interface IModelProvider {
  /**
   * Model family this provider belongs to
   */
  family: ModelFamily;

  /**
   * Complete a chat request
   *
   * @param request - Completion request with messages and options
   * @returns Completion response with generated content
   */
  complete(request: CompletionRequest): Promise<CompletionResponse>;
}

/**
 * ModelProviderFactory
 *
 * Factory for creating model provider instances.
 *
 * Features:
 * - Centralized API key management
 * - Provider configuration lookup
 * - Provider instance creation
 * - Validation and error handling
 *
 * Usage:
 * ```typescript
 * const factory = new ModelProviderFactory();
 * factory.setApiKey('anthropic', 'sk-ant-...');
 * factory.setApiKey('openai', 'sk-...');
 *
 * const provider = factory.createProvider({
 *   family: 'anthropic',
 *   model: 'claude-sonnet-4-20250514'
 * });
 *
 * const response = await provider.complete({
 *   messages: [{ role: 'user', content: 'Hello!' }]
 * });
 * ```
 */
export class ModelProviderFactory {
  private apiKeys: Map<ModelFamily, string> = new Map();

  /**
   * Set API key for a model family
   *
   * @param family - Model family
   * @param key - API key
   */
  setApiKey(family: ModelFamily, key: string): void {
    this.apiKeys.set(family, key);
  }

  /**
   * Get API key for a model family
   *
   * @param family - Model family
   * @returns API key or undefined if not set
   */
  getApiKey(family: ModelFamily): string | undefined {
    return this.apiKeys.get(family);
  }

  /**
   * Check if API key is set for a model family
   *
   * @param family - Model family
   * @returns true if API key is set
   */
  hasApiKey(family: ModelFamily): boolean {
    return this.apiKeys.has(family);
  }

  /**
   * Get provider configuration for a model family
   *
   * @param family - Model family
   * @returns Provider configuration
   */
  getProviderConfig(family: ModelFamily): ProviderConfig {
    const config = PROVIDER_CONFIGS[family];
    if (!config) {
      throw new Error(`Unknown model family: ${family}`);
    }
    return config;
  }

  /**
   * Get all available provider configurations
   *
   * @returns Record of all provider configs
   */
  getAllProviderConfigs(): Record<ModelFamily, ProviderConfig> {
    return { ...PROVIDER_CONFIGS };
  }

  /**
   * Create a model provider instance
   *
   * @param config - Model configuration
   * @returns Model provider instance
   * @throws Error if API key is required but not provided
   */
  createProvider(config: ModelConfig): IModelProvider {
    const providerConfig = this.getProviderConfig(config.family);

    // Get API key (from config or stored keys)
    const apiKey = config.apiKey || this.apiKeys.get(config.family);

    // Validate API key requirement
    if (providerConfig.requiresApiKey && !apiKey) {
      throw new Error(
        `API key required for ${config.family}. ` +
        `Set it via factory.setApiKey('${config.family}', 'your-key') or pass it in config.apiKey`
      );
    }

    // Get model (use provided or default)
    const model = config.model || providerConfig.defaultModel;

    // Get base URL (use provided or from config)
    const baseUrl = config.baseUrl || providerConfig.baseUrl;

    // Create provider instance
    return new ModelProvider(
      config.family,
      model,
      apiKey,
      baseUrl,
      config.maxTokens,
      config.temperature
    );
  }

  /**
   * Create multiple providers at once
   *
   * @param configs - Array of model configurations
   * @returns Array of provider instances
   */
  createProviders(configs: ModelConfig[]): IModelProvider[] {
    return configs.map(config => this.createProvider(config));
  }

  /**
   * Get a summary of available providers and their status
   *
   * @returns Array of provider summaries
   */
  getProvidersSummary(): Array<{
    family: ModelFamily;
    models: string[];
    defaultModel: string;
    requiresApiKey: boolean;
    hasApiKey: boolean;
    baseUrl?: string;
  }> {
    return Object.values(PROVIDER_CONFIGS).map(config => ({
      family: config.family,
      models: config.models,
      defaultModel: config.defaultModel,
      requiresApiKey: config.requiresApiKey,
      hasApiKey: this.hasApiKey(config.family),
      baseUrl: config.baseUrl,
    }));
  }
}

/**
 * ModelProvider implementation
 *
 * Wraps the real API providers to implement the IModelProvider interface.
 * Uses the provider infrastructure from ../providers for actual API calls.
 */
class ModelProvider implements IModelProvider {
  private provider: BaseProvider;

  constructor(
    public readonly family: ModelFamily,
    private readonly model: string,
    private readonly apiKey: string | undefined,
    private readonly baseUrl: string | undefined,
    private readonly maxTokens?: number,
    private readonly temperature?: number
  ) {
    // Get the appropriate provider for this family
    this.provider = getProvider(family, apiKey, model);
    console.log(`[ModelProvider] Created ${family} provider with model: ${model}`);
  }

  async complete(request: CompletionRequest): Promise<CompletionResponse> {
    // Merge request options with instance configuration
    const completionRequest: CompletionRequest = {
      ...request,
      maxTokens: request.maxTokens || this.maxTokens,
      temperature: request.temperature ?? this.temperature,
    };

    // Use the real provider to complete the request
    return this.provider.complete(completionRequest);
  }
}
