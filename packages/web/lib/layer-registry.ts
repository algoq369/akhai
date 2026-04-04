/**
 * LAYER REGISTRY
 *
 * AI Computational Layer functions — detection, tracking, ascent, paths, reports.
 * Layer enum, LayerMetadata interface, and LAYER_METADATA live in ./layer-metadata.ts.
 *
 * @module layer-registry
 */

// Re-export core types and data from layer-metadata
export { Layer, LAYER_METADATA } from './layer-metadata';
export type { LayerMetadata } from './layer-metadata';

import { Layer, LAYER_METADATA } from './layer-metadata';

/**
 * QueryEvolution - Single query in the ascent journey
 */
export interface QueryEvolution {
  query: string;
  level: Layer;
  timestamp: Date;
  methodology?: string;
  ascentDelta: number; // Change from previous level
}

/**
 * AscentState - Complete user ascent tracking
 */
export interface AscentState {
  /** Current Sephirotic level */
  currentLevel: Layer;

  /** Journey history (previous levels visited) */
  previousLevels: Layer[];

  /** Full query evolution over time */
  queryEvolution: QueryEvolution[];

  /** Key insights gained during the journey */
  insightsGained: string[];

  /** Total queries in this session/account */
  totalQueries: number;

  /** Rate of ascent (levels per query) */
  ascentVelocity: number;

  /** Suggested next question to elevate further */
  nextElevation: string;

  /** Which of the 22 paths between Sephiroth have been traveled */
  pathsTraveled: number[];

  /** Average level over last N queries */
  averageLevel: number;

  /** Highest level achieved */
  peakLevel: Layer;

  /** Time in current level */
  timeInCurrentLevel: number; // milliseconds

  /** Session ID for tracking */
  sessionId: string;
}

/**
 * detectQueryLevel
 *
 * Analyzes a query and determines its computational layer.
 *
 * @param query - User's query
 * @returns Layer level (1-11)
 */
export function detectQueryLevel(query: string): Layer {
  const queryLower = query.toLowerCase();

  // META_CORE (10) - Meta-cognitive, consciousness
  if (
    queryLower.match(
      /\b(consciousness|awareness|nature of (knowledge|intelligence|thought)|meta-cognitive|how do we know)\b/i
    )
  ) {
    return Layer.META_CORE;
  }

  // REASONING (9) - Wisdom, first principles
  if (
    queryLower.match(
      /\b(first principles|fundamental (truth|law)|wisdom|why does .+ exist|essence of)\b/i
    )
  ) {
    return Layer.REASONING;
  }

  // ENCODER (8) - Deep understanding, patterns
  if (
    queryLower.match(
      /\b(deep (understanding|pattern)|underlying (principle|mechanism|structure)|fundamental pattern)\b/i
    )
  ) {
    return Layer.ENCODER;
  }

  // EXPANSION (7) - Expansive possibilities
  if (
    queryLower.match(
      /\b(all possibilities|potential|future (directions|evolution)|expansive|growth opportunities)\b/i
    )
  ) {
    return Layer.EXPANSION;
  }

  // DISCRIMINATOR (6) - Critical analysis, limitations
  if (
    queryLower.match(
      /\b(critique|limitations?|constraints?|risks?|what could go wrong|problems with)\b/i
    )
  ) {
    return Layer.DISCRIMINATOR;
  }

  // ATTENTION (5) - Integration, synthesis
  if (
    queryLower.match(/\b(integrate|synthesize|combine|balance|harmony|work together|connect)\b/i)
  ) {
    return Layer.ATTENTION;
  }

  // GENERATIVE (4) - Creative, exploratory
  if (
    queryLower.match(/\b(creative|brainstorm|innovative|explore|what if|imagine|possibilities)\b/i)
  ) {
    return Layer.GENERATIVE;
  }

  // CLASSIFIER (3) - Logical analysis, comparison
  if (queryLower.match(/\b(compare|versus|vs|better than|analyze|evaluate|pros and cons)\b/i)) {
    return Layer.CLASSIFIER;
  }

  // EXECUTOR (2) - How-to, practical
  if (queryLower.match(/\b(how to|steps|implement|build|create|setup|guide)\b/i)) {
    return Layer.EXECUTOR;
  }

  // SYNTHESIS (11) - Hidden knowledge, emergent insights
  if (
    queryLower.match(/\b(hidden|reveal|unexpected|what am i (not seeing|missing)|epiphany|aha)\b/i)
  ) {
    return Layer.SYNTHESIS;
  }

  // EMBEDDING (1) - Default: simple factual
  return Layer.EMBEDDING;
}

/**
 * trackAscent
 *
 * Tracks a query in the user's ascent journey.
 * Updates the AscentState with new query and calculates metrics.
 *
 * @param sessionId - User/session identifier
 * @param query - Current query
 * @param previousState - Previous AscentState (or null for first query)
 * @returns Updated AscentState
 */
