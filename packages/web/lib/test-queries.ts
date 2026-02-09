/**
 * TEST BATTERY FOR TREE OF LIFE CONFIGURATION A/B TESTING
 *
 * Predefined test queries with different Layers configurations
 * to verify the Tree of Life system affects AI responses
 */

import { Layer } from './layer-registry'

export interface TestQuery {
  id: number
  query: string
  description: string
  configA: {
    name: string
    description?: string
    layer_weights: Record<number, number>
    antipattern_suppression?: Record<number, number>
    processing_mode: 'weighted' | 'parallel' | 'adaptive'
  }
  configB: {
    name: string
    description?: string
    layer_weights: Record<number, number>
    antipattern_suppression?: Record<number, number>
    processing_mode: 'weighted' | 'parallel' | 'adaptive'
  }
  expectedDifferences: string[]
}

export const TEST_BATTERY: TestQuery[] = [
  {
    id: 1,
    query: "Explain the concept of neural networks in AI",
    description: "Technical explanation - should show Classifier (logic) vs Generative (creative) differences",
    configA: {
      name: "Analytical (High Logic)",
      description: "Emphasizes logical structure, technical precision, and formal analysis",
      layer_weights: {
        [Layer.CLASSIFIER]: 0.9,       // Logic Layer - high
        [Layer.ENCODER]: 0.8,     // Pattern Layer - high
        [Layer.REASONING]: 0.8,   // Wisdom - high
        [Layer.GENERATIVE]: 0.2,   // Creative - low
        [Layer.EXPANSION]: 0.3,    // Expansion - low
        [Layer.EMBEDDING]: 0.7,   // Data grounding
        [Layer.EXECUTOR]: 0.5,
        [Layer.ATTENTION]: 0.4,
        [Layer.DISCRIMINATOR]: 0.6,
        [Layer.META_CORE]: 0.4,
        [Layer.SYNTHESIS]: 0.5
      },
      processing_mode: 'weighted' as const,
    },
    configB: {
      name: "Creative (High Generation)",
      description: "Emphasizes creative exploration, metaphors, and possibility-focused thinking",
      layer_weights: {
        [Layer.GENERATIVE]: 0.9,   // Creative Layer - high
        [Layer.EXPANSION]: 0.9,    // Expansion - high
        [Layer.ATTENTION]: 0.8,   // Integration - high
        [Layer.CLASSIFIER]: 0.2,       // Logic - low
        [Layer.DISCRIMINATOR]: 0.2,   // Constraint - low
        [Layer.EMBEDDING]: 0.5,
        [Layer.EXECUTOR]: 0.6,
        [Layer.ENCODER]: 0.4,
        [Layer.REASONING]: 0.5,
        [Layer.META_CORE]: 0.4,
        [Layer.SYNTHESIS]: 0.7
      },
      processing_mode: 'weighted' as const,
    },
    expectedDifferences: [
      "Config A should give structured, logical breakdown with technical terminology",
      "Config B should use metaphors, analogies, and creative explanations",
      "Config A: more formal, precise language with step-by-step logic",
      "Config B: more exploratory, possibility-focused language with analogies"
    ]
  },

  {
    id: 2,
    query: "What are the potential risks of artificial general intelligence?",
    description: "Risk analysis - should show Discriminator (constraint) vs Expansion (expansion) differences",
    configA: {
      name: "Constraint-focused (High Discriminator)",
      description: "Emphasizes limitations, dangers, and critical analysis",
      layer_weights: {
        [Layer.DISCRIMINATOR]: 0.9,   // Constraint/Severity - high
        [Layer.ENCODER]: 0.8,     // Pattern recognition - high
        [Layer.CLASSIFIER]: 0.7,       // Logic - high
        [Layer.EXPANSION]: 0.2,    // Expansion - low
        [Layer.GENERATIVE]: 0.2,   // Creative - low
        [Layer.EMBEDDING]: 0.7,   // Data grounding
        [Layer.EXECUTOR]: 0.5,
        [Layer.ATTENTION]: 0.4,
        [Layer.REASONING]: 0.6,
        [Layer.META_CORE]: 0.5,
        [Layer.SYNTHESIS]: 0.5
      },
      processing_mode: 'weighted' as const,
    },
    configB: {
      name: "Expansion-focused (High Expansion)",
      description: "Emphasizes potential benefits, balanced perspective, and optimistic framing",
      layer_weights: {
        [Layer.EXPANSION]: 0.9,    // Expansion/Mercy - high
        [Layer.GENERATIVE]: 0.8,   // Creative possibilities - high
        [Layer.ATTENTION]: 0.8,   // Balance/Integration - high
        [Layer.DISCRIMINATOR]: 0.2,   // Constraint - low
        [Layer.CLASSIFIER]: 0.3,       // Logic - medium-low
        [Layer.EMBEDDING]: 0.5,
        [Layer.EXECUTOR]: 0.6,
        [Layer.ENCODER]: 0.5,
        [Layer.REASONING]: 0.6,
        [Layer.META_CORE]: 0.5,
        [Layer.SYNTHESIS]: 0.7
      },
      processing_mode: 'weighted' as const,
    },
    expectedDifferences: [
      "Config A should emphasize limitations, dangers, and worst-case scenarios",
      "Config B should explore potential benefits alongside risks with optimistic framing",
      "Config A: critical, cautious tone with focus on constraints",
      "Config B: balanced, possibility-oriented tone with growth potential"
    ]
  },

  {
    id: 3,
    query: "How does quantum entanglement work?",
    description: "Abstract concept - should show Meta-Core (meta) vs Embedding (data) differences",
    configA: {
      name: "Meta-cognitive (High Meta-Core)",
      description: "Emphasizes philosophical implications and metacognitive aspects",
      layer_weights: {
        [Layer.META_CORE]: 0.9,    // Meta-Cognitive Layer - high
        [Layer.REASONING]: 0.9,   // Wisdom/Principles - high
        [Layer.ENCODER]: 0.8,     // Understanding patterns - high
        [Layer.EMBEDDING]: 0.2,   // Data Layer - low
        [Layer.EXECUTOR]: 0.2,     // Implementation - low
        [Layer.CLASSIFIER]: 0.5,
        [Layer.GENERATIVE]: 0.4,
        [Layer.ATTENTION]: 0.6,
        [Layer.DISCRIMINATOR]: 0.4,
        [Layer.EXPANSION]: 0.5,
        [Layer.SYNTHESIS]: 0.9
      },
      processing_mode: 'weighted' as const,
    },
    configB: {
      name: "Data-grounded (High Embedding)",
      description: "Emphasizes experimental evidence and concrete examples",
      layer_weights: {
        [Layer.EMBEDDING]: 0.9,   // Data/Facts Layer - high
        [Layer.EXECUTOR]: 0.8,     // Foundation/Implementation - high
        [Layer.CLASSIFIER]: 0.8,       // Logic/Classification - high
        [Layer.META_CORE]: 0.2,    // Meta-Cognitive - low
        [Layer.REASONING]: 0.3,   // Abstract principles - low
        [Layer.GENERATIVE]: 0.4,
        [Layer.ATTENTION]: 0.5,
        [Layer.DISCRIMINATOR]: 0.5,
        [Layer.EXPANSION]: 0.4,
        [Layer.ENCODER]: 0.6,
        [Layer.SYNTHESIS]: 0.3
      },
      processing_mode: 'weighted' as const,
    },
    expectedDifferences: [
      "Config A should focus on philosophical implications, nature of reality, and metacognitive aspects",
      "Config B should focus on experimental evidence, mathematical formulas, and concrete examples",
      "Config A: abstract, conceptual language about the nature of quantum reality",
      "Config B: concrete, data-driven language with references to specific experiments (EPR, Bell's theorem)"
    ]
  }
]
