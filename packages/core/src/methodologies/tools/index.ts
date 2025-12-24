/**
 * ReAct Tools - Tool Interface and Registry
 *
 * Tools enable LLMs to interact with external systems and perform actions.
 * Based on "ReAct: Synergizing Reasoning and Acting in Language Models" (ICLR 2023)
 */

/**
 * Tool parameter definition
 */
export interface ToolParameter {
  /** Parameter name */
  name: string;

  /** Parameter type */
  type: 'string' | 'number' | 'boolean' | 'object';

  /** Human-readable description */
  description: string;

  /** Is this parameter required? */
  required: boolean;

  /** Default value if not provided */
  default?: any;
}

/**
 * Tool interface - defines a callable tool
 */
export interface Tool {
  /** Unique tool name (used in action calls) */
  name: string;

  /** Human-readable description of what the tool does */
  description: string;

  /** List of parameters this tool accepts */
  parameters: ToolParameter[];

  /**
   * Execute the tool with given parameters
   * @param params - Key-value pairs matching parameter names
   * @returns Tool execution result as string
   */
  execute: (params: Record<string, any>) => Promise<string>;

  /** Optional examples of tool usage */
  examples?: string[];
}

/**
 * Tool registry - manages available tools
 */
export interface ToolRegistry {
  /** Internal tools storage */
  tools: Map<string, Tool>;

  /**
   * Register a new tool
   * @param tool - Tool to register
   */
  register(tool: Tool): void;

  /**
   * Get tool by name
   * @param name - Tool name
   * @returns Tool if found, undefined otherwise
   */
  get(name: string): Tool | undefined;

  /**
   * List all registered tools
   * @returns Array of all tools
   */
  list(): Tool[];

  /**
   * Get formatted tool descriptions for LLM prompt
   * @returns Multi-line string describing all tools
   */
  getToolDescriptions(): string;

  /**
   * Check if a tool exists
   * @param name - Tool name
   * @returns True if tool is registered
   */
  has(name: string): boolean;

  /**
   * Unregister a tool
   * @param name - Tool name to remove
   * @returns True if tool was removed
   */
  unregister(name: string): boolean;
}

/**
 * Create a new tool registry
 * @returns Initialized tool registry
 */
export function createToolRegistry(): ToolRegistry {
  const tools = new Map<string, Tool>();

  return {
    tools,

    register(tool: Tool): void {
      if (tools.has(tool.name)) {
        console.warn(`[ToolRegistry] Overwriting existing tool: ${tool.name}`);
      }
      tools.set(tool.name, tool);
      console.log(`[ToolRegistry] Registered tool: ${tool.name}`);
    },

    get(name: string): Tool | undefined {
      return tools.get(name);
    },

    list(): Tool[] {
      return Array.from(tools.values());
    },

    getToolDescriptions(): string {
      return Array.from(tools.values())
        .map((tool) => {
          const params = tool.parameters
            .map((p) => {
              const req = p.required ? 'required' : 'optional';
              return `  - ${p.name} (${p.type}, ${req}): ${p.description}`;
            })
            .join('\n');

          return `${tool.name}: ${tool.description}\nParameters:\n${params}`;
        })
        .join('\n\n');
    },

    has(name: string): boolean {
      return tools.has(name);
    },

    unregister(name: string): boolean {
      const existed = tools.has(name);
      if (existed) {
        tools.delete(name);
        console.log(`[ToolRegistry] Unregistered tool: ${name}`);
      }
      return existed;
    },
  };
}

// Export all tool implementations
export { searchTool } from './search.js';
export { calculateTool } from './calculate.js';
export { lookupTool } from './lookup.js';
export { finishTool } from './finish.js';
