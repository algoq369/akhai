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

export class DeepSeekProvider extends BaseProvider {
  private endpoint = 'https://api.deepseek.com/v1/chat/completions';

  protected getDefaultModel(): string {
    return 'deepseek-chat';
  }

  protected async callAPI(request: CompletionRequest): Promise<CompletionResponse> {
    const messages = this.buildMessages(request);

    const deepseekRequest: OpenAICompatibleRequest = {
      model: this.model,
      messages: messages as OpenAICompatibleMessage[],
      max_tokens: request.maxTokens || 4096,
      temperature: request.temperature ?? 1.0
    };

    console.log(`[DeepSeek] Calling API with ${messages.length} messages`);

    const response = await fetch(this.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify(deepseekRequest)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`DeepSeek API error (${response.status}): ${errorText}`);
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
      family: 'deepseek'
    };
  }
}
