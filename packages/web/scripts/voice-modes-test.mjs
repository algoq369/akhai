// voice-tune — 90-prompt live harness for AkhAI's three-mode voice (Aurelius/Ali/Jul).
// Hits /api/simple-query (direct) so the REAL system prompt is used, on the same lane
// anonymous users hear (free OpenRouter model).
//
// Usage (from packages/web):
//   node scripts/voice-modes-test.mjs                          # quick 3-per-mode sample (listen)
//   node scripts/voice-modes-test.mjs --full --out=results.json # all 90, JSON for judging
//   node scripts/voice-modes-test.mjs --mode=jul --n=10 --out=r.json  # subset re-runs while tuning

// 90 prompts: 30 that should trigger each voice mode.
const AURELIUS = [ // simple/factual -> calm plain short
  "What's the capital of France?", "How many days in a leap year?", "What is 15% of 2340?",
  "Convert 100 celsius to fahrenheit.", "What year did WW2 end?", "Define entropy.",
  "What's the boiling point of water?", "How far is the moon?", "What does DNA stand for?",
  "What is the square root of 144?", "What's the capital of Japan?", "How many continents are there?",
  "What is 7 times 8?", "Convert 5 kilometers to miles.", "What's the chemical symbol for gold?",
  "Define photosynthesis.", "How many bones are in the human body?", "What is 20% of 850?",
  "What's the largest planet in our solar system?", "Define inflation.", "How many minutes in a day?",
  "What's the speed of light?", "Who wrote Romeo and Juliet?", "Convert 72 fahrenheit to celsius.",
  "What's the tallest mountain on Earth?", "Define osmosis.", "What is 144 divided by 12?",
  "What year did the Berlin Wall fall?", "What's the currency of Switzerland?", "How many strings does a violin have?",
];
const ALI = [ // weighty/meaningful -> eloquent moral
  "Should I take a risk on a business that might fail?", "Is it worth forgiving someone who hurt me?",
  "How do I know if I'm on the right path in life?", "Should I stay in a job I've outgrown?",
  "Is ambition a virtue or a trap?", "How do I make peace with a decision I regret?",
  "When is it right to walk away from something you've built?", "How do I lead people who doubt me?",
  "Is it better to be feared or loved?", "How do I find meaning after a loss?",
  "What do I owe my parents as they grow old?", "How do I stay honest when honesty costs me?",
  "Is revenge ever justified?", "How do I choose between loyalty to a friend and doing what's right?",
  "What makes a life well lived?", "How do I keep going when no one believes in the work?",
  "Should I tell a hard truth that will hurt someone I love?", "How do I handle success without losing myself?",
  "What is courage, really?", "How do I forgive myself for wasted years?",
  "Is it selfish to choose my own path over my family's wishes?", "How do I deal with envy of a friend's success?",
  "What should I sacrifice for my children?", "How do I face growing old?",
  "When does patience become cowardice?", "How do I rebuild trust after I broke it?",
  "Is wealth worth pursuing?", "How do I stay humble while aiming high?",
  "What do I do with anger at someone who never apologized?", "How do I begin again after everything fell apart?",
];
const JUL = [ // playful/wonder -> alive, unexpected phrasing
  "Explain gravity to me.", "Why is the sky blue?", "What happens inside a black hole?",
  "How does the internet actually work?", "Why do we dream?", "What makes music sound good?",
  "How do plants know which way is up?", "Why does time feel faster as we age?",
  "What is consciousness, really?", "How does a seed become a tree?",
  "Why do cats purr?", "How do bees find their way home?", "Why does bread rise?",
  "What's actually happening when we laugh?", "How does a caterpillar become a butterfly?",
  "Why is yawning contagious?", "How do birds know where to migrate?", "Why does coffee wake us up?",
  "What would happen if the moon disappeared?", "How does GPS know where I am?",
  "Why do onions make us cry?", "How does a song get stuck in your head?", "Why is the ocean salty?",
  "How do fireflies glow?", "Why can't we tickle ourselves?", "How does soap actually clean?",
  "Why do stars twinkle?", "What happens in our brains when we fall in love?",
  "How does an octopus change color?", "Why does popcorn pop?",
];

const MODES = { aurelius: AURELIUS, ali: ALI, jul: JUL };

const args = Object.fromEntries(process.argv.slice(2).map((a) => {
  const m = a.match(/^--([^=]+)(?:=(.*))?$/);
  return m ? [m[1], m[2] ?? true] : [a, true];
}));

