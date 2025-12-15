import { BaseProvider } from './base.js';
import { CompletionRequest, CompletionResponse } from '../models/types.js';

interface MistralMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface MistralRequest {
  model: string;
  messages: MistralMessage[];
  max_tokens?: number;
  temperature?: number;
}

interface MistralResponse {
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

export class MistralProvider extends BaseProvider {
  private endpoint = 'https://api.mistral.ai/v1/chat/completions';

  protected getDefaultModel(): string {
    return 'mistral-small-latest';
  }

  protected async callAPI(request: CompletionRequest): Promise<CompletionResponse> {
    const messages = this.buildMessages(request);

    const mistralRequest: MistralRequest = {
      model: this.model,
      messages: messages as MistralMessage[],
      max_tokens: request.maxTokens || 4096,
      temperature: request.temperature ?? 0.7
    };

    console.log(`[Mistral] Calling API with ${messages.length} messages`);

    const response = await fetch(this.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify(mistralRequest)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Mistral API error (${response.status}): ${errorText}`);
    }

    const data = await response.json() as MistralResponse;

    // Extract content from first choice
    const content = data.choices[0]?.message?.content || '';

    return {
      content,
      usage: {
        inputTokens: data.usage.prompt_tokens,
        outputTokens: data.usage.completion_tokens
      },
      model: data.model,
      family: 'mistral'
    };
  }
}
