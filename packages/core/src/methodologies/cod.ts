/**
 * Chain of Draft (CoD) Methodology
 *
 * Based on research paper arXiv:2502.18600 "Chain of Draft: Thinking Faster by Writing Less"
 *
 * Key Innovation:
 * - Achieves SAME accuracy as Chain of Thought (CoT) with only ~8% of the tokens
 * - Uses minimal shorthand reasoning (5 words or less per step)
 * - 92% cost reduction compared to standard CoT
 * - Faster inference time (~5-10s vs ~30s for CoT)
 *
 * Best for:
 * - Procedural "how to" queries
 * - Cost-sensitive applications
 * - High-volume query scenarios
 * - Step-by-step problem solving
 */

import type { BaseProvider } from '../providers/base.js';
import type { CompletionRequest } from '../models/types.js';

/**
 * CoD configuration options
 */
export interface CoDConfig {
  /** Maximum words per reasoning step (default: 5) */
  maxWordsPerStep: number;
  
  /** Maximum number of reasoning steps (default: 10) */
  maxSteps: number;
  
  /** Maximum tokens in response (default: 300, vs 1000+ for CoT) */
  maxTokens: number;
  
  /** Temperature for generation (default: 0.3 for focused reasoning) */
  temperature: number;
}

/**
 * CoD execution result
 */
export interface CoDResult {
  /** Final answer extracted from reasoning */
  answer: string;
  
  /** Methodology used */
  methodology: 'cod';
  
  /** Concise reasoning steps */
  reasoning: string;
  
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
  
  /** Metadata about execution */
  metadata: {
    wordsPerStep: number;
    actualSteps: number;
    tokenSavings: string;
    comparisonToCoT: {
      estimatedCoTTokens: number;
      actualCoDTokens: number;
      savingsPercent: number;
    };
  };
}

/**
 * Default CoD configuration
 */
