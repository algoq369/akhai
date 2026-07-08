// E4.6 — methodology × route FUNCTIONAL smoke sweep.
// Runs all 7 methodologies through POST /api/simple-query and proves each executes without
// erroring. This is NOT a quality eval (that's E4.7/pnpm eval): PASS = runs + returns a
// non-empty answer, not correctness. Mirrors the request/response contract of
// evals/providers/akhai-sse.js exactly (single JSON body; answer in `response`, methodology
// in `methodologyUsed`, cost/tokens in `metrics`).
//
// Usage: node scripts/methodology-sweep.mjs   (dev server must be live on :3000)
// Exit: 1 if any hard FAIL, else 0.

const BASE = process.env.AKHAI_BASE_URL || 'http://localhost:3000';
const METHODS = ['direct', 'cod', 'sc', 'react', 'pas', 'tot', 'auto'];
const PROMPTS = [
  { id: 'compute', q: 'Calculate 847 * 23 - 156' },
  { id: 'reason', q: 'Pros and cons of microservices versus a monolith' },
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const msg = (e) => (e && e.message ? e.message : String(e));
const truncate = (s, n = 200) => (s.length > n ? s.slice(0, n) : s);

async function runCell(method, prompt) {
  const started = Date.now();
  const cell = {
    method,
    promptId: prompt.id,
    httpStatus: null,
    ok: false,
    latencyMs: 0,
    answerLen: 0,
    methodologyUsed: null,
    cost: null,
    tokens: null,
    error: null,
  };
  try {
    let res;
    try {
      res = await fetch(`${BASE}/api/simple-query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: prompt.q,
          methodology: method,
          conversationHistory: [],
          legendMode: false,
        }),
        signal: AbortSignal.timeout(90_000),
      });
    } catch (e) {
      cell.error = truncate(`request failed: ${msg(e)}`);
      cell.latencyMs = Date.now() - started;
      return cell;
    }
    cell.httpStatus = res.status;
    cell.ok = res.ok;
    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      cell.error = truncate(`HTTP ${res.status}: ${detail}`);
      cell.latencyMs = Date.now() - started;
      return cell;
    }
    let json;
    try {
      json = await res.json();
    } catch (e) {
      cell.error = truncate(`non-JSON response: ${msg(e)}`);
      cell.latencyMs = Date.now() - started;
      return cell;
    }
    cell.answerLen = json.response?.length || 0;
    cell.methodologyUsed = json.methodologyUsed || json.methodology || null;
    cell.cost = json.metrics?.cost ?? null;
    cell.tokens = json.metrics?.tokens ?? null;
  } catch (e) {
    // Any unexpected error in a cell must not abort the rest of the sweep.
    cell.error = truncate(`unexpected: ${msg(e)}`);
  }
  cell.latencyMs = Date.now() - started;
  return cell;
}

const passed = (cell) => cell.ok === true && cell.answerLen > 20 && !cell.error;

function pad(s, n) {
  s = String(s);
  return s.length >= n ? s : s + ' '.repeat(n - s.length);
}

async function main() {
  console.log(`\nMETHODOLOGY × ROUTE FUNCTIONAL SWEEP`);
  console.log(`Base: ${BASE}  |  ${METHODS.length * PROMPTS.length} cells (${METHODS.length} methods × ${PROMPTS.length} prompts)\n`);

  // results[method][promptId] = cell
  const results = {};
  let first = true;
  for (const method of METHODS) {
    results[method] = {};
    for (const prompt of PROMPTS) {
      if (!first) await sleep(1500); // pace calls to avoid rate-limit noise
      first = false;
      results[method][prompt.id] = await runCell(method, prompt);
    }
  }

  // ── Matrix (rows = methods, cols = prompts) ──
  const colW = 22;
  const header = pad('Method', 8) + '| ' + PROMPTS.map((p) => pad(p.id, colW)).join('| ');
  console.log(header);
  console.log('-'.repeat(header.length));
  for (const method of METHODS) {
    const cells = PROMPTS.map((p) => {
      const c = results[method][p.id];
      const verdict = passed(c) ? 'PASS' : 'FAIL';
      return pad(`${verdict}  ${c.latencyMs}ms`, colW);
    });
    console.log(pad(method, 8) + '| ' + cells.join('| '));
  }

  // ── Summary ──
  const all = METHODS.flatMap((m) => PROMPTS.map((p) => results[m][p.id]));
  const fails = all.filter((c) => !passed(c));
  const passCount = all.length - fails.length;

  console.log(`\nSUMMARY: ${passCount}/${all.length} passed, ${fails.length} failed`);

  if (fails.length > 0) {
    console.log(`\nFAILURES:`);
    for (const c of fails) {
      const why = c.error
        ? c.error
        : c.answerLen <= 20
          ? `empty/short answer (answerLen=${c.answerLen})`
          : `ok=${c.ok}`;
      console.log(`  [${c.method} × ${c.promptId}] http=${c.httpStatus} ok=${c.ok} answerLen=${c.answerLen} → ${why}`);
    }
  }

  // ── Dispatch fidelity (soft — report only) ──
  const mismatches = [];
  for (const method of METHODS) {
    if (method === 'auto') continue;
    for (const p of PROMPTS) {
      const c = results[method][p.id];
      if (c.methodologyUsed !== method) {
        mismatches.push({ method, promptId: p.id, used: c.methodologyUsed });
      }
    }
  }
  if (mismatches.length > 0) {
    console.log(`\nDISPATCH MISMATCHES (soft — route returned a different methodology than requested):`);
    for (const m of mismatches) {
      console.log(`  [${m.method} × ${m.promptId}] requested='${m.method}' used='${m.used}'`);
    }
  } else {
    console.log(`\nDISPATCH: all non-auto cells returned the requested methodology.`);
  }

  console.log(`\nAUTO PICKS:`);
  for (const p of PROMPTS) {
    const c = results['auto'][p.id];
    console.log(`  [auto × ${p.id}] picked='${c.methodologyUsed}'  (cost=${c.cost}, tokens=${c.tokens})`);
  }

  console.log('');
  process.exit(fails.length > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error('sweep crashed:', msg(e));
  process.exit(1);
});
