/**
 * LLM-powered cognitive signature extractor.
 * Haiku 4.5 primary -> Sonnet 4.6 fallback.
 * Reuses the proven salvage-parser pattern from lib/depth/llm-extractor.ts.
 */

import { buildExchangePrompt, buildSynthesisPrompt } from './prompts';
import { VALID_LENS_IDS } from './lenses';

export const COGNITIVE_PROMPT_VERSION = 1;
export const SYNTHESIS_PROMPT_VERSION = 1;

export interface InlineDialogueEntry {
  lens_id: string;
  text: string;
}

export interface CognitiveSignature {
  inline_dialogue: InlineDialogueEntry[];
  short_metadata_summary: string;
  short_output_summary: string;
  source: string;
}

export interface SynthesisChapter {
  title: string;
  exchanges: string[];
  body: string;
}

export interface ConversationSynthesisResult {
  chapters: SynthesisChapter[];
  source: string;
}

const MODELS = [
  { id: 'claude-haiku-4-5-20251001', label: 'llm-haiku' },
  { id: 'claude-sonnet-4-6', label: 'llm-sonnet' },
] as const;

async function callAnthropic(model: string, system: string, user: string): Promise<string> {
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
        system,
        messages: [{ role: 'user', content: user }],
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

/** Salvage parser — extracts complete JSON objects from potentially truncated output. */
function salvageParse(raw: string): any {
  const cleaned = raw
    .replace(/^```(?:json)?\s*/m, '')
    .replace(/\s*```\s*$/m, '')
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    // Fall through to salvage
  }

  // Try to find a complete top-level object { ... }
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
          return JSON.parse(cleaned.slice(start, i + 1));
        } catch {
          /* continue scanning */
        }
        start = -1;
      }
    }
  }
  throw new Error('No salvageable JSON object found');
}

function validateSignature(obj: any): CognitiveSignature & { source: string } {
  const dialogue = Array.isArray(obj.inline_dialogue) ? obj.inline_dialogue : [];
  const valid = dialogue.filter(
    (e: any) =>
      typeof e?.lens_id === 'string' &&
      VALID_LENS_IDS.has(e.lens_id) &&
      typeof e?.text === 'string' &&
      e.text.length >= 15
  );
  return {
    inline_dialogue: valid.slice(0, 8),
    short_metadata_summary:
      typeof obj.short_metadata_summary === 'string' ? obj.short_metadata_summary : '',
    short_output_summary:
      typeof obj.short_output_summary === 'string' ? obj.short_output_summary : '',
    source: '',
  };
}

function validateSynthesis(obj: any): ConversationSynthesisResult {
  const chapters = Array.isArray(obj.chapters) ? obj.chapters : [];
  const valid = chapters.filter(
    (c: any) =>
      typeof c?.title === 'string' &&
      Array.isArray(c?.exchanges) &&
      typeof c?.body === 'string' &&
      c.body.length >= 30
  );
  return { chapters: valid, source: '' };
}

/** Extract cognitive signature for one exchange. Haiku -> Sonnet fallback. */
export async function extractCognitiveSignature(input: {
  query: string;
  response: string;
  sessionHistory: Array<{ role: string; content: string }>;
}): Promise<CognitiveSignature> {
  const { system, user } = buildExchangePrompt(input);
  let lastError: Error | null = null;

  for (const model of MODELS) {
    try {
      const raw = await callAnthropic(model.id, system, user);
      const parsed = salvageParse(raw);
      const sig = validateSignature(parsed);
      sig.source = model.label;
      console.log(`[Cognitive] ${model.label}: ${sig.inline_dialogue.length} lenses extracted`);
      return sig;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      console.warn(`[Cognitive] ${model.label} failed: ${lastError.message.slice(0, 120)}`);
    }
  }
  throw lastError || new Error('All cognitive extractors failed');
}

/** Generate conversation synthesis. Haiku -> Sonnet fallback. */
export async function generateSynthesis(input: {
  exchanges: Array<{
    queryId: string;
    query: string;
    responseSummary: string;
    metadataSummary: string;
  }>;
}): Promise<ConversationSynthesisResult> {
  const { system, user } = buildSynthesisPrompt(input);
  let lastError: Error | null = null;

  for (const model of MODELS) {
    try {
      const raw = await callAnthropic(model.id, system, user);
      const parsed = salvageParse(raw);
      const result = validateSynthesis(parsed);
      result.source = model.label;
      console.log(`[Cognitive] Synthesis ${model.label}: ${result.chapters.length} chapters`);
      return result;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      console.warn(
        `[Cognitive] Synthesis ${model.label} failed: ${lastError.message.slice(0, 120)}`
      );
    }
  }
  throw lastError || new Error('All synthesis extractors failed');
}
