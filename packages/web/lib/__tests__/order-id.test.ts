/**
 * Delimiter-safe order-id round-trip (regression: the '-'-positional scheme shattered on
 * UUID userIds — parts[3] became a UUID fragment → parseInt NaN → 0 tokens, userId truncated).
 * The whole point: a REAL hyphenated UUID must survive encode→decode intact, not as a fragment.
 */
import { describe, it, expect } from 'vitest';
import { encodeOrderId, decodeOrderId } from '../order-id';

const REAL_UUID = '3a942698-b8f2-4482-824a-ac082ba88036'; // 4 hyphens — the exact break case

describe('order-id v2 encode/decode', () => {
  it('round-trips a credits order — full UUID survives, not a fragment', () => {
    const id = encodeOrderId({ type: 'credits', userId: REAL_UUID, meta: '500', nonce: 'xYz789ab' });
    const decoded = decodeOrderId(id);
    expect(decoded).not.toBeNull();
    expect(decoded!.userId).toBe(REAL_UUID); // the regression assertion — exact, not sliced
    expect(decoded!.type).toBe('credits');
    expect(decoded!.meta).toBe('500');
    // downstream reads token amount as parseInt(meta)
    expect(parseInt(decoded!.meta)).toBe(500);
  });

  it('round-trips a subscription order — planId intact', () => {
    const id = encodeOrderId({
      type: 'subscription',
      userId: REAL_UUID,
      meta: 'pro',
      nonce: 'nano1234',
    });
    const decoded = decodeOrderId(id);
    expect(decoded!.type).toBe('subscription');
    expect(decoded!.userId).toBe(REAL_UUID);
    expect(decoded!.meta).toBe('pro');
  });

  it('encoded id contains no raw UUID hyphens to shatter on', () => {
    const id = encodeOrderId({ type: 'credits', userId: REAL_UUID, meta: '500', nonce: 'n-a-n-o' });
    // The userId segment is base64url — the UUID hyphens are gone from that field.
    expect(id).not.toContain(REAL_UUID);
    expect(id.startsWith('akhai.2.')).toBe(true);
  });

  it('legacy "-" id returns null (caller uses its own legacy parser — behavior unchanged)', () => {
    expect(decodeOrderId('akhai-subscription-abc-pro-x')).toBeNull();
    expect(decodeOrderId('akhai-credits-abc123-50000-xYz789')).toBeNull();
    expect(decodeOrderId('akhai-btc-credits-abc123def456')).toBeNull();
  });

  it('garbage id returns null safely, no throw', () => {
    expect(decodeOrderId('')).toBeNull();
    expect(decodeOrderId('random-nonsense')).toBeNull();
    expect(decodeOrderId('akhai.2.')).toBeNull(); // prefix only, too few parts
    expect(decodeOrderId('akhai.2.bogus.xxx.yyy.zzz')).toBeNull(); // invalid type
  });
});
