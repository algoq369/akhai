/**
 * AKHAI Mother Base
 * 
 * The central AI orchestrator for sovereign intelligence.
 * Manages multiple self-hosted models and provides unified interface.
 */

import { SelfHostedProvider, CompletionRequest, CompletionResponse, StreamChunk } from './providers/self-hosted.js';
import { AnthropicProvider } from './providers/anthropic.js';

export interface MotherBaseConfig {
  primary: ModelConfig;
  advisors?: ModelConfig[];
  tools?: ToolConfig[];
}

export interface ModelConfig {
  name: string;
  baseUrl: string;
  model: string;
  apiKey?: string;
  role: 'primary' | 'advisor' | 'specialist';
  providerType?: 'self-hosted' | 'anthropic';
}

export interface ToolConfig {
  name: string;
  type: 'web-search' | 'code-exec' | 'file-system' | 'api';
  config: Record<string, any>;
}

export interface QueryOptions {
  useConsensus?: boolean;
  useTools?: boolean;
  stream?: boolean;
  timeout?: number;
}

export interface ConsensusResult {
  finalAnswer: string;
  confidence: number;
  sources: Array<{
    model: string;
    response: string;
    latency: number;
  }>;
  totalLatency: number;
}

// Union type for providers
type Provider = SelfHostedProvider | AnthropicProvider;

/**
 * Create the appropriate provider based on config
 */
function createProvider(config: ModelConfig): Provider {
  if (config.providerType === 'anthropic') {
    return new AnthropicProvider({
      name: config.name,
      apiKey: config.apiKey!,
      model: config.model,
    });
  }
  return new SelfHostedProvider({
    name: config.name,
    baseUrl: config.baseUrl,
    model: config.model,
    apiKey: config.apiKey,
  });
}

/**
 * Mother Base - Sovereign AI Core
 */
export class MotherBase {
  private primary: Provider;
  private advisors: Provider[] = [];
  private initialized: boolean = false;

  constructor(config: MotherBaseConfig) {
    // Initialize primary model
    this.primary = createProvider(config.primary);

    // Initialize advisor models
    if (config.advisors) {
      this.advisors = config.advisors.map(advisor => createProvider(advisor));
    }

    console.log(`[Mother Base] 🏛️ Initialized with ${1 + this.advisors.length} models`);
  }

  /**
   * Initialize and verify all connections
   */
  async initialize(): Promise<boolean> {
    console.log('[Mother Base] 🔄 Initializing...');

    // Check primary
    const primaryHealth = await this.primary.healthCheck();
    if (!primaryHealth) {
      console.error('[Mother Base] ❌ Primary model unreachable');
      return false;
    }
    console.log('[Mother Base] ✅ Primary model online');

    // Check advisors
    for (const advisor of this.advisors) {
      const health = await advisor.healthCheck();
      if (health) {
        console.log(`[Mother Base] ✅ Advisor ${advisor.getInfo().name} online`);
      } else {
        console.warn(`[Mother Base] ⚠️ Advisor ${advisor.getInfo().name} offline`);
      }
    }

    this.initialized = true;
    console.log('[Mother Base] 🚀 Ready');
    return true;
  }

  /**
   * Simple query - just primary model
   */
  async query(prompt: string, options?: QueryOptions): Promise<CompletionResponse> {
    const request: CompletionRequest = {
      messages: [{ role: 'user', content: prompt }],
    };

    if (options?.useConsensus && this.advisors.length > 0) {
      const result = await this.consensusQuery(prompt);
      return {
        content: result.finalAnswer,
        model: 'consensus',
        provider: 'mother-base',
        usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
        latency: result.totalLatency,
      };
    }

    return this.primary.complete(request);
  }

  /**
   * Chat with conversation history
   */
  async chat(
    messages: Array<{ role: 'user' | 'assistant'; content: string }>,
    systemPrompt?: string
  ): Promise<CompletionResponse> {
    const request: CompletionRequest = {
      messages: messages.map(m => ({ ...m, role: m.role as 'user' | 'assistant' })),
      systemPrompt,
    };

    return this.primary.complete(request);
  }

  /**
   * Stream response
   */
  async *stream(prompt: string): AsyncGenerator<StreamChunk> {
    const request: CompletionRequest = {
      messages: [{ role: 'user', content: prompt }],
    };

    yield* this.primary.stream(request);
  }