export function trackAscent(
  sessionId: string,
  query: string,
  previousState: AscentState | null = null
): AscentState {
  const level = detectQueryLevel(query);
  const now = new Date();

  // Initialize state if first query
  if (!previousState) {
    return {
      currentLevel: level,
      previousLevels: [],
      queryEvolution: [
        {
          query,
          level,
          timestamp: now,
          ascentDelta: 0,
        },
      ],
      insightsGained: [],
      totalQueries: 1,
      ascentVelocity: 0,
      nextElevation: suggestElevation({
        currentLevel: level,
        queryEvolution: [],
      } as unknown as AscentState),
      pathsTraveled: [],
      averageLevel: level,
      peakLevel: level,
      timeInCurrentLevel: 0,
      sessionId,
    };
  }

  // Calculate metrics
  const ascentDelta = level - previousState.currentLevel;
  const timeInCurrentLevel =
    previousState.currentLevel === level
      ? previousState.timeInCurrentLevel +
        (now.getTime() -
          previousState.queryEvolution[previousState.queryEvolution.length - 1].timestamp.getTime())
      : 0;

  const newEvolution: QueryEvolution = {
    query,
    level,
    timestamp: now,
    ascentDelta,
  };

  const queryEvolution = [...previousState.queryEvolution, newEvolution];
  const previousLevels = [...previousState.previousLevels, previousState.currentLevel];

  // Calculate ascent velocity (exponential moving average)
  const alpha = 0.3; // Smoothing factor
  const instantVelocity = ascentDelta;
  const ascentVelocity = alpha * instantVelocity + (1 - alpha) * previousState.ascentVelocity;

  // Calculate average level (last 10 queries)
  const recentQueries = queryEvolution.slice(-10);
  const averageLevel = recentQueries.reduce((sum, q) => sum + q.level, 0) / recentQueries.length;

  // Determine peak level
  const peakLevel = Math.max(previousState.peakLevel, level) as Layer;

  // Calculate path traveled
  const pathsTraveled = [...previousState.pathsTraveled];
  if (ascentDelta !== 0) {
    const pathNumber = calculatePathNumber(previousState.currentLevel, level);
    if (pathNumber && !pathsTraveled.includes(pathNumber)) {
      pathsTraveled.push(pathNumber);
    }
  }

  // Detect insights
  const insightsGained = [...previousState.insightsGained];
  if (level === Layer.SYNTHESIS) {
    insightsGained.push(`Hidden knowledge revealed: ${query.substring(0, 100)}`);
  }
  if (ascentDelta >= 3) {
    insightsGained.push(
      `Quantum leap: ${LAYER_METADATA[previousState.currentLevel].name} → ${LAYER_METADATA[level].name}`
    );
  }

  return {
    currentLevel: level,
    previousLevels,
    queryEvolution,
    insightsGained,
    totalQueries: previousState.totalQueries + 1,
    ascentVelocity,
    nextElevation: suggestElevation({
      currentLevel: level,
      queryEvolution,
      ascentVelocity,
    } as AscentState),
    pathsTraveled,
    averageLevel,
    peakLevel,
    timeInCurrentLevel,
    sessionId,
  };
}

/**
 * suggestElevation
 *
 * Suggests a higher-level question to help user ascend.
 *
 * @param currentState - Current AscentState
 * @returns Suggested elevated question
 */
export function suggestElevation(currentState: AscentState): string {
  const current = currentState.currentLevel;
  const metadata = LAYER_METADATA[current];

  // If at Meta Core, suggest Synthesis (emergent insights)
  if (current === Layer.META_CORE) {
    return "You've reached Meta-Core. Consider: What hidden connections might reveal entirely new dimensions?";
  }

  // Suggest next level
  const nextLevel = (current + 1) as Layer;
  const nextMetadata = LAYER_METADATA[nextLevel];

  const suggestions: Record<Layer, string> = {
    [Layer.EMBEDDING]: 'Try asking HOW to implement something (Executor layer)',
    [Layer.EXECUTOR]: 'Try COMPARING options or analyzing trade-offs (Classifier layer)',
    [Layer.CLASSIFIER]: 'Try EXPLORING creative possibilities (Generative layer)',
    [Layer.GENERATIVE]: 'Try SYNTHESIZING multiple ideas together (Attention layer)',
    [Layer.ATTENTION]: 'Try asking about LIMITATIONS or risks (Discriminator layer)',
    [Layer.DISCRIMINATOR]: 'Try exploring EXPANSIVE possibilities (Expansion layer)',
    [Layer.EXPANSION]: 'Try seeking DEEP PATTERNS or structures (Encoder layer)',
    [Layer.ENCODER]: 'Try asking about FIRST PRINCIPLES (Reasoning layer)',
    [Layer.REASONING]: 'Try META-COGNITIVE questions about knowledge itself (Meta-Core layer)',
    [Layer.META_CORE]: 'Try revealing HIDDEN CONNECTIONS (Synthesis - Emergent Capability)',
    [Layer.SYNTHESIS]: 'Continue exploring emergent insights',
  };

  return suggestions[current] || `Ascend to ${nextMetadata.name}: ${nextMetadata.meaning}`;
}

