/**
 * Routing escalation regression (SB.2).
 *
 * The requiresTools regexes lacked word boundaries, so "api" matched inside
 * "capital" / "therapist" / "rapid" and "compute" matched inside "computer" —
 * pushing trivial factual queries to the heavy `react` (search) methodology
 * (react +0.85). These tests lock word-boundary behavior: trivial queries stay
 * false, genuine tool queries stay true.
 */
import { describe, it, expect } from 'vitest';
import { analyzeQuery } from '../intelligence-fusion-analysis';
import { classifyQueryIntent } from '../query-classifier';

describe('routing escalation / analyzeQuery.requiresTools (EDIT 1)', () => {
  it('is FALSE for trivial queries — "api" must not match inside a word', () => {
    expect(analyzeQuery('What is the capital of Iceland?').requiresTools).toBe(false);
    expect(analyzeQuery('I need to see a therapist').requiresTools).toBe(false);
    expect(analyzeQuery('That was a rapid response').requiresTools).toBe(false);
  });

  it('is TRUE for genuine tool queries', () => {
    expect(analyzeQuery('search the latest news').requiresTools).toBe(true);
    expect(analyzeQuery('lookup the stock price').requiresTools).toBe(true);
  });
});

describe('routing escalation / classifyQueryIntent.requiresTools (EDIT 2)', () => {
  it('is FALSE for trivial queries — "compute" must not match inside "computer"', () => {
    expect(classifyQueryIntent('What is the best computer for a student?').requiresTools).toBe(false);
    expect(classifyQueryIntent('What is the capital of Iceland?').requiresTools).toBe(false);
  });

  it('is TRUE for genuine tool queries', () => {
    expect(classifyQueryIntent('search the latest price').requiresTools).toBe(true);
  });
});
