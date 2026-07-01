#!/usr/bin/env node
// AkhAI Eval Bar — unified frozen-core quality gate.
// Deterministic floor (SHIELD + honesty goldens) + quality score (correctness goldens) → verdict.
// Run in the user's terminal with the dev server on :3000:  pnpm eval
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
const THRESHOLD = 85;

// 1. Floor part A: SHIELD deterministic gate
let shieldPass = false;
try {
  execSync('bash scripts/shield.sh --fast', { stdio: 'inherit' });
  shieldPass = true;
} catch {
  shieldPass = false;
}

// 2. Goldens via promptfoo (writes JSON we parse)
let results = [];
try {
  execSync(
    'pnpm dlx promptfoo@latest eval -c evals/promptfooconfig.yaml --output /tmp/akhai-eval.json',
    { stdio: 'inherit' }
  );
  const data = JSON.parse(readFileSync('/tmp/akhai-eval.json', 'utf8'));
  results = data.results?.results ?? data.results ?? []; // defensive: promptfoo schema varies by version
} catch (e) {
  console.error('\n[eval-bar] promptfoo run failed — is the dev server on :3000?', e.message);
  process.exit(2);
}

const tierOf = (r) => r.testCase?.metadata?.tier ?? r.vars?.tier ?? 'quality';
const passed = (r) => r.success === true || r.gradingResult?.pass === true;
const floor = results.filter((r) => tierOf(r) === 'floor');
const quality = results.filter((r) => tierOf(r) === 'quality');

// 3. Floor = SHIELD AND all honesty goldens pass. Quality = correctness pass rate → 0-100.
const floorPass = shieldPass && floor.length > 0 && floor.every(passed);
const qPass = quality.filter(passed).length;
const qScore = quality.length ? Math.round((100 * qPass) / quality.length) : 0;
const verdict = floorPass && qScore >= THRESHOLD;

console.log('\n══════ AKHAI EVAL BAR ══════');
console.log(
  `  Deterministic floor : ${floorPass ? 'PASS' : 'FAIL'}  (SHIELD ${shieldPass ? '✓' : '✗'}, honesty goldens ${floor.filter(passed).length}/${floor.length})`
);
console.log(
  `  Quality score       : ${qScore}/100  (${qPass}/${quality.length} correctness goldens, need ≥${THRESHOLD})`
);
console.log(`  VERDICT             : ${verdict ? 'PASS ✅' : 'FAIL ❌'}`);
console.log('════════════════════════════');
process.exit(verdict ? 0 : 1);
