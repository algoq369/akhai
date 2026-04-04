import { NextRequest } from 'next/server';

// Security: Rate limiting (in-memory token bucket)
const rateLimitMap = new Map<string, { tokens: number; lastRefill: number }>();
const RATE_LIMIT_WINDOW_MS = 60000; // 1 minute
const RATE_LIMIT_MAX_TOKENS = 20; // 20 requests per minute per IP
const RATE_LIMIT_REFILL_RATE = 20; // Refill to max per window

export function getRateLimitKey(request: NextRequest): string {
  // Use X-Forwarded-For for proxied requests, fallback to a default
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded?.split(',')[0]?.trim() || 'unknown';
  return ip;
}

export function checkRateLimit(key: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  let bucket = rateLimitMap.get(key);

  if (!bucket) {
    bucket = { tokens: RATE_LIMIT_MAX_TOKENS, lastRefill: now };
    rateLimitMap.set(key, bucket);
  }

  // Refill tokens based on time elapsed
  const elapsed = now - bucket.lastRefill;
  if (elapsed >= RATE_LIMIT_WINDOW_MS) {
    bucket.tokens = RATE_LIMIT_MAX_TOKENS;
    bucket.lastRefill = now;
  }

  if (bucket.tokens > 0) {
    bucket.tokens--;
    return { allowed: true, remaining: bucket.tokens };
  }

  return { allowed: false, remaining: 0 };
}

// Clean up old rate limit entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of rateLimitMap.entries()) {
    if (now - bucket.lastRefill > RATE_LIMIT_WINDOW_MS * 5) {
      rateLimitMap.delete(key);
    }
  }
}, 300000);
