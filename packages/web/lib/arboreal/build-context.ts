import { Layer, LAYER_METADATA } from '@/lib/layer-metadata';
import type { ArborealSection } from './bin-sections';
import type { ArborealMessage } from '@/lib/db/arboreal-threads';

export interface BlockChatContext {
  systemPrompt: string;
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
}

export function buildBlockChatContext(opts: {
  query: string;
  layer: Layer;
  paragraph: ArborealSection;
  siblingTitles: string[];
  threadHistory: ArborealMessage[];
  userQuestion: string;
}): BlockChatContext {
  const meta = LAYER_METADATA[opts.layer];
  const layerDesc = meta
    ? `${meta.name} (${meta.kabbalisticName}) — ${meta.aiRole}. Characteristics: ${meta.queryCharacteristics?.join(', ') ?? 'general analysis'}.`
    : 'Unknown layer';

  const siblingContext =
    opts.siblingTitles.length > 0
      ? `Other sections in this response: ${opts.siblingTitles.join('; ')}.`
      : '';

  const paragraphHeader = opts.paragraph.title
    ? `${opts.paragraph.sigil} ${opts.paragraph.title}: `
    : '';

  const systemPrompt = [
    `You are AkhAI, a sovereign AI research engine. You are responding within a scoped paragraph chat.`,
    `The user's original query was: "${opts.query}"`,
    `You are answering from the perspective of the ${layerDesc}`,
    `The paragraph you are discussing:`,
    `"${paragraphHeader}${opts.paragraph.body.slice(0, 1500)}"`,
    siblingContext,
    `Keep answers focused on this specific paragraph. Be concise — 2-4 paragraphs max.`,
  ]
    .filter(Boolean)
    .join('\n\n');

  const messages = [
    ...opts.threadHistory.map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    })),
    { role: 'user' as const, content: opts.userQuestion },
  ];

  return { systemPrompt, messages };
}
