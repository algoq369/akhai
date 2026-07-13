/**
 * M2 — Local embedding-based methodology router.
 *
 * Replaces the keyword/heuristic selector (55% on the audit's 20-query eval) with
 * on-device semantic routing: the query is embedded with a local MiniLM model
 * (@xenova/transformers, no API, $0/query) and matched against hand-written
 * exemplar queries per methodology by cosine similarity.
 *
 * Selection order (selectMethodologyHybrid):
 *   1. Deterministic overrides — explicit search/look-up requests, spaced arithmetic
 *      expressions. Deliberately narrow, high precision — ambiguous queries go to
 *      the embeddings. Crypto live-price queries are NOT overridden here — the route
 *      intercepts them via checkCryptoQuery before any LLM call, which is the real
 *      deterministic crypto rule (an override here would claim "real-time data" for
 *      queries the live path declines, e.g. price predictions).
 *   2. Embedding router — blend of centroid + nearest-exemplar cosine similarity.
 *   3. Keyword fallback — the existing selectMethodology scorer, only when the
 *      model is unavailable (cold start, download failure, EMBED_ROUTER=0).
 *      Routing never hard-fails.
 *
 * The model (~23MB, quantized all-MiniLM-L6-v2) is downloaded on first use and
 * cached under .cache/transformers (gitignored via the root .gitignore `.cache/`).
 */

import path from 'node:path';
import { log } from './logger';
import { selectMethodology } from './intelligence-fusion-scoring';
import type {
  CoreMethodology,
  QueryAnalysis,
  LayersActivation,
  MethodologyScore,
} from './intelligence-fusion-types';

type RoutableMethodology = Exclude<CoreMethodology, 'auto'>;

export type EmbeddingStrategy = 'centroid' | 'max' | 'blend';

/**
 * Production strategy — chosen by scripts/selector-eval.mjs on the 35-query eval:
 * blend (0.5·centroid + 0.5·max) 35/35 vs centroid 32/35 vs max 32/35. Centroid is
 * robust to single-exemplar lexical traps, max preserves nearest-example precision;
 * averaging the two beat both. Caveat: exemplars were tuned against that eval, so
 * 35/35 is in-sample — leave-one-out measures ~31/35 (~89%), still far above the
 * old keyword selector's 17/35 (49%) on the same queries.
 */
export const DEFAULT_STRATEGY: EmbeddingStrategy = 'blend';

const MODEL_ID = 'Xenova/all-MiniLM-L6-v2';
const MODEL_WAIT_MS = 5000; // per-query cap on waiting for the model; fallback keeps routing alive

// ============================================================
// EXEMPLARS — hand-written queries that typify each methodology
// (derived from the audit's correct answers + methodology descriptions)
// ============================================================

