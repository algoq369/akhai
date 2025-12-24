/**
 * Program of Thought (PoT) Methodology - Code-Based Reasoning
 *
 * Based on "Program of Thoughts Prompting: Disentangling Computation from Reasoning" (2022)
 * Paper: https://arxiv.org/abs/2211.12588
 *
 * Key Innovation:
 * - Generates executable code instead of natural language reasoning
 * - Separates reasoning (what to compute) from computation (how to compute)
 * - Achieves +24% accuracy on mathematical and computational tasks
 * - More reliable than chain-of-thought for numerical problems
 *
 * Best for:
 * - Mathematical calculations
 * - Financial computations
 * - Statistical analysis
 * - Algorithmic problem solving
 */

import type { BaseProvider } from '../providers/base.js';
import type { CompletionRequest } from '../models/types.js';

/**
 * PoT configuration options
 */
export interface PoTConfig {
  /** Maximum code generation iterations (default: 5) */
  maxIterations?: number;

  /** Programming language (default: 'javascript') */
  language?: 'javascript' | 'python';

  /** Enable verbose logging (default: false) */
  verbose?: boolean;

  /** Maximum tokens per LLM call (default: 800) */
  maxTokens?: number;

  /** Temperature for generation (default: 0.2 - lower for code) */
  temperature?: number;

  /** Timeout for code execution in milliseconds (default: 5000) */
  executionTimeout?: number;

  /** Maximum code length in characters (default: 2000) */
  maxCodeLength?: number;
}

/**
 * PoT step type
 */
export type PoTStepType = 'reasoning' | 'code-generation' | 'execution' | 'result';

/**
 * Single step in PoT process
 */
export interface PoTStep {
  /** Step type */
  type: PoTStepType;

  /** Step content */
  content: string;

  /** Generated code (for code-generation steps) */
  code?: string;

  /** Execution result (for execution steps) */
  executionResult?: string;

  /** Error message (if step failed) */
  error?: string;

  /** Iteration number */
  iteration: number;

  /** Timestamp */
  timestamp: number;
}

/**
 * PoT execution result
 */
export interface PoTResult {
  /** Final answer */
  answer: string;

  /** Methodology used */
  methodology: 'pot';

  /** All reasoning and execution steps */
  steps: PoTStep[];

  /** Number of iterations used */
  iterations: number;

  /** Generated code that produced the answer */
  finalCode: string;

  /** Language used */
  language: 'javascript' | 'python';

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

  /** Whether code execution succeeded */
  executionSucceeded: boolean;
}

/**
 * Default PoT configuration
 */
