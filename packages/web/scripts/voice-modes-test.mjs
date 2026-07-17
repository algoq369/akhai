import embeddingsMod from '../lib/methodology-embeddings.ts';

// 90 prompts: 30 that should trigger each voice mode.
const AURELIUS = [ // simple/factual -> calm plain short
  "What's the capital of France?", "How many days in a leap year?", "What is 15% of 2340?",
  "Convert 100 celsius to fahrenheit.", "What year did WW2 end?", "Define entropy.",
  "What's the boiling point of water?", "How far is the moon?", "What does DNA stand for?",
  "What is the square root of 144?",
];
const ALI = [ // weighty/meaningful -> eloquent moral
  "Should I take a risk on a business that might fail?", "Is it worth forgiving someone who hurt me?",
  "How do I know if I'm on the right path in life?", "Should I stay in a job I've outgrown?",
  "Is ambition a virtue or a trap?", "How do I make peace with a decision I regret?",
  "When is it right to walk away from something you've built?", "How do I lead people who doubt me?",
  "Is it better to be feared or loved?", "How do I find meaning after a loss?",
];
const JUL = [ // playful/artistic -> alive irreverent
  "Explain gravity to me.", "Why is the sky blue?", "What happens inside a black hole?",
  "How does the internet actually work?", "Why do we dream?", "What makes music sound good?",
  "How do plants know which way is up?", "Why does time feel faster as we age?",
  "What is consciousness, really?", "How does a seed become a tree?",
];

const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;
async function ask(q) {
  // hit the live engine so the REAL system prompt (new voice) is used
  const r = await fetch('http://localhost:3000/api/simple-query', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: q, methodology: 'direct', conversationHistory: [], legendMode: false, queryId: 'voicetest-'+Math.random().toString(36).slice(2) }),
  });
  const d = await r.json();
  return d.response || '(no response)';
}

(async () => {
  // Run a SAMPLE of 3 per mode live (9 total) so Algoq can hear the voice without a 90-call wait
  const sample = { Aurelius: AURELIUS.slice(0,3), Ali: ALI.slice(0,3), Jul: JUL.slice(0,3) };
  for (const [mode, prompts] of Object.entries(sample)) {
    console.log(`\n${'='.repeat(70)}\n  ${mode.toUpperCase()} MODE\n${'='.repeat(70)}`);
    for (const q of prompts) {
      const a = await ask(q);
      const words = a.split(/\s+/).length;
      console.log(`\nQ: ${q}`);
      console.log(`A: ${a}`);
      console.log(`   [${words} words]`);
    }
  }
})();
