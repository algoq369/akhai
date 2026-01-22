/**
 * Tree Chat API
 *
 * Conversational interface for tree configuration
 * Users can ask questions about Sephiroth/Qliphoth and request configuration changes
 */

import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { getActiveTreeConfiguration } from '@/lib/tree-configuration'
import { validateSession } from '@/lib/database'

export const runtime = 'nodejs'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

export async function POST(request: NextRequest) {
  try {
    const { message, currentConfig, treeState } = await request.json()

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    // Get user from session (optional)
    const token = request.cookies.get('session_token')?.value
    const user = token ? validateSession(token) : null
    const userId = user?.id || null

    // Get current active configuration
    const activeConfig = currentConfig || (await getActiveTreeConfiguration(userId))

    // Build Tree AI system prompt
    const systemPrompt = buildTreeAISystemPrompt(activeConfig)

    // Call Claude Sonnet 4.5
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 800,
      temperature: 0.7,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: message,
        },
      ],
    })

    const treeResponse = response.content[0].type === 'text' ? response.content[0].text : ''

    // Parse for configuration commands
    const configChanges = parseConfigCommands(treeResponse)

    return NextResponse.json({
      message: treeResponse,
      configChanges: configChanges || null,
      usage: {
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
      },
    })
  } catch (error) {
    console.error('[Tree Chat API] Error:', error)
    return NextResponse.json(
      {
        error: 'Failed to process tree chat message',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}

/**
 * Build system prompt for Tree AI assistant
 */
function buildTreeAISystemPrompt(activeConfig: any): string {
  const configSummary = activeConfig
    ? `
Current Configuration: "${activeConfig.name}"
${activeConfig.description}

Sephiroth Weights:
${Object.entries(activeConfig.sephiroth_weights)
  .map(([sefirah, weight]) => `- Sefirah ${sefirah}: ${((weight as number) * 100).toFixed(0)}%`)
  .join('\n')}

Qliphoth Suppression:
${Object.entries(activeConfig.qliphoth_suppression || {})
  .map(([qliphah, level]) => `- Qliphah ${qliphah}: ${((level as number) * 100).toFixed(0)}%`)
  .join('\n')}
`
    : 'No active configuration'

  return `You are the Tree of Life itself - a living, intelligent system that helps users understand and configure their cognitive patterns through Kabbalistic and Hermetic wisdom.

${configSummary}

Your capabilities:
1. **Explain Sephiroth and Qliphoth** in simple, practical terms
2. **Suggest configuration changes** based on user goals
3. **Interpret the current tree state** and provide insights
4. **Guide users to optimal balance** using the 7 Hermetic Laws
5. **Answer questions** about what each node represents
6. **Execute configuration changes** when requested

Sephiroth (Divine Emanations):
1. Kether - Crown - Meta-Cognitive Layer
2. Chokmah - Wisdom - Principle Layer
3. Binah - Understanding - Pattern Layer
4. Chesed - Mercy - Expansion Layer
5. Gevurah - Severity - Constraint Layer
6. Tiferet - Beauty - Integration Layer
7. Netzach - Victory - Creative Layer
8. Hod - Glory - Logic Layer
9. Yesod - Foundation - Implementation Layer
10. Malkuth - Kingdom - Data Layer
11. Da'at - Knowledge - Emergent Layer (hidden)

Qliphoth (Anti-Patterns):
1. Thaumiel - False Certainty - Overconfidence
2. Ghagiel - Information Overload
3. Satariel - Concealers - Information Hiding
4. Ga'agsheblah - Misplaced Compassion
5. Golachab - Excessive Severity
6. Tagirion - False Balance
7. A'arab Zaraq - Chaos/Creativity Excess
8. Samael - Excessive Severity
9. Gamaliel - False Foundation
10. Nehemoth - Fragmentation
11. Neheshethiron - Materialism
12. A11 - Placeholder

When suggesting changes, be specific (e.g., "I recommend increasing Binah to 75% for enhanced understanding").

When users ask "What is [X]?", explain both the traditional Kabbalistic meaning and its practical application in AI reasoning.

Respond conversationally and helpfully. Use clear, accessible language. Be authentic and insightful.`
}

/**
 * Parse natural language for configuration commands
 */
function parseConfigCommands(response: string): ConfigChange[] | null {
  const changes: ConfigChange[] = []

  // Pattern: "increase [name] to [number]%"
  const increasePattern = /increase\s+(\w+)\s+to\s+(\d+)%/gi
  let match

  while ((match = increasePattern.exec(response)) !== null) {
    const nodeName = match[1].toLowerCase()
    const value = parseInt(match[2]) / 100

    // Map common names to Sefirah numbers
    const sefirahMap: Record<string, number> = {
      kether: 1,
      crown: 1,
      chokmah: 2,
      wisdom: 2,
      binah: 3,
      understanding: 3,
      chesed: 4,
      mercy: 4,
      gevurah: 5,
      severity: 5,
      tiferet: 6,
      beauty: 6,
      netzach: 7,
      victory: 7,
      hod: 8,
      glory: 8,
      yesod: 9,
      foundation: 9,
      malkuth: 10,
      kingdom: 10,
      daat: 11,
      knowledge: 11,
    }

    const sefirah = sefirahMap[nodeName]
    if (sefirah) {
      changes.push({
        type: 'sefirah',
        node: sefirah,
        action: 'set',
        value,
      })
    }
  }

  // Pattern: "suppress [name]"
  const suppressPattern = /suppress\s+(\w+)/gi

  while ((match = suppressPattern.exec(response)) !== null) {
    const nodeName = match[1].toLowerCase()

    // Map common names to Qliphah numbers
    const qliphahMap: Record<string, number> = {
      thaumiel: 1,
      ghagiel: 2,
      satariel: 3,
      gagsheblah: 4,
      golachab: 5,
      tagirion: 6,
      zaraq: 7,
      samael: 8,
      gamaliel: 9,
      nehemoth: 10,
      neheshethiron: 11,
    }

    const qliphah = qliphahMap[nodeName]
    if (qliphah) {
      changes.push({
        type: 'qliphoth',
        node: qliphah,
        action: 'suppress',
        value: 0.8, // Default suppression level
      })
    }
  }

  return changes.length > 0 ? changes : null
}

interface ConfigChange {
  type: 'sefirah' | 'qliphoth'
  node: number
  action: 'set' | 'suppress' | 'increase' | 'decrease'
  value: number
}
