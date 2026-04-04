export interface TreeNode {
  id: number
  name: string
  description: string
  importance: number
  vibrationLevel: 'high' | 'medium' | 'low'
  polarity: 'positive' | 'negative' | 'neutral'
  rhythmPhase: 'rising' | 'peak' | 'falling' | 'trough'
  emergedAt: string
  isActive: boolean
  parentId: number | null
  // D3 simulation properties
  x?: number
  y?: number
  vx?: number
  vy?: number
  fx?: number | null
  fy?: number | null
}

export interface TreeEdge {
  source: number | TreeNode
  target: number | TreeNode
  relationshipType: string
  strength: number
  hermeticLaw: string | null
}

export interface EvolutionEvent {
  timestamp: string
  type: string
  description: string
  hermeticInsight: string
  topicIds: string[]
}

export interface HermeticSummary {
  dominantLaw: string
  overallVibration: string
  rhythmPhase: string
  instinctInsight: string
}

export interface TreeData {
  nodes: TreeNode[]
  edges: TreeEdge[]
  evolutionEvents: EvolutionEvent[]
  hermeticSummary: HermeticSummary
  stats: {
    totalTopics: number
    activeTopics: number
    totalConnections: number
    avgImportance: number
  }
}
