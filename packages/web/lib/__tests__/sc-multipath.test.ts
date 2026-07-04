import { describe, it, expect } from 'vitest';
import {
  SC_SAMPLES,
  SC_SAMPLE_TEMPERATURE,
  extractConsensus,
  pairwiseAgreement,
  pickCentral,
  runScMultipath,
  type ScSample,
} from '../sc-multipath';

const mkSample = (fullText: string): ScSample => ({
  fullText,
  consensus: extractConsensus(fullText),
  usage: { inputTokens: 100, outputTokens: 50, totalTokens: 150 },
  cost: 0.01,
});

describe('sc-multipath / extractConsensus', () => {
  it('extracts the bracketed consensus answer', () => {
    expect(extractConsensus('[PATH 1] reasoning here [CONSENSUS: Paris is the capital]')).toBe(
      'Paris is the capital'
    );
  });

  it('is case-insensitive on the marker', () => {
    expect(extractConsensus('paths... [consensus: forty two]')).toBe('forty two');
  });

  it('uses the LAST marker occurrence', () => {
    expect(extractConsensus('[CONSENSUS: first draft] more paths [CONSENSUS: second answer]')).toBe(
      'second answer'
    );
  });

  it('strips the leading colon and trailing bracket', () => {
    const out = extractConsensus('[CONSENSUS: answer]');
    expect(out).toBe('answer');
    expect(out).not.toContain('[');
    expect(out).not.toContain(']');
    expect(out).not.toContain(':');
  });

  it('falls back to the tail when the marker is missing — never empty for non-empty input', () => {
    const text = 'alpha bravo charlie delta echo foxtrot golf hotel india juliet kilo lima';
    const out = extractConsensus(text);
    expect(out.length).toBeGreaterThan(0);
    expect(text).toContain(out);
  });

  it('steps back past a truncated trailing marker to the last COMPLETE consensus', () => {
    expect(
      extractConsensus('[CONSENSUS: the real full answer here] some trailing reasoning [CONSENSUS:')
    ).toBe('the real full answer here');
  });

  it('cuts at the closing bracket even with trailing prose after it', () => {
    expect(extractConsensus('[CONSENSUS: Paris] Note: verified twice.')).toBe('Paris');
  });

  it('is not misaligned by case-folding length changes before the marker (İ)', () => {
    expect(extractConsensus('İİİİİİİİİİ [CONSENSUS: answer]')).toBe('answer');
  });

  it('extracts the [ANSWER] marker (current SC prompt format)', () => {
    expect(
      extractConsensus('[BUFFER] facts [REASONING] chain [VALIDATION] ok [ANSWER: Paris]')
    ).toBe('Paris');
  });

  it('handles label-style [ANSWER] with the text after the bracket', () => {
    expect(extractConsensus('[VALIDATION] checks out\n[ANSWER]\nThe ball costs $0.05.')).toBe(
      'The ball costs $0.05.'
    );
  });

  it('is case-insensitive on the ANSWER marker', () => {
    expect(extractConsensus('reasoning... [answer: forty two]')).toBe('forty two');
  });

  it('steps back past a truncated trailing [ANSWER marker', () => {
    expect(extractConsensus('[ANSWER: the real one] trailing reasoning [ANSWER:')).toBe(
      'the real one'
    );
  });

  it('prefers ANSWER over legacy CONSENSUS when both markers are present', () => {
    expect(extractConsensus('[CONSENSUS: old format] more text [ANSWER: new format]')).toBe(
      'new format'
    );
  });
});

describe('sc-multipath / pairwiseAgreement', () => {
  it('is 1 for three identical answers', () => {
    const a = 'the capital of france is paris';
    expect(pairwiseAgreement([a, a, a])).toBe(1);
  });

  it('is 0 for fully-disjoint word sets', () => {
    expect(
      pairwiseAgreement(['alpha bravo charlie', 'delta echo foxtrot', 'golf hotel india'])
    ).toBe(0);
  });

  it('is strictly between 0 and 1 for two similar + one outlier', () => {
    const score = pairwiseAgreement([
      'paris capital france europe',
      'paris capital france europe',
      'bananas monkeys jungle canopy',
    ]);
    expect(score).not.toBeNull();
    expect(score!).toBeGreaterThan(0);
    expect(score!).toBeLessThan(1);
  });

  it('is null for fewer than 2 answers — never fabricated', () => {
    expect(pairwiseAgreement(['only one answer'])).toBeNull();
    expect(pairwiseAgreement([])).toBeNull();
  });

  it('scores identical short/numeric answers as 1 despite empty content-word sets', () => {
    expect(pairwiseAgreement(['42', '42', '42'])).toBe(1);
    expect(pairwiseAgreement(['No', 'no', 'No'])).toBe(1);
    expect(pairwiseAgreement(['42', '43'])).toBe(0);
  });

  it('is deterministic — same input, same output', () => {
    const answers = ['paris capital france', 'paris capital europe', 'lyon rivers france'];
    expect(pairwiseAgreement(answers)).toBe(pairwiseAgreement(answers));
  });
});

