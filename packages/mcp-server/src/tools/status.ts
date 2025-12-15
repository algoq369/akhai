/**
 * akhai.status MCP Tool
 *
 * Get AkhAI system status, configuration, and available model families.
 */

import { ALL_MODEL_FAMILIES, FIXED_BRAINSTORMER_SLOT_3 } from '@akhai/core';
import { getCurrentInstance } from '../shared/instance.js';

/**
 * Arguments for akhai.status tool (none required)
 */
export interface StatusArgs {
  // No arguments needed
}

/**
 * Handle akhai.status tool
 *
 * @param args - Tool arguments (unused)
 * @returns MCP tool response with system status
 */
export async function handleStatus(args: StatusArgs): Promise<{ content: Array<{ type: string; text: string }> }> {
  try {
    // Check which API keys are configured (4 providers)
    const apiKeyStatus = {
      anthropic: !!process.env.ANTHROPIC_API_KEY,
      deepseek: !!process.env.DEEPSEEK_API_KEY,
      openrouter: !!process.env.OPENROUTER_API_KEY,
      xai: !!process.env.XAI_API_KEY,
    };

    const configuredCount = Object.values(apiKeyStatus).filter(Boolean).length;
    const totalCount = ALL_MODEL_FAMILIES.length;

    // Build status text
    const lines: string[] = [];

    lines.push('# 🧠 AkhAI System Status');
    lines.push('');
    lines.push('## 📊 Overview');
    lines.push('');
    lines.push(`- **Status:** ✅ Ready`);
    lines.push(`- **Version:** 0.1.0`);
    lines.push(`- **API Keys Configured:** ${configuredCount}/${totalCount}`);
    lines.push('');

    lines.push('## 🎯 Architecture');
    lines.push('');
    lines.push('```');
    lines.push('Mother Base (Your choice)');
    lines.push('     │');
    lines.push('     ▼');
    lines.push('Advisor Layer (4 AIs)');
    lines.push('├── Slot 1: Configurable');
    lines.push('├── Slot 2: Configurable');
    lines.push(`├── Slot 3: ${FIXED_BRAINSTORMER_SLOT_3} (Fixed)`);
    lines.push('└── Slot 4: Redactor (= Mother Base)');
    lines.push('     │');
    lines.push('     ▼');
    lines.push('Sub-Agents (= Mother Base)');
    lines.push('```');
    lines.push('');

    lines.push('## 🤖 Supported Model Families');
    lines.push('');
    lines.push('| Family | API Key | Status |');
    lines.push('|--------|---------|--------|');
    ALL_MODEL_FAMILIES.forEach((family) => {
      const hasKey = apiKeyStatus[family as keyof typeof apiKeyStatus];
      const status = hasKey ? '✅ Ready' : '❌ Not configured';
      const keyRequired = 'Yes';
      lines.push(`| ${family} | ${keyRequired} | ${status} |`);
    });
    lines.push('');

    // Add cost tracking if instance exists
    const currentInstance = getCurrentInstance();
    if (currentInstance) {
      const costReport = currentInstance.getCostReport();

      lines.push('## 💰 Cost Tracking');
      lines.push('');

      if (costReport.totalTokens.total > 0) {
        lines.push('### Session Summary');
        lines.push(`- **Total Cost:** $${costReport.totalCost.toFixed(4)}`);
        lines.push(`- **Total Tokens:** ${costReport.totalTokens.total.toLocaleString()} (${costReport.totalTokens.input.toLocaleString()} in + ${costReport.totalTokens.output.toLocaleString()} out)`);
        lines.push('');

        if (costReport.providerUsage.length > 0) {
          lines.push('### By Provider');
          lines.push('');
          lines.push('| Provider | Requests | Tokens | Cost |');
          lines.push('|----------|----------|--------|------|');
          costReport.providerUsage.forEach((usage) => {
            const totalTokens = usage.totalInputTokens + usage.totalOutputTokens;
            lines.push(
              `| ${usage.family} | ${usage.requestCount} | ${totalTokens.toLocaleString()} | $${usage.totalCost.toFixed(4)} |`
            );
          });
          lines.push('');
        }
      } else {
        lines.push('_No API calls made yet in this session._');
        lines.push('');
      }
    }

    lines.push('## ⚙️ Configuration');
    lines.push('');
    lines.push('### Default Settings');
    lines.push('- **Mother Base:** anthropic');
    lines.push('- **Advisor Slot 1:** deepseek');
    lines.push('- **Advisor Slot 2:** deepseek');
    lines.push(`- **Advisor Slot 3:** ${FIXED_BRAINSTORMER_SLOT_3} (fixed)`);
    lines.push('- **Max Consensus Rounds:** 3 (2 min each)');
    lines.push('- **Max Flow Exchanges:** 3');
    lines.push('');

    lines.push('### Available Flows');
    lines.push('');
    lines.push('**Flow A: Mother Base Decision**');
    lines.push('- User → Mother Base → Advisor Layer → Redactor → Mother Base');
    lines.push('- Best for: Strategic decisions, architecture choices');
    lines.push('');
    lines.push('**Flow B: Sub-Agent Execution**');
    lines.push('- User → Sub-Agent → Advisor Layer → Redactor → Sub-Agent → Mother Base');
    lines.push('- Best for: Task execution, code generation, research');
    lines.push('');

    lines.push('## 🔧 Setup Instructions');
    lines.push('');

    if (configuredCount < totalCount) {
      lines.push('**⚠️ Some API keys are missing. To configure:**');
      lines.push('');
      lines.push('1. Create a `.env` file in the project root');
      lines.push('2. Add your API keys:');
      lines.push('');
      lines.push('```bash');
      if (!apiKeyStatus.anthropic) lines.push('ANTHROPIC_API_KEY=sk-ant-...');
      if (!apiKeyStatus.deepseek) lines.push('DEEPSEEK_API_KEY=sk-...');
      if (!apiKeyStatus.openrouter) lines.push('OPENROUTER_API_KEY=sk-or-...');
      if (!apiKeyStatus.xai) lines.push('XAI_API_KEY=xai-...');
      lines.push('```');
      lines.push('');
      lines.push('3. Restart Claude Code');
    } else {
      lines.push('✅ **All API keys configured!**');
      lines.push('');
      lines.push('You can now use `akhai.query` to execute queries.');
    }
    lines.push('');

    lines.push('## 📚 Usage Examples');
    lines.push('');
    lines.push('### Flow A (Mother Base Decision)');
    lines.push('```typescript');
    lines.push('akhai.query({');
    lines.push('  query: "Should we use microservices or monolith?",');
    lines.push('  flow: "A"');
    lines.push('})');
    lines.push('```');
    lines.push('');
    lines.push('### Flow B (Sub-Agent Execution)');
    lines.push('```typescript');
    lines.push('akhai.query({');
    lines.push('  query: "Build a REST API for user auth",');
    lines.push('  flow: "B",');
    lines.push('  agentName: "CodingAgent"');
    lines.push('})');
    lines.push('```');
    lines.push('');

    return {
      content: [
        {
          type: 'text',
          text: lines.join('\n'),
        },
      ],
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`[akhai.status] Error:`, error);

    return {
      content: [
        {
          type: 'text',
          text: `❌ Error getting status:\n\n${errorMessage}`,
        },
      ],
    };
  }
}
