/**
 * Self-Hosted AI Provider
 * 
 * Connects to vLLM, TGI, or any OpenAI-compatible endpoint.
 * This is the foundation of AKHAI Mother Base.
 */

export interface SelfHostedConfig {
  name: string;
  baseUrl: string;
  model: string;
  apiKey?: string;
  maxTokens: number;
  temperature: number;
  timeout: number;
}

export interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface CompletionRequest {
  messages: Message[];
  systemPrompt?: string;
  maxTokens?: number;
  temperature?: number;
  stream?: boolean;
}

export interface CompletionResponse {
  content: string;
  model: string;
  provider: string;
  usage: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  };
  latency: number;
}

export interface StreamChunk {
  content: string;
  done: boolean;
}

const DEFAULT_CONFIG: Partial<SelfHostedConfig> = {
  maxTokens: 4096,
  temperature: 0.7,
  timeout: 120000, // 2 minutes
};

export class SelfHostedProvider {
  private config: SelfHostedConfig;

  constructor(config: Partial<SelfHostedConfig> & { name: string; baseUrl: string; model: string }) {
    this.config = { ...DEFAULT_CONFIG, ...config } as SelfHostedConfig;
    console.log(`[Mother Base] 🧠 Initialized: ${this.config.name} (${this.config.model})`);
  }

  /**
   * Complete a chat request
   */
  async complete(request: CompletionRequest): Promise<CompletionResponse> {
    const startTime = Date.now();

    const messages: Message[] = [];
    
    // Add system prompt if provided
    if (request.systemPrompt) {
      messages.push({ role: 'system', content: request.systemPrompt });
    }
    
    // Add conversation messages
    messages.push(...request.messages);

    const body = {
      model: this.config.model,
      messages,
      max_tokens: request.maxTokens || this.config.maxTokens,
      temperature: request.temperature || this.config.temperature,
      stream: false,
    };

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.config.apiKey) {
      headers['Authorization'] = `Bearer ${this.config.apiKey}`;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

      const response = await fetch(`${this.config.baseUrl}/v1/chat/completions`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`API error ${response.status}: ${error}`);
      }

      const data = await response.json() as any;
      const latency = Date.now() - startTime;

      console.log(`[Mother Base] ✅ ${this.config.name}: ${latency}ms, ${data.usage?.total_tokens || 0} tokens`);

      return {
        content: data.choices[0].message.content,
        model: this.config.model,
        provider: this.config.name,
        usage: {
          inputTokens: data.usage?.prompt_tokens || 0,
          outputTokens: data.usage?.completion_tokens || 0,
          totalTokens: data.usage?.total_tokens || 0,
        },
        latency,
      };
    } catch (error: any) {
      const latency = Date.now() - startTime;
      console.error(`[Mother Base] ❌ ${this.config.name} failed after ${latency}ms:`, error.message);
      throw error;
    }
  }

  /**
   * Stream a chat response
   */
  async *stream(request: CompletionRequest): AsyncGenerator<StreamChunk> {
    const messages: Message[] = [];
    
    if (request.systemPrompt) {
      messages.push({ role: 'system', content: request.systemPrompt });
    }
    messages.push(...request.messages);

    const body = {
      model: this.config.model,
      messages,
      max_tokens: request.maxTokens || this.config.maxTokens,
      temperature: request.temperature || this.config.temperature,
      stream: true,
    };

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.config.apiKey) {
      headers['Authorization'] = `Bearer ${this.config.apiKey}`;
    }

    const response = await fetch(`${this.config.baseUrl}/v1/chat/completions`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`Stream error: ${response.status}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error('No response body');

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      
      if (done) {
        yield { content: '', done: true };
        break;
      }

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') {
            yield { content: '', done: true };
            return;
          }
          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content || '';
            if (content) {
              yield { content, done: false };
            }
          } catch {
            // Skip invalid JSON
          }
        }
      }
    }
  }

  /**
   * Check if the endpoint is healthy
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.config.baseUrl}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      });
      return response.ok;
    } catch {
      // Try models endpoint as fallback
      try {
        const response = await fetch(`${this.config.baseUrl}/v1/models`, {
          method: 'GET',
          signal: AbortSignal.timeout(5000),
        });
        return response.ok;
      } catch {
        return false;
      }
    }
  }

  /**
   * Get model info
   */
  getInfo() {
    return {
      name: this.config.name,
      model: this.config.model,
      baseUrl: this.config.baseUrl,
      maxTokens: this.config.maxTokens,
    };
  }
}
