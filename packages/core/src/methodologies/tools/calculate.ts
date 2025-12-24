/**
 * Calculate Tool - Safe mathematical expression evaluation
 *
 * Evaluates mathematical expressions safely without using eval()
 * Supports basic arithmetic, exponentiation, and common math functions
 */

import type { Tool } from './index.js';

/**
 * Safe math evaluator - avoids eval() security issues
 * Supports: +, -, *, /, %, **, (), numbers, decimals
 */
function safeMathEval(expr: string): number {
  // Remove whitespace
  expr = expr.replace(/\s+/g, '');

  // Allow only safe characters
  if (!/^[\d+\-*/%().\s]+$/.test(expr)) {
    throw new Error('Expression contains invalid characters');
  }

  // Use Function constructor (safer than eval)
  // This creates a new function in strict mode
  try {
    const result = new Function(`'use strict'; return (${expr})`)();

    if (typeof result !== 'number' || !isFinite(result)) {
      throw new Error('Result is not a finite number');
    }

    return result;
  } catch (error) {
    throw new Error(`Invalid expression: ${error instanceof Error ? error.message : 'unknown error'}`);
  }
}

/**
 * Calculate tool - evaluate mathematical expressions
 */
export const calculateTool: Tool = {
  name: 'calculate',
  description: 'Evaluate mathematical expressions (arithmetic, percentages, basic operations)',
  parameters: [
    {
      name: 'expression',
      type: 'string',
      description: 'Mathematical expression to evaluate (e.g., "2 + 2", "15 * 20 / 100", "(5 + 3) * 2")',
      required: true,
    },
  ],
  examples: [
    'calculate(expression="2 + 2")',
    'calculate(expression="(100 - 25) * 1.5")',
    'calculate(expression="1000 * 0.15")',
    'calculate(expression="50 / 2 + 10")',
  ],

  async execute({ expression }): Promise<string> {
    if (!expression || typeof expression !== 'string') {
      return 'Error: Expression is required';
    }

    console.log(`[CalculateTool] Evaluating: "${expression}"`);

    try {
      const result = safeMathEval(expression);

      // Format result nicely
      const formatted = Number.isInteger(result)
        ? result.toString()
        : result.toFixed(2);

      return `Calculation: ${expression} = ${formatted}`;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error(`[CalculateTool] Error:`, message);
      return `Error evaluating expression "${expression}": ${message}`;
    }
  },
};
