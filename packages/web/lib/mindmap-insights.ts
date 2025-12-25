/**
 * Mind Map Insights Computation
 * Analyzes topics to compute sentiment, bias, market correlation, manipulation signals, and factuality
 */

import { Node } from '../components/MindMap'

export interface TopicInsights {
  sentiment: number // -1 to 1 (negative to positive)
  bias: string[] // List of detected biases
  marketCorrelation: number | null // 0 to 1 if topic relates to market/finance
  manipulation: boolean // True if manipulation signals detected
  factuality: 'fact' | 'opinion' | 'mixed' // Classification
}

/**
 * Compute sentiment from topic description and name
 * Simple keyword-based analysis (can be enhanced with AI)
 */
export function computeSentiment(topic: Node): number {
  const text = `${topic.name} ${topic.description || ''}`.toLowerCase()
  
  // Positive keywords
  const positiveWords = ['increase', 'growth', 'success', 'profit', 'gain', 'bullish', 'positive', 'good', 'strong', 'up']
  // Negative keywords
  const negativeWords = ['decrease', 'loss', 'crash', 'bearish', 'negative', 'bad', 'weak', 'down', 'risk', 'warning']
  
  let score = 0
  positiveWords.forEach(word => {
    if (text.includes(word)) score += 0.1
  })
  negativeWords.forEach(word => {
    if (text.includes(word)) score -= 0.1
  })
  
  // Clamp to -1 to 1
  return Math.max(-1, Math.min(1, score))
}

/**
 * Detect psychological biases in AI instructions
 */
export function detectBias(topic: Node): string[] {
  const biases: string[] = []
  const instructions = (topic.ai_instructions || '').toLowerCase()
  
  // Confirmation bias: looking for confirmation
  if (instructions.includes('confirm') || instructions.includes('prove') || instructions.includes('validate')) {
    biases.push('confirmation')
  }
  
  // Anchoring: fixed reference points
  if (instructions.includes('always') || instructions.includes('never') || instructions.includes('must')) {
    biases.push('anchoring')
  }
  
  // Availability: recent events emphasis
  if (instructions.includes('latest') || instructions.includes('recent') || instructions.includes('current')) {
    biases.push('availability')
  }
  
  // Overconfidence: strong claims
  if (instructions.includes('certain') || instructions.includes('definitely') || instructions.includes('guaranteed')) {
    biases.push('overconfidence')
  }
  
  return biases
}

/**
 * Check if topic correlates with market behavior
 */
export function getMarketCorrelation(topic: Node): number | null {
  const marketKeywords = ['price', 'market', 'crypto', 'bitcoin', 'ethereum', 'trading', 'volatility', 'cap', 'supply', 'demand', 'finance', 'stock', 'asset']
  const text = `${topic.name} ${topic.description || ''} ${topic.category || ''}`.toLowerCase()
  
  const matches = marketKeywords.filter(keyword => text.includes(keyword)).length
  if (matches === 0) return null
  
  // Return correlation strength (0 to 1)
  return Math.min(1, matches / 5)
}

/**
 * Detect manipulation signals (hype patterns)
 */
export function detectManipulation(topic: Node): boolean {
  const text = `${topic.name} ${topic.description || ''}`.toLowerCase()
  
  // Manipulation indicators
  const manipulationPatterns = [
    'guaranteed',
    '100%',
    'never fails',
    'always works',
    'instant profit',
    'get rich',
    'secret',
    'exclusive',
    'limited time',
    'act now',
  ]
  
  return manipulationPatterns.some(pattern => text.includes(pattern))
}

/**
 * Classify factuality (fact vs opinion vs mixed)
 */
export function classifyFactuality(topic: Node): 'fact' | 'opinion' | 'mixed' {
  const text = `${topic.name} ${topic.description || ''}`.toLowerCase()
  
  // Opinion indicators
  const opinionWords = ['think', 'believe', 'feel', 'should', 'might', 'could', 'perhaps', 'maybe', 'opinion', 'view']
  // Fact indicators
  const factWords = ['is', 'are', 'was', 'were', 'data', 'statistics', 'research', 'study', 'proven', 'evidence']
  
  const opinionCount = opinionWords.filter(word => text.includes(word)).length
  const factCount = factWords.filter(word => text.includes(word)).length
  
  if (opinionCount > factCount && opinionCount > 0) return 'opinion'
  if (factCount > opinionCount && factCount > 0) return 'fact'
  return 'mixed'
}

/**
 * Compute all insights for a topic
 */
export function computeInsights(topic: Node): TopicInsights {
  return {
    sentiment: computeSentiment(topic),
    bias: detectBias(topic),
    marketCorrelation: getMarketCorrelation(topic),
    manipulation: detectManipulation(topic),
    factuality: classifyFactuality(topic),
  }
}

/**
 * Compute insights for multiple topics
 */
export function computeInsightsBatch(topics: Node[]): Record<string, TopicInsights> {
  const insights: Record<string, TopicInsights> = {}
  topics.forEach(topic => {
    insights[topic.id] = computeInsights(topic)
  })
  return insights
}

