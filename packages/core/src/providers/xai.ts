import { BaseProvider } from './base';
import { CompletionRequest, CompletionResponse } from '../models/types';

interface OpenAICompatibleMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface OpenAICompatibleRequest {
  model: string;
  messages: OpenAICompatibleMessage[];
  max_tokens?: number;
  temperature?: number;
}

interface OpenAICompatibleResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export class XAIProvider extends BaseProvider {
  private endpoint = 'https://api.x.ai/v1/chat/completions';

  protected getDefaultModel(): string {
    return 'grok-3';
  }

  protected async callAPI(request: CompletionRequest): Promise<CompletionResponse> {
    const messages = this.buildMessages(request);

    const xaiRequest: OpenAICompatibleRequest = {
      model: this.model,
      messages: messages as OpenAICompatibleMessage[],
      max_tokens: request.maxTokens || 4096,
      temperature: request.temperature ?? 1.0
    };

    console.log(`[xAI] Calling API with ${messages.length} messages`);

    const response = await fetch(this.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify(xaiRequest)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`xAI API error (${response.status}): ${errorText}`);
    }

    const data = await response.json() as OpenAICompatibleResponse;

    // Extract content from first choice
    const content = data.choices[0]?.message?.content || '';

    return {
      content,
      usage: {
        inputTokens: data.usage.prompt_tokens,
        outputTokens: data.usage.completion_tokens
      },
      model: data.model,
      family: 'xai'
    };
  }
}