// The engine appends scaffolding ([RELATED]/[NEXT]/## SYNTHESIS) on substantial queries; the VOICE
// lives in the body. Judge and count the body, keep the full text for reference.
function bodyOf(text) {
  const cut = text.search(/\n*\s*(\[RELATED\]|\[NEXT\]|## SYNTHESIS|\[SYNTHESIS\])/);
  return (cut === -1 ? text : text.slice(0, cut)).trim();
}
const wordCount = (s) => (s.trim().match(/\S+/g) || []).length;

let reqSeq = 0;
async function ask(q, tries = 5) {
  const baseWait = args['retry-failed'] ? 30000 : 8000; // free-pool congestion needs patience
  // rotate x-forwarded-for so the local dev limiter (10/min/ip) doesn't throttle the harness;
  // OpenRouter's own free-tier limit is respected via pacing + 429 retry below.
  const xff = `10.77.${Math.floor(reqSeq / 250)}.${(reqSeq % 250) + 1}`; reqSeq++;
  for (let attempt = 1; attempt <= tries; attempt++) {
    try {
      const t0 = Date.now();
      const r = await fetch('http://localhost:3000/api/simple-query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-forwarded-for': xff },
        body: JSON.stringify({ query: q, methodology: 'direct', conversationHistory: [], legendMode: false, queryId: 'voicetest-' + Math.random().toString(36).slice(2) }),
      });
      if (r.status === 429) { await new Promise((res) => setTimeout(res, Math.max(20000, baseWait) * attempt)); continue; }
      const d = await r.json();
      if (!d.response) { await new Promise((res) => setTimeout(res, baseWait * attempt)); continue; }
      return { response: d.response, model: d.provider?.model || '?', latency: Date.now() - t0 };
    } catch {
      await new Promise((res) => setTimeout(res, baseWait * attempt));
    }
  }
  return { response: '(no response after retries)', model: '?', latency: 0 };
}

async function runSet(mode, prompts, concurrency = 3) {
  const out = new Array(prompts.length);
  let i = 0;
  async function worker() {
    while (i < prompts.length) {
      const idx = i++;
      const q = prompts[idx];
      const { response, model, latency } = await ask(q);
      const body = bodyOf(response);
      out[idx] = { mode, prompt: q, response, body, bodyWords: wordCount(body), fullWords: wordCount(response), model, latency };
      process.stderr.write(`  [${mode}] ${idx + 1}/${prompts.length} ${wordCount(body)}w  ${q.slice(0, 48)}\n`);
      await new Promise((res) => setTimeout(res, 1500)); // pace for the free-model lane
    }
  }
  await Promise.all(Array.from({ length: concurrency }, worker));
  return out;
}

(async () => {
  if (args['retry-failed']) {
    // Re-run only the failed rows of a previous --full run and merge them back in place.
    // Patient mode: the anon lane rides the shared free-model pool, which congests in bursts.
    const { readFileSync, writeFileSync } = await import('node:fs');
    const path = args['retry-failed'];
    const data = JSON.parse(readFileSync(path, 'utf8'));
    const isFailed = (r) => !r || r.bodyWords === 0 || r.response.includes('(no response');
    const failedIdx = data.results.map((r, i) => (isFailed(r) ? i : -1)).filter((i) => i !== -1);
    console.error(`retry-failed: ${failedIdx.length} rows to refill`);
    let done = 0;
    for (const i of failedIdx) {
      const row = data.results[i];
      const { response, model, latency } = await ask(row.prompt, 10);
      const body = bodyOf(response);
      data.results[i] = { ...row, response, body, bodyWords: wordCount(body), fullWords: wordCount(response), model, latency };
      done++;
      console.error(`  [${row.mode}] refill ${done}/${failedIdx.length} ${wordCount(body)}w  ${row.prompt.slice(0, 48)}`);
      writeFileSync(path, JSON.stringify(data, null, 2)); // checkpoint after every row
      await new Promise((res) => setTimeout(res, 4000));
    }
    const still = data.results.filter(isFailed).length;
    console.error(`retry-failed complete: ${still} still failing`);
    return;
  }
  if (args.full || args.mode) {
    const selected = args.mode ? { [args.mode]: MODES[args.mode] } : MODES;
    if (args.mode && !MODES[args.mode]) { console.error(`unknown mode: ${args.mode}`); process.exit(2); }
    const n = args.n ? Number(args.n) : Infinity;
    const results = [];
    for (const [mode, prompts] of Object.entries(selected)) {
      console.error(`\n== ${mode.toUpperCase()} (${Math.min(n, prompts.length)} prompts) ==`);
      results.push(...await runSet(mode, prompts.slice(0, n)));
    }
    const summary = {};
    for (const mode of Object.keys(selected)) {
      const rows = results.filter((r) => r.mode === mode && r.bodyWords > 0);
      summary[mode] = {
        count: rows.length,
        avgBodyWords: +(rows.reduce((s, r) => s + r.bodyWords, 0) / Math.max(rows.length, 1)).toFixed(1),
        medianBodyWords: rows.map((r) => r.bodyWords).sort((a, b) => a - b)[Math.floor(rows.length / 2)] ?? 0,
      };
    }
    console.error(`\nsummary: ${JSON.stringify(summary)}`);
    if (args.out) {
      const { writeFileSync } = await import('node:fs');
      writeFileSync(args.out, JSON.stringify({ summary, results }, null, 2));
      console.error(`wrote ${results.length} results -> ${args.out}`);
    }
    return;
  }

  // Default: a SAMPLE of 3 per mode live (9 total) so Algoq can hear the voice without a 90-call wait
  const sample = { Aurelius: AURELIUS.slice(0, 3), Ali: ALI.slice(0, 3), Jul: JUL.slice(0, 3) };
  for (const [mode, prompts] of Object.entries(sample)) {
    console.log(`\n${'='.repeat(70)}\n  ${mode.toUpperCase()} MODE\n${'='.repeat(70)}`);
    for (const q of prompts) {
      const { response } = await ask(q);
      console.log(`\nQ: ${q}`);
      console.log(`A: ${response}`);
      console.log(`   [${wordCount(bodyOf(response))} body words]`);
    }
  }
})();
