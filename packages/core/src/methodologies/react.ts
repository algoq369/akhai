/**
 * ReAct Methodology - Reasoning + Acting
 *
 * Based on "ReAct: Synergizing Reasoning and Acting in Language Models" (ICLR 2023)
 * Paper: https://arxiv.org/abs/2210.03629
 *
 * Key Innovation:
 * - Interleaves reasoning (thinking) with acting (tool use)
 * - Achieves superior performance on knowledge-intensive tasks
 * - Enables dynamic information seeking and fact verification
 * - More interpretable than chain-of-thought alone
 *
 * Best for:
 * - Questions requiring external information (web search)
 * - Mathematical calculations
 * - Fact-checking and verification
 * - Multi-step problem solving with tools
 */

import type { BaseProvider } from '../providers/base.js';
import type { CompletionRequest } from '../models/types.js';
import {
  createToolRegistry,
  searchTool,
  calculateTool,
  lookupTool,
  finishTool,
  type Tool,
  type ToolRegistry,
} from './tools/index.js';

/**
 * ReAct configuration options
 */
export interface ReActConfig {
  /** Maximum reasoning iterations (default: 10) */
  maxIterations?: number;

  /** Custom tools to register (in addition to defaults) */
  tools?: Tool[];

  /** Enable verbose logging (default: false) */
  verbose?: boolean;

  /** Maximum tokens per LLM call (default: 500) */
  maxTokens?: number;

  /** Temperature for generation (default: 0.3) */
  temperature?: number;
}

/**
 * ReAct step type
 */
export type ReActStepType = 'thought' | 'action' | 'observation';

/**
 * Single step in ReAct reasoning process
 */
export interface ReActStep {
  /** Step type */
  type: ReActStepType;

  /** Step content/description */
  content: string;

  /** Tool name (for action steps) */
  tool?: string;

  /** Tool parameters (for action steps) */
  params?: Record<string, any>;

  /** Iteration number when this step occurred */
  iteration: number;

  /** Timestamp */
  timestamp: number;
}

/**
 * ReAct execution result
 */
export interface ReActResult {
  /** Final answer */
  answer: string;

  /** Methodology used */
  methodology: 'react';

  /** All reasoning and action steps */
  steps: ReActStep[];

  /** Number of iterations used */
  iterations: number;

  /** List of tools that were called */
  toolsUsed: string[];

  /** Provider used */
  provider: string;

  /** Token usage */
  tokens: {
    input: number;
    output: number;
    total: number;
  };

  /** Execution time in milliseconds */
  latencyMs: number;

  /** Estimated cost in USD */
  cost: number;

  /** Whether max iterations was reached */
  maxIterationsReached: boolean;
}

/**
 * Default ReAct configuration
 */
const DEFAULT_CONFIG: Required<Omit<ReActConfig, 'tools'>> = {
  maxIterations: 10,
  verbose: false,
  maxTokens: 500,
  temperature: 0.3,
};

/**
 * Provider pricing (per 1K tokens)
 */
const PROVIDER_RATES: Record<string, { input: number; output: number }> = {
  deepseek: { input: 0.00055, output: 0.00219 },
  anthropic: { input: 0.003, output: 0.015 },
  mistral: { input: 0.0002, output: 0.0006 },
  xai: { input: 0.002, output: 0.01 },
};

/**
 * Execute ReAct reasoning + acting loop
 *
 * @param query - User query to solve
 * @param provider - AI provider instance
 * @param config - Optional configuration overrides
 * @returns ReAct execution result
 */
