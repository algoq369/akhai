/**
 * LLM-powered depth annotation extractor.
 * Haiku 4.5 primary → Sonnet 4.6 fallback → caller handles regex fallback.
 */

import { buildExtractionSystemPrompt } from './prompts';

/** Bump this whenever the extraction prompt changes — invalidates cached annotations. */
export const ANNOTATION_PROMPT_VERSION = 1;

export interface LLMAnnotation {
  term: string;
  layer: string;
  insight: string;
}

const MODELS = [
  { id: 'claude-haiku-4-5-20251001', label: 'llm-haiku' },
  { id: 'claude-sonnet-4-6', label: 'llm-sonnet' },
] as const;

async function callAnthropic(
  model: string,
  systemPrompt: string,
  userPrompt: string
): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not set');

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 40000);

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        max_tokens: 4096,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      throw new Error(`Anthropic ${res.status}: ${errText.slice(0, 200)}`);
    }

    const data = await res.json();
    return data.content?.[0]?.text || '';
  } finally {
    clearTimeout(timeout);
  }
}

function parseAnnotations(raw: string): LLMAnnotation[] {
  // Strip markdown fences if model included them despite instructions
  const cleaned = raw
    .replace(/^```(?:json)?\s*/m, '')
    .replace(/\s*```\s*$/m, '')
    .trim();

  // Try strict parse first
  try {
    const parsed = JSON.parse(cleaned);
    if (Array.isArray(parsed)) return filterValid(parsed);
  } catch {
    // Fall through to salvage mode
  }

  // Salvage: output got truncated mid-object (hit max_tokens).
  // Walk forward, extract every complete {…} at depth 1, stop when the next one is incomplete.
  const out: any[] = [];
  let depth = 0;
  let start = -1;
  let inStr = false;
  let esc = false;
  for (let i = 0; i < cleaned.length; i++) {
    const c = cleaned[i];
    if (esc) {
      esc = false;
      continue;
    }
    if (c === '\\') {
      esc = true;
      continue;
    }
    if (c === '"') {
      inStr = !inStr;
      continue;
    }
    if (inStr) continue;
    if (c === '{') {
      if (depth === 0) start = i;
      depth++;
    } else if (c === '}') {
      depth--;
      if (depth === 0 && start >= 0) {
        try {
          out.push(JSON.parse(cleaned.slice(start, i + 1)));
        } catch {
          /* skip malformed */
        }
        start = -1;
      }
    }
  }
  if (out.length === 0) throw new Error('No salvageable annotations');
  console.warn(`[DepthExtract] Salvaged ${out.length} annotations from truncated JSON`);
  return filterValid(out);
}

function filterValid(arr: any[]): LLMAnnotation[] {
  return arr.filter(
    (a: any) =>
      typeof a?.term === 'string' &&
      a.term.length >= 2 &&
      typeof a?.layer === 'string' &&
      typeof a?.insight === 'string' &&
      a.insight.length >= 10
  );
}

/**
 * Extract annotations using LLM. Tries Haiku first, then Sonnet.
 * Throws if both fail — caller should fall back to regex.
 */
export async function extractAnnotationsLLM(
  responseText: string,
  queryText: string
): Promise<{ annotations: LLMAnnotation[]; source: string }> {
  const systemPrompt = buildExtractionSystemPrompt();
  const userPrompt = `QUERY: ${queryText}\n\nRESPONSE TO ANNOTATE:\n${responseText.slice(0, 12000)}`;

  let lastError: Error | null = null;

  for (const model of MODELS) {
    try {
      const raw = await callAnthropic(model.id, systemPrompt, userPrompt);
      const annotations = parseAnnotations(raw);
      console.log(`[DepthExtract] ${model.label}: ${annotations.length} annotations extracted`);
      return { annotations, source: model.label };
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      console.warn(`[DepthExtract] ${model.label} failed: ${lastError.message.slice(0, 120)}`);
    }
  }

  throw lastError || new Error('All LLM extractors failed');
}