const EXEMPLARS: Record<RoutableMethodology, string[]> = {
  // Simple factual or short creative asks — one-shot answer, no scaffolding.
  // Covers three archetypes (plain facts, short creative, short ambiguous), so it
  // carries a few more exemplars than the other methodologies.
  direct: [
    'Who wrote One Hundred Years of Solitude?',
    'What is the boiling point of water at sea level?',
    'What is the tallest mountain in the world?',
    'When did the Titanic sink?',
    'What does NASA stand for?',
    'Define photosynthesis in one sentence.',
    'Name three famous Renaissance painters.',
    'Write a short poem about the sea.',
    'Make up a short story about a talking cat for kids.',
    'Brainstorm fun names for my new puppy.',
    'Any thoughts?',
    'Is it any good?',
    'Worth a try?',
  ],
  // How-to / step-by-step / process explanation
  cod: [
    'How do I install Docker on Ubuntu?',
    'Walk me through setting up a home wifi router step by step.',
    'Explain how a computer boots up, step by step.',
    'Guide me through changing a flat bicycle tire.',
    'How do I fix a merge conflict in git?',
    'Show me step by step how to brew pour-over coffee.',
    'Explain step by step how a bill becomes a law.',
    'What are the steps to publish an npm package?',
  ],
  // Multi-constraint tracking — every stated requirement must be honored
  sc: [
    "Given a $2,000 budget, a 3-week timeline, and no coding experience, what's the best way to launch an online store?",
    'Assuming I can only train three days a week and have a bad knee, how should I prepare for a 10k run?',
    'I need a laptop under $900 with 16GB of RAM, all-day battery life, and Linux support — what fits all of these requirements?',
    'Given that our team has two engineers, a fixed deadline, and a legacy PHP codebase, how should we plan the migration?',
    'Plan a week of meals with these constraints: vegetarian, under 2,000 calories a day, no nuts, and high protein.',
    'Considering GDPR compliance, EU data residency, and a budget under 500 euros a month, which hosting setup satisfies every requirement?',
    'My flight leaves at 6 am, the airport is 45 minutes away, and I still need to pack — plan my evening so nothing is missed.',
  ],
  // Needs current / external information
  react: [
    "What's the latest news about artificial intelligence regulation?",
    'What is the current price of gold?',
    'Who won the football match yesterday?',
    "What's the weather forecast for tomorrow in Chicago?",
    'What are the newest features in the latest iPhone release?',
    'What is the current state of the electric vehicle market this year?',
    'Look up recent developments in fusion energy.',
    'What happened in the news today?',
  ],
  // Math / calculation / quantitative planning
  pas: [
    'What is 23% of 1850?',
    'Calculate the simple interest on $5,000 at 4% per year over 3 years.',
    'If a train travels 300 km in 2.5 hours, what is its average speed?',
    'Compute the monthly payment on a $30,000 car loan at 7% APR over 5 years.',
    'Solve for x: 3x + 7 = 22.',
    'A recipe serves 4 people using 250 grams of flour — how much flour do I need for 10 people?',
    'How many tables of 8 do I need to seat 127 wedding guests, and how many seats are left over?',
    'Convert 98.6 degrees Fahrenheit to Celsius.',
  ],
  // Deep comparison / tradeoffs / multi-perspective weighing
  tot: [
    'Compare microservices and monolithic architectures — which should a small startup choose and why?',
    'What are the pros and cons of nuclear power versus renewables from economic and environmental perspectives?',
    'Should I rent or buy a house? Weigh the tradeoffs from multiple angles.',
    'Evaluate the arguments for and against a universal basic income.',
    'Which is better for a beginner, learning Python or JavaScript first? Consider career paths and difficulty.',
    'Analyze the impact of social media on democracy from technical, social, and political perspectives.',
    'Optimistic versus zero-knowledge rollups: compare security, cost, and developer experience.',
    'Which database is the better fit for an early-stage product — a relational or a NoSQL one? Weigh the tradeoffs.',
    'Is it more ethical to prioritize space exploration or fixing problems on Earth? Consider both sides.',
  ],
};

/** Human-readable routing reasons — shown on the honest confidence surface. */
const ROUTE_REASON: Record<RoutableMethodology, string> = {
  direct: 'reads like a simple factual or creative ask — direct answer',
  cod: 'closest to how-to / explanation patterns — drafted and refined',
  sc: 'multiple constraints to track — buffered reasoning',
  react: 'needs current or external information — knowledge-recall with uncertainty flags',
  pas: 'math or calculation problem — plan-and-solve',
  tot: 'deep comparison or multi-perspective question — tree of thoughts',
};

// ============================================================
// DETERMINISTIC OVERRIDES — precise rules checked before embeddings
// ============================================================

// Explicit search/look-up REQUESTS only — verb + object ("search for X", "look up X",
// "google it") or a news ask. Bare nouns must not fire: "binary search", "lookup table",
// "Google Cloud" are topics, not requests (review finding: noun usage forced react at 0.9).
const SEARCH_VERB_RE =
  /\b(search|look)\s+(for|up)\b|\bsearch\s+the\s+web\b|\bgoogle\s+(it|this|that|for)\b|\b(latest|breaking)\s+news\b/i;
