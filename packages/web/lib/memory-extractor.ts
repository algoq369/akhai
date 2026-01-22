/**
 * MEMORY EXTRACTOR
 *
 * Extracts insights, facts, preferences, and context from conversations
 * Builds persistent knowledge within Grimoires
 */

import type { Memory } from './stores/grimoire-store'

// Re-export Memory type for use in other modules
export type { Memory } from './stores/grimoire-store'

export interface ExtractedMemory {
  content: string
  type: 'insight' | 'fact' | 'preference' | 'context'
  confidence: number
}

/**
 * Extract memories from user-AI exchange
 * Uses pattern matching and heuristics
 * Can be enhanced with AI-powered extraction later
 */
export function extractMemories(
  userMessage: string,
  aiResponse: string
): ExtractedMemory[] {
  const memories: ExtractedMemory[] = []

  // Extract user preferences
  const preferencePatterns = [
    /\b(?:i|my)\s+(?:like|prefer|want|need|enjoy|love)\s+([^.!?]+)/gi,
    /\bmy\s+(?:favorite|preferred|chosen)\s+([^.!?]+)/gi,
    /\bi\s+(?:always|usually|typically|often)\s+([^.!?]+)/gi,
  ]

  for (const pattern of preferencePatterns) {
    const matches = userMessage.matchAll(pattern)
    for (const match of matches) {
      if (match[1] && match[1].length > 5 && match[1].length < 100) {
        memories.push({
          content: match[1].trim(),
          type: 'preference',
          confidence: 0.7
        })
      }
    }
  }

  // Extract facts (definitive statements)
  const factPatterns = [
    /\b(?:is|are|was|were)\s+(?:a|an|the)?\s*([^.!?]{10,80})/gi,
    /\b(?:means?|refers?\s+to|defined\s+as)\s+([^.!?]{10,80})/gi,
  ]

  for (const pattern of factPatterns) {
    const matches = aiResponse.matchAll(pattern)
    for (const match of matches) {
      if (match[1] && !match[1].includes('?')) {
        memories.push({
          content: match[1].trim(),
          type: 'fact',
          confidence: 0.6
        })
      }
    }
  }

  // Extract key insights from AI response
  const insightMarkers = [
    'importantly',
    'key point',
    'crucially',
    'fundamentally',
    'essentially',
    'notably',
    'significantly'
  ]

  const sentences = aiResponse.split(/[.!?]+/)
  for (const sentence of sentences) {
    const lower = sentence.toLowerCase()
    for (const marker of insightMarkers) {
      if (lower.includes(marker) && sentence.length > 20 && sentence.length < 150) {
        memories.push({
          content: sentence.trim(),
          type: 'insight',
          confidence: 0.8
        })
        break
      }
    }
  }

  // Extract context: topics discussed
  const significantWords = extractSignificantWords(userMessage)
  if (significantWords.length >= 2) {
    memories.push({
      content: 'Discussed: ' + significantWords.slice(0, 5).join(', '),
      type: 'context',
      confidence: 0.5
    })
  }

  // Deduplicate similar memories
  return deduplicateMemories(memories)
}

/**
 * Extract significant words (filter out common words)
 */
function extractSignificantWords(text: string): string[] {
  const commonWords = new Set([
    'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i',
    'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at',
    'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her', 'she',
    'or', 'an', 'will', 'my', 'one', 'all', 'would', 'there', 'their',
    'what', 'so', 'up', 'out', 'if', 'about', 'who', 'get', 'which', 'go',
    'me', 'when', 'make', 'can', 'like', 'time', 'no', 'just', 'him', 'know',
    'take', 'people', 'into', 'year', 'your', 'good', 'some', 'could', 'them',
    'see', 'other', 'than', 'then', 'now', 'look', 'only', 'come', 'its', 'over',
    'think', 'also', 'back', 'after', 'use', 'two', 'how', 'our', 'work',
    'first', 'well', 'way', 'even', 'new', 'want', 'because', 'any', 'these',
    'give', 'day', 'most', 'us', 'is', 'was', 'are', 'been', 'has', 'had',
    'were', 'said', 'did', 'having', 'may', 'should', 'could', 'would'
  ])

  const words = text
    .toLowerCase()
    .split(/\W+/)
    .filter(w => w.length > 4 && !commonWords.has(w))

  // Return unique words
  return Array.from(new Set(words))
}