export async function executeReAct(
  query: string,
  provider: BaseProvider,
  config: ReActConfig = {}
): Promise<ReActResult> {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  const startTime = Date.now();

  // Create tool registry
  const registry = createToolRegistry();

  // Register default tools
  registry.register(searchTool);
  registry.register(calculateTool);
  registry.register(lookupTool);
  registry.register(finishTool);

  // Register custom tools
  config.tools?.forEach((tool) => registry.register(tool));

  // Initialize tracking
  const steps: ReActStep[] = [];
  const toolsUsed = new Set<string>();
  let iteration = 0;
  let finished = false;
  let finalAnswer = '';
  let totalInputTokens = 0;
  let totalOutputTokens = 0;

  // Build system prompt with tool descriptions
  const systemPrompt = buildSystemPrompt(registry);

  // Initialize conversation context
  let context = `Question: ${query}\n\n`;

  if (cfg.verbose) {
    console.log('[ReAct] Starting reasoning loop');
    console.log(`[ReAct] Question: ${query}`);
    console.log(`[ReAct] Available tools: ${registry.list().map(t => t.name).join(', ')}`);
  }

  // ReAct loop: Thought → Action → Observation → repeat
  while (!finished && iteration < cfg.maxIterations) {
    iteration++;

    if (cfg.verbose) {
      console.log(`\n[ReAct] === Iteration ${iteration} ===`);
    }

    // Get next step from LLM
    const request: CompletionRequest = {
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: context },
      ],
      maxTokens: cfg.maxTokens,
      temperature: cfg.temperature,
    };

    const response = await provider.complete(request);

    // Track tokens
    const inputTokens = response.usage?.inputTokens || estimateTokens(systemPrompt + context);
    const outputTokens = response.usage?.outputTokens || estimateTokens(response.content);
    totalInputTokens += inputTokens;
    totalOutputTokens += outputTokens;

    // Parse LLM response
    const parsed = parseReActResponse(response.content);

    if (cfg.verbose) {
      console.log(`[ReAct] Parsed: ${parsed.type} - ${parsed.content.substring(0, 80)}...`);
    }

    // Handle thought
    if (parsed.type === 'thought') {
      steps.push({
        type: 'thought',
        content: parsed.content,
        iteration,
        timestamp: Date.now(),
      });
      context += `Thought: ${parsed.content}\n`;
    }

    // Handle action
    else if (parsed.type === 'action') {
      const tool = registry.get(parsed.tool!);

      if (!tool) {
        // Tool not found
        const errorMsg = `Tool "${parsed.tool}" not found. Available tools: ${registry.list().map(t => t.name).join(', ')}`;
        steps.push({
          type: 'observation',
          content: errorMsg,
          iteration,
          timestamp: Date.now(),
        });
        context += `Observation: ${errorMsg}\n`;
        continue;
      }

      // Record action
      steps.push({
        type: 'action',
        content: `${parsed.tool}(${JSON.stringify(parsed.params)})`,
        tool: parsed.tool,
        params: parsed.params,
        iteration,
        timestamp: Date.now(),
      });

      context += `Action: ${parsed.tool}(${JSON.stringify(parsed.params)})\n`;

      // Check if this is finish tool
      if (parsed.tool === 'finish') {
        finalAnswer = parsed.params?.answer || '';
        finished = true;

        if (cfg.verbose) {
          console.log(`[ReAct] Finish called with answer: ${finalAnswer.substring(0, 80)}...`);
        }
        break;
      }

      // Execute tool
      try {
        const result = await tool.execute(parsed.params || {});

        steps.push({
          type: 'observation',
          content: result,
          iteration,
          timestamp: Date.now(),
        });

        context += `Observation: ${result}\n`;
        if (parsed.tool) {
          toolsUsed.add(parsed.tool);
        }

        if (cfg.verbose) {
          console.log(`[ReAct] Tool result: ${result.substring(0, 80)}...`);
        }
      } catch (error) {
        const errorMsg = `Error executing ${parsed.tool}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        steps.push({
          type: 'observation',
          content: errorMsg,
          iteration,
          timestamp: Date.now(),
        });
        context += `Observation: ${errorMsg}\n`;

        if (cfg.verbose) {
          console.error(`[ReAct] Tool error:`, error);
        }
      }
    }

    // Handle finish (without tool call)
    else if (parsed.type === 'finish') {
      finalAnswer = parsed.content;
      finished = true;

      if (cfg.verbose) {
        console.log(`[ReAct] Finished with answer: ${finalAnswer.substring(0, 80)}...`);
      }
    }
  }

  // Calculate metrics
  const totalTokens = totalInputTokens + totalOutputTokens;
  const providerFamily = (provider as any).family as string;
  const cost = calculateCost(providerFamily, totalInputTokens, totalOutputTokens);
  const latencyMs = Date.now() - startTime;

  if (cfg.verbose) {
    console.log(`\n[ReAct] Execution complete:`);
    console.log(`  - Iterations: ${iteration}`);
    console.log(`  - Steps: ${steps.length}`);
    console.log(`  - Tools used: ${Array.from(toolsUsed).join(', ') || 'none'}`);
    console.log(`  - Tokens: ${totalTokens}`);
    console.log(`  - Cost: $${cost.toFixed(4)}`);
    console.log(`  - Latency: ${latencyMs}ms`);
  }

  return {
    answer: finalAnswer || 'Unable to determine answer (max iterations reached)',
    methodology: 'react',
    steps,
    iterations: iteration,
    toolsUsed: Array.from(toolsUsed),
    provider: providerFamily,
    tokens: {
      input: totalInputTokens,
      output: totalOutputTokens,
      total: totalTokens,
    },
    latencyMs,
    cost,
    maxIterationsReached: iteration >= cfg.maxIterations && !finished,
  };
}

/**
 * Build system prompt with tool descriptions
 */
function buildSystemPrompt(registry: ToolRegistry): string {
  return `You are a reasoning agent that solves problems step-by-step using tools.

Available tools:
${registry.getToolDescriptions()}

For each step, respond with EXACTLY ONE of:
1. Thought: [your reasoning about what to do next]
2. Action: [tool_name](param1="value1", param2="value2")
3. Finish: [your final answer]

Rules:
- Always think before acting
- Use tools when you need external information or calculations
- Be explicit about your reasoning in Thought steps
- When using Action, specify the exact tool and parameters
- Call finish() when you have the complete answer

Example:
Thought: I need to find the current price of bitcoin
Action: search(query="current bitcoin price USD")
Observation: [search results showing $45,000]
Thought: I have the information I need
Finish: The current bitcoin price is approximately $45,000 USD.`;
}

/**
 * Parse ReAct response from LLM
 */
function parseReActResponse(response: string): {
  type: 'thought' | 'action' | 'finish';
  content: string;
  tool?: string;
  params?: Record<string, any>;
} {
  const trimmed = response.trim();

  // Pattern 1: Thought
  const thoughtMatch = trimmed.match(/^Thought:\s*(.+)/i);
  if (thoughtMatch) {
    return {
      type: 'thought',
      content: thoughtMatch[1].trim(),
    };
  }

  // Pattern 2: Action with parameters
  const actionMatch = trimmed.match(/^Action:\s*(\w+)\((.+?)\)/i);
  if (actionMatch) {
    const tool = actionMatch[1];
    const paramsStr = actionMatch[2];

    // Parse parameters (key="value" format)
    const params: Record<string, any> = {};
    const paramMatches = paramsStr.matchAll(/(\w+)="([^"]+)"/g);
    for (const m of paramMatches) {
      params[m[1]] = m[2];
    }

    return {
      type: 'action',
      content: trimmed,
      tool,
      params,
    };
  }

  // Pattern 3: Finish
  const finishMatch = trimmed.match(/^Finish:\s*(.+)/is);
  if (finishMatch) {
    return {
      type: 'finish',
      content: finishMatch[1].trim(),
    };
  }

  // Default: treat as thought
  return {
    type: 'thought',
    content: trimmed,
  };
}

/**
 * Estimate token count from text
 */
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * Calculate cost based on provider and token usage
 */
function calculateCost(providerName: string, inputTokens: number, outputTokens: number): number {
  const normalizedName = providerName.toLowerCase();
  const rate = PROVIDER_RATES[normalizedName] || PROVIDER_RATES.deepseek;

  return (inputTokens * rate.input + outputTokens * rate.output) / 1000;
}

// Re-export tools for convenience
export {
  createToolRegistry,
  searchTool,
  calculateTool,
  lookupTool,
  finishTool,
  type Tool,
  type ToolParameter,
  type ToolRegistry,
} from './tools/index.js';

/**
 * Export for use as default
 */
export default executeReAct;
