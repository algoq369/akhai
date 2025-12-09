import { ModelFamily, ProviderConfig, ModelConfig, CompletionRequest, CompletionResponse } from './types.js';

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
 * This is a placeholder implementation that will be replaced with
 * actual API calls in the future. For now, it returns mock responses
 * to enable testing of the consensus and flow logic.
 */
class ModelProvider implements IModelProvider {
  constructor(
    public readonly family: ModelFamily,
    private readonly model: string,
    private readonly apiKey: string | undefined,
    private readonly baseUrl: string | undefined,
    private readonly maxTokens?: number,
    private readonly temperature?: number
  ) {}

  async complete(request: CompletionRequest): Promise<CompletionResponse> {
    // PLACEHOLDER IMPLEMENTATION
    // TODO: Replace with actual API calls to each provider
    //
    // For now, return mock responses to enable testing of:
    // - Consensus mechanism (3 rounds, 2 min each)
    // - Flow A (Mother Base decision)
    // - Flow B (Sub-Agent execution)
    //
    // Future implementation will:
    // 1. Make HTTP requests to provider APIs
    // 2. Handle authentication (API keys)
    // 3. Parse responses
    // 4. Handle errors and retries
    // 5. Track usage (tokens)

    const messages = request.messages;
    const lastMessage = messages[messages.length - 1];
    const userContent = lastMessage.content;

    // Generate mock response based on family
    const mockResponse = this.generateMockResponse(userContent, request.systemPrompt);

    // Simulate API delay (50-200ms)
    await new Promise(resolve => setTimeout(resolve, 50 + Math.random() * 150));

    return {
      content: mockResponse,
      model: this.model,
      family: this.family,
      usage: {
        inputTokens: this.estimateTokens(userContent),
        outputTokens: this.estimateTokens(mockResponse),
      },
    };
  }

  /**
   * Generate mock response (placeholder)
   */
  private generateMockResponse(userContent: string, systemPrompt?: string): string {
    const familyStyle = this.getFamilyStyle();

    // Check if this is a consensus check
    if (systemPrompt?.includes('CONSENSUS') || systemPrompt?.includes('NO_CONSENSUS')) {
      // Simulate consensus detection
      const hasAgree = userContent.toLowerCase().includes('[agree]');
      const hasDisagree = userContent.toLowerCase().includes('[disagree]');

      if (hasAgree && !hasDisagree) {
        return 'CONSENSUS';
      } else if (Math.random() > 0.7) {
        // 30% chance of detecting consensus
        return 'CONSENSUS';
      } else {
        return 'NO_CONSENSUS';
      }
    }

    // Check if this is an approval request
    if (userContent.toLowerCase().includes('approve')) {
      // 70% chance of approval
      if (Math.random() > 0.3) {
        return `${familyStyle} This looks good. APPROVED.`;
      } else {
        return `${familyStyle} I see some issues. REVISION needed: Please clarify the assumptions.`;
      }
    }

    // Check if this is a round-based consensus query
    if (userContent.toLowerCase().includes('round')) {
      const roundMatch = userContent.match(/round (\d+)/i);
      const round = roundMatch ? parseInt(roundMatch[1]) : 1;

      if (round === 1) {
        return `${familyStyle} Initial analysis: ${this.summarize(userContent)} [AGREE]`;
      } else if (round === 2) {
        return `${familyStyle} Refined perspective: ${this.summarize(userContent)} [AGREE]`;
      } else {
        return `${familyStyle} Final position: ${this.summarize(userContent)} [AGREE]`;
      }
    }

    // Regular response
    return `${familyStyle} ${this.summarize(userContent)}`;
  }

  /**
   * Get family-specific response style
   */
  private getFamilyStyle(): string {
    const styles: Record<ModelFamily, string> = {
      anthropic: '[Claude]',
      openai: '[GPT]',
      deepseek: '[DeepSeek]',
      qwen: '[Qwen]',
      google: '[Gemini]',
      mistral: '[Mistral]',
      openrouter: '[OpenRouter]',
      ollama: '[Ollama]',
      groq: '[Groq]',
      xai: '[Grok]',
    };
    return styles[this.family];
  }

  /**
   * Summarize content (placeholder)
   */
  private summarize(content: string): string {
    const words = content.split(/\s+/);
    if (words.length <= 20) {
      return content;
    }
    return words.slice(0, 20).join(' ') + '...';
  }

  /**
   * Estimate token count (rough approximation)
   */
  private estimateTokens(text: string): number {
    // Rough estimate: ~4 characters per token
    return Math.ceil(text.length / 4);
  }
}
