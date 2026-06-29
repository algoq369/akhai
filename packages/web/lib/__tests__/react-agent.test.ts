/**
 * S2.1 — real ReAct agent loop (deterministic; no network, no real LLM).
 *
 * Drives runReactAgent with AI SDK 6's MockLanguageModelV3: turn 1 emits a
 * web_search tool call, turn 2 emits the final text. webSearchCore is mocked, so
 * no real HTTP happens. This proves the loop actually executes the (mocked) real
 * search and that runReactAgent returns the final text + sources extracted from
 * genuine tool results — not the old faked [OBSERVATION] simulation.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MockLanguageModelV3 } from 'ai/test';

vi.mock('../web-search-core', () => ({ webSearchCore: vi.fn() }));

import { runReactAgent } from '../react-agent';
import { webSearchCore } from '../web-search-core';

const mockedSearch = vi.mocked(webSearchCore);

const usage = {
  inputTokens: { total: 10, noCache: 10, cacheRead: 0, cacheWrite: 0 },
  outputTokens: { total: 5, text: 5, reasoning: 0 },
};

/**
 * Mock model: step 1 → web_search tool call, step 2 → final text.
 *
 * Uses the function form of doGenerate (not the array form) with an explicit
 * counter: in ai@6.0.154 the array form pushes the call before indexing by
 * length, so array index 0 is unreachable. The function form is unambiguous.
 */
function twoTurnModel(searchQuery: string, finalText: string): MockLanguageModelV3 {
  let call = 0;
  return new MockLanguageModelV3({
    modelId: 'mock-react',
    doGenerate: async () => {
      call += 1;
      if (call === 1) {
        return {
          content: [
            {
              type: 'tool-call',
              toolCallId: 'call-1',
              toolName: 'web_search',
              input: JSON.stringify({ query: searchQuery }),
            },
          ],
          finishReason: { unified: 'tool-calls', raw: undefined },
          usage,
          warnings: [],
        };
      }
      return {
        content: [{ type: 'text', text: finalText }],
        finishReason: { unified: 'stop', raw: undefined },
        usage,
        warnings: [],
      };
    },
  });
}

beforeEach(() => {
  mockedSearch.mockReset();
});

describe('runReactAgent — real loop wiring', () => {
  it('model tool-call → (mocked) real search → final text + extracted sources', async () => {
    mockedSearch.mockResolvedValue({
      results: [
        { title: 'Iceland', snippet: 'Reykjavik is the capital.', url: 'https://example.com/iceland' },
      ],
      source: 'Brave',
      unavailable: false,
    });

    const model = twoTurnModel('capital of Iceland', 'Reykjavik is the capital of Iceland.');
    const result = await runReactAgent('What is the capital of Iceland?', model);

    // The loop actually invoked the (mocked) real search with the model's chosen query.
    expect(mockedSearch).toHaveBeenCalledWith('capital of Iceland', 5);
    expect(result.text).toBe('Reykjavik is the capital of Iceland.');
    expect(result.sources).toEqual([{ title: 'Iceland', url: 'https://example.com/iceland' }]);
    expect(result.steps).toBe(2);

    // usage is mapped from the model's reported tokens (for the live pipeline's metrics).
    expect(typeof result.usage.inputTokens).toBe('number');
    expect(typeof result.usage.outputTokens).toBe('number');
    expect(typeof result.usage.totalTokens).toBe('number');
    expect(result.usage.inputTokens).toBeGreaterThan(0);
    expect(result.usage.outputTokens).toBeGreaterThan(0);
  });

  it('honest-empty search → no sources, loop still completes', async () => {
    mockedSearch.mockResolvedValue({ results: [], source: 'none', unavailable: true });

    const model = twoTurnModel('obscure unindexed thing', 'I could not find reliable sources.');
    const result = await runReactAgent('Find an obscure unindexed thing', model);

    expect(mockedSearch).toHaveBeenCalledWith('obscure unindexed thing', 5);
    expect(result.text).toBe('I could not find reliable sources.');
    expect(result.sources).toEqual([]);
  });
});
