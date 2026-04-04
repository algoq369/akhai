/**
 * Lightweight cancellation context with timeout — stdlib pattern.
 * Wraps AbortController with automatic cleanup.
 */

export function createContext(timeoutMs: number = 30000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  return {
    signal: controller.signal,
    cancel: () => {
      clearTimeout(timer);
      controller.abort();
    },
    cleanup: () => clearTimeout(timer),
  };
}
