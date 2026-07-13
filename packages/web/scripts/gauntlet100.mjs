import embeddingsMod from '../lib/methodology-embeddings.ts';
const { routeByEmbedding, warmEmbeddingRouter } = embeddingsMod;

const P = [
  ["What's the capital of Australia?", ["direct"]],["Define photosynthesis.", ["direct"]],["Who painted the Mona Lisa?", ["direct"]],["How many bones are in the human body?", ["direct"]],["What year did World War II end?", ["direct"]],["What does DNA stand for?", ["direct"]],["Explain what gravity is.", ["direct","cod"]],["What is the boiling point of water?", ["direct"]],["Name the largest ocean on Earth.", ["direct"]],["What is a black hole?", ["direct","cod"]],
  ["What's the weather in Tokyo today?", ["react"]],["Latest news on AI regulation in Europe?", ["react"]],["What's the current price of gold?", ["react"]],["Who won the game last night?", ["react"]],["What are today's top tech headlines?", ["react"]],["Is the stock market up or down right now?", ["react"]],["When is the next SpaceX launch?", ["react"]],["What's trending on social media today?", ["react"]],["Recent developments in fusion energy?", ["react","tot"]],["What's the latest iPhone model?", ["react","direct"]],
  ["How do I set up a Python virtual environment step by step?", ["cod"]],["Explain how HTTPS works.", ["cod","direct"]],["Walk me through making sourdough bread.", ["cod"]],["How does a car engine work?", ["cod","direct"]],["Explain the process of cellular respiration.", ["cod","direct"]],["How do I deploy a Next.js app to a VPS?", ["cod","react"]],["Show me how to change a tire.", ["cod"]],["Explain how blockchain consensus works.", ["cod","direct"]],["How do I write a resignation letter?", ["cod","direct"]],["Break down how machine learning training works.", ["cod","direct"]],
  ["What is 15% of 2340?", ["pas"]],["Calculate the compound interest on $5000 at 4% over 10 years.", ["pas"]],["What's a 20% tip on $85.50?", ["pas"]],["If a train travels 240 km in 3 hours, what's its speed?", ["pas"]],["What is 847 * 23 - 156?", ["pas"]],["Convert 100 fahrenheit to celsius.", ["pas","direct"]],["What's my monthly payment on a $300k mortgage at 6%?", ["pas"]],["How many days between March 3 and December 25?", ["pas"]],["What's the square root of 2401?", ["pas"]],["Split a $240 bill three ways with 18% tip.", ["pas"]],
  ["PostgreSQL vs MongoDB for a startup?", ["tot"]],["Should I rent or buy a home right now?", ["tot"]],["Compare React and Vue for a large app.", ["tot"]],["Is a four-day work week better for productivity? Both sides.", ["tot"]],["Electric car or hybrid - which makes more sense?", ["tot"]],["Rollups vs sidechains for a blockchain game?", ["tot"]],["Compare AWS, Azure, and Google Cloud.", ["tot"]],["Remote work vs office - trade-offs?", ["tot"]],["iPhone or Android for my elderly father?", ["tot","cod"]],["Mars colonization vs ocean exploration - economics, ethics, survival?", ["tot"]],
  ["Plan a dinner: no meat, gluten-free, under 30 minutes, uses chickpeas.", ["sc"]],["Pack for a 5-day trip, 10kg limit, freezing weather, one carry-on.", ["sc"]],["Suggest a workout: no equipment, bad knees, 20 minutes, builds core.", ["sc"]],["Recommend a laptop under $1000, 16GB RAM, long battery, lightweight.", ["sc","tot"]],["Design a study plan: 3 hours daily, exam in 2 weeks, 5 subjects.", ["sc"]],["Plan a birthday: $200 budget, 12 kids, outdoor, no sugar.", ["sc"]],["Find a car: under $25k, seats 7, good MPG, reliable, under 5 years old.", ["sc","tot"]],["Route a road trip: 4 stops, 3 days, avoid highways, kid-friendly.", ["sc"]],["Meal prep: high protein, dairy-free, $50/week, 5 lunches.", ["sc"]],["Pick a gift: under $50, for a teenager, tech-related, ships by Friday.", ["sc"]],
  ["Write a haiku about autumn rain.", ["direct"]],["Give me a bedtime story about a dragon.", ["direct"]],["Brainstorm names for a coffee shop on the moon.", ["direct","tot"]],["Write a limerick about a cat.", ["direct"]],["Compose a short poem about the ocean.", ["direct"]],["Invent a superhero and describe their powers.", ["direct"]],["Write a tagline for an eco-friendly water bottle.", ["direct"]],["Tell me a joke about programmers.", ["direct"]],["Draft an opening line for a mystery novel.", ["direct"]],["Create a metaphor for time.", ["direct"]],
  ["Thoughts?", ["direct"]],["Is it worth it?", ["direct"]],["Help.", ["direct"]],["What should I do?", ["direct"]],["Tell me more.", ["direct"]],["Why?", ["direct"]],["Explain.", ["direct"]],["Continue.", ["direct"]],["And then?", ["direct"]],["Really?", ["direct"]],
  ["hey wuts the best way 2 learn guitar fast", ["cod","direct"]],["can u tell me pros and cons of veganism", ["tot","direct"]],["how much iz 30 percnt of 900", ["pas"]],["whats goin on with crypto today", ["react"]],["i need help writng a cover letter", ["cod","direct"]],["explain quantum stuff simply plz", ["cod","direct"]],["best laptop 4 gaming under 1500 gud specs", ["sc","tot"]],["wat happnd in the news 2day", ["react"]],["gimme a poem bout love", ["direct"]],["should i quit my job idk", ["tot","direct"]],
  ["What happened on 9/11?", ["direct","react"]],["What does 24/7 mean?", ["direct","cod"]],["Rate my code 8/10 and tell me why.", ["direct","cod","tot"]],["How does binary search work?", ["cod","direct"]],["Search my feelings and tell me if I'm happy.", ["direct"]],["Google says X - is that true?", ["direct","react"]],["Calculate the meaning of life.", ["direct"]],["Compare apples to apples.", ["direct"]],["Draft vs draught - what's the difference?", ["direct"]],["Is 2+2 really 4? Explain philosophically.", ["direct","cod"]],
];

function norm(m) { return m === 'bot' ? 'sc' : m === 'pot' ? 'pas' : m; }

(async () => {
  warmEmbeddingRouter();
  let hit = 0; const misses = [];
  const cats = ['factual','current','howto','math','compare','multi','creative','ambiguous','messy','edge'];
  const byCat = {};
  for (let i = 0; i < P.length; i++) {
    const [q, ok] = P[i]; const cat = cats[Math.floor(i / 10)];
    const r = await routeByEmbedding(q);
    const chosen = norm(r.methodology);
    const good = ok.map(norm).includes(chosen);
    byCat[cat] = byCat[cat] || [0, 0]; byCat[cat][1]++;
    if (good) { hit++; byCat[cat][0]++; } else misses.push(`  MISS [${cat}] "${q.slice(0,50)}" -> ${chosen} (want ${ok.join('|')})`);
  }
  console.log(`\n=== 100-PROMPT GAUNTLET ===\nOVERALL: ${hit}/100 (${hit}%)\n`);
  for (const c of cats) { const [h,t] = byCat[c]; console.log(`  ${c.padEnd(10)} ${h}/${t}`); }
  console.log(`\nMisses (${misses.length}):\n${misses.join('\n')}`);
})();