const DEFAULT_CONFIG: CoDConfig = {
  maxWordsPerStep: 5,
  maxSteps: 10,
  maxTokens: 300,
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
 * Execute Chain of Draft reasoning
 *
 * @param query - User query to solve
 * @param provider - AI provider instance
 * @param config - Optional configuration overrides
 * @returns CoD execution result
 */
export async function executeChainOfDraft(
  query: string,
  provider: BaseProvider,
  config: Partial<CoDConfig> = {}
): Promise<CoDResult> {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  const startTime = Date.now();

  // Construct prompt emphasizing concise reasoning
  const prompt = buildCoDPrompt(query, cfg);

  // Create completion request
  const request: CompletionRequest = {
    messages: [{ role: 'user', content: prompt }],
    maxTokens: cfg.maxTokens,
    temperature: cfg.temperature,
  };

  // Generate response with token limits
  const completion = await provider.complete(request);

  // Extract final answer from concise reasoning
  const finalAnswer = extractFinalAnswer(completion.content);

  // Calculate token usage
  const inputTokens = completion.usage?.inputTokens || estimateTokens(prompt);
  const outputTokens = completion.usage?.outputTokens || estimateTokens(completion.content);
  const totalTokens = inputTokens + outputTokens;

  // Get provider family (accessing protected property)
  const providerFamily = (provider as any).family as string;

  // Calculate cost
  const cost = calculateCost(providerFamily, inputTokens, outputTokens);

  // Calculate metadata
  const actualSteps = countSteps(completion.content);
  const estimatedCoTTokens = totalTokens * 12.5; // CoD uses ~8% of CoT tokens
  const savingsPercent = Math.round(((estimatedCoTTokens - totalTokens) / estimatedCoTTokens) * 100);

  return {
    answer: finalAnswer,
    methodology: 'cod',
    reasoning: completion.content,
    provider: providerFamily,
    tokens: {
      input: inputTokens,
      output: outputTokens,
      total: totalTokens,
    },
    latencyMs: Date.now() - startTime,
    cost,
    metadata: {
      wordsPerStep: cfg.maxWordsPerStep,
      actualSteps,
      tokenSavings: '~92% vs CoT',
      comparisonToCoT: {
        estimatedCoTTokens: Math.round(estimatedCoTTokens),
        actualCoDTokens: totalTokens,
        savingsPercent,
      },
    },
  };
}

/**
 * Build CoD prompt emphasizing concise reasoning
 *
 * @param query - User query
 * @param config - CoD configuration
 * @returns Formatted prompt
 */
function buildCoDPrompt(query: string, config: CoDConfig): string {
  return `Solve the following problem using extremely concise step-by-step reasoning.

**CRITICAL INSTRUCTIONS:**
- Each reasoning step must be ${config.maxWordsPerStep} words or less
- Use shorthand, abbreviations, and minimal words
- Maintain logical accuracy while being brief
- Number each step (1., 2., 3., etc.)
- End with "Final Answer: [your answer]"

**EXAMPLES OF CONCISE STEPS:**
❌ BAD: "First, we need to identify the variables in the equation and then set up the relationship between them."
✅ GOOD: "1. Identify vars: x, y"

❌ BAD: "The next step is to add the two numbers together to get the sum."
✅ GOOD: "2. Add: 5+3=8"

**Problem:** ${query}

**Concise reasoning (max ${config.maxWordsPerStep} words/step, max ${config.maxSteps} steps):**

1.`;
}

/**
 * Extract final answer from CoD reasoning
 *
 * @param response - AI response with reasoning
 * @returns Extracted answer
 */
function extractFinalAnswer(response: string): string {
  // Pattern 1: Explicit "Final Answer:" marker
  const finalAnswerMatch = response.match(/(?:Final Answer|Answer|Result|Therefore|Thus|So|Conclusion):\s*(.+?)(?:\n|$)/i);
  if (finalAnswerMatch) {
    return finalAnswerMatch[1].trim();
  }

  // Pattern 2: Markdown heading (####)
  const headingMatch = response.match(/####\s*(.+?)(?:\n|$)/);
  if (headingMatch) {
    return headingMatch[1].trim();
  }

  // Pattern 3: Bold answer (**Answer**)
  const boldMatch = response.match(/\*\*(?:Answer|Result)\*\*:\s*(.+?)(?:\n|$)/i);
  if (boldMatch) {
    return boldMatch[1].trim();
  }

  // Fallback: Extract last numbered step or last non-empty line
  const lines = response.trim().split('\n').filter(l => l.trim());
  const lastLine = lines[lines.length - 1] || '';
  
  // Remove step numbering (e.g., "5. Answer: 42" → "Answer: 42")
  return lastLine.replace(/^\d+\.\s*/, '').trim() || response;
}

/**
 * Count number of reasoning steps in response
 *
 * @param response - AI response
 * @returns Number of steps
 */
function countSteps(response: string): number {
  const stepPattern = /^\d+\./gm;
  const matches = response.match(stepPattern);
  return matches ? matches.length : 0;
}

/**
 * Estimate token count from text
 *
 * @param text - Input text
 * @returns Estimated token count
 */
function estimateTokens(text: string): number {
  // Rough estimation: ~4 characters per token on average
  return Math.ceil(text.length / 4);
}

/**
 * Calculate cost based on provider and token usage
 *
 * @param providerName - Provider name
 * @param inputTokens - Input token count
 * @param outputTokens - Output token count
 * @returns Cost in USD
 */
function calculateCost(providerName: string, inputTokens: number, outputTokens: number): number {
  const normalizedName = providerName.toLowerCase();
  const rate = PROVIDER_RATES[normalizedName] || PROVIDER_RATES.deepseek;
  
  // Rates are per 1K tokens
  return (inputTokens * rate.input + outputTokens * rate.output) / 1000;
}

/**
 * Export for use as default
 */
export default executeChainOfDraft;
