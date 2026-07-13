// M2 — selector accuracy eval (OFFLINE, $0, no API, no server).
// Runs the audit's 20-query A2 table (reconstructed from ULTIMATE-AUDIT-2026-07-12.md §Appendix,
// which recorded categories/gists rather than verbatim strings) plus 15 added coverage queries
// through BOTH selectors:
//   old — intelligence-fusion-scoring.selectMethodology (keyword/heuristic, audit: 11/20 = 55%)
//   new — methodology-embeddings.selectMethodologyHybrid (overrides → local MiniLM embeddings)
// and both embedding strategies (max vs centroid). Gate: new selector >= 30/35 (85%).
//
// Usage: pnpm exec tsx scripts/selector-eval.mjs        (from packages/web)
// Note: the old selector's layer activations include Math.random() base noise, so its
// hit count can wobble ±1 between runs; the embedding router is deterministic.
// HONESTY: the exemplars in methodology-embeddings.ts were tuned against this eval, so
// the blend hit rate is IN-SAMPLE (leave-one-out measures ~31/35). Treat this as a
// routing smoke test + regression gate, never as a general accuracy claim.
// Downloads the ~23MB model to .cache/transformers on first run (offline thereafter).

// default-import + destructure: tsx compiles these TS modules as CJS (packages/web has no
// "type": "module"), so named ESM imports from .mjs don't resolve — the exports land on default.
import embeddingsMod from '../lib/methodology-embeddings.ts';
import scoringMod from '../lib/intelligence-fusion-scoring.ts';
import analysisMod from '../lib/intelligence-fusion-analysis.ts';

const { selectMethodologyHybrid } = embeddingsMod;
const { selectMethodology, calculateLayersActivations } = scoringMod;
const { analyzeQuery } = analysisMod;

// Neutral layer weights — same defaults the API applies when the client sends none
const WEIGHTS = Object.fromEntries(Array.from({ length: 11 }, (_, i) => [i + 1, 0.5]));

// expect: any listed methodology counts as a HIT (mirrors the audit's flexible grading,
// e.g. howto rows were graded HIT for cod OR direct).
const AUDIT_20 = [
  { q: 'What is the capital of Japan?', expect: ['direct'] },
  { q: 'When did the Berlin Wall fall?', expect: ['direct'] },
  { q: 'Define osmosis.', expect: ['direct'] },
  { q: 'PostgreSQL vs MongoDB — which should I use for a new web application?', expect: ['tot'] },
  {
    q: 'Are rollups or sidechains the better scaling choice for a blockchain gaming project?',
    expect: ['tot'],
  },
  { q: 'Should I get my elderly parents an iPhone or an Android phone?', expect: ['tot', 'cod'] },
  { q: 'How do I create a Python virtual environment?', expect: ['cod', 'direct'] },
  { q: 'How do I make sourdough bread at home?', expect: ['cod', 'direct'] },
  { q: 'How do I deploy a Next.js app to a VPS?', expect: ['cod', 'react'] },
  { q: 'What is the latest EU AI regulation?', expect: ['react'] },
  { q: 'What is the current state of solid-state battery manufacturing?', expect: ['react', 'tot'] },
  { q: 'Who won the most recent Champions League final?', expect: ['react', 'direct'] },
  { q: 'Write a poem about autumn rain.', expect: ['direct'] },
  { q: 'Brainstorm names for a coffee shop on the moon.', expect: ['direct'] },
  { q: 'Tell me a bedtime story about a dragon.', expect: ['direct'] },
  {
    q: 'What is 15% of 2340, and what would that amount grow to after 3 years of 5% compound interest?',
    expect: ['pas'],
  },
  {
    q: 'Calculate the monthly mortgage payment on a $400,000 loan at 6.5% over 30 years.',
    expect: ['pas'],
  },
  { q: 'Thoughts?', expect: ['direct'] },
  { q: 'Is it worth it?', expect: ['direct'] },
  {
    q: 'Should humanity colonize Mars or explore the oceans first? Consider the economics, the ethics, and long-term survival.',
    expect: ['tot'],
  },
];

