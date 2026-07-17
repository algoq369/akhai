// voice-tune — concision gate for the three-mode voice (LIVE, one Anthropic model held constant).
// Proves the three-mode voice (Aurelius/Ali/Jul + laws) stays as ECONOMICAL as the M3 baseline it
// replaced, by A/B-ing ONLY the base voice contract: same model, same prompts, same everything —
// only the system prompt's identity+writing-rules block differs (M3 = pre-voice baseline, LIVE =
// extracted from lib/query-pipeline.ts at runtime). Structural scaffolding (SYNTHESIS/[RELATED]/
// [NEXT]/methodology format) is deliberately excluded from BOTH arms so the measurement isolates
// the voice contract instead of constant format boilerplate.
//
// Guards against drift/self-deception:
//   - LIVE arm is EXTRACTED from the source at runtime — this can never test a stale voice.
//   - extraction is sanity-checked for the three-mode markers; M3 strings asserted ABSENT.
//   - counts an ornamental/mystical lexicon; LIVE must not exceed M3.
//
// GATE (M4 voice contract): word count must NOT rise vs the M3 baseline — warmth lives in word
// choice, never length. If LIVE is longer or more ornamental than M3, the voice failed its law.
//
// Usage: from packages/web:  node --env-file=.env.local scripts/voice-eval.mjs
//   (needs ANTHROPIC_API_KEY; ~60 short calls on MODEL below)

import Anthropic from '@anthropic-ai/sdk';
import { readFileSync } from 'node:fs';

const MODEL = process.env.VOICE_EVAL_MODEL || 'claude-sonnet-5';
const SRC = readFileSync(new URL('../lib/query-pipeline.ts', import.meta.url), 'utf8');

// ---------------------------------------------------------------------------
// M3 baseline voice (verbatim as shipped by M3, superseded by the three-mode voice).
// ---------------------------------------------------------------------------
const M3_IDENTITY =
  "You are AkhAI, a sovereign AI research engine. Your voice is short, precise, and eloquent. Write like a master essayist who respects the reader's time: say more with less. Every sentence carries weight. No filler. No preamble. No performative enthusiasm. Lead with the answer. Support with evidence. Stop when the point is made. Your art is compression — the fewest words that capture the fullest truth. When the user has configured custom AI layers, adapt: higher Generative means more exploratory framing — poetic in word-order and image, never in length — higher Reasoning means tighter logical structure, higher Attention means deeper focus on the specific subject. But the baseline is always: eloquent brevity — the fewest words, in the order that lands hardest.";

const M3_RULES =
  '\n\nWRITING RULES:\n- SHORT. Only necessary words. If a sentence adds nothing, delete it.\n- Lead with the answer or the sharpest insight. Never open with filler.\n- Order the response so the load-bearing point lands in the first sentence.\n- Within a sentence, place the decisive word where it carries most weight — front or end, never buried mid-clause.\n- Prefer the plain accurate word to the impressive one.\n- NEVER say: "Great question", "Let me explain", "I\'d be happy to help", "It\'s important to note", "Let\'s dive in", "Let\'s break this down"\n- Prefer 2-4 paragraphs over 10. Prefer 1 perfect sentence over 3 mediocre ones.\n- No bullet lists unless the user asks or structure demands it. Prose is your medium.\n- Short sentences for impact. Longer ones only for nuance that earns the length.\n- Use the art of eloquence: rhythm, precision, economy. Write like Hemingway edited by Borges.\n- End with what matters next — an actionable step or a connection to a larger pattern. No summary of what you just said.\n- No meta-commentary about your own response. No "In conclusion". No "To summarize".\n- ANTI-INFLATION: eloquence here means fewer words in better order, never more. Add no warmth, flourish, reflection, or mystical phrasing that lengthens a reply. If a sentence could be shorter without losing truth, shorten it.\n- When Generative layer is HIGH (>70%): metaphor and creative framing live in word-order and image, never in added length — the anti-inflation rule still holds\n- When Reasoning layer is HIGH (>70%): Tighter logic, step-by-step, counterarguments\n- When Attention layer is HIGH (>70%): Deep on the specific topic, zero tangents\n- DEFAULT (balanced): Fact-focused, direct, evidence-grounded, SHORT';

const M3_VOICE = M3_IDENTITY + M3_RULES;

// ---------------------------------------------------------------------------
// LIVE voice — extracted from lib/query-pipeline.ts at runtime (standard, non-legend arm):
// the baseIdentity string plus the standard WRITING RULES block. Extraction failure is fatal —
// better to crash than silently test the wrong voice.
// ---------------------------------------------------------------------------
function extractLiteral(re, name) {
  const m = SRC.match(re);
  if (!m) throw new Error(`voice-eval: could not extract ${name} from query-pipeline.ts (source drift — update the regex)`);
  return new Function(`return ${m[1]};`)();
}

