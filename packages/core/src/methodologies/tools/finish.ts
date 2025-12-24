/**
 * Finish Tool - Signal completion and provide final answer
 *
 * This tool is used by the ReAct agent to indicate it has completed reasoning
 * and is ready to provide the final answer to the user's query.
 */

import type { Tool } from './index.js';

/**
 * Finish tool - provide the final answer and end the reasoning loop
 */
export const finishTool: Tool = {
  name: 'finish',
  description: 'Provide the final answer to the user\'s query and end the reasoning process',
  parameters: [
    {
      name: 'answer',
      type: 'string',
      description: 'The complete final answer to the user\'s original question',
      required: true,
    },
  ],
  examples: [
    'finish(answer="The capital of France is Paris.")',
    'finish(answer="Based on my calculations, the result is 150.")',
    'finish(answer="After researching, I found that the current bitcoin price is approximately $45,000 USD.")',
  ],

  async execute({ answer }): Promise<string> {
    if (!answer || typeof answer !== 'string') {
      return 'Error: Answer is required';
    }

    console.log(`[FinishTool] Providing final answer: ${answer.substring(0, 100)}...`);

    // Return the answer directly
    // The ReAct loop will detect this tool call and terminate
    return answer;
  },
};