const ADDED_15 = [
  { q: 'What year did World War II end?', expect: ['direct'] },
  { q: 'What does HTTP stand for?', expect: ['direct'] },
  { q: 'List the planets of the solar system in order from the sun.', expect: ['direct'] },
  { q: 'Best pizza topping?', expect: ['direct'] },
  { q: "What's the weather in Paris right now?", expect: ['react'] },
  { q: 'Any news on the next iPhone release date?', expect: ['react'] },
  { q: "What are today's mortgage rates?", expect: ['react'] },
  { q: 'Explain how DNS resolution works step by step.', expect: ['cod'] },
  { q: 'How do I set up SSH keys for GitHub?', expect: ['cod'] },
  {
    q: 'If I save $850 a month at 4% annual interest, how much will I have after 5 years?',
    expect: ['pas'],
  },
  { q: 'What is an 18% tip on a $67.50 bill?', expect: ['pas'] },
  {
    q: 'Is a four-day work week actually better for productivity? Give the arguments on both sides.',
    expect: ['tot'],
  },
  { q: 'Compare renting versus buying a home when interest rates are high.', expect: ['tot'] },
  {
    q: 'Given a 10 kg luggage limit, a 5-day trip, and freezing weather, what should I pack?',
    expect: ['sc'],
  },
  {
    q: "Plan tonight's dinner with these constraints: no meat, gluten-free, and ready in under 30 minutes.",
    expect: ['sc'],
  },
];

const EVAL = [...AUDIT_20, ...ADDED_15];

// Override-regression guards (from the pre-commit adversarial review): queries the
// deterministic overrides used to hijack. Slash dates/ratios must not force pas; noun
// 'search'/'google' must not force react; crypto price questions must not get a false
// "real-time data" direct override (crypto stays intercepted at the route by
// checkCryptoQuery). Spaced arithmetic MUST still be overridden to pas.
const OVERRIDE_GUARDS = [
  { q: 'What happened on 9/11?', expect: ['direct', 'react'] },
  { q: 'What does 24/7 support mean in an SLA?', expect: ['direct', 'cod'] },
  { q: 'Rate my essay 8/10 and explain why.', expect: ['direct', 'cod', 'tot'] },
  { q: 'How does binary search work?', expect: ['cod', 'direct'] },
  { q: 'Explain how a lookup table works.', expect: ['cod', 'direct'] },
  { q: 'Compare Google Cloud and AWS for a startup.', expect: ['tot'] },
  { q: 'How much does a solar panel cost?', expect: ['direct', 'react'] },
  { q: 'What is the price of bitcoin right now?', expect: ['react', 'direct'] },
  { q: 'What is 84 / 7?', expect: ['pas'] },
  { q: 'What is 12 + 30 * 2?', expect: ['pas'] },
];

function oldSelect(q) {
  const analysis = analyzeQuery(q);
  const layers = calculateLayersActivations(q, WEIGHTS);
  return selectMethodology(analysis, layers).methodology;
}

async function newSelect(q, strategy) {
  const analysis = analyzeQuery(q);
  const layers = calculateLayersActivations(q, WEIGHTS);
  const r = await selectMethodologyHybrid(q, analysis, layers, strategy);
  return { id: r.methodology, confidence: r.confidence };
}

const pad = (s, n) => String(s).padEnd(n);