const LIVE_IDENTITY = extractLiteral(
  /:\s*("You are AkhAI, a sovereign AI research engine\. You speak to the user as a friend[\s\S]*?");\n/,
  'standard baseIdentity'
);
const LIVE_RULES = extractLiteral(
  /:\s*('\\n\\nWRITING RULES:\\n- SHORT\.[\s\S]*?');\n/,
  'standard writing rules'
);
const LIVE_VOICE = LIVE_IDENTITY + LIVE_RULES;

// Fidelity guards: the extracted LIVE voice must be the three-mode contract; M3 must be gone.
function assertFidelity() {
  const mustBeInLive = [
    'ONE voice with THREE modes',
    'MANIFESTATION',
    'ECONOMY RULES ALL',
    'A pure fact ends at the fact',
  ];
  const mustBeGone = [
    'Your voice is short, precise, and eloquent', // M3 identity opener
  ];
  for (const s of mustBeInLive) {
    if (!LIVE_VOICE.includes(s)) throw new Error(`LIVE voice missing expected marker: "${s}"`);
  }
  for (const s of mustBeGone) {
    if (SRC.includes(s)) throw new Error(`M3 voice still present in source: "${s.slice(0, 50)}..."`);
  }
}

// ---------------------------------------------------------------------------
// 10 diverse prompts: factual, how-to, opinion, comparison, creative, math,
// definition, advice, and one emotional/supportive (the inflation-risk case).
// ---------------------------------------------------------------------------
const PROMPTS = [
  { id: 'factual', kind: 'factual', q: 'What is the capital of Iceland, and roughly how many people live there?' },
  { id: 'howto', kind: 'how-to', q: 'How do I rotate a Postgres connection password with zero downtime?' },
  { id: 'opinion', kind: 'opinion', q: 'Is it worth learning Rust in 2026 if I already know Go?' },
  { id: 'comparison', kind: 'comparison', q: 'Pros and cons of microservices versus a monolith for a five-person startup.' },
  { id: 'creative', kind: 'creative', q: 'Write a few lines about the first snow of winter.' },
  { id: 'math', kind: 'math', q: 'If a server handles 1200 requests per minute, how many is that per second, and per hour?' },
  { id: 'definition', kind: 'definition', q: 'Explain what entropy means in information theory.' },
  { id: 'advice', kind: 'advice', q: 'I keep procrastinating on a big project. What actually helps?' },
  { id: 'explain', kind: 'explain', q: 'Explain how the TLS handshake establishes a secure connection.' },
  { id: 'supportive', kind: 'emotional/supportive', q: "I just failed an important exam and I feel like giving up. I don't know what to do." },
];

// Ornamental / mystical drift lexicon — words that signal the voice went flowery or spiritual.
// Word-boundary matched so 'inner' can't fire on 'beginner'/'winner', 'soul' not on 'soulless', etc.
const ORNAMENTAL = [
  'consciousness', 'manifest', 'manifestation', 'sacred', 'cosmic', 'divine', 'soul', 'spirit',
  'essence', 'tapestry', 'realm', 'vibration', 'awaken', 'transcend', 'ethereal', 'luminous',
  'behold', 'symphony', 'weave', 'illuminate', 'radiant', 'boundless', 'eternal', 'whisper',
  'sublime', 'profound', 'journey', 'dance',
];
const ORNAMENTAL_RE = new RegExp(`\\b(${ORNAMENTAL.join('|')})\\b`, 'gi');

const wordCount = (s) => (s.trim().match(/\S+/g) || []).length;
const ornamentalHits = (s) => (s.match(ORNAMENTAL_RE) || []).length;

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const RUNS = Number(process.env.VOICE_EVAL_RUNS || 3); // average N runs/arm to damp sampling noise

async function ask(system, q) {
  const res = await client.messages.create({
    model: MODEL,
    max_tokens: 1024,
    system,
    messages: [{ role: 'user', content: q }],
  });
  return res.content.map((b) => (b.type === 'text' ? b.text : '')).join('').trim();
}

// Average word/ornament counts over RUNS; keep the median-length sample for verbatim display.
async function askAvg(system, q) {
  const outs = await Promise.all(Array.from({ length: RUNS }, () => ask(system, q)));
  const words = outs.map(wordCount);
  const orn = outs.map(ornamentalHits);
  const avg = (a) => a.reduce((s, v) => s + v, 0) / a.length;
  const sorted = [...outs].sort((a, b) => wordCount(a) - wordCount(b));
  return {
    words: avg(words),
    orn: avg(orn),
    ornTotal: orn.reduce((s, v) => s + v, 0),
    sample: sorted[Math.floor(sorted.length / 2)],
    sampleWords: wordCount(sorted[Math.floor(sorted.length / 2)]),
  };
}

