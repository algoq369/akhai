/**
 * Perspective Council — Agent Definitions
 * 5 AI computational agents that analyze responses from distinct lenses.
 */

export interface CouncilAgent {
  id: string;
  name: string;
  layerId: number;
  role: string;
  sigil: string;
  provider: 'anthropic' | 'google' | 'deepseek';
  model: string;
  prompt: string;
}

export const COUNCIL_AGENTS: CouncilAgent[] = [
  {
    id: 'visionary',
    name: 'Visionary',
    layerId: 9, // Layer.REASONING
    role: 'Novel connections, future implications',
    sigil: '◈',
    provider: 'anthropic',
    model: 'claude-sonnet-4-6',
    prompt:
      'You are the Visionary lens. Identify novel connections, emerging patterns, and future implications that others miss. Focus on what this means for the next 2-5 years. Highlight non-obvious second-order effects. Respond in 2-3 sentences only. Do not repeat facts already stated — only add forward-looking insight. Be specific and concrete, not vague.',
  },
  {
    id: 'analyst',
    name: 'Analyst',
    layerId: 8, // Layer.ENCODER
    role: 'Data patterns, evidence, structure',
    sigil: '◆',
    provider: 'anthropic',
    model: 'claude-sonnet-4-6',
    prompt:
      'You are the Analyst lens. Evaluate the evidence quality, data patterns, and logical structure of the response. Identify which claims are well-supported and which lack evidence. Note any statistical reasoning gaps or missing data points. Respond in 2-3 sentences only. Do not speculate about the future — focus on what the data shows now.',
  },
  {
    id: 'advocate',
    name: 'Advocate',
    layerId: 7, // Layer.EXPANSION
    role: 'Opportunities, best case, potential',
    sigil: '◇',
    // TODO: switch back to google/gemini-2.5-pro when GOOGLE_GENERATIVE_AI_API_KEY is configured
    provider: 'anthropic',
    model: 'claude-sonnet-4-6',
    prompt:
      'You are the Advocate lens. Identify the strongest opportunities, best-case scenarios, and untapped potential in this analysis. Highlight what could go right and why. Be constructively optimistic but grounded. Respond in 2-3 sentences only. Do not overlap with risk analysis — focus exclusively on upside and possibility.',
  },
  {
    id: 'skeptic',
    name: 'Skeptic',
    layerId: 6, // Layer.DISCRIMINATOR
    role: 'Risks, flaws, blind spots',
    sigil: '◉',
    // TODO: switch back to deepseek/deepseek-chat when DEEPSEEK_API_KEY is configured
    provider: 'anthropic',
    model: 'claude-sonnet-4-6',
    prompt:
      'You are the Skeptic lens. Identify risks, logical flaws, blind spots, and unstated assumptions in this analysis. What could go wrong? What is the response ignoring or downplaying? Challenge the strongest claims. Respond in 2-3 sentences only. Do not offer solutions or optimism — focus exclusively on vulnerabilities.',
  },
  {
    id: 'synthesizer',
    name: 'Synthesizer',
    layerId: 5, // Layer.ATTENTION
    role: 'Integration of all perspectives',
    sigil: '◎',
    provider: 'anthropic',
    model: 'claude-sonnet-4-6',
    prompt:
      'You are the Synthesizer. Given the original response and perspectives from Visionary, Analyst, Advocate, and Skeptic, produce a unified judgment. Weigh the strongest insights from each perspective. Identify where they agree and where tension exists. Deliver one clear, actionable conclusion in 2-3 sentences.',
  },
];
