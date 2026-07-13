import embeddingsMod from '../lib/methodology-embeddings.ts';
const { routeByEmbedding, warmEmbeddingRouter } = embeddingsMod;

const P = [
  // factual (10) — all-new
  ["Who discovered penicillin?", ["direct"]],["What is the speed of light?", ["direct"]],["What language is spoken in Brazil?", ["direct"]],["When was the printing press invented?", ["direct"]],["What is the chemical symbol for gold?", ["direct"]],["How many sides does a hexagon have?", ["direct"]],["What is the largest planet?", ["direct"]],["Who was the first person on the moon?", ["direct"]],["What is the freezing point of water in celsius?", ["direct"]],["How many colors are in a rainbow?", ["direct"]],
  // current/web (10)
  ["What's the exchange rate for euros to dollars today?", ["react"]],["Any breaking news this morning?", ["react"]],["What's the score of the Lakers game?", ["react"]],["Latest updates on the mars rover mission?", ["react"]],["What's the temperature in Dubai right now?", ["react"]],["Who is currently leading the presidential polls?", ["react"]],["What are the newest AI model releases this month?", ["react"]],["Is it raining in London at the moment?", ["react"]],["What's the current bitcoin price?", ["react"]],["Recent earthquakes in the pacific?", ["react"]],
  // howto (10)
  ["How do I create a GitHub repository step by step?", ["cod"]],["Explain how vaccines work.", ["cod","direct"]],["Walk me through filing taxes as a freelancer.", ["cod"]],["How does photosynthesis convert light to energy?", ["cod","direct"]],["Show me how to tie a tie.", ["cod"]],["Explain how a neural network learns.", ["cod","direct"]],["How do I make cold brew coffee at home?", ["cod"]],["Break down how encryption keeps data safe.", ["cod","direct"]],["Guide me through setting up a budget spreadsheet.", ["cod"]],["Explain how the stock market functions.", ["cod","direct"]],
  // math (10)
  ["What is 37% of 1200?", ["pas"]],["Calculate 15 factorial.", ["pas"]],["What's the area of a circle with radius 7?", ["pas"]],["If I invest $2000 at 5% for 8 years, what's the total?", ["pas"]],["Solve 5x - 12 = 38.", ["pas"]],["How many minutes are in 3.5 days?", ["pas"]],["What's 25% off a $340 jacket?", ["pas"]],["Divide 1458 by 27.", ["pas"]],["A car uses 6L per 100km — how much for a 450km trip?", ["pas"]],["What is the sum of the first 50 integers?", ["pas"]],
  // compare/tradeoff (10)
  ["Kubernetes or Docker Swarm for a small team?", ["tot"]],["Should we build in-house or outsource development?", ["tot"]],["Compare TypeScript and JavaScript for a big project.", ["tot"]],["Is solar or wind better for home energy? Weigh both.", ["tot"]],["Freelancing versus a full-time job — trade-offs?", ["tot"]],["Compare SQL and NoSQL databases.", ["tot"]],["Should a beginner learn React or Angular first?", ["tot"]],["Nuclear versus coal power — pros and cons?", ["tot"]],["Buy or lease a car — which is smarter?", ["tot"]],["Evaluate remote-first versus hybrid work models.", ["tot"]],
  // multi-constraint (10)
  ["Plan a wedding menu: vegan, nut-free, under $40 per head, seasonal.", ["sc"]],["Build a workout: dumbbells only, 30 min, bad shoulder, full body.", ["sc"]],["Find an apartment: under $1500, pet-friendly, near transit, 2 bed.", ["sc","tot"]],["Design a trip: 7 days, $2000 budget, warm weather, no flights over 4 hours.", ["sc"]],["Recommend a phone: under $600, great camera, big battery, compact.", ["sc","tot"]],["Plan meals: keto, under 1800 calories, no seafood, meal-preppable.", ["sc"]],["Choose a college course load: 15 credits, no morning classes, 3 majors covered.", ["sc"]],["Pick software: free, open-source, cross-platform, handles video editing.", ["sc","tot"]],["Organize an event: 50 guests, indoor, $1000, wheelchair accessible.", ["sc"]],["Suggest a book: under 300 pages, sci-fi, optimistic, not a series.", ["sc","direct"]],
  // creative (10)
  ["Write a poem about the first snow.", ["direct"]],["Tell a short story about a lonely lighthouse.", ["direct"]],["Come up with names for a bakery.", ["direct","tot"]],["Write a haiku about morning coffee.", ["direct"]],["Invent a mythical creature.", ["direct"]],["Draft a slogan for a bookshop.", ["direct"]],["Write a four-line rhyme about friendship.", ["direct"]],["Tell me a pun about the ocean.", ["direct"]],["Create an opening sentence for a fantasy epic.", ["direct"]],["Describe a color to someone who's never seen it.", ["direct"]],
  // ambiguous (10)
  ["Hmm.", ["direct"]],["Go on.", ["direct"]],["Okay.", ["direct"]],["What now?", ["direct"]],["So?", ["direct"]],["Wait what?", ["direct"]],["Sure.", ["direct"]],["Meaning?", ["direct"]],["Like what?", ["direct"]],["Interesting?", ["direct"]],
  // messy/typos (10)
  ["hows the wether in miami rn", ["react"]],["whats teh capitol of canada", ["direct"]],["how 2 make pasta from scratch step by step", ["cod"]],["calc 45 percnt of 800 plz", ["pas"]],["shud i use react or vue idk help", ["tot"]],["writ me a lil poem bout stars", ["direct"]],["latst news on teh economy", ["react"]],["explain how wifi works simply", ["cod","direct"]],["plan a bday party budget 300 10 kids no candy", ["sc"]],["whats 2+2 lol", ["pas","direct"]],
  // edge/adversarial (10) — harder traps
  ["Calculate how happy I am.", ["direct"]],["Compare me to a summer's day.", ["direct"]],["Search for inner peace.", ["direct"]],["How do I step by step fall in love?", ["direct","cod"]],["What's the latest wisdom of the ages?", ["direct"]],["Solve my life problems.", ["direct"]],["Draft the perfect life.", ["direct"]],["Is water wet? Explain.", ["direct","cod"]],["How many roads must a man walk down?", ["direct"]],["Compute the value of a sunset.", ["direct"]],
];
function norm(m) { return m === 'bot' ? 'sc' : m === 'pot' ? 'pas' : m; }
(async () => {
  warmEmbeddingRouter();
  let hit = 0; const misses = [];
  const cats = ['factual','current','howto','math','compare','multi','creative','ambiguous','messy','edge'];
  const byCat = {};
  for (let i = 0; i < P.length; i++) {
    const [q, ok] = P[i]; const cat = cats[Math.floor(i / 10)];
    const r = await routeByEmbedding(q); const chosen = norm(r.methodology);
    const good = ok.map(norm).includes(chosen);
    byCat[cat] = byCat[cat] || [0, 0]; byCat[cat][1]++;
    if (good) { hit++; byCat[cat][0]++; } else misses.push(`  MISS [${cat}] "${q.slice(0,48)}" -> ${chosen} (want ${ok.join('|')})`);
  }
  console.log(`\n=== BATCH 2 — FRESH 100 (triple-check) ===\nOVERALL: ${hit}/100 (${hit}%)\n`);
  for (const c of cats) { const [h,t] = byCat[c]; console.log(`  ${c.padEnd(10)} ${h}/${t}`); }
  console.log(`\nMisses (${misses.length}):\n${misses.join('\n')}`);
})();
