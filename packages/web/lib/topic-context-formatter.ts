/**
 * Topic Context Formatter
 *
 * Formats MindMap topic context for injection into AI prompts
 * Enables scoped discussions about selected topics
 */

export interface TopicContext {
  topicId: string
  topicName: string
  topicDescription?: string
  relatedTopics?: string[]
  insights?: string[]
}

/**
 * Formats topic context into a structured prompt section
 *
 * @param topicContext - Topic information from MindMap
 * @returns Formatted string for system prompt injection
 */
export function formatTopicContextForPrompt(topicContext: TopicContext): string {
  if (!topicContext || !topicContext.topicId) {
    return ''
  }

  let prompt = `\n\n◈ TOPIC CONTEXT - SCOPED DISCUSSION\n`
  prompt += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`
  prompt += `Primary Topic: ${topicContext.topicName}\n`

  if (topicContext.topicDescription) {
    prompt += `Description: ${topicContext.topicDescription}\n`
  }

  prompt += `\nYou are discussing this topic in the context of a knowledge graph.\n`

  if (topicContext.relatedTopics && topicContext.relatedTopics.length > 0) {
    prompt += `Related topics: ${topicContext.relatedTopics.join(', ')}\n`
  } else {
    prompt += `No related topics yet.\n`
  }

  if (topicContext.insights && topicContext.insights.length > 0) {
    prompt += `\nKey insights:\n`
    topicContext.insights.forEach(insight => {
      prompt += `• ${insight}\n`
    })
  }

  prompt += `\nINSTRUCTIONS:\n`
  prompt += `• Keep responses focused on "${topicContext.topicName}" unless the user explicitly asks for broader context\n`
  prompt += `• Leverage related topics when drawing connections\n`
  prompt += `• Consider the insights provided above when formulating answers\n`
  prompt += `• If the query extends beyond this topic, acknowledge and clarify scope with the user\n`
  prompt += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`

  return prompt
}