/**
 * Deduplicate similar memories
 */
function deduplicateMemories(memories: ExtractedMemory[]): ExtractedMemory[] {
  const unique: ExtractedMemory[] = []
  const seen = new Set<string>()

  for (const memory of memories) {
    // Create a normalized key for comparison
    const key = memory.content.toLowerCase().slice(0, 50)
    if (!seen.has(key)) {
      seen.add(key)
      unique.push(memory)
    }
  }

  return unique
}

/**
 * Format memories for injection into AI prompt
 * Only includes high-confidence memories
 */
export function formatMemoriesForPrompt(memories: Memory[]): string {
  if (memories.length === 0) return ''

  // Filter for high confidence
  const highConfidence = memories.filter(m => m.confidence >= 0.6)
  if (highConfidence.length === 0) return ''

  // Group by type
  const byType: Record<string, Memory[]> = {
    preference: [],
    fact: [],
    insight: [],
    context: []
  }

  for (const memory of highConfidence) {
    byType[memory.type].push(memory)
  }

  const lines: string[] = []
  lines.push('◈ GRIMOIRE MEMORY')
  lines.push('━━━━━━━━━━━━━━━━━━━━')

  if (byType.preference.length > 0) {
    lines.push('PREFERENCES:')
    byType.preference.slice(0, 3).forEach(m => {
      lines.push(`  • ${m.content}`)
    })
  }

  if (byType.fact.length > 0) {
    lines.push('FACTS:')
    byType.fact.slice(0, 3).forEach(m => {
      lines.push(`  • ${m.content}`)
    })
  }

  if (byType.insight.length > 0) {
    lines.push('INSIGHTS:')
    byType.insight.slice(0, 3).forEach(m => {
      lines.push(`  • ${m.content}`)
    })
  }

  if (byType.context.length > 0) {
    lines.push('CONTEXT:')
    byType.context.slice(0, 2).forEach(m => {
      lines.push(`  • ${m.content}`)
    })
  }

  lines.push('━━━━━━━━━━━━━━━━━━━━')
  lines.push('')

  return lines.join('\n')
}

/**
 * Calculate memory relevance score for a query
 * Higher score = more relevant
 */
export function scoreMemoryRelevance(memory: Memory, query: string): number {
  const queryLower = query.toLowerCase()
  const contentLower = memory.content.toLowerCase()

  // Exact match
  if (contentLower.includes(queryLower) || queryLower.includes(contentLower)) {
    return 1.0
  }

  // Word overlap
  const queryWords = new Set(queryLower.split(/\W+/).filter(w => w.length > 3))
  const contentWords = new Set(contentLower.split(/\W+/).filter(w => w.length > 3))

  let overlap = 0
  for (const word of queryWords) {
    if (contentWords.has(word)) {
      overlap++
    }
  }

  const overlapScore = overlap / Math.max(queryWords.size, 1)

  // Weight by confidence and recency
  const confidenceWeight = memory.confidence
  const recencyWeight = memory.lastAccessed
    ? 1.0 / (1 + (Date.now() - memory.lastAccessed) / (1000 * 60 * 60 * 24 * 30)) // Decay over 30 days
    : 0.5

  return overlapScore * confidenceWeight * recencyWeight
}

/**
 * Get most relevant memories for a query
 */
export function getRelevantMemories(
  memories: Memory[],
  query: string,
  limit: number = 10
): Memory[] {
  const scored = memories.map(m => ({
    memory: m,
    score: scoreMemoryRelevance(m, query)
  }))

  return scored
    .filter(s => s.score > 0.1) // Min relevance threshold
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(s => s.memory)
}
