/**
 * akhai.query MCP Tool
 *
 * Execute queries using AkhAI's multi-AI consensus engine.
 * Supports Flow A (Mother Base decision) and Flow B (Sub-Agent execution).
 */

import { type ModelFamily, type FlowAResult, type FlowBResult } from '@akhai/core';
import { getAkhaiInstance } from '../shared/instance.js';

/**
 * Arguments for akhai.query tool
 */
export interface QueryArgs {
  query: string;
  flow?: 'A' | 'B';
  agentName?: string;
  motherBase?: string;
  advisorSlot1?: string;
  advisorSlot2?: string;
}

/**
 * Handle akhai.query tool
 *
 * @param args - Tool arguments
 * @returns MCP tool response
 */
export async function handleQuery(args: QueryArgs): Promise<{ content: Array<{ type: string; text: string }> }> {
  try {
    // Validate required arguments
    if (!args.query) {
      throw new Error('Missing required argument: query');
    }

    // Default values
    const flow = args.flow || 'A';
    const motherBaseFamily = (args.motherBase as ModelFamily) || 'anthropic';
    const advisorSlot1 = (args.advisorSlot1 as ModelFamily) || 'deepseek';
    const advisorSlot2 = (args.advisorSlot2 as ModelFamily) || 'qwen';

    // Validate flow type
    if (flow !== 'A' && flow !== 'B') {
      throw new Error(`Invalid flow type: ${flow}. Must be 'A' or 'B'`);
    }

    // Validate agent name for Flow B
    if (flow === 'B' && !args.agentName) {
      throw new Error('Flow B requires agentName argument');
    }

    console.error(`[akhai.query] Starting ${flow === 'A' ? 'Flow A (Mother Base Decision)' : `Flow B (Sub-Agent: ${args.agentName})`}`);
    console.error(`[akhai.query] Query: ${args.query.substring(0, 80)}...`);

    // Get or create AkhAI instance
    const akhai = getAkhaiInstance(motherBaseFamily);

    // Setup Advisor Layer
    akhai.setupAdvisorLayer(advisorSlot1, advisorSlot2);

    let result: FlowAResult | FlowBResult;
    let resultText: string;

    if (flow === 'A') {
      // Execute Flow A: Mother Base Decision
      result = await akhai.executeMotherBaseFlow(args.query);
      resultText = formatFlowAResult(result);
    } else {
      // Flow B: Register sub-agent if needed
      const agentName = args.agentName!;
      const existingAgents = akhai.listSubAgents();

      if (!existingAgents.includes(agentName)) {
        console.error(`[akhai.query] Registering sub-agent: ${agentName}`);
        akhai.registerSubAgent(agentName);
      }

      // Execute Flow B: Sub-Agent Execution
      result = await akhai.executeSubAgentFlow(args.query, agentName);
      resultText = formatFlowBResult(result);
    }

    return {
      content: [
        {
          type: 'text',
          text: resultText,
        },
      ],
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`[akhai.query] Error:`, error);

    return {
      content: [
        {
          type: 'text',
          text: `❌ Error executing query:\n\n${errorMessage}\n\nPlease check:\n- API keys are configured\n- Arguments are valid\n- Flow type is 'A' or 'B'`,
        },
      ],
    };
  }
}

/**
 * Format Flow A result for display
 */