  /**
   * Multi-model consensus query
   */
  async consensusQuery(prompt: string): Promise<ConsensusResult> {
    const startTime = Date.now();
    const sources: ConsensusResult['sources'] = [];

    // Query all models in parallel
    const allModels = [this.primary, ...this.advisors];
    
    const results = await Promise.allSettled(
      allModels.map(async (model) => {
        const response = await model.complete({
          messages: [{ role: 'user', content: prompt }],
        });
        return {
          model: model.getInfo().name,
          response: response.content,
          latency: response.latency,
        };
      })
    );

    // Collect successful responses
    for (const result of results) {
      if (result.status === 'fulfilled') {
        sources.push(result.value);
      }
    }

    if (sources.length === 0) {
      throw new Error('All models failed');
    }

    // If only one response, return it directly
    if (sources.length === 1) {
      return {
        finalAnswer: sources[0].response,
        confidence: 0.7,
        sources,
        totalLatency: Date.now() - startTime,
      };
    }

    // Synthesize consensus with primary model
    const synthesisPrompt = `You are synthesizing multiple AI responses into one coherent answer.

ORIGINAL QUESTION: ${prompt}

RESPONSES:
${sources.map((s, i) => `[Model ${i + 1}: ${s.model}]\n${s.response}`).join('\n\n')}

Synthesize these responses into one clear, comprehensive answer. If they agree, summarize the consensus. If they disagree, present the strongest argument.`;

    const synthesis = await this.primary.complete({
      messages: [{ role: 'user', content: synthesisPrompt }],
      systemPrompt: 'You are a synthesis AI. Combine multiple perspectives into one clear answer.',
    });

    return {
      finalAnswer: synthesis.content,
      confidence: sources.length >= 2 ? 0.85 : 0.7,
      sources,
      totalLatency: Date.now() - startTime,
    };
  }

  /**
   * Get status of all models
   */
  async getStatus(): Promise<{
    initialized: boolean;
    primary: { name: string; model: string; healthy: boolean };
    advisors: Array<{ name: string; model: string; healthy: boolean }>;
  }> {
    const primaryHealth = await this.primary.healthCheck();
    const advisorStatuses = await Promise.all(
      this.advisors.map(async (advisor) => ({
        name: advisor.getInfo().name,
        model: advisor.getInfo().model,
        healthy: await advisor.healthCheck(),
      }))
    );

    return {
      initialized: this.initialized,
      primary: {
        name: this.primary.getInfo().name,
        model: this.primary.getInfo().model,
        healthy: primaryHealth,
      },
      advisors: advisorStatuses,
    };
  }
}

/**
 * Pre-configured Mother Base setups
 */
export const MOTHER_BASE_CONFIGS = {
  // Claude Opus 4.5 setup (default for production)
  claude: (apiKey: string) => ({
    primary: {
      name: 'claude-opus',
      baseUrl: 'https://api.anthropic.com',
      model: 'claude-opus-4-5-20251101',
      apiKey,
      role: 'primary' as const,
      providerType: 'anthropic' as const,
    },
  }),

  // Local Ollama setup
  local: {
    primary: {
      name: 'ollama-llama',
      baseUrl: 'http://localhost:11434',
      model: 'llama3.1:70b',
      role: 'primary' as const,
    },
  },

  // RunPod vLLM setup
  runpod: (endpoint: string, apiKey: string) => ({
    primary: {
      name: 'runpod-llama',
      baseUrl: endpoint,
      model: 'meta-llama/Llama-3.1-70B-Instruct',
      apiKey,
      role: 'primary' as const,
    },
  }),

  // Together AI setup
  together: (apiKey: string) => ({
    primary: {
      name: 'together-llama',
      baseUrl: 'https://api.together.xyz',
      model: 'meta-llama/Llama-3.1-70B-Instruct-Turbo',
      apiKey,
      role: 'primary' as const,
    },
    advisors: [
      {
        name: 'together-mistral',
        baseUrl: 'https://api.together.xyz',
        model: 'mistralai/Mixtral-8x22B-Instruct-v0.1',
        apiKey,
        role: 'advisor' as const,
      },
      {
        name: 'together-qwen',
        baseUrl: 'https://api.together.xyz',
        model: 'Qwen/Qwen2.5-72B-Instruct-Turbo',
        apiKey,
        role: 'advisor' as const,
      },
    ],
  }),
};