describe('sc-multipath / pickCentral', () => {
  it('picks a similar answer over the outlier', () => {
    const idx = pickCentral([
      'paris capital france europe',
      'paris capital france continent',
      'bananas monkeys jungle canopy',
    ]);
    expect(idx).not.toBe(2);
  });

  it('breaks ties toward the lowest index (identical answers → 0)', () => {
    const a = 'the answer is forty two';
    expect(pickCentral([a, a, a])).toBe(0);
  });

  it('returns 0 for a single answer', () => {
    expect(pickCentral(['solo'])).toBe(0);
  });
});

describe('sc-multipath / runScMultipath', () => {
  it('3 resolve → central full text served, real consistency, summed usage/cost, sample 1 sequenced first', async () => {
    const log: string[] = [];
    const progress: Array<[number, number]> = [];
    let calls = 0;
    const sampler = async (temperature: number) => {
      expect(temperature).toBe(SC_SAMPLE_TEMPERATURE);
      const i = ++calls;
      log.push(`start-${i}`);
      await Promise.resolve();
      log.push(`end-${i}`);
      return mkSample(
        i === 3
          ? `sample ${i} text [CONSENSUS: entirely divergent wording here]`
          : `sample ${i} text [CONSENSUS: shared common answer words]`
      );
    };
    const mp = await runScMultipath(sampler, (i, n) => progress.push([i, n]));

    expect(mp.samplesUsed).toBe(3);
    expect(typeof mp.consistency).toBe('number');
    expect(mp.consistency!).toBeGreaterThanOrEqual(0);
    expect(mp.consistency!).toBeLessThanOrEqual(1);
    // central = one of the two agreeing samples; ties → lowest index → sample 1
    expect(mp.content).toBe('sample 1 text [CONSENSUS: shared common answer words]');
    expect(mp.usage).toEqual({ inputTokens: 300, outputTokens: 150, totalTokens: 450 });
    expect(mp.cost).toBeCloseTo(0.03, 10);
    // sample 1 completes BEFORE samples 2 and 3 start (prompt-cache write → reads)
    expect(log.indexOf('end-1')).toBeLessThan(log.indexOf('start-2'));
    expect(log.indexOf('end-1')).toBeLessThan(log.indexOf('start-3'));
    expect(progress).toEqual([
      [1, SC_SAMPLES],
      [2, SC_SAMPLES],
      [3, SC_SAMPLES],
    ]);
  });

  it('1 of 3 rejects → 2 survivors, consistency still measured', async () => {
    let calls = 0;
    const sampler = async () => {
      const i = ++calls;
      if (i === 2) throw new Error('boom');
      return mkSample(`sample ${i} [CONSENSUS: shared answer words]`);
    };
    const mp = await runScMultipath(sampler);
    expect(mp.samplesUsed).toBe(2);
    expect(mp.consistency).not.toBeNull();
    expect(mp.usage.totalTokens).toBe(300);
  });

  it('2 of 3 reject → single survivor, consistency null (never fabricated)', async () => {
    let calls = 0;
    const sampler = async () => {
      const i = ++calls;
      if (i !== 1) throw new Error('boom');
      return mkSample('sample 1 [CONSENSUS: the lone answer]');
    };
    const mp = await runScMultipath(sampler);
    expect(mp.samplesUsed).toBe(1);
    expect(mp.consistency).toBeNull();
    expect(mp.content).toBe('sample 1 [CONSENSUS: the lone answer]');
  });

  it('all reject → throws SC_MULTIPATH_ALL_FAILED carrying the root cause', async () => {
    const sampler = async (): Promise<ScSample> => {
      throw new Error('insufficient credits');
    };
    await expect(runScMultipath(sampler)).rejects.toThrow(
      'SC_MULTIPATH_ALL_FAILED: insufficient credits'
    );
  });
});