const DEFAULT_CONFIG: Required<Omit<PoTConfig, 'language'>> & { language: 'javascript' | 'python' } = {
  maxIterations: 5,
  language: 'javascript',
  verbose: false,
  maxTokens: 800,
  temperature: 0.2,
  executionTimeout: 5000,
  maxCodeLength: 2000,
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
 * Execute Program of Thought reasoning
 *
 * @param query - User query to solve
 * @param provider - AI provider instance
 * @param config - Optional configuration overrides
 * @returns PoT execution result
 */
export async function executeProgramOfThought(
  query: string,
  provider: BaseProvider,
  config: PoTConfig = {}
): Promise<PoTResult> {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  const startTime = Date.now();

  // Initialize tracking
  const steps: PoTStep[] = [];
  let iteration = 0;
  let finished = false;
  let finalAnswer = '';
  let finalCode = '';
  let executionSucceeded = false;
  let totalInputTokens = 0;
  let totalOutputTokens = 0;

  // Build system prompt
  const systemPrompt = buildSystemPrompt(cfg.language);

  // Initialize context
  let context = `Problem: ${query}\n\n`;

  if (cfg.verbose) {
    console.log('[PoT] Starting Program of Thought reasoning');
    console.log(`[PoT] Problem: ${query}`);
    console.log(`[PoT] Language: ${cfg.language}`);
  }

  // PoT loop: Reasoning → Code Generation → Execution → repeat
  while (!finished && iteration < cfg.maxIterations) {
    iteration++;

    if (cfg.verbose) {
      console.log(`\n[PoT] === Iteration ${iteration} ===`);
    }

    // Get reasoning and code from LLM
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

    // Parse response
    const parsed = parsePoTResponse(response.content, cfg.language);

    if (cfg.verbose) {
      console.log(`[PoT] Reasoning: ${parsed.reasoning.substring(0, 80)}...`);
      if (parsed.code) {
        console.log(`[PoT] Code length: ${parsed.code.length} chars`);
      }
    }

    // Record reasoning step
    steps.push({
      type: 'reasoning',
      content: parsed.reasoning,
      iteration,
      timestamp: Date.now(),
    });

    context += `Reasoning: ${parsed.reasoning}\n`;

    // If no code generated, continue to next iteration
    if (!parsed.code) {
      if (cfg.verbose) {
        console.log('[PoT] No code generated, requesting code...');
      }
      context += 'Please provide the code to solve this problem.\n';
      continue;
    }

    // Validate code length
    if (parsed.code.length > cfg.maxCodeLength) {
      steps.push({
        type: 'code-generation',
        content: 'Code too long',
        code: parsed.code.substring(0, 100) + '...',
        error: `Code exceeds maximum length of ${cfg.maxCodeLength} characters`,
        iteration,
        timestamp: Date.now(),
      });
      context += `Error: Code is too long (${parsed.code.length} chars). Please simplify.\n`;
      continue;
    }

    // Record code generation step
    steps.push({
      type: 'code-generation',
      content: `Generated ${cfg.language} code`,
      code: parsed.code,
      iteration,
      timestamp: Date.now(),
    });

    context += `Code:\n\`\`\`${cfg.language}\n${parsed.code}\n\`\`\`\n`;

    // Execute code
    try {
      const executionResult = await executeCode(parsed.code, cfg.language, cfg.executionTimeout);

      if (cfg.verbose) {
        console.log(`[PoT] Execution result: ${executionResult.substring(0, 80)}...`);
      }

      // Record execution step
      steps.push({
        type: 'execution',
        content: 'Code executed successfully',
        executionResult,
        iteration,
        timestamp: Date.now(),
      });

      context += `Execution Result: ${executionResult}\n`;

      // Check if result is final answer
      if (parsed.isFinal || iteration >= cfg.maxIterations - 1) {
        finalAnswer = executionResult;
        finalCode = parsed.code;
        executionSucceeded = true;
        finished = true;

        steps.push({
          type: 'result',
          content: finalAnswer,
          iteration,
          timestamp: Date.now(),
        });

        if (cfg.verbose) {
          console.log(`[PoT] Final answer obtained: ${finalAnswer.substring(0, 80)}...`);
        }
      } else {
        // Ask for interpretation or next step
        context += 'Does this solve the problem? If yes, provide the final answer. If no, what should we compute next?\n';
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown execution error';

      if (cfg.verbose) {
        console.error(`[PoT] Execution error:`, error);
      }

      // Record execution error
      steps.push({
        type: 'execution',
        content: 'Code execution failed',
        error: errorMsg,
        iteration,
        timestamp: Date.now(),
      });

      context += `Execution Error: ${errorMsg}\nPlease fix the code.\n`;
    }
  }

  // Calculate metrics
  const totalTokens = totalInputTokens + totalOutputTokens;
  const providerFamily = (provider as any).family as string;
  const cost = calculateCost(providerFamily, totalInputTokens, totalOutputTokens);
  const latencyMs = Date.now() - startTime;

  if (cfg.verbose) {
    console.log(`\n[PoT] Execution complete:`);
    console.log(`  - Iterations: ${iteration}`);
    console.log(`  - Steps: ${steps.length}`);
    console.log(`  - Success: ${executionSucceeded}`);
    console.log(`  - Tokens: ${totalTokens}`);
    console.log(`  - Cost: $${cost.toFixed(4)}`);
    console.log(`  - Latency: ${latencyMs}ms`);
  }

  return {
    answer: finalAnswer || 'Unable to determine answer (execution failed or max iterations reached)',
    methodology: 'pot',
    steps,
    iterations: iteration,
    finalCode,
    language: cfg.language,
    provider: providerFamily,
    tokens: {
      input: totalInputTokens,
      output: totalOutputTokens,
      total: totalTokens,
    },
    latencyMs,
    cost,
    maxIterationsReached: iteration >= cfg.maxIterations && !finished,
    executionSucceeded,
  };
}

/**
 * Build system prompt for PoT
 */
function buildSystemPrompt(language: 'javascript' | 'python'): string {
  const langExamples = language === 'javascript'
    ? `
Example 1:
Problem: Calculate the area of a circle with radius 5
Reasoning: I need to use the formula A = πr²
Code:
\`\`\`javascript
const radius = 5;
const area = Math.PI * radius * radius;
console.log(area);
\`\`\`

Example 2:
Problem: Find the sum of first 100 natural numbers
Reasoning: I can use the formula n(n+1)/2 or a loop
Code:
\`\`\`javascript
const n = 100;
const sum = (n * (n + 1)) / 2;
console.log(sum);
\`\`\``
    : `
Example 1:
Problem: Calculate the area of a circle with radius 5
Reasoning: I need to use the formula A = πr²
Code:
\`\`\`python
import math
radius = 5
area = math.pi * radius ** 2
print(area)
\`\`\`

Example 2:
Problem: Find the sum of first 100 natural numbers
Reasoning: I can use the formula n(n+1)/2 or a loop
Code:
\`\`\`python
n = 100
sum_n = (n * (n + 1)) // 2
print(sum_n)
\`\`\``;

  return `You are a Program of Thought (PoT) reasoning agent. You solve problems by generating executable code.

For each problem:
1. First, explain your reasoning about what needs to be computed
2. Then, write clean, executable ${language} code to perform the computation
3. The code should print or return the final result

Format your response as:
Reasoning: [explain what you will compute and why]
Code:
\`\`\`${language}
[your executable code]
\`\`\`

Important rules:
- Write self-contained code that can be executed directly
- Use console.log() (JavaScript) or print() (Python) to output results
- Keep code simple and focused on the computation
- Avoid external dependencies or file I/O
- Use standard math libraries when needed
${langExamples}`;
}

/**
 * Parse PoT response from LLM
 */
function parsePoTResponse(
  response: string,
  language: 'javascript' | 'python'
): {
  reasoning: string;
  code: string | null;
  isFinal: boolean;
} {
  const trimmed = response.trim();

  // Extract reasoning
  const reasoningMatch = trimmed.match(/Reasoning:\s*(.+?)(?=\nCode:|$)/is);
  const reasoning = reasoningMatch ? reasoningMatch[1].trim() : trimmed;

  // Extract code block
  const codeBlockRegex = new RegExp(`\`\`\`(?:${language})?\\s*([\\s\\S]+?)\`\`\``, 'i');
  const codeMatch = trimmed.match(codeBlockRegex);
  const code = codeMatch ? codeMatch[1].trim() : null;

  // Check if this seems to be a final answer
  const isFinal = /final answer|result is|answer:|solution:/i.test(reasoning);

  return {
    reasoning,
    code,
    isFinal,
  };
}

/**
 * Execute code safely in sandbox
 */
async function executeCode(
  code: string,
  language: 'javascript' | 'python',
  timeout: number
): Promise<string> {
  if (language === 'python') {
    throw new Error('Python execution not yet implemented. Use language: "javascript" for now.');
  }

  // For JavaScript, use Function constructor with captured output
  return executeJavaScript(code, timeout);
}

/**
 * Execute JavaScript code with captured console output
 */
async function executeJavaScript(code: string, timeout: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const outputs: string[] = [];

    // Create a timeout
    const timer = setTimeout(() => {
      reject(new Error(`Execution timeout after ${timeout}ms`));
    }, timeout);

    try {
      // Capture console.log output
      const mockConsole = {
        log: (...args: any[]) => {
          outputs.push(args.map(arg => String(arg)).join(' '));
        },
      };

      // Create sandboxed function
      const fn = new Function('console', 'Math', code);

      // Execute
      fn(mockConsole, Math);

      clearTimeout(timer);

      // Return captured output
      if (outputs.length === 0) {
        reject(new Error('Code executed but produced no output. Use console.log() to output results.'));
      } else {
        resolve(outputs.join('\n'));
      }
    } catch (error) {
      clearTimeout(timer);
      reject(new Error(`Execution error: ${error instanceof Error ? error.message : 'Unknown error'}`));
    }
  });
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

/**
 * Export for use as default
 */
export default executeProgramOfThought;
