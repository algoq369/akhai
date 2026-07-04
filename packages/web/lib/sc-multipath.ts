import 'server-only';

/**
 * SC multipath (D3a) — genuine N-sample self-consistency, feature-gated by SC_MULTIPATH=1.
 *
 * Runs N independent samples of the existing SC prompt at higher temperature, extracts each
 * sample's [CONSENSUS] answer, measures REAL cross-sample agreement (content-word Jaccard),
 * and serves the most central sample's FULL text. Consistency is measured cross-sample
 * AGREEMENT, not correctness — and is null (never fabricated) when fewer than 2 paths survive.
 *
 * Prompt-cache synergy (gap A): sample 1 runs ALONE first (writes the shared stable-prefix
 * cache), then the remaining samples run in PARALLEL as cache reads.
 */

export const SC_SAMPLES = 3;
// Diversity across samples. NOTE: callAnthropic does not pass temperature through, so Anthropic
// samples run at the API default (1.0) — this knob currently applies to non-Anthropic providers.
export const SC_SAMPLE_TEMPERATURE = 0.9;

const STOP = new Set([
  'the',
  'and',
  'for',
  'are',
  'was',
  'were',
  'not',
  'with',
  'that',
  'this',
  'from',
  'which',
  'their',
  'has',
  'have',
  'but',
  'you',
  'all',
  'can',
  'will',
  'its',
]);

/** Content-word set: lowercase alphanumeric tokens, len>=3, minus stopwords. */
function contentWords(text: string): Set<string> {
  return new Set(
    (text.toLowerCase().match(/[a-z0-9]+/g) || []).filter((w) => w.length > 2 && !STOP.has(w))
  );
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 0;
  let inter = 0;
  for (const w of a) if (b.has(w)) inter++;
  return inter / (a.size + b.size - inter);
}

/**
 * Per-sample "final answer" for agreement purposes only — the SERVED content is always a
 * sample's FULL text. Extracts the final ANSWER section (legacy CONSENSUS supported):
 * anchored on the LAST '[ANSWER' marker with non-empty content — a trailing marker
 * truncated by the token budget steps back to the previous complete one — then the LAST
 * '[CONSENSUS' (old prompt format), then the final 30% tail (never empty for non-blank input).
 */
export function extractConsensus(text: string): string {
  // matchAll on the ORIGINAL string — indexing a lowercased copy misaligns when
  // toLowerCase changes length (e.g. U+0130 'İ' → 'i' + combining dot).
  for (const marker of ['[answer', '[consensus'] as const) {
    const re = new RegExp('\\' + marker, 'gi');
    const markers = [...text.matchAll(re)];
    for (let i = markers.length - 1; i >= 0; i--) {
      let out = text.slice(markers[i].index + marker.length);
      out = out.replace(/^[\s:\]]+/, '');
      const close = out.indexOf(']');
      if (close !== -1) out = out.slice(0, close);
      out = out.trim();
      if (out.length > 0) return out;
    }
  }
  const tail = text.slice(Math.floor(text.length * 0.7)).trim();
  return tail.length > 0 ? tail : text.trim();
}

const normalizeAnswer = (a: string): string => a.toLowerCase().replace(/\s+/g, ' ').trim();

/**
 * Similarity for one answer pair. Short/numeric answers ('42', 'No') can have EMPTY
 * content-word sets — fall back to normalized-string equality there so identical short
 * answers score 1, not a fabricated 0.
 */
function pairScore(setA: Set<string>, setB: Set<string>, normA: string, normB: string): number {
  if (setA.size === 0 && setB.size === 0) return normA === normB ? 1 : 0;
  return jaccard(setA, setB);
}

/**
 * Mean pairwise similarity over content-word sets, in [0,1]. Fewer than 2 answers → null
 * (consistency unavailable — never fabricate).
 */
