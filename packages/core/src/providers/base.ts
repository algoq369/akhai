import { CompletionRequest, CompletionResponse, ModelFamily } from '../models/types';

export abstract class BaseProvider {
  protected apiKey: string;
  protected model: string;
  protected family: ModelFamily;
  protected maxRetries: number = 3;
  protected timeout: number = 30000; // 30 seconds

  constructor(family: ModelFamily, apiKey: string, model?: string) {
    this.family = family;
    this.apiKey = apiKey;
    this.model = model || this.getDefaultModel();
  }

  /**
   * Abstract method to be implemented by each provider
   */
  protected abstract callAPI(request: CompletionRequest): Promise<CompletionResponse>;

  /**
   * Get the default model for this provider
   */
  protected abstract getDefaultModel(): string;

  /**
   * Public method to complete a request with retry logic
   */
  async complete(request: CompletionRequest): Promise<CompletionResponse> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        console.log(`[${this.family}] Attempt ${attempt}/${this.maxRetries} - Model: ${this.model}`);

        const response = await this.callAPIWithTimeout(request);

        console.log(`[${this.family}] Success - Tokens: ${response.usage?.inputTokens || 0} in, ${response.usage?.outputTokens || 0} out`);

        return response;
      } catch (error) {
        lastError = error as Error;
        const isRateLimitError = this.isRateLimitError(error);

        console.error(`[${this.family}] Attempt ${attempt} failed:`, error instanceof Error ? error.message : error);

        // Don't retry on the last attempt
        if (attempt === this.maxRetries) {
          break;
        }

        // Calculate backoff delay: 1s, 2s, 4s
        const backoffDelay = Math.pow(2, attempt - 1) * 1000;

        // Add extra delay for rate limit errors
        const delay = isRateLimitError ? backoffDelay * 2 : backoffDelay;

        console.log(`[${this.family}] Retrying in ${delay}ms...`);
        await this.sleep(delay);
      }
    }

    throw new Error(`[${this.family}] Failed after ${this.maxRetries} attempts: ${lastError?.message || 'Unknown error'}`);
  }

  /**
   * Call API with timeout wrapper
   */
  private async callAPIWithTimeout(request: CompletionRequest): Promise<CompletionResponse> {
    return Promise.race([
      this.callAPI(request),
      this.createTimeoutPromise()
    ]);
  }

  /**
   * Create a timeout promise that rejects after the configured timeout
   */
  private createTimeoutPromise(): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Request timeout after ${this.timeout}ms`));
      }, this.timeout);
    });
  }

  /**
   * Check if error is a rate limit error
   */
  protected isRateLimitError(error: unknown): boolean {
    if (error instanceof Error) {
      const message = error.message.toLowerCase();
      return message.includes('rate limit') ||
             message.includes('429') ||
             message.includes('too many requests');
    }
    return false;
  }

  /**
   * Sleep utility for backoff delays
   */
  protected sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Count tokens (approximate - can be overridden by providers)
   */
  protected estimateTokens(text: string): number {
    // Rough approximation: ~4 characters per token
    return Math.ceil(text.length / 4);
  }

  /**
   * Build messages array with system prompt if provided
   */
  protected buildMessages(request: CompletionRequest): Array<{ role: 'user' | 'assistant' | 'system'; content: string }> {
    const messages = [...request.messages];

    // Add system prompt as first message if provided
    if (request.systemPrompt) {
      messages.unshift({
        role: 'system',
        content: request.systemPrompt
      });
    }

    return messages;
  }
}
