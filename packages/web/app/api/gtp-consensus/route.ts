/**
 * GTP (Generative Thought Process) - Multi-AI Consensus API Route
 * 
 * This is ONE of AkhAI's 7 methodologies, specifically for multi-perspective analysis.
 * Uses DeepSeek, Mistral, and Grok in parallel rounds to achieve consensus.
 * 
 * AkhAI School of Thoughts:
 * - Direct: Fast single-pass
 * - CoD: Iterative drafts  
 * - BoT: Template reasoning
 * - ReAct: Tool-augmented
 * - PoT: Code computation
 * - GTP: Multi-AI consensus (THIS FILE)
 * - Auto: Smart routing
 * 
 * Flow:
 * 1. Round 1: All 3 AIs respond independently
 * 2. Round 2: Each AI sees others' responses and refines
 * 3. Synthesis: Claude synthesizes the consensus
 */

import { NextRequest, NextResponse } from 'next/server'
import { log } from '@/lib/logger'

// Provider configurations
const PROVIDERS = {
  deepseek: {
    name: 'DeepSeek',
    endpoint: 'https://api.deepseek.com/v1/chat/completions',
    model: 'deepseek-chat',
    role: 'Technical Analyst',
    icon: '🔬',
    color: '#4F46E5',
  },
  mistral: {
    name: 'Mistral',
    endpoint: 'https://api.mistral.ai/v1/chat/completions',
    model: 'mistral-small-latest',
    role: 'Strategic Advisor',
    icon: '🎯',
    color: '#F97316',
  },
  xai: {
    name: 'Grok',
    endpoint: 'https://api.x.ai/v1/chat/completions',
    model: 'grok-3',
    role: 'Creative Challenger',
    icon: '⚡',
    color: '#10B981',
  },
} as const

type ProviderKey = keyof typeof PROVIDERS

interface AdvisorResponse {
  provider: ProviderKey
  name: string
  role: string
  content: string
  keyPoints: string[]
  confidence: number
  tokens: { input: number; output: number }
  latency: number
  status: 'complete' | 'failed' | 'timeout'
  error?: string
}

interface RoundResult {
  round: number
  responses: AdvisorResponse[]
  consensusLevel: number
  timestamp: number
}


// Helper to call a provider
async function callProvider(
  provider: ProviderKey,
  apiKey: string,
  systemPrompt: string,
  userPrompt: string,
  timeout: number = 60000
): Promise<AdvisorResponse> {
  const config = PROVIDERS[provider]
  const startTime = Date.now()
  
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)
    
    const response = await fetch(config.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: config.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        max_tokens: 2048,
        temperature: 0.7,
      }),
      signal: controller.signal,
    })
    
    clearTimeout(timeoutId)
    
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`${config.name} API error (${response.status}): ${errorText.slice(0, 100)}`)
    }
    
    const data = await response.json()
    const content = data.choices?.[0]?.message?.content || ''
    const latency = Date.now() - startTime
    
    return {
      provider,
      name: config.name,
      role: config.role,
      content,
      keyPoints: extractKeyPoints(content),
      confidence: calculateConfidence(content),
      tokens: {
        input: data.usage?.prompt_tokens || 0,
        output: data.usage?.completion_tokens || 0,
      },
      latency,
      status: 'complete',
    }
  } catch (error: any) {
    const latency = Date.now() - startTime
    const isTimeout = error.name === 'AbortError'
    
    return {
      provider,
      name: config.name,
      role: config.role,
      content: '',
      keyPoints: [],
      confidence: 0,
      tokens: { input: 0, output: 0 },
      latency,
      status: isTimeout ? 'timeout' : 'failed',
      error: error.message,
    }
  }
}


// Extract key points from content
function extractKeyPoints(content: string): string[] {
  const points: string[] = []
  
  const bulletMatches = content.match(/^[•\-\*]\s+(.+)$/gm)
  if (bulletMatches) {
    points.push(...bulletMatches.map(m => m.replace(/^[•\-\*]\s+/, '').trim()))
  }
  
  const numberedMatches = content.match(/^\d+\.\s+(.+)$/gm)
  if (numberedMatches) {
    points.push(...numberedMatches.map(m => m.replace(/^\d+\.\s+/, '').trim()))
  }
  
  const boldMatches = content.match(/\*\*([^*]+)\*\*/g)
  if (boldMatches) {
    points.push(...boldMatches.map(m => m.replace(/\*\*/g, '').trim()))
  }
  
  return Array.from(new Set(points)).filter(p => p.length > 10).slice(0, 5)
}

