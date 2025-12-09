import { BaseProvider } from './base';
import { CompletionRequest, CompletionResponse } from '../models/types';

interface AnthropicMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface AnthropicRequest {
  model: string;
  messages: AnthropicMessage[];
  max_tokens: number;
  temperature?: number;
  system?: string;
}

interface AnthropicResponse {
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

export class AnthropicProvider extends BaseProvider {
  private endpoint = 'https://api.anthropic.com/v1/messages';
  private apiVersion = '2023-06-01';

  protected getDefaultModel(): string {
    return 'claude-sonnet-4-20250514';
  }

  protected async callAPI(request: CompletionRequest): Promise<CompletionResponse> {
    const messages = this.buildMessages(request);

    // Separate system messages from conversation messages
    const systemMessages = messages.filter(m => m.role === 'system');
    const conversationMessages = messages.filter(m => m.role !== 'system');

    // Anthropic requires at least one user message
    if (conversationMessages.length === 0 || conversationMessages[0].role !== 'user') {
      conversationMessages.unshift({ role: 'user', content: 'Hello' });
    }

    // Build system prompt from all system messages
    const systemPrompt = systemMessages.map(m => m.content).join('\n\n');

    const anthropicRequest: AnthropicRequest = {
      model: this.model,
      messages: conversationMessages as AnthropicMessage[],
      max_tokens: request.maxTokens || 4096,
      temperature: request.temperature ?? 1.0
    };

    // Add system prompt if present
    if (systemPrompt) {
      anthropicRequest.system = systemPrompt;
    }

    console.log(`[Anthropic] Calling API with ${conversationMessages.length} messages`);

    const response = await fetch(this.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': this.apiVersion
      },
      body: JSON.stringify(anthropicRequest)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Anthropic API error (${response.status}): ${errorText}`);
    }

    const data = await response.json() as AnthropicResponse;

    // Extract text content from response
    const content = data.content
      .filter(block => block.type === 'text')
      .map(block => block.text)
      .join('\n');

    return {
      content,
      usage: {
        inputTokens: data.usage.input_tokens,
        outputTokens: data.usage.output_tokens
      },
      model: data.model,
      family: 'anthropic'
    };
  }
}