async function run() {
  // ---- cold-load latency: first hybrid call includes model load + exemplar embedding
  const t0 = Date.now();
  await newSelect('warmup: how do I measure cold start latency?', 'max');
  const coldMs = Date.now() - t0;

  const results = [];
  const latencies = [];
  for (const item of EVAL) {
    const old = oldSelect(item.q);
    const t = Date.now();
    const nMax = await newSelect(item.q, 'max');
    latencies.push(Date.now() - t);
    const nCen = await newSelect(item.q, 'centroid');
    const nBld = await newSelect(item.q, 'blend');
    results.push({ ...item, old, max: nMax, cen: nCen, bld: nBld });
  }

  const hit = (chose, expect) => expect.includes(chose);
  const tally = (get) => results.filter((r) => hit(get(r), r.expect)).length;
  const oldHits = tally((r) => r.old);
  const maxHits = tally((r) => r.max.id);
  const cenHits = tally((r) => r.cen.id);
  const bldHits = tally((r) => r.bld.id);

  console.error(
    `\n${pad('#', 3)}${pad('query', 62)}${pad('expected', 14)}${pad('old', 8)}${pad('new(max)', 15)}${pad('new(centroid)', 15)}${pad('new(blend)', 15)}`
  );
  console.error('-'.repeat(132));
  results.forEach((r, i) => {
    const mark = (chose) => (hit(chose, r.expect) ? 'HIT ' : 'MISS') + ' ' + chose;
    const cell = (n) => pad(mark(n.id) + ' ' + Math.round(n.confidence * 100) + '%', 15);
    console.error(
      `${pad(i + 1, 3)}${pad(r.q.slice(0, 60), 62)}${pad(r.expect.join('|'), 14)}${pad(mark(r.old), 12)}${cell(r.max)}${cell(r.cen)}${cell(r.bld)}`
    );
  });

  // Override-regression guards run on the SHIPPED configuration only
  const guards = [];
  for (const item of OVERRIDE_GUARDS) {
    const chose = await newSelect(item.q, 'blend');
    guards.push({ ...item, chose });
  }

  const warmSorted = [...latencies].sort((a, b) => a - b);
  const p50 = warmSorted[Math.floor(warmSorted.length / 2)];
  const p95 = warmSorted[Math.floor(warmSorted.length * 0.95)];

  console.error('-'.repeat(132));
  console.error(`old keyword selector : ${oldHits}/${EVAL.length} (${Math.round((oldHits / EVAL.length) * 100)}%)`);
  console.error(`new embedding (max)  : ${maxHits}/${EVAL.length} (${Math.round((maxHits / EVAL.length) * 100)}%)`);
  console.error(`new embedding (cent.): ${cenHits}/${EVAL.length} (${Math.round((cenHits / EVAL.length) * 100)}%)`);
  console.error(`new embedding (blend): ${bldHits}/${EVAL.length} (${Math.round((bldHits / EVAL.length) * 100)}%)  <- SHIPPED strategy`);
  console.error(`latency — cold first-route: ${coldMs}ms | warm p50: ${p50}ms | warm p95: ${p95}ms`);

  console.error(`\nOverride-regression guards (shipped config):`);
  let guardHits = 0;
  for (const g of guards) {
    const ok = hit(g.chose.id, g.expect);
    if (ok) guardHits++;
    console.error(
      `  ${ok ? 'HIT ' : 'MISS'} ${pad(g.q.slice(0, 55), 57)} chose ${g.chose.id} ${Math.round(g.chose.confidence * 100)}% (expected ${g.expect.join('|')})`
    );
  }
  console.error(`  guards: ${guardHits}/${guards.length}`);

  // Gate on the SHIPPED strategy (blend), not best-of-three (review finding), plus the guards.
  if (bldHits < 30) {
    console.error(`\nGATE FAIL: shipped blend strategy ${bldHits}/35 < 30/35 (85%)`);
    process.exit(1);
  }
  if (guardHits < guards.length - 1) {
    console.error(`\nGATE FAIL: override guards ${guardHits}/${guards.length} (max 1 miss allowed)`);
    process.exit(1);
  }
  console.error(`\nGATE PASS: shipped blend ${bldHits}/35 >= 30/35 (85%), guards ${guardHits}/${guards.length}`);
}

run();
