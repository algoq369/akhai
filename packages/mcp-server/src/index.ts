#!/usr/bin/env node

/**
 * AkhAI MCP Server
 *
 * Exposes AkhAI Super Research Engine via Model Context Protocol
 *
 * Available tools:
 * - akhai.query - Execute query via Flow A (Mother Base) or Flow B (Sub-Agent)
 * - akhai.status - Get system status and configuration
 * - akhai.agents - Manage sub-agents
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';

// Import types from @akhai/core
import type { ModelFamily } from '@akhai/core';

// Import MCP tool handlers
import { handleQuery } from './tools/query.js';
import { handleStatus } from './tools/status.js';
import { handleAgents } from './tools/agents.js';

// Server info
const SERVER_NAME = 'akhai-mcp-server';
const SERVER_VERSION = '0.1.0';

/**
 * MCP Server instance
 */
class AkhAIMCPServer {
  private server: Server;
  private akhaiInitialized: boolean = false;
  private motherBaseFamily: ModelFamily | null = null;

  constructor() {
    this.server = new Server(
      {
        name: SERVER_NAME,
        version: SERVER_VERSION,
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupHandlers();
  }

  /**
   * Setup MCP protocol handlers
   */
  private setupHandlers(): void {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: this.getToolDefinitions(),
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'akhai.query':
            return await this.handleQueryTool(args);
          case 'akhai.status':
            return await this.handleStatusTool(args);
          case 'akhai.agents':
            return await this.handleAgentsTool(args);
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${errorMessage}`,
            },
          ],
        };
      }
    });
  }

  /**
   * Define available MCP tools
   */
  private getToolDefinitions(): Tool[] {
    return [
      {
        name: 'akhai.query',
        description: 'Execute a query using AkhAI multi-AI consensus engine. Supports Flow A (Mother Base decision) or Flow B (Sub-Agent execution).',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'The query or task to execute',
            },
            flow: {
              type: 'string',
              enum: ['A', 'B'],
              description: 'Flow type: A (Mother Base decision) or B (Sub-Agent execution)',
              default: 'A',
            },
            agentName: {
              type: 'string',
              description: 'Sub-agent name (required for Flow B)',
            },
            motherBase: {
              type: 'string',
              description: 'Mother Base model family (anthropic, openai, deepseek, etc.)',
            },
            advisorSlot1: {
              type: 'string',
              description: 'Advisor Layer Slot 1 model family',
            },
            advisorSlot2: {
              type: 'string',
              description: 'Advisor Layer Slot 2 model family',
            },
          },
          required: ['query'],
        },
      },
      {
        name: 'akhai.status',
        description: 'Get AkhAI system status, configuration, and available model families',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'akhai.agents',
        description: 'Manage sub-agents: register new agents or list existing ones',
        inputSchema: {
          type: 'object',
          properties: {
            action: {
              type: 'string',
              enum: ['list', 'register'],
              description: 'Action: list existing agents or register a new one',
            },
            agentName: {
              type: 'string',
              description: 'Agent name (required for register action)',
            },
          },
          required: ['action'],
        },
      },
    ];
  }

  /**
   * Handle akhai.query tool
   */
  private async handleQueryTool(args: any): Promise<any> {
    return handleQuery(args);
  }

  /**
   * Handle akhai.status tool
   */
  private async handleStatusTool(args: any): Promise<any> {
    return handleStatus(args);
  }

  /**
   * Handle akhai.agents tool
   */
  private async handleAgentsTool(args: any): Promise<any> {
    return handleAgents(args);
  }

  /**
   * Start the MCP server
   */
  async start(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);

    // Log to stderr (stdout is reserved for MCP protocol)
    console.error(`${SERVER_NAME} v${SERVER_VERSION} started`);
    console.error('Waiting for MCP requests...');
  }
}

/**
 * Main entry point
 */
async function main() {
  const server = new AkhAIMCPServer();
  await server.start();
}

// Start server
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
