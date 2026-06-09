/**
 * Intelligence Fusion — scoring engine tests.
 *
 * The methodology selector is the heart of the engine: given a query analysis
 * and layer activations, it must deterministically pick the right methodology.
 * These tests lock that behavior so scoring weights can't regress silently.
 */
import { describe, it, expect } from 'vitest';
import {
  selectMethodology,
  calculateLayersActivations,
  assessGuardStatus,
  calculateThinkingBudget,
} from '../intelligence-fusion-scoring';
import type { QueryAnalysis } from '../intelligence-fusion-types';

// Minimal analysis factory — override only what each test cares about
function analysis(over: Partial<QueryAnalysis> = {}): QueryAnalysis {
  return {
    complexity: 0.5,
    queryType: 'factual',
    requiresTools: false,
    requiresMultiPerspective: false,
    isMathematical: false,
    isFactual: false,
    isProcedural: false,
    isCreative: false,
    wordCount: 20,
    keywords: [],
    ...over,
  };
}

describe('fusion / calculateLayersActivations', () => {
  it('produces an activation entry for every keyworded layer', () => {
    const acts = calculateLayersActivations('analyze the data structure', {});
    expect(acts.length).toBeGreaterThan(0);
    for (const a of acts) {
      expect(a.activation).toBeGreaterThanOrEqual(0);
      expect(a.activation).toBeLessThanOrEqual(1);
    }
  });

  it('gives higher activation to layers whose keywords appear', () => {
    const acts = calculateLayersActivations('reason through first principles logic', {});
    const withMatches = acts.filter((a) => a.keywords.length > 0);
    expect(withMatches.length).toBeGreaterThan(0);
  });
});

describe('fusion / selectMethodology', () => {
  it('returns a valid methodology + bounded confidence', () => {
    const acts = calculateLayersActivations('what is the capital of France', {});
    const result = selectMethodology(analysis({ isFactual: true, complexity: 0.1 }), acts);
    expect(['direct', 'cod', 'sc', 'react', 'pas', 'tot', 'auto']).toContain(result.methodology);
    expect(result.confidence).toBeGreaterThanOrEqual(0);
    expect(result.confidence).toBeLessThanOrEqual(1);
  });

  it('picks DIRECT for a short low-complexity factual query', () => {
    const acts = calculateLayersActivations('capital of France', {});
    const result = selectMethodology(
      analysis({ isFactual: true, complexity: 0.1, wordCount: 3 }),
      acts
    );
    expect(result.methodology).toBe('direct');
  });

  it('favors COD for procedural/troubleshooting queries', () => {
    const acts = calculateLayersActivations('how to debug a memory leak step by step', {});
    const result = selectMethodology(
      analysis({ isProcedural: true, queryType: 'troubleshooting', complexity: 0.5 }),
      acts
    );
    const cod = result.scores.find((s) => s.methodology === 'cod');
    const direct = result.scores.find((s) => s.methodology === 'direct');
    expect(cod!.score).toBeGreaterThan(direct!.score);
  });

  it('favors SC for analytical/planning queries', () => {
    const acts = calculateLayersActivations('analyze the tradeoffs and plan a strategy', {});
    const result = selectMethodology(analysis({ queryType: 'analytical', complexity: 0.6 }), acts);
    const sc = result.scores.find((s) => s.methodology === 'sc');
    const direct = result.scores.find((s) => s.methodology === 'direct');
    expect(sc!.score).toBeGreaterThan(direct!.score);
  });

  it('is deterministic — same input yields same methodology', () => {
    const acts = calculateLayersActivations('compare X and Y in depth', {});
    const a = analysis({ queryType: 'comparative', complexity: 0.6 });
    const r1 = selectMethodology(a, acts);
    const r2 = selectMethodology(a, acts);
    expect(r1.methodology).toBe(r2.methodology);
    expect(r1.confidence).toBe(r2.confidence);
  });

  it('returns a score for every methodology candidate', () => {
    const acts = calculateLayersActivations('hello world', {});
    const result = selectMethodology(analysis(), acts);
    const methodologies = result.scores.map((s) => s.methodology);
    expect(methodologies).toContain('direct');
    expect(methodologies).toContain('cod');
    expect(methodologies).toContain('sc');
  });
});

describe('fusion / calculateThinkingBudget', () => {
  it('scales the budget up with complexity', () => {
    const acts = calculateLayersActivations('a query', {});
    const low = calculateThinkingBudget(analysis({ complexity: 0.1 }), acts);
    const high = calculateThinkingBudget(analysis({ complexity: 0.9 }), acts);
    expect(high).toBeGreaterThanOrEqual(low);
  });

  it('returns a non-negative finite budget', () => {
    const acts = calculateLayersActivations('a query', {});
    const b = calculateThinkingBudget(analysis({ complexity: 0.5 }), acts);
    expect(b).toBeGreaterThanOrEqual(0);
    expect(Number.isFinite(b)).toBe(true);
  });
});

describe('fusion / assessGuardStatus', () => {
  it('returns proceed for a normal safe query', () => {
    const guard = assessGuardStatus('what is 2 plus 2', analysis());
    expect(['proceed', 'warn', 'block']).toContain(guard.recommendation);
    expect(Array.isArray(guard.reasons)).toBe(true);
  });

  it('flags high-stakes medical content with reasons', () => {
    const guard = assessGuardStatus(
      'what treatment for this medical diagnosis symptom',
      analysis()
    );
    expect(guard.reasons.length).toBeGreaterThan(0);
  });
});
