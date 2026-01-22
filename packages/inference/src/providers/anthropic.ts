/**
 * Anthropic Claude Provider for Mother Base
 *
 * Native Anthropic API integration for Claude models.
 * Default provider for production launch using Claude Opus 4.5.
 */

import type { CompletionRequest, CompletionResponse, StreamChunk, Message } from './self-hosted.js';

export interface AnthropicConfig {
  name: string;
  apiKey: string;
  model: string;
  maxTokens: number;
  temperature: number;
  timeout: number;
}

interface AnthropicMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface AnthropicAPIResponse {
  id: string;
  type: string;
  role: string;
  content: Array<{
    type: string;
    text: string;
  }>;
  model: string;
  stop_reason: string;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
}

const DEFAULT_CONFIG: Partial<AnthropicConfig> = {
  maxTokens: 4096,
  temperature: 0.7,
  timeout: 120000, // 2 minutes
};

export class AnthropicProvider {
  private config: AnthropicConfig;
  private endpoint = 'https://api.anthropic.com/v1/messages';
  private apiVersion = '2023-06-01';

  constructor(config: Partial<AnthropicConfig> & { name: string; apiKey: string; model: string }) {
    this.config = { ...DEFAULT_CONFIG, ...config } as AnthropicConfig;
    console.log(`[Mother Base] 🧠 Initialized: ${this.config.name} (${this.config.model})`);
  }

  /**
   * Complete a chat request
   */
  async complete(request: CompletionRequest): Promise<CompletionResponse> {
    const startTime = Date.now();

    // Separate system messages from conversation messages
    const systemMessages: string[] = [];
    const conversationMessages: AnthropicMessage[] = [];

    if (request.systemPrompt) {
      systemMessages.push(request.systemPrompt);
    }

    for (const msg of request.messages) {
      if (msg.role === 'system') {
        systemMessages.push(msg.content);
      } else {
        conversationMessages.push({
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
        });
      }
    }

    // Anthropic requires at least one user message
    if (conversationMessages.length === 0 || conversationMessages[0].role !== 'user') {
      conversationMessages.unshift({ role: 'user', content: 'Hello' });
    }

    const body: Record<string, unknown> = {
      model: this.config.model,
      messages: conversationMessages,
      max_tokens: request.maxTokens || this.config.maxTokens,
      temperature: request.temperature || this.config.temperature,
    };

    // Add system prompt if present
    if (systemMessages.length > 0) {
      body.system = systemMessages.join('\n\n');
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.config.apiKey,
          'anthropic-version': this.apiVersion,
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Anthropic API error ${response.status}: ${error}`);
      }

      const data = await response.json() as AnthropicAPIResponse;
      const latency = Date.now() - startTime;

      // Extract text content from response
      const content = data.content
        .filter(block => block.type === 'text')
        .map(block => block.text)
        .join('\n');

      console.log(`[Mother Base] ✅ ${this.config.name}: ${latency}ms, ${data.usage.input_tokens + data.usage.output_tokens} tokens`);

      return {
        content,
        model: this.config.model,
        provider: this.config.name,
        usage: {
          inputTokens: data.usage.input_tokens,
          outputTokens: data.usage.output_tokens,
          totalTokens: data.usage.input_tokens + data.usage.output_tokens,
        },
        latency,
      };
    } catch (error: unknown) {
      const latency = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`[Mother Base] ❌ ${this.config.name} failed after ${latency}ms:`, errorMessage);
      throw error;
    }
  }

  /**
   * Stream a chat response
   */
  async *stream(request: CompletionRequest): AsyncGenerator<StreamChunk> {
    // Separate system messages from conversation messages
    const systemMessages: string[] = [];
    const conversationMessages: AnthropicMessage[] = [];

    if (request.systemPrompt) {
      systemMessages.push(request.systemPrompt);
    }

    for (const msg of request.messages) {
      if (msg.role === 'system') {
        systemMessages.push(msg.content);
      } else {
        conversationMessages.push({
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
        });
      }
    }

    if (conversationMessages.length === 0 || conversationMessages[0].role !== 'user') {
      conversationMessages.unshift({ role: 'user', content: 'Hello' });
    }

    const body: Record<string, unknown> = {
      model: this.config.model,
      messages: conversationMessages,
      max_tokens: request.maxTokens || this.config.maxTokens,
      temperature: request.temperature || this.config.temperature,
      stream: true,
    };

    if (systemMessages.length > 0) {
      body.system = systemMessages.join('\n\n');
    }

    const response = await fetch(this.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.config.apiKey,
        'anthropic-version': this.apiVersion,
      },
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
          try {
            const parsed = JSON.parse(data);
            // Anthropic streaming format
            if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
              yield { content: parsed.delta.text, done: false };
            } else if (parsed.type === 'message_stop') {
              yield { content: '', done: true };
              return;
            }
          } catch {
            // Skip invalid JSON
          }
        }
      }
    }
  }

  /**
   * Check if the Anthropic API is reachable
   */
  async healthCheck(): Promise<boolean> {
    try {
      // Anthropic doesn't have a dedicated health endpoint
      // We'll do a minimal request to verify API key validity
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.config.apiKey,
          'anthropic-version': this.apiVersion,
        },
        body: JSON.stringify({
          model: this.config.model,
          messages: [{ role: 'user', content: 'Hi' }],
          max_tokens: 1,
        }),
        signal: AbortSignal.timeout(10000),
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Get provider info
   */
  getInfo() {
    return {
      name: this.config.name,
      model: this.config.model,
      baseUrl: 'https://api.anthropic.com',
      maxTokens: this.config.maxTokens,
    };
  }
}