// Spaced arithmetic expression only. '+ * ^' with optional spaces is genuinely arithmetic,
// but '/' and '-' require surrounding spaces: dates/ratios/ranges ("9/11", "24/7", "8/10",
// "2020-2024") are far more common in natural queries than unspaced division/subtraction
// (review finding: '9/11' was forced to pas at 0.9 as an "arithmetic expression").
const ARITHMETIC_RE = /\d+(\.\d+)?\s*[+*^]\s*\d+|\d+(\.\d+)?\s+[/-]\s+\d+(\.\d+)?/;

function deterministicOverride(
  query: string
): { methodology: RoutableMethodology; reason: string; confidence: number } | null {
  if (SEARCH_VERB_RE.test(query)) {
    return {
      methodology: 'react',
      reason: 'explicit search / look-up request — needs external information',
      confidence: 0.9,
    };
  }
  if (ARITHMETIC_RE.test(query)) {
    return {
      methodology: 'pas',
      reason: 'arithmetic expression detected — plan-and-solve calculation',
      confidence: 0.9,
    };
  }
  return null;
}

// ============================================================
// MODEL + EXEMPLAR VECTORS (lazy singletons, loaded once per process)
// ============================================================

type Embedder = (text: string) => Promise<Float32Array>;

interface ExemplarIndex {
  embed: Embedder;
  // per methodology: exemplar vectors + renormalized centroid
  vectors: Record<RoutableMethodology, { exemplars: Float32Array[]; centroid: Float32Array }>;
}

let indexPromise: Promise<ExemplarIndex> | null = null;
let indexReady = false;
let fallbackLogged = false;
// Failure latch: after a load failure/timeout, skip the router (instant keyword fallback)
// for a cooldown instead of paying MODEL_WAIT_MS on every query while egress is down.
let routerFailedAt = 0;
const RETRY_COOLDOWN_MS = 5 * 60_000;

function dot(a: Float32Array, b: Float32Array): number {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += a[i] * b[i];
  return s;
}

function buildCentroid(vecs: Float32Array[]): Float32Array {
  const dim = vecs[0].length;
  const c = new Float32Array(dim);
  for (const v of vecs) for (let i = 0; i < dim; i++) c[i] += v[i];
  let norm = 0;
  for (let i = 0; i < dim; i++) norm += c[i] * c[i];
  norm = Math.sqrt(norm) || 1;
  for (let i = 0; i < dim; i++) c[i] /= norm;
  return c;
}

async function buildIndex(): Promise<ExemplarIndex> {
  const { pipeline, env } = await import('@xenova/transformers');
  env.cacheDir = process.env.TRANSFORMERS_CACHE || path.join(process.cwd(), '.cache', 'transformers');
  const extractor = await pipeline('feature-extraction', MODEL_ID, { quantized: true });
  const embed: Embedder = async (text: string) => {
    const out = await extractor(text, { pooling: 'mean', normalize: true });
    return out.data as Float32Array;
  };
  const vectors = {} as ExemplarIndex['vectors'];
  for (const [m, examples] of Object.entries(EXEMPLARS) as [RoutableMethodology, string[]][]) {
    const exemplars: Float32Array[] = [];
    for (const ex of examples) exemplars.push(await embed(ex));
    vectors[m] = { exemplars, centroid: buildCentroid(exemplars) };
  }
  return { embed, vectors };
}

function getIndex(): Promise<ExemplarIndex> {
  if (!indexPromise) {
    indexPromise = buildIndex()
      .then((index) => {
        indexReady = true;
        return index;
      })
      .catch((err) => {
        indexPromise = null; // allow retry on a later query (after the cooldown)
        throw err;
      });
  }
  return indexPromise;
}

/** Warm the model + exemplar index ahead of the first query (optional, non-blocking). */
export function warmEmbeddingRouter(): void {
  getIndex().catch(() => {
    /* first real query falls back to the keyword selector */
  });
}

// ============================================================
// EMBEDDING ROUTER
// ============================================================

export interface EmbeddingRoute {
  methodology: RoutableMethodology;
  confidence: number;
  scores: MethodologyScore[];
  /** Nearest exemplar for the winning methodology (max strategy) — for honest reporting. */
  nearestExemplar: string;
}