function formatFlowAResult(result: FlowAResult): string {
  const lines: string[] = [];

  lines.push('# 🚀 Flow A: Mother Base Decision');
  lines.push('');
  lines.push(`**Status:** ${result.approvedAt !== null ? '✅ Approved' : '⚠️ Forced Decision'}`);
  lines.push(`**Exchanges:** ${result.totalMotherBaseExchanges}`);
  lines.push(`**Approved at Exchange:** ${result.approvedAt || 'N/A (forced)'}`);
  lines.push('');

  lines.push('## 📊 Consensus Summary');
  lines.push(`- **Total Rounds:** ${result.layerConsensus.totalRounds}`);
  lines.push(`- **Consensus Reached:** ${result.layerConsensus.consensusReachedAt !== null ? `Yes (Round ${result.layerConsensus.consensusReachedAt})` : 'No (forced)'}`);
  lines.push('');

  lines.push('## 📋 Redactor Output');
  lines.push('');
  lines.push(result.redactorOutput);
  lines.push('');

  lines.push('## 🏢 Final Decision');
  lines.push('');
  lines.push(result.finalDecision);
  lines.push('');

  if (result.totalMotherBaseExchanges > 1) {
    lines.push('## 🔄 Exchange History');
    result.motherBaseExchanges.forEach((exchange, i) => {
      lines.push('');
      lines.push(`### Exchange ${i + 1}`);
      lines.push(`**Status:** ${exchange.approved ? '✅ Approved' : '↩️ Revision Requested'}`);
      if (!exchange.approved) {
        lines.push('');
        lines.push('**Mother Base Feedback:**');
        lines.push(exchange.motherBaseResponse);
      }
    });
  }

  return lines.join('\n');
}

/**
 * Format Flow B result for display
 */
function formatFlowBResult(result: FlowBResult): string {
  const lines: string[] = [];

  lines.push('# 🚀 Flow B: Sub-Agent Execution');
  lines.push('');
  lines.push(`**Status:** ${result.motherBaseApproval.approvedAt !== null ? '✅ Approved' : '⚠️ Forced Approval'}`);
  lines.push(`**Phase 1 Exchanges:** ${result.totalSubAgentExchanges}`);
  lines.push(`**Phase 2 Exchanges:** ${result.motherBaseApproval.totalExchanges}`);
  lines.push(`**Sub-Agent Completed:** ${result.subAgentCompletedAt !== null ? `Yes (Exchange ${result.subAgentCompletedAt})` : 'No (forced)'}`);
  lines.push(`**Mother Base Approved:** ${result.motherBaseApproval.approvedAt !== null ? `Yes (Exchange ${result.motherBaseApproval.approvedAt})` : 'No (forced)'}`);
  lines.push('');

  lines.push('## 📊 Consensus Summary');
  lines.push(`- **Total Rounds:** ${result.layerConsensus.totalRounds}`);
  lines.push(`- **Consensus Reached:** ${result.layerConsensus.consensusReachedAt !== null ? `Yes (Round ${result.layerConsensus.consensusReachedAt})` : 'No (forced)'}`);
  lines.push('');

  lines.push('## 📋 Advisor Guidance');
  lines.push('');
  lines.push(result.redactorOutput);
  lines.push('');

  lines.push('## 🏢 Final Output');
  lines.push('');
  lines.push(result.finalOutput);
  lines.push('');

  if (result.totalSubAgentExchanges > 1) {
    lines.push('## 🔄 Phase 1: Sub-Agent ↔ Advisor Layer');
    result.subAgentExchanges.forEach((exchange, i) => {
      lines.push('');
      lines.push(`### Exchange ${i + 1}`);
      lines.push(`**Status:** ${exchange.complete ? '✅ Complete' : '↩️ Needs Clarification'}`);
      if (!exchange.complete) {
        lines.push('');
        lines.push('**Sub-Agent Feedback:**');
        lines.push(exchange.agentResponse);
      }
    });
  }

  if (result.motherBaseApproval.totalExchanges > 1) {
    lines.push('');
    lines.push('## 🔄 Phase 2: Mother Base Approval');
    result.motherBaseApproval.exchanges.forEach((exchange, i) => {
      lines.push('');
      lines.push(`### Approval ${i + 1}`);
      lines.push(`**Status:** ${exchange.approved ? '✅ Approved' : '↩️ Revision Requested'}`);
      if (!exchange.approved) {
        lines.push('');
        lines.push('**Mother Base Feedback:**');
        lines.push(exchange.motherBaseResponse);
      }
    });
  }

  return lines.join('\n');
}
