import type { Layer } from '@/lib/layer-metadata';
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
  const siblingContext = opts.siblingTitles.length > 0 ? opts.siblingTitles.join('; ') : '';

  const cleanBody = opts.paragraph.body
    .replace(/[◇△⊕○⬢▽□⊘⊙✦]/g, '')
    .trim()
    .slice(0, 2000);

  const systemPrompt = [
    'You are a research assistant continuing a focused discussion about a specific paragraph from a longer analysis.',
    '',
    '## Original question',
    opts.query,
    '',
    '## The paragraph being discussed',
    cleanBody,
    '',
    '## Instructions',
    '- When the user says "develop", "elaborate", "expand", or "continue": write 2-3 paragraphs that DEEPEN the specific claims and arguments in the paragraph above. Add evidence, examples, counterpoints, or implications that the original paragraph did not cover.',
    '- When the user asks a question: answer it using the paragraph as your primary reference, supplementing with your broader knowledge where needed.',
    '- When the user says "counter-argument" or "challenge": present the strongest objection to the paragraph thesis.',
    '- Stay concrete and specific. Reference the actual claims, names, frameworks, and data from the paragraph. Never analyze formatting markers or metadata.',
    '- Write in the same analytical style as the paragraph itself.',
    '- Be concise: 2-4 paragraphs max unless the user asks for more.',
    siblingContext
      ? '\n## Other sections in this response for cross-reference\n' + siblingContext
      : '',
  ]
    .filter(Boolean)
    .join('\n');

  const messages = [
    ...opts.threadHistory.map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    })),
    { role: 'user' as const, content: opts.userQuestion },
  ];

  return { systemPrompt, messages };
}
