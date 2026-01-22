/**
 * TEST BATTERY FOR TREE OF LIFE CONFIGURATION A/B TESTING
 *
 * Predefined test queries with different Sephiroth configurations
 * to verify the Tree of Life system affects AI responses
 */

import { Sefirah } from './ascent-tracker'

export interface TestQuery {
  id: number
  query: string
  description: string
  configA: {
    name: string
    description?: string
    sephiroth_weights: Record<number, number>
    qliphoth_suppression?: Record<number, number>
    processing_mode: 'weighted' | 'parallel' | 'adaptive'
  }
  configB: {
    name: string
    description?: string
    sephiroth_weights: Record<number, number>
    qliphoth_suppression?: Record<number, number>
    processing_mode: 'weighted' | 'parallel' | 'adaptive'
  }
  expectedDifferences: string[]
}

export const TEST_BATTERY: TestQuery[] = [
  {
    id: 1,
    query: "Explain the concept of neural networks in AI",
    description: "Technical explanation - should show Hod (logic) vs Netzach (creative) differences",
    configA: {
      name: "Analytical (High Logic)",
      description: "Emphasizes logical structure, technical precision, and formal analysis",
      sephiroth_weights: {
        [Sefirah.HOD]: 0.9,       // Logic Layer - high
        [Sefirah.BINAH]: 0.8,     // Pattern Layer - high
        [Sefirah.CHOKMAH]: 0.8,   // Wisdom - high
        [Sefirah.NETZACH]: 0.2,   // Creative - low
        [Sefirah.CHESED]: 0.3,    // Expansion - low
        [Sefirah.MALKUTH]: 0.7,   // Data grounding
        [Sefirah.YESOD]: 0.5,
        [Sefirah.TIFERET]: 0.4,
        [Sefirah.GEVURAH]: 0.6,
        [Sefirah.KETHER]: 0.4,
        [Sefirah.DAAT]: 0.5
      },
      processing_mode: 'weighted' as const,
    },
    configB: {
      name: "Creative (High Generation)",
      description: "Emphasizes creative exploration, metaphors, and possibility-focused thinking",
      sephiroth_weights: {
        [Sefirah.NETZACH]: 0.9,   // Creative Layer - high
        [Sefirah.CHESED]: 0.9,    // Expansion - high
        [Sefirah.TIFERET]: 0.8,   // Integration - high
        [Sefirah.HOD]: 0.2,       // Logic - low
        [Sefirah.GEVURAH]: 0.2,   // Constraint - low
        [Sefirah.MALKUTH]: 0.5,
        [Sefirah.YESOD]: 0.6,
        [Sefirah.BINAH]: 0.4,
        [Sefirah.CHOKMAH]: 0.5,
        [Sefirah.KETHER]: 0.4,
        [Sefirah.DAAT]: 0.7
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
    description: "Risk analysis - should show Gevurah (constraint) vs Chesed (expansion) differences",
    configA: {
      name: "Constraint-focused (High Gevurah)",
      description: "Emphasizes limitations, dangers, and critical analysis",
      sephiroth_weights: {
        [Sefirah.GEVURAH]: 0.9,   // Constraint/Severity - high
        [Sefirah.BINAH]: 0.8,     // Pattern recognition - high
        [Sefirah.HOD]: 0.7,       // Logic - high
        [Sefirah.CHESED]: 0.2,    // Expansion - low
        [Sefirah.NETZACH]: 0.2,   // Creative - low
        [Sefirah.MALKUTH]: 0.7,   // Data grounding
        [Sefirah.YESOD]: 0.5,
        [Sefirah.TIFERET]: 0.4,
        [Sefirah.CHOKMAH]: 0.6,
        [Sefirah.KETHER]: 0.5,
        [Sefirah.DAAT]: 0.5
      },
      processing_mode: 'weighted' as const,
    },
    configB: {
      name: "Expansion-focused (High Chesed)",
      description: "Emphasizes potential benefits, balanced perspective, and optimistic framing",
      sephiroth_weights: {
        [Sefirah.CHESED]: 0.9,    // Expansion/Mercy - high
        [Sefirah.NETZACH]: 0.8,   // Creative possibilities - high
        [Sefirah.TIFERET]: 0.8,   // Balance/Integration - high
        [Sefirah.GEVURAH]: 0.2,   // Constraint - low
        [Sefirah.HOD]: 0.3,       // Logic - medium-low
        [Sefirah.MALKUTH]: 0.5,
        [Sefirah.YESOD]: 0.6,
        [Sefirah.BINAH]: 0.5,
        [Sefirah.CHOKMAH]: 0.6,
        [Sefirah.KETHER]: 0.5,
        [Sefirah.DAAT]: 0.7
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
    description: "Abstract concept - should show Kether (meta) vs Malkuth (data) differences",
    configA: {
      name: "Meta-cognitive (High Kether)",
      description: "Emphasizes philosophical implications and metacognitive aspects",
      sephiroth_weights: {
        [Sefirah.KETHER]: 0.9,    // Meta-Cognitive Layer - high
        [Sefirah.CHOKMAH]: 0.9,   // Wisdom/Principles - high
        [Sefirah.BINAH]: 0.8,     // Understanding patterns - high
        [Sefirah.MALKUTH]: 0.2,   // Data Layer - low
        [Sefirah.YESOD]: 0.2,     // Implementation - low
        [Sefirah.HOD]: 0.5,
        [Sefirah.NETZACH]: 0.4,
        [Sefirah.TIFERET]: 0.6,
        [Sefirah.GEVURAH]: 0.4,
        [Sefirah.CHESED]: 0.5,
        [Sefirah.DAAT]: 0.9
      },
      processing_mode: 'weighted' as const,
    },
    configB: {
      name: "Data-grounded (High Malkuth)",
      description: "Emphasizes experimental evidence and concrete examples",
      sephiroth_weights: {
        [Sefirah.MALKUTH]: 0.9,   // Data/Facts Layer - high
        [Sefirah.YESOD]: 0.8,     // Foundation/Implementation - high
        [Sefirah.HOD]: 0.8,       // Logic/Classification - high
        [Sefirah.KETHER]: 0.2,    // Meta-Cognitive - low
        [Sefirah.CHOKMAH]: 0.3,   // Abstract principles - low
        [Sefirah.NETZACH]: 0.4,
        [Sefirah.TIFERET]: 0.5,
        [Sefirah.GEVURAH]: 0.5,
        [Sefirah.CHESED]: 0.4,
        [Sefirah.BINAH]: 0.6,
        [Sefirah.DAAT]: 0.3
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