/**
 * Route a query by embedding similarity. Returns null if the model is unavailable
 * within MODEL_WAIT_MS (the caller falls back to the keyword selector).
 */
export async function routeByEmbedding(
  query: string,
  strategy: EmbeddingStrategy = DEFAULT_STRATEGY
): Promise<EmbeddingRoute | null> {
  // Kill-switch for constrained hosts (~170MB RSS once the model is resident):
  // EMBED_ROUTER=0 keeps routing on the keyword selector.
  if (process.env.EMBED_ROUTER === '0') return null;
  // While the model is unavailable, don't re-pay the wait on every query.
  if (!indexReady && routerFailedAt && Date.now() - routerFailedAt < RETRY_COOLDOWN_MS) {
    return null;
  }
  let index: ExemplarIndex;
  let q: Float32Array;
  try {
    index = await Promise.race([
      getIndex(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('embedding model load timeout')), MODEL_WAIT_MS)
      ),
    ]);
    q = await index.embed(query);
  } catch (err) {
    routerFailedAt = Date.now();
    if (!fallbackLogged) {
      fallbackLogged = true;
      log(
        'WARN',
        'ROUTER',
        `Embedding router unavailable (${err instanceof Error ? err.message : err}) — keyword selector fallback, retry in ${RETRY_COOLDOWN_MS / 60_000}min`
      );
    }
    return null;
  }

  let best: RoutableMethodology = 'direct';
  let bestSim = -Infinity;
  let nearestExemplar = '';
  const scores: MethodologyScore[] = [];

  for (const [m, { exemplars, centroid }] of Object.entries(index.vectors) as [
    RoutableMethodology,
    ExemplarIndex['vectors'][RoutableMethodology],
  ][]) {
    let maxSim = -Infinity;
    let nearest = '';
    exemplars.forEach((v, i) => {
      const s = dot(q, v);
      if (s > maxSim) {
        maxSim = s;
        nearest = EXEMPLARS[m][i];
      }
    });
    const centroidSim = dot(q, centroid);
    const sim =
      strategy === 'centroid'
        ? centroidSim
        : strategy === 'max'
          ? maxSim
          : 0.5 * centroidSim + 0.5 * maxSim;
    scores.push({
      methodology: m,
      score: Math.max(0, Math.min(1, sim)),
      reasons: [ROUTE_REASON[m]],
    });
    if (sim > bestSim) {
      bestSim = sim;
      best = m;
      nearestExemplar = nearest;
    }
  }

  // nearestExemplar stays OUT of scores[].reasons: reasons are joined into the LLM
  // system prompt (intelligence-fusion-behaviors), and an off-topic exemplar sentence
  // there contaminates the answer's steering. It remains on EmbeddingRoute for UI use.
  scores.sort((a, b) => b.score - a.score);

  return {
    methodology: best,
    confidence: Math.max(0, Math.min(1, bestSim)),
    scores,
    nearestExemplar,
  };
}

// ============================================================
// HYBRID SELECTOR — overrides → embeddings → keyword fallback
// ============================================================

export async function selectMethodologyHybrid(
  query: string,
  analysis: QueryAnalysis,
  layerActivations: LayersActivation[],
  strategy: EmbeddingStrategy = DEFAULT_STRATEGY
): Promise<{ methodology: CoreMethodology; scores: MethodologyScore[]; confidence: number }> {
  const override = deterministicOverride(query);
  if (override) {
    return {
      methodology: override.methodology,
      scores: [
        {
          methodology: override.methodology,
          score: override.confidence,
          reasons: [override.reason],
        },
      ],
      confidence: override.confidence,
    };
  }

  const route = await routeByEmbedding(query, strategy);
  if (route) {
    return { methodology: route.methodology, scores: route.scores, confidence: route.confidence };
  }

  // Model unavailable — keep routing alive on the pre-M2 keyword selector
  return selectMethodology(analysis, layerActivations);
}