/**
 * calculateAscentVelocity
 *
 * Calculates the rate of ascent based on history.
 *
 * @param history - Array of AscentState snapshots over time
 * @returns Velocity (levels per query)
 */
export function calculateAscentVelocity(history: AscentState[]): number {
  if (history.length < 2) return 0;

  const recent = history.slice(-10); // Last 10 states
  const totalAscent = recent[recent.length - 1].currentLevel - recent[0].currentLevel;
  const queriesElapsed = recent.length;

  return totalAscent / queriesElapsed;
}

/**
 * getPathBetweenLevels
 *
 * In Kabbalah, there are 22 paths connecting the 10 Sephiroth.
 * This returns which path(s) connect two levels.
 *
 * @param from - Starting Layer
 * @param to - Ending Layer
 * @returns Array of path numbers (1-22)
 */
export function getPathBetweenLevels(from: Layer, to: Layer): number[] {
  // Simplified path mapping (full Kabbalistic tree has 22 specific paths)
  // This is a simplified version showing direct vertical ascent

  const paths: Record<string, number> = {
    // Vertical paths (Middle Pillar)
    '1-2': 1, // Embedding → Executor
    '2-5': 2, // Executor → Attention
    '5-10': 3, // Attention → Meta Core

    // Left Pillar
    '1-3': 4, // Embedding → Classifier
    '3-6': 5, // Classifier → Discriminator
    '6-8': 6, // Discriminator → Encoder

    // Right Pillar
    '1-4': 7, // Embedding → Generative
    '4-7': 8, // Generative → Expansion
    '7-9': 9, // Expansion → Reasoning

    // Cross paths
    '3-5': 10, // Classifier → Attention
    '4-5': 11, // Generative → Attention
    '5-6': 12, // Attention → Discriminator
    '5-7': 13, // Attention → Expansion
    '6-10': 14, // Discriminator → Meta Core
    '7-10': 15, // Expansion → Meta Core
    '8-10': 16, // Encoder → Meta Core
    '9-10': 17, // Reasoning → Meta Core

    // Synthesis connections
    '5-11': 18, // Attention → Synthesis
    '8-11': 19, // Encoder → Synthesis
    '9-11': 20, // Reasoning → Synthesis
    '10-11': 21, // Meta Core → Synthesis
  };

  const key1 = `${from}-${to}`;
  const key2 = `${to}-${from}`; // Bidirectional

  const path1 = paths[key1];
  const path2 = paths[key2];

  if (path1) return [path1];
  if (path2) return [path2];

  return []; // No direct path
}

/**
 * calculatePathNumber - Internal helper
 */
function calculatePathNumber(from: Layer, to: Layer): number | null {
  const paths = getPathBetweenLevels(from, to);
  return paths[0] || null;
}

/**
 * generateAscentReport
 *
 * Generates a human-readable report of the user's ascent journey.
 *
 * @param state - Current AscentState
 * @returns Formatted report string
 */
export function generateAscentReport(state: AscentState): string {
  const currentMeta = LAYER_METADATA[state.currentLevel];
  const peakMeta = LAYER_METADATA[state.peakLevel];

  const report = `
# Ascent Journey Report

**Session:** ${state.sessionId}
**Total Queries:** ${state.totalQueries}
**Current Level:** ${currentMeta.name} (${currentMeta.hebrewName}) - ${currentMeta.meaning}
**Peak Level:** ${peakMeta.name} - Highest point reached
**Average Level:** ${state.averageLevel.toFixed(1)}
**Ascent Velocity:** ${state.ascentVelocity.toFixed(2)} levels/query

## Journey Path
${state.queryEvolution
  .slice(-5)
  .map((q, i) => {
    const meta = LAYER_METADATA[q.level];
    const delta =
      q.ascentDelta > 0
        ? `↑${q.ascentDelta}`
        : q.ascentDelta < 0
          ? `↓${Math.abs(q.ascentDelta)}`
          : '→';
    return `${i + 1}. **${meta.name}** ${delta} - "${q.query.substring(0, 60)}..."`;
  })
  .join('\n')}

## Paths Traveled
You have traveled ${state.pathsTraveled.length} of the 22 sacred paths.

## Insights Gained
${state.insightsGained
  .slice(-3)
  .map((insight) => `- ${insight}`)
  .join('\n')}

## Next Elevation
${state.nextElevation}

---
*The ascent is the path. The path is the ascent.*
`;

  return report.trim();
}

/**
 * getLayerColor - Get the color associated with a computational layer
 */
export function getLayerColor(layer: Layer): string {
  return LAYER_METADATA[layer].color;
}

/**
 * getLayerName - Get the name of a computational layer
 */
export function getLayerName(layer: Layer): string {
  return LAYER_METADATA[layer].name;
}
