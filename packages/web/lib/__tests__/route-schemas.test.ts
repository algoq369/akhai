/**
 * E1 tranche 1 — boundary schemas for the 10 highest-risk routes.
 * Focused assertions: money bounds, SSRF floor, auth shapes, and the
 * tot-consensus INTERNAL caller contract (simple-query → tot-consensus).
 */
import { describe, it, expect } from 'vitest';
import {
  AuthEmailSchema,
  AuthWalletVerifySchema,
  CheckoutCustomCreditsSchema,
  CheckoutSchema,
  FetchUrlSchema,
  GodViewAgentChatSchema,
  NatalChatSchema,
  SettingsSchema,
  SideCanalSchema,
  SideCanalSynopsisSchema,
  TestKeySchema,
  TotConsensusSchema,
  WebBrowseSchema,
} from '@/lib/route-schemas';

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

  // ─────────────────────────── tranche 2 ───────────────────────────

  it('natal-chat accepts a real chart shape and keeps passthrough aspect fields (PII route)', () => {
    // shape traced from lib/esoteric/natal-engine.ts NodePosition/Aspect
    const chart = {
      northNode: { sign: 'Aries', formattedDegree: '15°32′', house: 7, longitude: 15.5, signDegree: 15.5 },
      southNode: { sign: 'Libra', formattedDegree: '15°32′', house: 1, longitude: 195.5, signDegree: 15.5 },
      aspects: [{ planet: 'Sun', symbol: '☉', type: 'trine', angle: 120, orb: 2.1, exact: 120 }],
    };
    const parsed = NatalChatSchema.safeParse({ question: 'What does my north node mean?', chart });
    expect(parsed.success).toBe(true);
    // passthrough preserved: natal-synthesis forwards aspects verbatim into the prompt
    if (parsed.success) {
      expect(parsed.data.chart.aspects?.[0]).toMatchObject({ symbol: '☉', angle: 120, exact: 120 });
    }
    expect(NatalChatSchema.safeParse({ question: 'q', chart: { northNode: {} } }).success).toBe(false);
  });

  it('side-canal accepts a 20k-char response (never clip a legitimate long answer)', () => {
    const parsed = SideCanalSchema.safeParse({
      query: 'what is entropy',
      response: 'x'.repeat(20000),
      queryId: 'q_abc123',
    });
    expect(parsed.success).toBe(true);
    expect(SideCanalSchema.safeParse({ query: 'q', response: '', queryId: 'q1' }).success).toBe(false);
  });

  it('synopsis rejects 501 queryIds, accepts 500', () => {
    const ids = (n: number) => Array.from({ length: n }, (_, i) => `q${i}`);
    expect(SideCanalSynopsisSchema.safeParse({ topicId: 't1', queryIds: ids(500) }).success).toBe(true);
    expect(SideCanalSynopsisSchema.safeParse({ topicId: 't1', queryIds: ids(501) }).success).toBe(false);
  });

  it('settings rejects oversized payloads, accepts the real settings shape', () => {
    expect(
      SettingsSchema.safeParse({
        apiKeys: { anthropic: 'sk-ant-***masked' },
        consensus: { maxRounds: 3 },
        appearance: { compactView: true },
      }).success
    ).toBe(true);
    expect(SettingsSchema.safeParse({ apiKeys: { anthropic: 'x'.repeat(301) } }).success).toBe(false);
    expect(SettingsSchema.safeParse({ consensus: { maxRounds: 99 } }).success).toBe(false);
  });

  it('god-view agent-chat caps messages at 100', () => {
    const msgs = (n: number) => Array.from({ length: n }, () => ({ role: 'user', content: 'hi' }));
    expect(
      GodViewAgentChatSchema.safeParse({ agentId: 'skeptic', messages: msgs(100) }).success
    ).toBe(true);
    expect(
      GodViewAgentChatSchema.safeParse({ agentId: 'skeptic', messages: msgs(101) }).success
    ).toBe(false);
    expect(GodViewAgentChatSchema.safeParse({ agentId: 'skeptic', messages: [] }).success).toBe(false);
  });
});
