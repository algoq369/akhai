/**
 * Delimiter-safe payment order-id encoding.
 *
 * The old scheme `akhai-{type}-{userId}-{meta}-{nano}` split on '-', but userId is a
 * randomUUID containing hyphens (and nanoid's alphabet includes '-' too), so field
 * positions shattered: parts[3] became a UUID fragment → parseInt NaN → 0 tokens, and
 * userId was truncated. Every real crypto payment mis-credited.
 *
 * New scheme (v2): `akhai.2.{type}.{base64url(userId)}.{meta}.{nonce}` split on '.'.
 * '.' cannot appear in the type ('credits'/'subscription'), a base64url string
 * (alphabet A-Za-z0-9-_), the meta (digits or a plan slug), or a nanoid — so the
 * userId's hyphens can no longer break the field boundaries. Only userId is encoded
 * (it is the sole hyphen-bearing field); type/meta stay readable. ~80 chars, well
 * under any gateway order_id limit.
 *
 * Legacy '-' ids (already in flight) are NOT handled here — decodeOrderId returns null
 * for them and each webhook keeps its own existing legacy parser, so their handling is
 * unchanged.
 */

const PREFIX = 'akhai.2.';

const encodeSegment = (s: string): string => Buffer.from(s, 'utf8').toString('base64url');
const decodeSegment = (s: string): string => Buffer.from(s, 'base64url').toString('utf8');

export interface DecodedOrderId {
  type: 'credits' | 'subscription';
  userId: string;
  /** tokenAmount for credits, planId for subscription — as a string, parse downstream. */
  meta: string;
}

export function encodeOrderId(p: {
  type: 'credits' | 'subscription';
  userId: string;
  meta: string;
  nonce: string;
}): string {
  return `${PREFIX}${p.type}.${encodeSegment(p.userId)}.${p.meta}.${p.nonce}`;
}

/**
 * Decode a v2 order id. Returns null for anything that is not a well-formed v2 id
 * (including legacy '-' ids and garbage) — the caller falls back to its legacy parser.
 */
export function decodeOrderId(orderId: string): DecodedOrderId | null {
  if (!orderId.startsWith(PREFIX)) return null;
  const parts = orderId.slice(PREFIX.length).split('.');
  if (parts.length < 4) return null;
  const [type, encodedUserId, meta] = parts;
  if (type !== 'credits' && type !== 'subscription') return null;
  const userId = decodeSegment(encodedUserId);
  if (!userId) return null;
  return { type, userId, meta };
}
