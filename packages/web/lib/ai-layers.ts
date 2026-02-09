/**
 * AI COMPUTATIONAL LAYERS
 * 
 * Defines the 11 processing layers from user input to AI output
 * Based on cognitive architecture research and LLM processing pipelines
 * 
 * Processing Order: Input → Understanding → Reasoning → Output
 */

// Layer IDs (mapped to existing Layer enum for compatibility)
export enum AILayer {
  RECEPTION = 10,        // Embedding - Input parsing
  COMPREHENSION = 9,     // Executor - Semantic understanding  
  CONTEXT_BUILDING = 8,  // Classifier - Relationship mapping
  KNOWLEDGE_RECALL = 3,  // Encoder - Fact retrieval
  REASONING = 2,         // Reasoning - Problem decomposition
  EXPANSION = 4,         // Expansion - Creative exploration
  CRITICAL_ANALYSIS = 5, // Discriminator - Evaluation & limits
  SYNTHESIS = 6,         // Attention - Integration
  VERIFICATION = 11,     // Synthesis - Self-checking
  ARTICULATION = 7,      // Generative - Response crafting
  OUTPUT = 1,            // Meta-Core - Final delivery (meta-cognition)
}

// Processing order (input to output)
export const PROCESSING_ORDER: AILayer[] = [
  AILayer.RECEPTION,
  AILayer.COMPREHENSION,
  AILayer.CONTEXT_BUILDING,
  AILayer.KNOWLEDGE_RECALL,
  AILayer.REASONING,
  AILayer.EXPANSION,
  AILayer.CRITICAL_ANALYSIS,
  AILayer.SYNTHESIS,
  AILayer.VERIFICATION,
  AILayer.ARTICULATION,
  AILayer.OUTPUT,
]

// Critical layers for Quick Config (Top 3 most impactful)
export const CRITICAL_LAYERS: AILayer[] = [
  AILayer.REASONING,        // Most important - problem decomposition
  AILayer.KNOWLEDGE_RECALL, // Factual accuracy
  AILayer.VERIFICATION,     // Hallucination prevention
]

// Layer metadata
export interface AILayerMeta {
  id: AILayer
  name: string
  concept: string
  description: string
  phase: 'input' | 'understanding' | 'reasoning' | 'output'
  importance: 'low' | 'medium' | 'high' | 'critical'
  color: string
  order: number
}

export const AI_LAYER_METADATA: Record<AILayer, AILayerMeta> = {
  [AILayer.RECEPTION]: {
    id: AILayer.RECEPTION,
    name: 'reception',
    concept: 'input parsing',
    description: 'Receives and normalizes your input text',
    phase: 'input',
    importance: 'low',
    color: '#78716c',
    order: 1,
  },
  [AILayer.COMPREHENSION]: {
    id: AILayer.COMPREHENSION,
    name: 'comprehension',
    concept: 'semantic understanding',
    description: 'Understands word meanings and encodes into processable form',
    phase: 'input',
    importance: 'medium',
    color: '#a3a3a3',
    order: 2,
  },
  [AILayer.CONTEXT_BUILDING]: {
    id: AILayer.CONTEXT_BUILDING,
    name: 'context-building',
    concept: 'relationship mapping',
    description: 'Maps relationships between all parts of your message',
    phase: 'understanding',
    importance: 'high',
    color: '#facc15',
    order: 3,
  },
  [AILayer.KNOWLEDGE_RECALL]: {
    id: AILayer.KNOWLEDGE_RECALL,
    name: 'knowledge-recall',
    concept: 'fact retrieval',
    description: 'Retrieves relevant facts, patterns, and domain expertise',
    phase: 'understanding',
    importance: 'critical',
    color: '#6366f1',
    order: 4,
  },
  [AILayer.REASONING]: {
    id: AILayer.REASONING,
    name: 'reasoning',
    concept: 'problem decomposition',
    description: 'Breaks complex problems into steps and works through logic',
    phase: 'reasoning',
    importance: 'critical',
    color: '#818cf8',
    order: 5,
  },
  [AILayer.EXPANSION]: {
    id: AILayer.EXPANSION,
    name: 'expansion',
    concept: 'creative exploration',
    description: 'Explores possibilities, generates alternatives, thinks broadly',
    phase: 'reasoning',
    importance: 'medium',
    color: '#34d399',
    order: 6,
  },
  [AILayer.CRITICAL_ANALYSIS]: {
    id: AILayer.CRITICAL_ANALYSIS,
    name: 'critical-analysis',
    concept: 'evaluation & limits',
    description: 'Evaluates ideas rigorously, identifies limitations and risks',
    phase: 'reasoning',
    importance: 'high',
    color: '#f87171',
    order: 7,
  },
  [AILayer.SYNTHESIS]: {
    id: AILayer.SYNTHESIS,
    name: 'synthesis',
    concept: 'integration',
    description: 'Combines insights from multiple sources into coherent whole',
    phase: 'reasoning',
    importance: 'medium',
    color: '#fbbf24',
    order: 8,
  },
  [AILayer.VERIFICATION]: {
    id: AILayer.VERIFICATION,
    name: 'verification',
    concept: 'self-checking',
    description: 'Checks work for errors, inconsistencies, and hallucinations',
    phase: 'output',
    importance: 'critical',
    color: '#22d3ee',
    order: 9,
  },
  [AILayer.ARTICULATION]: {
    id: AILayer.ARTICULATION,
    name: 'articulation',
    concept: 'response crafting',
    description: 'Crafts clear, well-structured response text',
    phase: 'output',
    importance: 'medium',
    color: '#fb923c',
    order: 10,
  },
  [AILayer.OUTPUT]: {
    id: AILayer.OUTPUT,
    name: 'output',
    concept: 'final delivery',
    description: 'Delivers final response with appropriate formatting',
    phase: 'output',
    importance: 'low',
    color: '#a78bfa',
    order: 11,
  },
}

