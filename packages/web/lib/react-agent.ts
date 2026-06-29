import 'server-only';
import { generateText, tool, stepCountIs, type LanguageModel } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { z } from 'zod';
import { webSearchCore, type SearchResult } from './web-search-core';
import { MODELS } from './models';

/** Output the web_search tool returns to the model — also the source of grounding URLs. */
interface WebSearchToolOutput {
  results: SearchResult[];
  note?: string;
}

/** A single observable step in the agent loop. Exposed for S2.2 step inspection. */
export interface ReactStep {
  type: 'tool-call' | 'tool-result' | 'text';
  toolName?: string;
  text?: string;
}

export interface ReactResult {
  text: string;
  sources: { title: string; url: string }[]; // for grounding context in S2.2
  steps: number;
}

/**
 * Real ReAct agent loop.
 *
 * The model reasons, calls the real web_search tool when it needs current/factual
 * information, observes the actual results, and produces a grounded final answer.
 * This replaces the old prompt-only simulation (which faked [OBSERVATION] text and
 * never hit a search provider).
 *
 * `model` is injectable for deterministic testing; it defaults to the premium model.
 */
export async function runReactAgent(
  query: string,
  model: LanguageModel = anthropic(MODELS.premium)
): Promise<ReactResult> {
  const result = await generateText({
    model,
    stopWhen: stepCountIs(5),
    tools: {
      web_search: tool({
        description: 'Search the web for current/factual information. Returns real results.',
        inputSchema: z.object({ query: z.string().describe('search query') }),
        execute: async ({ query }): Promise<WebSearchToolOutput> => {
          const r = await webSearchCore(query, 5);
          return r.unavailable ? { results: [], note: 'search unavailable' } : { results: r.results };
        },
      }),
    },
    system:
      'You are a research agent. Use web_search for any question needing current or factual lookup. Reason step by step, search when needed, then give a grounded final answer citing what you found.',
    prompt: query,
  });

  // Collect sources from the real tool results across all steps (deduped by URL) for S2.2 grounding.
  const seen = new Set<string>();
  const sources: { title: string; url: string }[] = [];
  for (const step of result.steps) {
    for (const toolResult of step.staticToolResults) {
      if (toolResult.toolName !== 'web_search') continue;
      for (const r of toolResult.output.results) {
        if (r.url && !seen.has(r.url)) {
          seen.add(r.url);
          sources.push({ title: r.title, url: r.url });
        }
      }
    }
  }

  return { text: result.text, sources, steps: result.steps.length };
}
