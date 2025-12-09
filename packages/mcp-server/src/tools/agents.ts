/**
 * akhai.agents MCP Tool
 *
 * Manage sub-agents: register new agents or list existing ones.
 */

/**
 * Arguments for akhai.agents tool
 */
export interface AgentsArgs {
  action: 'list' | 'register';
  agentName?: string;
}

/**
 * Global registry of sub-agents
 * Persists across tool calls
 */
const globalAgentRegistry: Set<string> = new Set();

/**
 * Pre-register default agents
 */
function initializeDefaultAgents() {
  if (globalAgentRegistry.size === 0) {
    // Add common agent types
    globalAgentRegistry.add('CodingAgent');
    globalAgentRegistry.add('ResearchAgent');
    globalAgentRegistry.add('AnalysisAgent');
    console.error('[akhai.agents] Initialized default agents');
  }
}

/**
 * Handle akhai.agents tool
 *
 * @param args - Tool arguments
 * @returns MCP tool response
 */
export async function handleAgents(args: AgentsArgs): Promise<{ content: Array<{ type: string; text: string }> }> {
  try {
    // Initialize default agents
    initializeDefaultAgents();

    const action = args.action;

    if (action === 'list') {
      return handleListAgents();
    } else if (action === 'register') {
      return handleRegisterAgent(args);
    } else {
      throw new Error(`Unknown action: ${action}. Must be 'list' or 'register'`);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`[akhai.agents] Error:`, error);

    return {
      content: [
        {
          type: 'text',
          text: `❌ Error managing agents:\n\n${errorMessage}`,
        },
      ],
    };
  }
}

/**
 * Handle list action
 */
function handleListAgents(): { content: Array<{ type: string; text: string }> } {
  const agents = Array.from(globalAgentRegistry).sort();

  const lines: string[] = [];

  lines.push('# 🤖 Registered Sub-Agents');
  lines.push('');
  lines.push(`**Total:** ${agents.length}`);
  lines.push('');

  if (agents.length === 0) {
    lines.push('⚠️ No agents registered yet.');
    lines.push('');
    lines.push('Use `akhai.agents` with action "register" to add agents.');
  } else {
    lines.push('## Available Agents');
    lines.push('');
    agents.forEach((agent, i) => {
      const isDefault = ['CodingAgent', 'ResearchAgent', 'AnalysisAgent'].includes(agent);
      const badge = isDefault ? ' *(default)*' : '';
      lines.push(`${i + 1}. **${agent}**${badge}`);
    });
    lines.push('');

    lines.push('## Agent Descriptions');
    lines.push('');
    lines.push('### CodingAgent *(default)*');
    lines.push('- **Purpose:** Code generation, refactoring, debugging');
    lines.push('- **Best for:** Building features, writing tests, fixing bugs');
    lines.push('');
    lines.push('### ResearchAgent *(default)*');
    lines.push('- **Purpose:** Information gathering, analysis, summarization');
    lines.push('- **Best for:** Technology research, competitive analysis, documentation');
    lines.push('');
    lines.push('### AnalysisAgent *(default)*');
    lines.push('- **Purpose:** Data analysis, pattern recognition, insights');
    lines.push('- **Best for:** Log analysis, performance metrics, decision support');
    lines.push('');

    // List custom agents
    const customAgents = agents.filter(
      (agent) => !['CodingAgent', 'ResearchAgent', 'AnalysisAgent'].includes(agent)
    );
    if (customAgents.length > 0) {
      lines.push('### Custom Agents');
      customAgents.forEach((agent) => {
        lines.push(`- **${agent}** *(custom)*`);
      });
      lines.push('');
    }
  }

  lines.push('## Usage');
  lines.push('');
  lines.push('To use an agent with Flow B:');
  lines.push('```typescript');
  lines.push('akhai.query({');
  lines.push('  query: "Your task here",');
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
}

/**
 * Handle register action
 */
function handleRegisterAgent(args: AgentsArgs): { content: Array<{ type: string; text: string }> } {
  if (!args.agentName) {
    throw new Error('Missing required argument: agentName');
  }

  const agentName = args.agentName.trim();

  if (!agentName) {
    throw new Error('Agent name cannot be empty');
  }

  // Validate agent name (alphanumeric and underscores only)
  if (!/^[a-zA-Z0-9_]+$/.test(agentName)) {
    throw new Error('Agent name must contain only letters, numbers, and underscores');
  }

  // Check if already registered
  if (globalAgentRegistry.has(agentName)) {
    return {
      content: [
        {
          type: 'text',
          text: `⚠️ Agent **${agentName}** is already registered.\n\nUse \`akhai.agents\` with action "list" to see all agents.`,
        },
      ],
    };
  }

  // Register agent
  globalAgentRegistry.add(agentName);
  console.error(`[akhai.agents] Registered new agent: ${agentName}`);

  const lines: string[] = [];

  lines.push(`# ✅ Agent Registered`);
  lines.push('');
  lines.push(`**Agent Name:** ${agentName}`);
  lines.push('');
  lines.push('## Next Steps');
  lines.push('');
  lines.push('Use this agent with Flow B:');
  lines.push('```typescript');
  lines.push('akhai.query({');
  lines.push('  query: "Your task here",');
  lines.push('  flow: "B",');
  lines.push(`  agentName: "${agentName}"`);
  lines.push('})');
  lines.push('```');
  lines.push('');
  lines.push('## All Registered Agents');
  lines.push('');
  const allAgents = Array.from(globalAgentRegistry).sort();
  allAgents.forEach((agent, i) => {
    const current = agent === agentName ? ' **(new)**' : '';
    lines.push(`${i + 1}. ${agent}${current}`);
  });
  lines.push('');

  return {
    content: [
      {
        type: 'text',
        text: lines.join('\n'),
      },
    ],
  };
}
