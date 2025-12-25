/**
 * Agent configuration types for Idea Factory
 */

export interface AgentConfig {
  id: string
  name: string
  type: 'handball' | 'human' | 'custom'
  physical: {
    walkingSpeed: number // multiplier
    walkingStyle: 'normal' | 'graceful' | 'aggressive' | 'cautious'
    strength: number
    endurance: number
    scale: number
  }
  vision: {
    fieldOfView: number // degrees
    focusDistance: 'near' | 'far' | 'adaptive'
    colorPerception: 'monochrome' | 'full color' | 'enhanced'
    nightVision: boolean
    recognitionSensitivity: number // 0-1
  }
  functions: {
    categories: string[]
    priorities: Record<string, number>
  }
  ai: {
    creativity: number // 0-1
    intuition: number // 0-1
    learningSpeed: number // 0-1
    adaptability: number // 0-1
  }
  personality: {
    communicationStyle: 'formal' | 'casual' | 'friendly' | 'professional'
    proactivity: number // 0-1
    curiosity: number // 0-1
  }
  created_at: number
  updated_at: number
}

