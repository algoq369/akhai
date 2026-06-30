/**
 * E1.1 — lexical-support scorer tests.
 *
 * Deterministic, dependency-free. Proves the 'heuristic' grounding tier produces a
 * real word-overlap score and flags sentences the context does not support.
 */
import { describe, it, expect } from 'vitest';
import { scoreLexicalSupport } from '../grounding-heuristic';

describe('scoreLexicalSupport', () => {
  it('scores ~fully supported when every content word appears in context', () => {
    const context = ['Reykjavik is the capital of Iceland. Iceland is a Nordic island country.'];
    const { score, spans } = scoreLexicalSupport('Reykjavik is the capital of Iceland.', context);
    expect(score).toBeGreaterThanOrEqual(0.9);
    expect(spans).toHaveLength(0);
  });

  it('scores low and flags the sentence when content words are absent from context', () => {
    const context = ['Reykjavik is the capital of Iceland.'];
    const answer = 'Bananas grow rapidly in tropical greenhouses.';
    const { score, spans } = scoreLexicalSupport(answer, context);
    expect(score).toBeLessThanOrEqual(0.2);
    expect(spans.length).toBeGreaterThan(0);
    expect(spans.some((s) => s.text.includes('Bananas'))).toBe(true);
  });

  it('scores in the middle for a mixed answer and flags only the fabricated sentence', () => {
    const context = ['Reykjavik is the capital of Iceland.'];
    const answer = 'Reykjavik is the capital of Iceland. Bananas grow in tropical greenhouses.';
    const { score, spans } = scoreLexicalSupport(answer, context);
    expect(score).toBeGreaterThan(0.2);
    expect(score).toBeLessThan(0.8);
    expect(spans).toHaveLength(1);
    expect(spans[0].text).toContain('Bananas');
    // the offsets point at the fabricated sentence within the answer
    expect(answer.slice(spans[0].start, spans[0].end)).toBe(spans[0].text);
  });

  it('returns score 0 for empty context (defensive)', () => {
    const { score } = scoreLexicalSupport('Anything stated here at all.', []);
    expect(score).toBe(0);
  });
});