// Presets with AI-focused descriptions
export interface AIPreset {
  id: string
  name: string
  description: string
  weights: Record<AILayer, number>
}

export const AI_PRESETS: AIPreset[] = [
  {
    id: 'analytical',
    name: 'analytical',
    description: 'Maximum reasoning & verification for complex problems',
    weights: {
      [AILayer.RECEPTION]: 0.5,
      [AILayer.COMPREHENSION]: 0.7,
      [AILayer.CONTEXT_BUILDING]: 0.8,
      [AILayer.KNOWLEDGE_RECALL]: 0.9,
      [AILayer.REASONING]: 0.95,
      [AILayer.EXPANSION]: 0.3,
      [AILayer.CRITICAL_ANALYSIS]: 0.95,
      [AILayer.SYNTHESIS]: 0.6,
      [AILayer.VERIFICATION]: 0.9,
      [AILayer.ARTICULATION]: 0.7,
      [AILayer.OUTPUT]: 0.6,
    }
  },
  {
    id: 'creative',
    name: 'creative',
    description: 'High expansion & low constraints for brainstorming',
    weights: {
      [AILayer.RECEPTION]: 0.5,
      [AILayer.COMPREHENSION]: 0.6,
      [AILayer.CONTEXT_BUILDING]: 0.7,
      [AILayer.KNOWLEDGE_RECALL]: 0.6,
      [AILayer.REASONING]: 0.7,
      [AILayer.EXPANSION]: 0.95,
      [AILayer.CRITICAL_ANALYSIS]: 0.3,
      [AILayer.SYNTHESIS]: 0.85,
      [AILayer.VERIFICATION]: 0.5,
      [AILayer.ARTICULATION]: 0.8,
      [AILayer.OUTPUT]: 0.7,
    }
  },
  {
    id: 'balanced',
    name: 'balanced',
    description: 'Even distribution for general-purpose use',
    weights: {
      [AILayer.RECEPTION]: 0.5,
      [AILayer.COMPREHENSION]: 0.6,
      [AILayer.CONTEXT_BUILDING]: 0.65,
      [AILayer.KNOWLEDGE_RECALL]: 0.7,
      [AILayer.REASONING]: 0.7,
      [AILayer.EXPANSION]: 0.6,
      [AILayer.CRITICAL_ANALYSIS]: 0.65,
      [AILayer.SYNTHESIS]: 0.7,
      [AILayer.VERIFICATION]: 0.7,
      [AILayer.ARTICULATION]: 0.65,
      [AILayer.OUTPUT]: 0.6,
    }
  },
  {
    id: 'deep',
    name: 'deep',
    description: 'Extended thinking with thorough verification',
    weights: {
      [AILayer.RECEPTION]: 0.5,
      [AILayer.COMPREHENSION]: 0.75,
      [AILayer.CONTEXT_BUILDING]: 0.8,
      [AILayer.KNOWLEDGE_RECALL]: 0.85,
      [AILayer.REASONING]: 0.9,
      [AILayer.EXPANSION]: 0.7,
      [AILayer.CRITICAL_ANALYSIS]: 0.8,
      [AILayer.SYNTHESIS]: 0.75,
      [AILayer.VERIFICATION]: 0.9,
      [AILayer.ARTICULATION]: 0.75,
      [AILayer.OUTPUT]: 0.7,
    }
  },
  {
    id: 'fast',
    name: 'fast',
    description: 'Quick responses with minimal deliberation',
    weights: {
      [AILayer.RECEPTION]: 0.5,
      [AILayer.COMPREHENSION]: 0.6,
      [AILayer.CONTEXT_BUILDING]: 0.5,
      [AILayer.KNOWLEDGE_RECALL]: 0.6,
      [AILayer.REASONING]: 0.4,
      [AILayer.EXPANSION]: 0.3,
      [AILayer.CRITICAL_ANALYSIS]: 0.4,
      [AILayer.SYNTHESIS]: 0.5,
      [AILayer.VERIFICATION]: 0.4,
      [AILayer.ARTICULATION]: 0.8,
      [AILayer.OUTPUT]: 0.9,
    }
  },
]

// Helper to get layer by processing order
export function getLayerByOrder(order: number): AILayerMeta | undefined {
  return Object.values(AI_LAYER_METADATA).find(l => l.order === order)
}

// Helper to get layers by phase
export function getLayersByPhase(phase: AILayerMeta['phase']): AILayerMeta[] {
  return Object.values(AI_LAYER_METADATA)
    .filter(l => l.phase === phase)
    .sort((a, b) => a.order - b.order)
}

// Helper to check if layer is critical
export function isCriticalLayer(layer: AILayer): boolean {
  return CRITICAL_LAYERS.includes(layer)
}
