/**
 * Scenario Engine — Entity extraction + 3-branch prediction builder
 * Used by /api/god-view/predict to generate divergent scenario branches.
 */

/* ── Types ─────────────────────────────────────────────────────────── */

export interface ScenarioInput {
  seed: string;
  question: string;
  domain: 'financial' | 'geopolitical' | 'creative' | 'auto';
}

export interface EntityResult {
  entities: { name: string; type: string }[];
  relationships: { from: string; to: string; label: string }[];
}

export interface ScenarioBranch {
  id: 'optimistic' | 'balanced' | 'pessimistic';
  title: string;
  summary: string;
  keyEvents: string[];
  confidence: number;
  assumptions: string[];
  risks: string[];
}

export interface PredictionResult {
  entities: EntityResult;
  branches: ScenarioBranch[];
  totalCost: number;
  totalLatency: number;
}

export type BranchLens = 'optimistic' | 'balanced' | 'pessimistic';

/* ── Domain Detection ──────────────────────────────────────────────── */

const DOMAIN_KEYWORDS: Record<string, string[]> = {
  financial: [
    'money',
    'market',
    'btc',
    'stock',
    'price',
    'trading',
    'invest',
    'crypto',
    'bond',
    'equity',
    'gdp',
    'inflation',
    'revenue',
    'profit',
  ],
  geopolitical: [
    'country',
    'war',
    'policy',
    'regulation',
    'election',
    'government',
    'sanction',
    'treaty',
    'diplomacy',
    'nato',
    'alliance',
  ],
  creative: [
    'story',
    'character',
    'plot',
    'novel',
    'film',
    'game',
    'design',
    'art',
    'music',
    'narrative',
  ],
};

export function detectDomain(seed: string, question: string): string {
  const text = `${seed} ${question}`.toLowerCase();
  let best = 'auto';
  let bestCount = 0;

  for (const [domain, keywords] of Object.entries(DOMAIN_KEYWORDS)) {
    const count = keywords.filter((kw) => text.includes(kw)).length;
    if (count > bestCount) {
      bestCount = count;
      best = domain;
    }
  }

  return bestCount >= 2 ? best : 'auto';
}

/* ── Entity Extraction Prompt ──────────────────────────────────────── */

export function buildEntityPrompt(): string {
  return `You are an entity extraction engine. Given source material, extract the key entities and their relationships.

Return ONLY valid JSON with this exact structure:
{
  "entities": [{ "name": "Entity Name", "type": "person|org|concept|asset|event|location" }],
  "relationships": [{ "from": "Entity A", "to": "Entity B", "label": "relationship type" }]
}

Rules:
- Extract 5-15 entities maximum
- Include only meaningful relationships (3-10)
- Types: person, org, concept, asset, event, location
- No markdown, no explanation — pure JSON only`;
}

/* ── Branch Prompt Builder ─────────────────────────────────────────── */

const LENS_CONFIG: Record<BranchLens, { layer: string; instruction: string }> = {
  optimistic: {
    layer: 'Expansion',
    instruction:
      'Assume favorable conditions align. Catalysts activate, obstacles diminish, and best-case trajectories unfold. Focus on upside potential, positive feedback loops, and compounding advantages. Be specific about what goes right and why.',
  },
  balanced: {
    layer: 'Attention',
    instruction:
      'Weigh all factors evenly using historical base rates and evidence-weighted reasoning. Neither optimistic nor pessimistic — calibrate to what is most likely given current signals. Account for both tailwinds and headwinds with honest probability assessment.',
  },
  pessimistic: {
    layer: 'Discriminator',
    instruction:
      'Assume worst-case constraints bind. Identify failure modes, black swan risks, and structural vulnerabilities. Stress-test every assumption. Focus on what breaks first, cascade effects, and irreversible damage scenarios.',
  },
};

export function buildBranchPrompt(
  entities: EntityResult,
  question: string,
  domain: string,
  lens: BranchLens
): string {
  const config = LENS_CONFIG[lens];
  const entityList = entities.entities.map((e) => `${e.name} (${e.type})`).join(', ');

  return `You are the ${config.layer} layer of a scenario prediction engine.
Domain: ${domain}
Lens: ${lens.toUpperCase()}

Key entities in play: ${entityList}

The user asks: "${question}"

${config.instruction}

Return ONLY valid JSON with this exact structure:
{
  "title": "Short scenario title (5-10 words)",
  "summary": "2-3 paragraph narrative of how this scenario unfolds. Be specific with mechanisms, not vague hand-waving.",
  "keyEvents": ["Event 1 — Q2 2026", "Event 2 — Q3 2026", "Event 3 — Q4 2026", "Event 4 — Q1 2027", "Event 5 — Q2 2027"],
  "confidence": 65,
  "assumptions": ["Assumption 1", "Assumption 2", "Assumption 3"],
  "risks": ["Risk 1", "Risk 2", "Risk 3"]
}

Rules:
- keyEvents: 5-7 items with approximate dates
- confidence: 0-100 integer (how likely this scenario is)
- assumptions: 3-5 items
- risks: 3-5 items
- No markdown, no explanation — pure JSON only`;
}

/* ── JSON Parser (lenient) ─────────────────────────────────────────── */

export function parseJSONResponse<T>(raw: string): T {
  // Try direct parse first
  try {
    return JSON.parse(raw) as T;
  } catch {
    // Extract JSON from markdown code blocks or surrounding text
    const match = raw.match(/\{[\s\S]*\}/);
    if (match) {
      return JSON.parse(match[0]) as T;
    }
    throw new Error('No valid JSON found in response');
  }
}
