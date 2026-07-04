/**
 * D5 (E5.3) — prompt-honesty locks. The runtime methodology prompts must never
 * instruct fabrication (react) or claim an algorithm the pipeline doesn't run (sc).
 * These assertions keep the two fixed prompts fixed, and pin the clean prompts'
 * format anchors so extraction/renderer contracts don't drift silently.
 */
import { describe, it, expect } from 'vitest';
import { getMethodologyPrompt } from '../query-pipeline';

describe('methodology prompts — honesty locks (D5)', () => {
  it('react (flag-off) never instructs simulated search observations', () => {
    const p = getMethodologyPrompt('react', '', false);
    expect(p).not.toContain('simulated');
    expect(p).not.toContain('[OBSERVATION');
    expect(p).toContain('Never fabricate');
    expect(p).toContain('[KNOWLEDGE');
  });

  it('sc matches its audited buffer/reason/validate structure', () => {
    const p = getMethodologyPrompt('sc', '', false);
    expect(p).not.toContain('Wang et al');
    expect(p).not.toContain('[PATH 1');
    expect(p).toContain('[BUFFER');
    expect(p).toContain('[ANSWER');
  });

  it('clean prompts keep their expected format anchors', () => {
    expect(getMethodologyPrompt('cod', '', false)).toContain('[DRAFT 1]');
    expect(getMethodologyPrompt('pas', '', false)).toContain('[UNDERSTAND]');
    expect(getMethodologyPrompt('tot', '', false)).toContain('[TECHNICAL]');
    expect(getMethodologyPrompt('direct', '', false)).toContain('direct, factual');
  });
});
