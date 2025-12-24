/**
 * Methodology Registry
 *
 * Central registry for all AkhAI methodologies with metadata and execution functions.
 * This enables dynamic methodology discovery and status tracking.
 */

import { executeChainOfDraft } from './cod.js';
import { executeBufferOfThoughts } from './bot.js';
import { executeReAct } from './react.js';
import { executeProgramOfThought } from './pot.js';
import { GTPExecutor } from './gtp/index.js';
import type { CoreMethodology, METHODOLOGY_INFO, MethodologyInfo } from './types.js';

/**
 * Methodology registry entry
 */
export interface MethodologyEntry {
  /** Execution function (null if not yet implemented) */
  execute: Function | null;

  /** Methodology metadata */
  info: MethodologyInfo;

  /** Implementation status */
  status: 'implemented' | 'planned';

  /** Optional notes */
  notes?: string;
}

/**
 * Comprehensive registry of all core methodologies
 *
 * This registry tracks:
 * - Which methodologies are implemented
 * - Execution functions for each
 * - Metadata (cost, latency, best use cases)
 * - Implementation status
 */
export const METHODOLOGY_REGISTRY: Record<CoreMethodology, MethodologyEntry> = {
  direct: {
    execute: null, // TODO: Extract from AkhAISystem
    info: {
      name: 'Direct',
      tier: 1,
      icon: '⚡',
      description: 'Instant response for simple queries',
      tokenMultiplier: 1.0,
      avgLatencyMs: 2000,
      costPer1K: 0.0001,
      bestFor: ['factual', 'definitions', 'lookups'],
    },
    status: 'implemented',
    notes: 'Currently handled inline in AkhAISystem',
  },

  cod: {
    execute: executeChainOfDraft,
    info: {
      name: 'Chain of Draft',
      tier: 2,
      icon: '📝',
      description: 'Token-efficient step-by-step reasoning (92% cheaper than CoT)',
      tokenMultiplier: 0.08,
      avgLatencyMs: 8000,
      costPer1K: 0.0008,
      bestFor: ['procedural', 'how-to', 'sequential'],
    },
    status: 'implemented',
    notes: 'Standalone implementation in cod.ts',
  },

  bot: {
    execute: executeBufferOfThoughts,
    info: {
      name: 'Buffer of Thoughts',
      tier: 2,
      icon: '🧠',
      description: 'Template-based analysis (88% cheaper than ToT)',
      tokenMultiplier: 0.12,
      avgLatencyMs: 18000,
      costPer1K: 0.006,
      bestFor: ['complex', 'analysis', 'comparison', 'planning'],
    },
    status: 'implemented',
    notes: 'Standalone implementation in bot.ts with thought buffering and distillation',
  },

  react: {
    execute: executeReAct,
    info: {
      name: 'ReAct',
      tier: 3,
      icon: '🔧',
      description: 'Tool-augmented reasoning with external actions',
      tokenMultiplier: 3.0,
      avgLatencyMs: 20000,
      costPer1K: 0.02,
      bestFor: ['search', 'calculate', 'external-data'],
    },
    status: 'implemented',
    notes: 'Standalone implementation with search, calculate, lookup, and finish tools',
  },

  pot: {
    execute: executeProgramOfThought,
    info: {
      name: 'Program of Thought',
      tier: 4,
      icon: '💻',
      description: 'Code-based computation (+24% on numerical tasks)',
      tokenMultiplier: 1.5,
      avgLatencyMs: 12000,
      costPer1K: 0.01,
      bestFor: ['math', 'finance', 'computation'],
    },
    status: 'implemented',
    notes: 'JavaScript execution with sandboxed Function constructor and timeout protection',
  },

  gtp: {
    execute: GTPExecutor, // Wrapped in class, need to adapt
    info: {
      name: 'GTP + Self-Consistency',
      tier: 5,
      icon: '🤝',
      description: 'Multi-perspective consensus with Self-MoA',
      tokenMultiplier: 5.0,
      avgLatencyMs: 30000,
      costPer1K: 0.03,
      bestFor: ['debate', 'verification', 'critical-decisions'],
    },
    status: 'implemented',
    notes: 'Full Flash architecture with TUMIX early exit',
  },

  auto: {
    execute: null, // Uses selector, not a direct execution
    info: {
      name: 'Auto Selector',
      tier: 0,
      icon: '🎯',
      description: 'Automatically selects optimal methodology',
      tokenMultiplier: 1.0,
      avgLatencyMs: 500,
      costPer1K: 0,
      bestFor: ['default'],
    },
    status: 'implemented',
    notes: 'Routing logic in selector.ts',
  },
};

/**
 * Get methodology entry by name
 *
 * @param name - Methodology name
 * @returns Methodology entry or undefined
 */
export function getMethodology(name: CoreMethodology): MethodologyEntry | undefined {
  return METHODOLOGY_REGISTRY[name];
}

/**
 * Get all implemented methodologies
 *
 * @returns Array of implemented methodology names
 */
export function getImplementedMethodologies(): CoreMethodology[] {
  return (Object.entries(METHODOLOGY_REGISTRY) as Array<[CoreMethodology, MethodologyEntry]>)
    .filter(([_, entry]) => entry.status === 'implemented')
    .map(([name]) => name);
}

/**
 * Get all planned methodologies
 *
 * @returns Array of planned methodology names
 */
export function getPlannedMethodologies(): CoreMethodology[] {
  return (Object.entries(METHODOLOGY_REGISTRY) as Array<[CoreMethodology, MethodologyEntry]>)
    .filter(([_, entry]) => entry.status === 'planned')
    .map(([name]) => name);
}

/**
 * Get methodology statistics
 *
 * @returns Statistics about methodology implementation
 */
export function getMethodologyStats() {
  const total = Object.keys(METHODOLOGY_REGISTRY).length;
  const implemented = getImplementedMethodologies().length;
  const planned = getPlannedMethodologies().length;
  const percentComplete = Math.round((implemented / total) * 100);

  return {
    total,
    implemented,
    planned,
    progress: `${implemented}/${total}`,
    percentComplete,
  };
}

/**
 * Get methodologies by tier
 *
 * @param tier - Tier number (0-5)
 * @returns Array of methodology names in that tier
 */
export function getMethodologiesByTier(tier: number): CoreMethodology[] {
  return (Object.entries(METHODOLOGY_REGISTRY) as Array<[CoreMethodology, MethodologyEntry]>)
    .filter(([_, entry]) => entry.info.tier === tier)
    .map(([name]) => name);
}

/**
 * Check if methodology is implemented
 *
 * @param name - Methodology name
 * @returns True if implemented, false otherwise
 */
export function isImplemented(name: CoreMethodology): boolean {
  const entry = METHODOLOGY_REGISTRY[name];
  return entry ? entry.status === 'implemented' : false;
}

/**
 * Get methodology by use case
 *
 * @param useCase - Use case keyword
 * @returns Array of methodology names that match the use case
 */
export function getMethodologiesByUseCase(useCase: string): CoreMethodology[] {
  return (Object.entries(METHODOLOGY_REGISTRY) as Array<[CoreMethodology, MethodologyEntry]>)
    .filter(([_, entry]) => entry.info.bestFor.some(uc => uc.includes(useCase.toLowerCase())))
    .map(([name]) => name);
}
