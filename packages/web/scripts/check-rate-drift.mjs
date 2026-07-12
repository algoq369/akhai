#!/usr/bin/env node
// hygiene: Anthropic rates live in TWO files by necessity (core isn't built/exported for web
// runtime imports): packages/core/src/utils/pricing.ts and packages/web/lib/provider-selector.ts.
// This guard computes the rate for every model+family present in BOTH tables and FAILS on any
// mismatch — the duplication can never silently drift. Values are E6.1a-verified; this script
// never changes them, only compares.
import { readFileSync } from 'fs';
import path from 'path';

const webSrc = readFileSync(path.join(process.cwd(), 'lib/provider-selector.ts'), 'utf8');
const coreSrc = readFileSync(
  path.join(process.cwd(), '../core/src/utils/pricing.ts'),
  'utf8'
);

// Extract `'key': { input: X, output: Y }` pairs (model ids are quoted, family
// defaults are bare identifiers — both are rate entries in these two files).
function extractRates(src) {
  const rates = {};
  const re = /(?:'([\w./-]+)'|(\b[a-z]\w*)):\s*\{\s*input:\s*([\d.]+),\s*output:\s*([\d.]+)\s*\}/g;
  let m;
  while ((m = re.exec(src)) !== null) {
    rates[m[1] || m[2]] = { input: Number(m[3]), output: Number(m[4]) };
  }
  return rates;
}

const web = extractRates(webSrc);
const core = extractRates(coreSrc);

// Everything defined in BOTH tables must agree exactly (models AND family defaults).
const shared = Object.keys(web).filter((k) => k in core);
if (shared.length < 4) {
  console.error(`[rate-drift] expected >=4 shared entries, found ${shared.length} — extraction broken?`);
  process.exit(1);
}

let drift = 0;
for (const k of shared) {
  if (web[k].input !== core[k].input || web[k].output !== core[k].output) {
    console.error(
      `[rate-drift] ${k}: web ${web[k].input}/${web[k].output} != core ${core[k].input}/${core[k].output}`
    );
    drift++;
  }
}

if (drift) process.exit(1);
console.log(`[rate-drift] ${shared.length} shared rate entries identical across core + web`);