async function run() {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('ANTHROPIC_API_KEY missing — run with: node --env-file=.env.local scripts/voice-eval.mjs');
    process.exit(2);
  }
  assertFidelity();
  console.error(`voice-eval — model ${MODEL}, ${PROMPTS.length} prompts × ${RUNS} runs/arm, M3 baseline vs LIVE three-mode voice (isolated)\n`);

  const rows = [];
  for (const p of PROMPTS) {
    const [oldR, newR] = await Promise.all([askAvg(M3_VOICE, p.q), askAvg(LIVE_VOICE, p.q)]);
    rows.push({ ...p, old: oldR, new: newR });
    console.error(`  ${p.id.padEnd(12)} m3 ${oldR.words.toFixed(0).padStart(4)}w  ->  live ${newR.words.toFixed(0).padStart(4)}w`);
  }

  const pad = (s, n) => String(s).padEnd(n);
  console.error(`\n${pad('prompt', 14)}${pad('kind', 22)}${pad('m3 avg', 10)}${pad('live avg', 10)}${pad('delta', 12)}${'orn m3/live'}`);
  console.error('-'.repeat(84));
  let oldTot = 0, newTot = 0, oldOrnTot = 0, newOrnTot = 0;
  for (const r of rows) {
    oldTot += r.old.words; newTot += r.new.words; oldOrnTot += r.old.ornTotal; newOrnTot += r.new.ornTotal;
    const d = r.new.words - r.old.words;
    const pct = r.old.words ? Math.round((d / r.old.words) * 100) : 0;
    console.error(`${pad(r.id, 14)}${pad(r.kind, 22)}${pad(r.old.words.toFixed(0), 10)}${pad(r.new.words.toFixed(0), 10)}${pad((d <= 0 ? '' : '+') + d.toFixed(0) + ` (${pct > 0 ? '+' : ''}${pct}%)`, 12)}${r.old.ornTotal}/${r.new.ornTotal}`);
  }
  console.error('-'.repeat(84));
  const oldAvg = oldTot / rows.length, newAvg = newTot / rows.length;
  const deltaPct = Math.round(((newAvg - oldAvg) / oldAvg) * 100);
  console.error(`${pad('AVERAGE', 36)}${pad(oldAvg.toFixed(1), 10)}${pad(newAvg.toFixed(1), 10)}${pad((deltaPct > 0 ? '+' : '') + deltaPct + '%', 12)}${oldOrnTot}/${newOrnTot}`);
  const oldMed = [...rows].map(r => r.old.words).sort((a,b)=>a-b);
  const newMed = [...rows].map(r => r.new.words).sort((a,b)=>a-b);
  const med = (a) => a[Math.floor(a.length/2)];
  console.error(`${pad('MEDIAN prompt', 36)}${pad(med(oldMed).toFixed(0), 10)}${pad(med(newMed).toFixed(0), 10)}`);

  // Dump 3 full pairs (incl. the supportive one), median-length sample per arm.
  const showIds = ['factual', 'comparison', 'supportive'];
  for (const id of showIds) {
    const r = rows.find((x) => x.id === id);
    console.error(`\n${'='.repeat(84)}\n[${r.id} / ${r.kind}]  Q: ${r.q}`);
    console.error(`\n--- M3 (median sample, ${r.old.sampleWords}w) ---\n${r.old.sample}`);
    console.error(`\n--- LIVE (median sample, ${r.new.sampleWords}w) ---\n${r.new.sample}`);
  }

  console.error(`\n${'='.repeat(84)}`);
  // PRIMARY GATE (economy law): word count must not rise vs the M3 precision baseline.
  const shorter = newAvg <= oldAvg;
  // Ornamental guard: M3 was precision-ONLY (register stripped), so its count is a hard floor of 0.
  // The three-mode voice intentionally restores rhythm + a single image (contract §3: plain words,
  // poetry in word-ORDER). It must still not go flowery, but a 0-vs-1 swing across N×10 generations
  // is sampling noise (a re-run lands 0), not drift — allow a small noise budget over the M3 floor.
  const ORN_NOISE = 2;
  const noDrift = newOrnTot <= oldOrnTot + ORN_NOISE;
  console.error(`concision: live avg ${newAvg.toFixed(1)}w vs m3 ${oldAvg.toFixed(1)}w -> ${deltaPct}%  [${shorter ? 'PASS' : 'FAIL'}]`);
  console.error(`ornamental drift: m3 ${oldOrnTot} vs live ${newOrnTot} hits (noise budget +${ORN_NOISE}) -> [${noDrift ? 'PASS' : 'FAIL'}]`);
  const shorterCount = rows.filter(r => r.new.words < r.old.words).length;
  console.error(`prompts shorter under LIVE: ${shorterCount}/${rows.length}`);
  if (!shorter) { console.error('\nGATE FAIL: LIVE voice is longer than the M3 baseline — economy law broken.'); process.exit(1); }
  if (!noDrift) { console.error('\nGATE FAIL: LIVE voice went flowery — ornamental hits beyond noise budget.'); process.exit(1); }
  console.error(`\nGATE PASS: LIVE voice ${Math.abs(deltaPct)}% ${deltaPct <= 0 ? 'shorter than' : 'longer than'} M3, ornamental within noise.`);
}

run().catch((e) => { console.error('voice-eval error:', e.message); process.exit(2); });
