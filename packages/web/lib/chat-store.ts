/**
 * Chat store for conversation state management
 */

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  methodology?: string
  metrics?: {
    tokens: number
    latency: number
    cost: number
    source?: string
  }
  topics?: Array<{ id: string; name: string; category?: string }>
  timestamp: Date
  guardResult?: {
    passed: boolean
    issues: string[]
    scores: {
      hype: number
      echo: number
      drift: number
      fact: number
    }
    sanityViolations: string[]
  }
  guardAction?: 'pending' | 'accepted' | 'refined' | 'pivoted'
  guardActionQuery?: string
  isHidden?: boolean
  // ============================================================================
  // GNOSTIC SOVEREIGN INTELLIGENCE METADATA
  // ============================================================================
  gnostic?: {
    ketherState: {
      intent: string
      boundary: string
      reflectionMode: boolean
      ascentLevel: number
    } | null
    ascentState: {
      currentLevel: number
      levelName: string
      velocity: number
      totalQueries: number
      nextElevation: string | null
    } | null
    sephirothAnalysis: {
      activations: Record<number, number>
      dominant: string
      averageLevel: number
      daatInsight: {
        insight: string
        confidence: number
      } | null
    }
    qliphothPurified: boolean
    qliphothType: string
    qliphothCritique?: {
      severity: number
      triggers: {
        patterns: string[]
        count: number
      }
      audit: {
        sefirotAdjustments: Array<{
          sefirah: string
          currentWeight: number
          suggestedWeight: number
          rationale: string
          impact: 'reduce' | 'increase' | 'maintain'
        }>
        pillarRebalance?: {
          current: { left: number; middle: number; right: number }
          suggested: { left: number; middle: number; right: number }
          shifts: Array<{ pillar: 'left' | 'middle' | 'right'; direction: 'increase' | 'decrease'; amount: number }>
        }
        explanation: {
          whatWasDetected: string
          whyItMatters: string
          howToFix: string
        }
        confidence: number
        priority: 'low' | 'medium' | 'high' | 'critical'
      }
      purificationActions: {
        before: string
        after: string
        transformations: Array<{
          type: 'replace' | 'remove' | 'qualify'
          pattern: string
          replacement: string
        }>
      } | null
      qliphothEducation: {
        name: string
        description: string
        commonCauses: string[]
        aiManifestation: string
      }
    } | null
    sovereigntyFooter: string | null
  }
  // ============================================================================
  // INTELLIGENCE FUSION METADATA
  // ============================================================================
  intelligence?: {
    analysis: {
      complexity: number
      queryType: string
      keywords: string[]
    }
    sefirotActivations: Array<{
      sefirah: number
      name: string
      activation: number
      effectiveWeight: number
    }>
    dominantSefirot: string[]
    pathActivations: Array<{
      from: number
      to: number
      strength: number
    }>
    methodologySelection: {
      selected: string
      confidence: number
      alternatives: Array<{
        methodology: string
        score: number
      }>
    }
    guard: {
      recommendation: 'proceed' | 'warn' | 'block'
      reasons: string[]
    }
    instinct: {
      enabled: boolean
      activeLenses: string[]
    }
    processing: {
      mode: 'weighted' | 'parallel' | 'adaptive'
      extendedThinkingBudget: number
    }
    timing: {
      fusionMs: number
    }
  }
}

export interface ChatState {
  messages: Message[]
  isLoading: boolean
  currentMethodology: string
}

/**
 * Generate unique message ID
 */
export function generateId(): string {
  return Math.random().toString(36).substring(2, 12)
}
