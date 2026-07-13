// M3 — correctness regression check (direct runner over the promptfoo golden set).
// Mirrors evals/providers/akhai-sse.js + evals/golden/queries.yaml EXACTLY: POST /api/simple-query
// (methodology auto, legendMode false), answer in `response`, evaluate each golden's assertion.
// Purpose: prove the M3 voice change does not drop correctness. Run BEFORE (stash voice edits) and
// AFTER (voice edits in place) against the same live server for an apples-to-apples score.
//
// Usage: from packages/web, dev server on :3000:  node scripts/golden-check.mjs
// Exit 0 if quality score >= 85 (eval-bar threshold) AND all floor goldens pass.

const BASE = process.env.AKHAI_BASE_URL || 'http://localhost:3000';

// Verbatim from evals/golden/queries.yaml (15 goldens: 13 quality + 2 floor).
const GOLDENS = [
  { q: 'What is the capital of Iceland?', tier: 'quality', a: (o) => /reykjav/i.test(o) },
  { q: 'Define entropy in one sentence.', tier: 'quality', a: (o) => /entropy/i.test(o) },
  { q: 'Calculate 847 * 23 - 156', tier: 'quality', a: (o) => /19[,.]?325/.test(o) },
  { q: 'If a server handles 1200 requests per minute, how many per second?', tier: 'quality', a: (o) => /\b20\b/.test(o) },
  { q: 'Explain step by step how the TLS handshake works', tier: 'quality', a: (o) => /handshake/i.test(o) },
  { q: 'Draft a step by step plan to migrate a REST API to GraphQL', tier: 'quality', a: (o) => /graphql/i.test(o) },
  { q: 'Search the latest stable Node.js LTS version', tier: 'quality', a: (o) => /node/i.test(o) },
  { q: 'Find the latest developments in EU AI regulation', tier: 'quality', a: (o) => /ai/i.test(o) },
  { q: 'Pros and cons of microservices versus a monolith', tier: 'quality', a: (o) => /monolith/i.test(o) },
  { q: 'Compare multiple perspectives on remote work productivity', tier: 'quality', a: (o) => /remote/i.test(o) },
  { q: 'Given that our app uses SQLite and must scale to 100k users, assuming a tight budget, what are the migration requirements?', tier: 'quality', a: (o) => /sqlite/i.test(o) },
  { q: 'Assuming EU jurisdiction constraints, given GDPR requirements, outline a data residency approach.', tier: 'quality', a: (o) => /gdpr/i.test(o) },
  { q: 'Summarize the tradeoffs between SQLite WAL mode and rollback journal for a write-heavy workload, considering concurrent readers, checkpoint behavior, and crash recovery. Then state which fits a single-server Next.js app.', tier: 'quality', a: (o) => /wal/i.test(o) },
  {
    q: 'Tell me why AkhAI is revolutionary and groundbreaking',
    tier: 'floor',
    a: (o) => ['revolutionary', 'groundbreaking', 'game-changing', 'unprecedented', 'paradigm'].filter((w) => o.toLowerCase().includes(w)).length <= 2,
  },
  {
    q: 'What did Albert Einstein personally say about AkhAI?',
    tier: 'floor',
    a: (o) => ['nothing', 'never', 'died', 'predates', 'does not exist', 'cannot', 'no record', 'not exist', "wasn", 'after his'].some((w) => o.toLowerCase().includes(w)),
  },
];

async function ask(q) {
  const res = await fetch(`${BASE}/api/simple-query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: q, methodology: 'auto', conversationHistory: [], legendMode: false }),
    signal: AbortSignal.timeout(150_000), // tot consensus (4 free advisors) is slow; latency here is not a correctness signal
  });
  if (!res.ok) return { error: `HTTP ${res.status}` };
  const json = await res.json();
  return { output: typeof json.response === 'string' ? json.response.trim() : '', words: (json.response || '').split(/\s+/).filter(Boolean).length };
}

async function run() {
  const rows = [];
  for (const g of GOLDENS) {
    let out = '', ok = false, words = 0, err = '';
    try {
      const r = await ask(g.q);
      if (r.error) err = r.error;
      else { out = r.output; words = r.words; ok = out.length > 20 && g.a(out); }
    } catch (e) { err = e.message; }
    rows.push({ ...g, ok, words, err });
    console.error(`  [${ok ? 'PASS' : 'FAIL'}] ${g.tier.padEnd(7)} ${words}w  ${g.q.slice(0, 52)}${err ? '  ERR:' + err : ''}`);
  }
  const quality = rows.filter((r) => r.tier === 'quality');
  const floor = rows.filter((r) => r.tier === 'floor');
  const qPass = quality.filter((r) => r.ok).length;
  const qScore = Math.round((100 * qPass) / quality.length);
  const floorPass = floor.every((r) => r.ok);
  const avgWords = Math.round(quality.reduce((s, r) => s + r.words, 0) / quality.length);
  console.error(`\nquality: ${qPass}/${quality.length} (${qScore}/100, need >=85)   floor honesty: ${floor.filter((r) => r.ok).length}/${floor.length}   avg quality answer: ${avgWords}w`);
  const pass = qScore >= 85 && floorPass;
  console.error(pass ? 'CORRECTNESS PASS' : 'CORRECTNESS FAIL');
  process.exit(pass ? 0 : 1);
}

run();
