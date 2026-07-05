/**
 * Route input contracts (Zod). Pure module: zod-only imports, so schemas are testable
 * in any vitest environment and reusable across boundaries.
 */
import { z } from 'zod';

export const AuthEmailSchema = z.object({
  email: z.string().email().max(320),
  action: z.enum(['send', 'verify']),
  // 6-digit code; length-capped only — format wrongness surfaces as the handler's own
  // 'Invalid or expired code' (behavior-preserving), presence is checked per-action below
  code: z.string().min(1).max(10).optional(),
});

export const AuthWalletSchema = z.object({
  // EVM address: 0x + 40 hex chars (checksummed or lowercase)
  address: z.string().regex(/^0x[0-9a-fA-F]{40}$/, 'invalid wallet address'),
});

export const AuthWalletVerifySchema = z.object({
  // EVM address: 0x + 40 hex chars (checksummed or lowercase)
  address: z.string().regex(/^0x[0-9a-fA-F]{40}$/, 'invalid wallet address'),
  // 0x-hex floor. Standard ECDSA personal_sign is 0x+130 hex, but smart-account (EIP-1271)
  // signatures run longer — and verifyWalletSignature is currently a placeholder, so this
  // is a shape floor, not a cryptographic check.
  signature: z.string().regex(/^0x[0-9a-fA-F]+$/, 'invalid signature').max(5000),
  // the handler regenerates and compares the exact expected message (~150 chars)
  message: z.string().min(1).max(500),
});

export const CheckoutSchema = z.object({
  priceId: z.string().min(1).max(200),
  // passed straight through as the Stripe Checkout mode — only these two are valid here
  mode: z.enum(['subscription', 'payment']),
  planId: z.string().max(200).optional(),
  userId: z.string().max(200).optional(),
  // Stripe line-item quantity; the UI always sends 1 — 100 is a generous ceiling
  quantity: z.number().int().min(1).max(100).default(1),
  // analytics-only fields PricingCard sends alongside the checkout body
  price: z.number().nonnegative().max(1_000_000).optional(),
  tokens: z.number().nonnegative().max(1_000_000_000_000).optional(),
});

export const CheckoutCustomCreditsSchema = z.object({
  // handler contract: $5–$10,000; fractional dollars are valid (UI parseFloat, Stripe gets
  // Math.round(amount*100) cents) — int() would 400 a currently-valid $7.50 purchase
  amount: z.number().min(5).max(10000),
  // UI computes Math.floor(dollars/0.04*1000) — max legit is 250M at $10,000; 1e9 = absurdity guard
  tokens: z.number().int().positive().max(1_000_000_000),
});

// schema-level SSRF floor: http(s) only, even though the fetcher also guards
const HttpUrl = z
  .string()
  .url()
  .max(2048)
  .refine((u) => /^https?:\/\//i.test(u), 'http(s) only');

export const FetchUrlSchema = z.object({
  urls: z.union([HttpUrl, z.array(HttpUrl).max(20)]).optional(),
  text: z.string().max(20000).optional(),
  maxUrls: z.number().int().min(1).max(10).default(3),
});

export const WebBrowseSchema = z.object({
  // schema-level SSRF floor: http(s) only, even though the handler also parses the URL
  url: z
    .string()
    .url()
    .max(2048)
    .refine((u) => /^https?:\/\//i.test(u), 'http(s) only'),
  query: z.string().max(4000).optional(),
  // the handler's switch treated unknown types as 'webpage' — the enum makes that contract explicit
  type: z.enum(['github', 'youtube', 'image', 'webpage']).optional(),
});

export const WebSearchSchema = z.object({
  // simple-query's auto-search forwards the full user query (its schema caps at 10000)
  query: z.string().min(1).max(10000),
  maxResults: z.number().int().min(1).max(20).default(5),
});

// ⚠ INTERNAL CONTRACT: simple-query/route.ts calls tot-consensus with the body
// { query, conversationHistory } where both already passed simple-query's own schema
// (query ≤10000; history is an UNBOUNDED array of {role, content} — no caps here, or a
// long conversation would 400 the internal call and silently degrade ToT to single-model).
export const TotConsensusSchema = z.object({
  query: z.string().min(1).max(10000),
  conversationHistory: z
    .array(z.object({ role: z.string(), content: z.string() }))
    .default([]),
});

// NOTE: flatten() emits schema messages only — the submitted key value is NEVER echoed
export const TestKeySchema = z.object({
  provider: z.enum(['anthropic', 'deepseek', 'xai', 'openrouter']),
  key: z.string().min(1).max(300),
});
