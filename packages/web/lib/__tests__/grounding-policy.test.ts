/**
 * Selective grounding policy (gap-D / WEBNA B5).
 *
 * Grounding applies only to fact-reporting query types. Generative/subjective
 * types (creative, planning) are EXPECTED to diverge from sources, so a grounding
 * score there is a misleading false alarm — shouldGround returns false for them.
 */
import { describe, it, expect } from 'vitest';
import { shouldGround } from '../grounding-policy';
import type { QueryType } from '../intelligence-fusion-types';

const ALL_TYPES: QueryType[] = [
  'factual',
  'comparative',
  'procedural',
  'research',
  'creative',
  'analytical',
  'troubleshooting',
  'planning',
];

describe('grounding policy / shouldGround', () => {
  it('grounds all fact-reporting types', () => {
    for (const t of ['factual', 'comparative', 'procedural', 'research', 'analytical', 'troubleshooting'] as QueryType[]) {
      expect(shouldGround(t)).toBe(true);
    }
  });

  it('skips generative/subjective types (creative, planning)', () => {
    expect(shouldGround('creative')).toBe(false);
    expect(shouldGround('planning')).toBe(false);
  });

  it('is exhaustive: returns a boolean for every QueryType (no undefined)', () => {
    for (const t of ALL_TYPES) {
      expect(typeof shouldGround(t)).toBe('boolean');
    }
  });
});