// Calculate confidence from content
function calculateConfidence(content: string): number {
  const lowerContent = content.toLowerCase()
  const highMarkers = ['definitely', 'certainly', 'clearly', 'undoubtedly', 'confident']
  const lowMarkers = ['might', 'possibly', 'perhaps', 'uncertain', 'unclear', 'may']
  
  let score = 0.7
  highMarkers.forEach(m => { if (lowerContent.includes(m)) score += 0.05 })
  lowMarkers.forEach(m => { if (lowerContent.includes(m)) score -= 0.05 })
  
  return Math.min(0.95, Math.max(0.3, score))
}

// Calculate consensus level between responses
function calculateConsensus(responses: AdvisorResponse[]): number {
  const successful = responses.filter(r => r.status === 'complete')
  if (successful.length < 2) return 0
  
  const allKeyPoints = successful.flatMap(r => r.keyPoints.map(p => p.toLowerCase()))
  const uniquePoints = new Set(allKeyPoints)
  const overlap = 1 - (uniquePoints.size / Math.max(allKeyPoints.length, 1))
  
  return Math.min(0.95, Math.max(0.3, 0.5 + overlap * 0.5))
}


export async function POST(request: NextRequest) {
  const startTime = Date.now()
  const queryId = Math.random().toString(36).slice(2, 10)
  
  log('INFO', 'GTP_CONSENSUS', `Starting multi-AI consensus: ${queryId}`)
  
  try {
    const { query, conversationHistory = [] } = await request.json()
    
    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 })
    }
    
    // Get API keys
    const apiKeys = {
      deepseek: process.env.DEEPSEEK_API_KEY,
      mistral: process.env.MISTRAL_API_KEY,
      xai: process.env.XAI_API_KEY,
      anthropic: process.env.ANTHROPIC_API_KEY,
    }
    
    // Check which providers are available
    const availableProviders = (Object.keys(PROVIDERS) as ProviderKey[])
      .filter(p => apiKeys[p])
    
    if (availableProviders.length === 0) {
      return NextResponse.json({ 
        error: 'No AI providers configured. Add DEEPSEEK_API_KEY, MISTRAL_API_KEY, or XAI_API_KEY.' 
      }, { status: 500 })
    }
    
    log('INFO', 'GTP_CONSENSUS', `Using ${availableProviders.length} providers: ${availableProviders.join(', ')}`)
    
    const rounds: RoundResult[] = []

    
    // ========================
    // ROUND 1: Independent Analysis
    // ========================
    log('INFO', 'GTP_CONSENSUS', 'Starting Round 1: Independent Analysis')
    
    const round1SystemPrompt = `You are a {ROLE} in AkhAI's multi-AI consensus system.

Your task: Analyze the query from your unique perspective.
- Provide independent analysis
- List 3-5 key points using bullet points
- Be concise but thorough
- End with your confidence level (high/medium/low)

Format with clear markdown structure.`
    
    const round1Promises = availableProviders.map(provider => {
      const config = PROVIDERS[provider]
      return callProvider(
        provider,
        apiKeys[provider]!,
        round1SystemPrompt.replace('{ROLE}', config.role),
        query
      )
    })
    
    const round1Responses = await Promise.all(round1Promises)
    const round1Consensus = calculateConsensus(round1Responses)
    
    rounds.push({
      round: 1,
      responses: round1Responses,
      consensusLevel: round1Consensus,
      timestamp: Date.now(),
    })
    
    log('INFO', 'GTP_CONSENSUS', `Round 1 complete. Consensus: ${(round1Consensus * 100).toFixed(0)}%`)

    
    // ========================
    // ROUND 2: Cross-Pollination (if needed)
    // ========================
    const successfulRound1 = round1Responses.filter(r => r.status === 'complete')
    
    if (successfulRound1.length >= 2 && round1Consensus < 0.85) {
      log('INFO', 'GTP_CONSENSUS', 'Starting Round 2: Cross-Pollination')
      
      const round1Context = successfulRound1.map(r => 
        `### ${r.name} (${r.role}):\n${r.content.slice(0, 500)}...`
      ).join('\n\n')
      
      const round2SystemPrompt = `You are a {ROLE} in AkhAI's multi-AI consensus system.

Round 2: You've seen other advisors' perspectives. Refine your analysis.

Other advisors said:
${round1Context}

Your task:
1. Consider other perspectives
2. Identify areas of agreement
3. Note disagreements and why
4. Provide refined analysis

Be collaborative, not combative.`
      
      const round2Promises = availableProviders
        .filter(p => round1Responses.find(r => r.provider === p)?.status === 'complete')
        .map(provider => {
          const config = PROVIDERS[provider]
          return callProvider(
            provider,
            apiKeys[provider]!,
            round2SystemPrompt.replace('{ROLE}', config.role),
            `Original query: ${query}\n\nProvide your refined perspective.`
          )
        })
      
      const round2Responses = await Promise.all(round2Promises)
      const round2Consensus = calculateConsensus(round2Responses)
      
      rounds.push({
        round: 2,
        responses: round2Responses,
        consensusLevel: round2Consensus,
        timestamp: Date.now(),
      })
      
      log('INFO', 'GTP_CONSENSUS', `Round 2 complete. Consensus: ${(round2Consensus * 100).toFixed(0)}%`)
    }

    
    // ========================
    // SYNTHESIS: Final Merge
    // ========================
    log('INFO', 'GTP_CONSENSUS', 'Starting Synthesis phase')
    
    const lastRound = rounds[rounds.length - 1]
    const successfulResponses = lastRound.responses.filter(r => r.status === 'complete')
    
    const synthesisContext = successfulResponses.map(r => 
      `### ${r.name} (${r.role}):\n${r.content}`
    ).join('\n\n---\n\n')
    
    let finalSynthesis: string
    let synthesisTokens = { input: 0, output: 0 }
    
    if (apiKeys.anthropic) {
      const synthesisResponse = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKeys.anthropic,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 4096,
          system: `You are Mother Base, the synthesizer in AkhAI's multi-AI consensus system.

Synthesize insights from ${successfulResponses.length} AI advisors into a unified response.

Guidelines:
- Integrate all perspectives coherently
- Highlight strong agreements
- Note important disagreements
- Provide clear, actionable conclusions
- Be concise but complete`,
          messages: [{
            role: 'user',
            content: `# Query\n${query}\n\n# Advisor Insights\n\n${synthesisContext}\n\n# Task\nSynthesize into a comprehensive response.`
          }],
        }),
      })
      
      if (synthesisResponse.ok) {
        const data = await synthesisResponse.json()
        finalSynthesis = data.content?.[0]?.text || 'Synthesis failed'
        synthesisTokens = {
          input: data.usage?.input_tokens || 0,
          output: data.usage?.output_tokens || 0,
        }
      } else {
        finalSynthesis = `# Multi-AI Consensus Response\n\n${synthesisContext}`
      }
    } else {
      const best = successfulResponses.sort((a, b) => b.confidence - a.confidence)[0]
      finalSynthesis = best?.content || 'No successful responses'
    }

    
    // ========================
    // Calculate Final Metrics
    // ========================
    const totalLatency = Date.now() - startTime
    
    let totalInputTokens = synthesisTokens.input
    let totalOutputTokens = synthesisTokens.output
    
    rounds.forEach(round => {
      round.responses.forEach(r => {
        totalInputTokens += r.tokens.input
        totalOutputTokens += r.tokens.output
      })
    })
    
    const costs: Record<string, { input: number; output: number }> = {
      deepseek: { input: 0.00055, output: 0.00219 },
      mistral: { input: 0.0002, output: 0.0006 },
      xai: { input: 0.002, output: 0.01 },
      anthropic: { input: 0.003, output: 0.015 },
    }
    
    let totalCost = (synthesisTokens.input / 1000) * costs.anthropic.input +
                    (synthesisTokens.output / 1000) * costs.anthropic.output
    
    rounds.forEach(round => {
      round.responses.forEach(r => {
        const providerCosts = costs[r.provider]
        totalCost += (r.tokens.input / 1000) * providerCosts.input +
                     (r.tokens.output / 1000) * providerCosts.output
      })
    })
    
    log('INFO', 'GTP_CONSENSUS', `Complete in ${totalLatency}ms. Cost: $${totalCost.toFixed(4)}`)
    
    // ========================
    // Build Response
    // ========================
    return NextResponse.json({
      id: queryId,
      query,
      methodology: 'gtp',
      methodologyUsed: 'gtp-consensus',
      selectionReason: 'Multi-AI consensus for comprehensive analysis',
      response: finalSynthesis,
      
      gtpData: {
        providers: availableProviders.map(p => ({
          id: p,
          ...PROVIDERS[p],
        })),
        rounds,
        finalConsensus: lastRound.consensusLevel,
        synthesizer: apiKeys.anthropic ? 'anthropic' : 'best-response',
      },
      
      metrics: {
        tokens: totalInputTokens + totalOutputTokens,
        inputTokens: totalInputTokens,
        outputTokens: totalOutputTokens,
        latency: totalLatency,
        cost: totalCost,
        roundCount: rounds.length,
        providersUsed: availableProviders.length,
        successRate: successfulResponses.length / availableProviders.length,
      },
    })
    
  } catch (error: any) {
    log('ERROR', 'GTP_CONSENSUS', `Error: ${error.message}`)
    return NextResponse.json(
      { error: 'GTP consensus failed', details: error.message },
      { status: 500 }
    )
  }
}
