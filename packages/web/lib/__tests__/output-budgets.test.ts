/**
 * Output budgets (WEBNA B2).
 *
 * Per-methodology output ceilings are the single source of truth for max_tokens
 * on non-thinking calls. Cheap methodologies get a tighter ceiling than deep
 * reasoning; unknown methodologies fall back to the 4096 safety default.
 */
import { describe, it, expect } from 'vitest';
import { OUTPUT_BUDGETS, maxTokensFor } from '../output-budgets';

describe('output budgets / maxTokensFor', () => {
  it('gives direct a tight 1500-token ceiling', () => {
    expect(maxTokensFor('direct')).toBe(1500);
  });

  it('keeps tot at the 4096 max', () => {
    expect(maxTokensFor('tot')).toBe(4096);
  });

  it('falls back to 4096 for an unknown methodology', () => {
    expect(maxTokensFor('unknown')).toBe(4096);
  });

  it('invariant: cheap methodology (direct) has a tighter ceiling than deep reasoning (tot)', () => {
    expect(maxTokensFor('direct')).toBeLessThan(maxTokensFor('tot'));
  });

  it('defines a budget for every one of the 7 methodologies (no undefined lookups)', () => {
    const methodologies = ['direct', 'cod', 'sc', 'react', 'pas', 'tot', 'auto'];
    for (const m of methodologies) {
      expect(OUTPUT_BUDGETS[m]).toBeTypeOf('number');
      expect(OUTPUT_BUDGETS[m]).toBeGreaterThan(0);
    }
  });
});
