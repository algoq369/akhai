/**
 * Retry with exponential backoff for AI provider calls.
 * Local wrapper matching @algoq/stdlib/retry API.
 */

export type RetryOptions = {
  maxAttempts?: number;
  baseDelay?: number;
  shouldRetry?: (err: Error) => boolean;
};

const DEFAULT_SHOULD_RETRY = (err: Error): boolean => {
  const msg = err.message?.toLowerCase() || '';
  return (
    msg.includes('rate') ||
    msg.includes('timeout') ||
    msg.includes('503') ||
    msg.includes('502') ||
    msg.includes('429') ||
    msg.includes('econnreset')
  );
};

export async function withRetry<T>(fn: () => Promise<T>, options: RetryOptions = {}): Promise<T> {
  const { maxAttempts = 3, baseDelay = 1000, shouldRetry = DEFAULT_SHOULD_RETRY } = options;

  let lastError: Error | undefined;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (attempt >= maxAttempts - 1 || !shouldRetry(lastError)) throw lastError;
      const delay = baseDelay * Math.pow(2, attempt) + Math.random() * baseDelay * 0.25;
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw lastError;
}
