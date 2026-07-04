/**
 * E1 tranche 1 — boundary schemas for the 10 highest-risk routes.
 * Focused assertions: money bounds, SSRF floor, auth shapes, and the
 * tot-consensus INTERNAL caller contract (simple-query → tot-consensus).
 */
import { describe, it, expect } from 'vitest';
import { CheckoutCustomCreditsSchema } from '../../app/api/checkout/custom-credits/route';
import { CheckoutSchema } from '../../app/api/checkout/route';
import { FetchUrlSchema } from '../../app/api/fetch-url/route';
import { WebBrowseSchema } from '../../app/api/web-browse/route';
import { AuthEmailSchema } from '../../app/api/auth/email/route';
import { AuthWalletVerifySchema } from '../../app/api/auth/wallet/verify/route';
import { TotConsensusSchema } from '../../app/api/tot-consensus/route';
import { TestKeySchema } from '../../app/api/test-key/route';

describe('route schemas (E1 tranche 1)', () => {
  it('custom-credits rejects negative/zero/sub-minimum/absurd amounts, accepts valid ones', () => {
    expect(CheckoutCustomCreditsSchema.safeParse({ amount: -5, tokens: 1000 }).success).toBe(false);
    expect(CheckoutCustomCreditsSchema.safeParse({ amount: 0, tokens: 1000 }).success).toBe(false);
    expect(CheckoutCustomCreditsSchema.safeParse({ amount: 4.99, tokens: 1000 }).success).toBe(false);
    expect(CheckoutCustomCreditsSchema.safeParse({ amount: 1e9, tokens: 1000 }).success).toBe(false);
    expect(CheckoutCustomCreditsSchema.safeParse({ amount: 50, tokens: 1_250_000 }).success).toBe(true);
    // fractional dollars are valid today (UI parseFloat; handler rounds to cents) — int() would regress
    expect(CheckoutCustomCreditsSchema.safeParse({ amount: 7.5, tokens: 187_500 }).success).toBe(true);
  });

  it('checkout requires priceId and a real Stripe mode', () => {
    expect(CheckoutSchema.safeParse({ priceId: 'price_123', mode: 'payment' }).success).toBe(true);
    expect(CheckoutSchema.safeParse({ priceId: '', mode: 'payment' }).success).toBe(false);
    expect(CheckoutSchema.safeParse({ priceId: 'price_123', mode: 'steal' }).success).toBe(false);
  });

  it('fetch-url enforces the http(s)-only SSRF floor', () => {
    expect(FetchUrlSchema.safeParse({ urls: 'javascript:alert(1)' }).success).toBe(false);
    expect(FetchUrlSchema.safeParse({ urls: 'ftp://example.com/x' }).success).toBe(false);
    expect(FetchUrlSchema.safeParse({ urls: 'https://example.com/x' }).success).toBe(true);
    expect(FetchUrlSchema.safeParse({ urls: ['https://a.com', 'ftp://b.com'] }).success).toBe(false);
  });

  it('web-browse enforces the http(s)-only SSRF floor', () => {
    expect(WebBrowseSchema.safeParse({ url: 'javascript:alert(1)' }).success).toBe(false);
    expect(WebBrowseSchema.safeParse({ url: 'ftp://example.com/x' }).success).toBe(false);
    expect(WebBrowseSchema.safeParse({ url: 'https://github.com/a/b' }).success).toBe(true);
  });

  it('auth/email rejects malformed emails, accepts valid ones', () => {
    expect(AuthEmailSchema.safeParse({ email: 'not-an-email', action: 'send' }).success).toBe(false);
    expect(AuthEmailSchema.safeParse({ email: 'a@b.co', action: 'send' }).success).toBe(true);
    expect(AuthEmailSchema.safeParse({ email: 'a@b.co', action: 'destroy' }).success).toBe(false);
  });

  it('wallet verify requires 0x shapes', () => {
    const addr = '0x' + 'ab'.repeat(20);
    const sig = '0x' + 'cd'.repeat(65);
    expect(
      AuthWalletVerifySchema.safeParse({ address: addr, signature: sig, message: 'm' }).success
    ).toBe(true);
    expect(
      AuthWalletVerifySchema.safeParse({ address: 'bob', signature: sig, message: 'm' }).success
    ).toBe(false);
    expect(
      AuthWalletVerifySchema.safeParse({ address: addr, signature: 'not-hex', message: 'm' }).success
    ).toBe(false);
  });

  it('tot-consensus accepts exactly the internal caller shape (simple-query contract)', () => {
    const parsed = TotConsensusSchema.safeParse({ query: 'compare X and Y', conversationHistory: [] });
    expect(parsed.success).toBe(true);
    // long histories must pass — capping would silently degrade ToT to single-model
    const long = Array.from({ length: 120 }, (_, i) => ({ role: 'user', content: `m${i}` }));
    expect(TotConsensusSchema.safeParse({ query: 'q', conversationHistory: long }).success).toBe(true);
  });

  it('test-key restricts provider to the supported set', () => {
    expect(TestKeySchema.safeParse({ provider: 'anthropic', key: 'sk-ant-x' }).success).toBe(true);
    expect(TestKeySchema.safeParse({ provider: 'evilcorp', key: 'x' }).success).toBe(false);
  });
});
