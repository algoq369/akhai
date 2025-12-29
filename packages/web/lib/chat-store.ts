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
