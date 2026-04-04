/**
 * INTELLIGENCE FUSION — Type Definitions & Utilities
 *
 * Shared types for the Intelligence Fusion Layer.
 */

import { Layer } from './layer-registry';

// ============================================================
// LRU CACHE FOR QUERY ANALYSIS
// ============================================================

export class LRUCache<K, V> {
  private cache = new Map<K, V>();
  private maxSize: number;

  constructor(maxSize: number = 100) {
    this.maxSize = maxSize;
  }

  get(key: K): V | undefined {
    const value = this.cache.get(key);
    if (value !== undefined) {
      // Move to end (most recently used)
      this.cache.delete(key);
      this.cache.set(key, value);
    }
    return value;
  }

  set(key: K, value: V): void {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxSize) {
      // Remove oldest (first) entry
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) {
        this.cache.delete(firstKey);
      }
    }
    this.cache.set(key, value);
  }

  clear(): void {
    this.cache.clear();
  }
}

// ============================================================
// TYPES
// ============================================================

export type CoreMethodology = 'direct' | 'cod' | 'sc' | 'react' | 'pas' | 'tot' | 'auto';

export interface QueryAnalysis {
  complexity: number; // 0-1 scale
  queryType: QueryType;
  requiresTools: boolean;
  requiresMultiPerspective: boolean;
  isMathematical: boolean;
  isFactual: boolean;
  isProcedural: boolean;
  isCreative: boolean;
  wordCount: number;
  keywords: string[];
}

export type QueryType =
  | 'factual' // Simple facts
  | 'comparative' // X vs Y
  | 'procedural' // How to
  | 'research' // In-depth
  | 'creative' // Brainstorm
  | 'analytical' // Analysis
  | 'troubleshooting' // Debug
  | 'planning'; // Strategy

export interface LayersActivation {
  layerNode: Layer;
  name: string;
  activation: number; // 0-1 computed activation
  weight: number; // User-configured weight
  effectiveWeight: number; // activation * weight
  keywords: string[]; // Keywords that triggered activation
}

export interface MethodologyScore {
  methodology: CoreMethodology;
  score: number;
  reasons: string[];
}

export interface IntelligenceFusionResult {
  // Query analysis
  analysis: QueryAnalysis;

  // Layers activations
  layerActivations: LayersActivation[];
  dominantLayers: Layer[];
  pathActivations: PathActivation[];

  // Methodology selection
  selectedMethodology: CoreMethodology;
  methodologyScores: MethodologyScore[];
  confidence: number;

  // Guard status
  guardRecommendation: 'proceed' | 'warn' | 'block';
  guardReasons: string[];

  // Instinct mode
  instinctPrompt: string;
  activeLenses: string[];

  // Side Canal context
  contextInjection: string | null;
  relatedTopics: string[];

  // Processing recommendations
  extendedThinkingBudget: number;
  processingMode: 'weighted' | 'parallel' | 'adaptive';

  // Metadata
  timestamp: number;
  processingTimeMs: number;
}

export interface PathActivation {
  from: Layer;
  to: Layer;
  weight: number;
  description: string;
}
