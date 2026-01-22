/**
 * QuickChat Contextual Suggestion Engine
 *
 * Analyzes conversation history to generate intelligent follow-up suggestions
 * based on context, references, and topics discussed.
 */

import type { QuickChatMessage } from './stores/quick-chat-store'

export interface QuickChatSuggestion {
  id: string
  text: string
  type: 'followup' | 'clarify' | 'expand' | 'related'
  confidence: number
  context?: string
}

/**
 * Detects if user message contains reference to previous context
 */
export function detectContextReference(message: string): boolean {
  const referencePatterns = [
    /\b(that|this|it|you said|mentioned|earlier|before|above)\b/i,
    /\b(tell me more|explain|elaborate|details about)\b/i,
    /\b(what do you mean|how does|why is|what about)\b/i,
    /\b(continue|go on|keep going)\b/i,
  ]

  return referencePatterns.some(pattern => pattern.test(message))
}

/**
 * Extracts key topics/entities from message
 */
export function extractTopics(message: string): string[] {
  const topics: string[] = []

  // Common sentence-starting words to filter out
  const commonStartWords = new Set([
    'Based', 'However', 'Therefore', 'Additionally', 'Furthermore', 'Moreover',
    'Nevertheless', 'Nonetheless', 'Meanwhile', 'Consequently', 'Subsequently',
    'Please', 'Sorry', 'Thank', 'Yes', 'No', 'Well', 'Now', 'Then', 'Here',
    'There', 'This', 'That', 'These', 'Those', 'According', 'Regarding',
    'Concerning', 'Unfortunately', 'Fortunately', 'Interestingly', 'Notably',
    'Specifically', 'Generally', 'Particularly', 'Essentially', 'Basically',
    'Actually', 'Really', 'Certainly', 'Definitely', 'Absolutely', 'Obviously',
    'Clearly', 'Indeed', 'Thus', 'Hence', 'Otherwise', 'Instead', 'Rather'
  ])

  // Extract capitalized words (likely proper nouns/important terms)
  const capitalizedWords = message.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g) || []
  const filteredCapitalized = capitalizedWords.filter(word => {
    // Filter out common sentence starters
    const firstWord = word.split(' ')[0]
    if (commonStartWords.has(firstWord)) return false

    // Keep if it's after a period (likely a proper noun, not sentence start)
    const pattern = new RegExp(`\\.\\s+${word}`)
    if (pattern.test(message)) return false

    // Keep if it's in the middle of a sentence
    const beforePattern = new RegExp(`[a-z]\\s+${word}`)
    if (beforePattern.test(message)) return true

    return true
  })
  topics.push(...filteredCapitalized)

  // Extract technical terms (words with special characters, numbers)
  const technicalTerms = message.match(/\b[\w-]+(?:\d+|[A-Z]{2,})\b/g) || []
  topics.push(...technicalTerms)

  // Extract quoted terms
  const quotedTerms = message.match(/"([^"]+)"|'([^']+)'/g) || []
  topics.push(...quotedTerms.map(q => q.replace(/['"]/g, '')))

  // Deduplicate and filter
  const uniqueTopics = Array.from(new Set(topics))
    .filter(t => t.length > 2)
    .filter(t => !commonStartWords.has(t))

  return uniqueTopics
}

/**
 * Analyzes recent messages to identify key concepts
 */
export function analyzeRecentConcepts(messages: QuickChatMessage[]): string[] {
  const recentMessages = messages.slice(-4) // Last 4 messages
  const concepts = new Set<string>()

  recentMessages.forEach(msg => {
    const topics = extractTopics(msg.content)
    topics.forEach(t => concepts.add(t))
  })

  return Array.from(concepts).slice(0, 5) // Top 5 concepts
}

/**
 * Generates contextual suggestions based on conversation history
 */
export function generateSuggestions(
  messages: QuickChatMessage[],
  maxSuggestions: number = 3
): QuickChatSuggestion[] {
  if (messages.length === 0) {
    return []
  }

  const suggestions: QuickChatSuggestion[] = []
  const lastMessage = messages[messages.length - 1]

  // Only generate suggestions after assistant responses
  if (lastMessage.role !== 'assistant') {
    return []
  }

  const lastContent = lastMessage.content.toLowerCase()
  const topics = extractTopics(lastMessage.content)
  const concepts = analyzeRecentConcepts(messages)

  // 1. Follow-up questions based on content
  if (topics.length > 0) {
    const mainTopic = topics[0]
    suggestions.push({
      id: `followup-${Date.now()}-1`,
      text: `tell me more about ${mainTopic}`,
      type: 'followup',
      confidence: 0.8,
      context: mainTopic,
    })
  }

  // 2. Clarification suggestions
  if (lastContent.includes('however') || lastContent.includes('but') || lastContent.includes('although')) {
    suggestions.push({
      id: `clarify-${Date.now()}-1`,
      text: 'can you clarify that?',
      type: 'clarify',
      confidence: 0.7,
    })
  }

  // 3. Expansion suggestions (if response mentions multiple concepts)
  if (concepts.length >= 2) {
    const concept = concepts[1] // Second concept
    suggestions.push({
      id: `expand-${Date.now()}-1`,
      text: `how does ${concept} work?`,
      type: 'expand',
      confidence: 0.75,
      context: concept,
    })
  }

  // 4. Related topic suggestions
  if (lastContent.includes('similar') || lastContent.includes('related') || lastContent.includes('also')) {
    suggestions.push({
      id: `related-${Date.now()}-1`,
      text: 'what else is related?',
      type: 'related',
      confidence: 0.65,
    })
  }

  // 5. Deep dive suggestions (if response seems surface-level)
  if (lastContent.split(' ').length < 30 && topics.length > 0) {
    suggestions.push({
      id: `expand-${Date.now()}-2`,
      text: 'give me more details',
      type: 'expand',
      confidence: 0.6,
    })
  }

  // 6. Practical application suggestions
  if (lastContent.includes('can be used') || lastContent.includes('useful for') || lastContent.includes('helps')) {
    suggestions.push({
      id: `followup-${Date.now()}-2`,
      text: 'show me an example',
      type: 'followup',
      confidence: 0.7,
    })
  }

  // 7. Comparison suggestions (if multiple items mentioned)
  if (concepts.length >= 2) {
    suggestions.push({
      id: `related-${Date.now()}-2`,
      text: `compare ${concepts[0]} and ${concepts[1]}`,
      type: 'related',
      confidence: 0.65,
      context: `${concepts[0]} vs ${concepts[1]}`,
    })
  }

  // Sort by confidence and return top N
  return suggestions
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, maxSuggestions)
}

/**
 * Generates smart suggestions based on user input patterns
 */
export function generateInputSuggestions(
  userInput: string,
  messages: QuickChatMessage[]
): QuickChatSuggestion[] {
  const suggestions: QuickChatSuggestion[] = []
  const input = userInput.toLowerCase().trim()

  // Detect incomplete questions
  if (input.startsWith('what') && !input.includes('?')) {
    suggestions.push({
      id: `input-${Date.now()}-1`,
      text: userInput + '?',
      type: 'clarify',
      confidence: 0.9,
    })
  }

  // Detect reference to previous context
  if (detectContextReference(input)) {
    const concepts = analyzeRecentConcepts(messages)
    if (concepts.length > 0) {
      suggestions.push({
        id: `input-${Date.now()}-2`,
        text: `tell me more about ${concepts[0]}`,
        type: 'followup',
        confidence: 0.75,
        context: concepts[0],
      })
    }
  }

  // Detect vague queries
  const vagueTerms = ['that', 'this', 'it']
  if (vagueTerms.some(term => input === term || input.startsWith(term + ' '))) {
    const lastAssistantMsg = messages.filter(m => m.role === 'assistant').pop()
    if (lastAssistantMsg) {
      const topics = extractTopics(lastAssistantMsg.content)
      if (topics.length > 0) {
        suggestions.push({
          id: `input-${Date.now()}-3`,
          text: `explain ${topics[0]} in detail`,
          type: 'expand',
          confidence: 0.8,
          context: topics[0],
        })
      }
    }
  }

  return suggestions
}

/**
 * Checks if current query is a follow-up to previous conversation
 */
export function isFollowUpQuery(
  currentQuery: string,
  messages: QuickChatMessage[]
): boolean {
  if (messages.length < 2) return false

  const hasReference = detectContextReference(currentQuery)
  const isShortQuery = currentQuery.split(' ').length < 5
  const topics = extractTopics(currentQuery)
  const previousTopics = analyzeRecentConcepts(messages)

  // Check if current query mentions previous topics
  const mentionsPreviousTopics = topics.some(t =>
    previousTopics.some(pt => pt.toLowerCase().includes(t.toLowerCase()))
  )

  return hasReference || (isShortQuery && mentionsPreviousTopics)
}

/**
 * Formats suggestion text for display (capitalize first letter)
 */
export function formatSuggestionText(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1)
}