export function pairwiseAgreement(answers: string[]): number | null {
  if (answers.length < 2) return null;
  const sets = answers.map(contentWords);
  const norms = answers.map(normalizeAnswer);
  let sum = 0;
  let pairs = 0;
  for (let i = 0; i < sets.length; i++) {
    for (let j = i + 1; j < sets.length; j++) {
      sum += pairScore(sets[i], sets[j], norms[i], norms[j]);
      pairs++;
    }
  }
  return sum / pairs;
}

/** Index of the answer with the highest mean similarity to the others (ties → lowest index). */
export function pickCentral(answers: string[]): number {
  if (answers.length <= 1) return 0;
  const sets = answers.map(contentWords);
  const norms = answers.map(normalizeAnswer);
  let best = 0;
  let bestScore = -1;
  for (let i = 0; i < sets.length; i++) {
    let sum = 0;
    for (let j = 0; j < sets.length; j++) {
      if (j !== i) sum += pairScore(sets[i], sets[j], norms[i], norms[j]);
    }
    const mean = sum / (sets.length - 1);
    if (mean > bestScore) {
      bestScore = mean;
      best = i;
    }
  }
  return best;
}

export interface ScSample {
  fullText: string;
  consensus: string;
  usage: { inputTokens: number; outputTokens: number; totalTokens: number };
  cost: number;
}

/**
 * Orchestrate the N samples. The sampler is injectable so tests run without network.
 * Sample 1 is awaited ALONE (prompt-cache write); the rest run in parallel (cache reads).
 * Partial failures degrade honestly: 1 survivor → consistency null; 0 survivors → throw
 * SC_MULTIPATH_ALL_FAILED so the route falls to its existing retry/fallback path.
 */
export async function runScMultipath(
  sample: (temperature: number) => Promise<ScSample>,
  onProgress?: (i: number, n: number) => void
): Promise<{
  content: string;
  consistency: number | null;
  samplesUsed: number;
  usage: { inputTokens: number; outputTokens: number; totalTokens: number };
  cost: number;
}> {
  onProgress?.(1, SC_SAMPLES);
  const settled: PromiseSettledResult<ScSample>[] = [];
  settled.push(...(await Promise.allSettled([sample(SC_SAMPLE_TEMPERATURE)])));
  const rest: Promise<ScSample>[] = [];
  for (let i = 2; i <= SC_SAMPLES; i++) {
    onProgress?.(i, SC_SAMPLES);
    rest.push(sample(SC_SAMPLE_TEMPERATURE));
  }
  settled.push(...(await Promise.allSettled(rest)));
  const ok = settled
    .filter((s): s is PromiseFulfilledResult<ScSample> => s.status === 'fulfilled')
    .map((s) => s.value);
  if (ok.length === 0) {
    // Carry the root cause so the route's error classification (credit/billing) and logs
    // still see the real provider failure, not just the wrapper.
    const rejected = settled.filter((s): s is PromiseRejectedResult => s.status === 'rejected');
    const last = rejected[rejected.length - 1]?.reason;
    const cause = last instanceof Error ? last.message : String(last ?? 'unknown');
    throw new Error(`SC_MULTIPATH_ALL_FAILED: ${cause}`);
  }
  const usage = ok.reduce(
    (acc, s) => ({
      inputTokens: acc.inputTokens + s.usage.inputTokens,
      outputTokens: acc.outputTokens + s.usage.outputTokens,
      totalTokens: acc.totalTokens + s.usage.totalTokens,
    }),
    { inputTokens: 0, outputTokens: 0, totalTokens: 0 }
  );
  const cost = ok.reduce((acc, s) => acc + s.cost, 0);
  if (ok.length === 1) {
    return { content: ok[0].fullText, consistency: null, samplesUsed: 1, usage, cost };
  }
  const answers = ok.map((s) => s.consensus);
  const central = pickCentral(answers);
  return {
    content: ok[central].fullText,
    consistency: pairwiseAgreement(answers),
    samplesUsed: ok.length,
    usage,
    cost,
  };
}
