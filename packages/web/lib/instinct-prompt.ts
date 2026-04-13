/**
 * Instinct Mode system prompt builder.
 * Enriches any methodology's system prompt with 7 hermetic lenses.
 * Zero extra API calls — prompt enrichment only.
 */

import { SEVEN_LENSES } from './instinct-mode';
import type { InstinctConfig } from './instinct-mode';

export function buildInstinctPrompt(config: InstinctConfig, esotericContext?: string): string {
  if (!config.enabled) return '';

  const activeLenses = SEVEN_LENSES.filter((l) => config.activeLenses.includes(l.id));
  if (activeLenses.length === 0) return '';

  const lensLines = activeLenses
    .map((l) => `${l.symbol} ${l.name.toUpperCase()}: ${l.description}`)
    .join('\n');

  const depthGuide =
    config.depth === 'standard'
      ? 'Mention key lenses briefly where relevant — a sentence or two each.'
      : config.depth === 'deep'
        ? 'Develop each perspective in 1-2 sentences, weaving cross-lens connections.'
        : 'Full hermetic analysis with cross-lens synthesis. Every perspective developed and interconnected.';

  let prompt = `
You are operating in INSTINCT MODE — holistic hermetic analysis.
Weave these perceptual lenses into your response naturally — do not list them as separate sections.
Instead, let each lens deepen your analysis organically:

${lensLines}

${depthGuide}

IMPORTANT: Do NOT use headers or bullet points for each lens. Weave them into flowing prose. The reader should feel deeper insight, not see a checklist.`;

  if (esotericContext) {
    prompt += `\n\nCurrent macro-cyclical context:\n${esotericContext}`;
  }

  return prompt;
}

/**
 * Build esoteric context string from live framework positions.
 * Safe to call server-side only (uses fs via cycle-engine).
 */
export function buildEsotericContext(positions: {
  barbault: { currentIndex: number; trend: string };
  kondratieff: { phase: string; perezStage: string };
  turchin: { psi: number; phase: string };
}): string {
  return [
    `Barbault Planetary Index: ${positions.barbault.currentIndex} (${positions.barbault.trend})`,
    `Kondratieff Wave: ${positions.kondratieff.phase} — ${positions.kondratieff.perezStage}`,
    `Turchin PSI: ${positions.turchin.psi} (${positions.turchin.phase})`,
  ].join(', ');
}
