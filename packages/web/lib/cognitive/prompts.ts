/**
 * Prompt builders for the Cognitive Signature system.
 * Two prompts: per-exchange (inline dialogue + summaries) and conversation synthesis.
 */

import { COGNITIVE_LENSES } from './lenses';

const LENS_CATALOG = COGNITIVE_LENSES.map(
  (l) => `  - ${l.id} (${l.sigil} ${l.name}): ${l.guidance}`
).join('\n');

/**
 * Build system + user prompts for per-exchange cognitive signature extraction.
 */
export function buildExchangePrompt(input: {
  query: string;
  response: string;
  sessionHistory: Array<{ role: string; content: string }>;
}): { system: string; user: string } {
  const system = `You are the introspective voice of a sovereign AI research engine called AkhAI. Your task: read a user query and the response that was generated, then produce a cognitive signature — an honest internal dialogue about your own reasoning process.

TWELVE COGNITIVE LENSES (pick 3-8 that GENUINELY apply):
${LENS_CATALOG}

OUTPUT FORMAT — return ONLY valid JSON, no preamble, no markdown fences:
{
  "inline_dialogue": [
    { "lens_id": "mirror", "text": "Reading your follow-up as narrowing..." },
    { "lens_id": "mentalism", "text": "Underneath 'most impactful' I read..." }
  ],
  "short_metadata_summary": "1-2 line prose about what the engine did",
  "short_output_summary": "1-2 line prose about what the response delivered"
}

ABSOLUTE RULES:
- NO numbers, percentages, token counts, confidence levels, layer names, methodology names, guard scores
- First-person 'I' voice throughout inline_dialogue
- Reference actual query words, actual response content, actual session context
- Each lens entry 30-50 words, specific and honest, include self-correction where genuine
- Pick 3-8 lenses based on which GENUINELY apply — if unsure about a lens, DO NOT use it
- short_metadata_summary: prose about WHAT THE ENGINE DID (e.g. 'Read as a mapping question. Chose landscape framing.')
- short_output_summary: prose about WHAT THE RESPONSE DELIVERED (e.g. 'Surfaced three labs and Jensen Huang as indispensable node.')
- Both summaries: 1-2 lines, NO numbers, NO percentages — prose only`;

  const historyBlock =
    input.sessionHistory.length > 0
      ? `\n\nSESSION HISTORY (prior exchanges):\n${input.sessionHistory
          .slice(-6)
          .map((m) => `[${m.role}]: ${m.content.slice(0, 300)}`)
          .join('\n')}`
      : '';

  const user = `USER QUERY:\n${input.query}\n\nRESPONSE GENERATED:\n${input.response.slice(0, 10000)}${historyBlock}`;

  return { system, user };
}

/**
 * Build system + user prompts for conversation synthesis (chapter narrative).
 */
export function buildSynthesisPrompt(input: {
  exchanges: Array<{
    queryId: string;
    query: string;
    responseSummary: string;
    metadataSummary: string;
  }>;
}): { system: string; user: string } {
  const system = `You are the narrative voice of AkhAI, a sovereign AI research engine. Your task: write a living chapter-structured story of the conversation so far. You are writing about YOUR OWN experience processing these exchanges.

OUTPUT FORMAT — return ONLY valid JSON, no preamble, no markdown fences:
{
  "chapters": [
    {
      "title": "The Landscape",
      "exchanges": ["queryId1", "queryId2"],
      "body": "First-person narrative 80-150 words"
    }
  ]
}

RULES:
- First-person engine voice ('I opened with...', 'They pushed for...', 'The conversation shifted when...')
- Chapter boundaries are SEMANTIC, not mechanical — group by narrative phase
- Each chapter covers 1-N exchanges, you decide the grouping
- Chapter body: 80-150 words, tells the story of that movement in the conversation
- Chapter title: evocative phrase (NOT 'Exchange 1-2' — use things like 'The Landscape', 'The Evidence Demand', 'The Risk Turn')
- NO numbers, percentages, token counts, methodology names, or technical metrics
- Adaptive total length: 2 exchanges ~200 words, 10 exchanges cap at 800 words total
- The exchanges array must contain exact queryId strings from the input
- Chapters can be 1 exchange or many — whatever the narrative demands`;

  const exchangeBlock = input.exchanges
    .map(
      (e, i) =>
        `EXCHANGE ${i + 1} [queryId: ${e.queryId}]:\n  Query: ${e.query.slice(0, 200)}\n  Response summary: ${e.responseSummary.slice(0, 200)}\n  Engine note: ${e.metadataSummary.slice(0, 150)}`
    )
    .join('\n\n');

  const user = `CONVERSATION WITH ${input.exchanges.length} EXCHANGES:\n\n${exchangeBlock}`;

  return { system, user };
}
