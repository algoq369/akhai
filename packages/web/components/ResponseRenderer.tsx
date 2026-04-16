'use client';

import React, { useMemo } from 'react';
import { DepthText } from '@/components/DepthAnnotation';
import { type DepthConfig, DEFAULT_DEPTH_CONFIG } from '@/lib/depth-annotations';

// ============ LAYER KEYWORD MAP ============

const TITLE_LAYER_MAP: { keywords: string[]; layer: string; color: string; sigil: string }[] = [
  {
    keywords: ['risk', 'limitation', 'flaw', 'challenge', 'concern', 'critical', 'warning'],
    layer: 'Discriminator',
    color: '#EF4444',
    sigil: '◈',
  },
  {
    keywords: ['principle', 'foundation', 'fundamental', 'first', 'core', 'reasoning'],
    layer: 'Reasoning',
    color: '#6B7280',
    sigil: '→',
  },
  {
    keywords: ['pattern', 'structure', 'deep', 'encode', 'framework', 'architecture'],
    layer: 'Encoder',
    color: '#6366F1',
    sigil: '△',
  },
  {
    keywords: ['expand', 'possibility', 'explore', 'broaden', 'future', 'trajectory', 'forecast'],
    layer: 'Expansion',
    color: '#3B82F6',
    sigil: '○',
  },
  {
    keywords: ['creative', 'imagine', 'brainstorm', 'innovate', 'idea', 'novel'],
    layer: 'Generative',
    color: '#22C55E',
    sigil: '⊕',
  },
  {
    keywords: [
      'synthesize',
      'integrate',
      'combine',
      'attention',
      'overview',
      'summary',
      'conclusion',
    ],
    layer: 'Attention',
    color: '#EAB308',
    sigil: '☉',
  },
  {
    keywords: ['compare', 'classify', 'logic', 'evaluate', 'analysis', 'assess', 'examine'],
    layer: 'Classifier',
    color: '#F97316',
    sigil: '□',
  },
  {
    keywords: ['implement', 'execute', 'step', 'how', 'guide', 'practical', 'action', 'recommend'],
    layer: 'Executor',
    color: '#9333EA',
    sigil: '▽',
  },
  {
    keywords: ['fact', 'data', 'define', 'basic', 'what is', 'overview', 'introduction'],
    layer: 'Embedding',
    color: '#F59E0B',
    sigil: '●',
  },
  {
    keywords: ['meta', 'conscious', 'aware', 'self', 'knowledge', 'epistemic'],
    layer: 'Meta-Core',
    color: '#7C3AED',
    sigil: '◊',
  },
  {
    keywords: ['insight', 'emerge', 'hidden', 'connect', 'epiphany', 'revelation'],
    layer: 'Synthesis',
    color: '#06B6D4',
    sigil: '✦',
  },
];

// Diverse palette for cycling when multiple sections have generic names (PATH 1, PATH 2, etc.)
const CYCLING_LAYERS = [
  { layer: 'Encoder', color: '#6366F1', sigil: '△' },
  { layer: 'Expansion', color: '#3B82F6', sigil: '○' },
  { layer: 'Generative', color: '#22C55E', sigil: '⊕' },
  { layer: 'Executor', color: '#9333EA', sigil: '▽' },
  { layer: 'Classifier', color: '#F97316', sigil: '□' },
];

// ============ HELPERS ============

function detectLayerFromTitle(
  title: string,
  sectionIdx: number = 0
): { layer: string; color: string; sigil: string } {
  const lower = title.toLowerCase();

  // Special handling: PATH 1, PATH 2, PATH 3 cycle through colors for visual distinction
  const pathMatch = lower.match(/^path\s+(\d+)/);
  if (pathMatch) {
    const pathNum = parseInt(pathMatch[1]);
    return CYCLING_LAYERS[(pathNum - 1) % CYCLING_LAYERS.length];
  }

  // Convergence/consensus/synthesis gets a distinct layer
  if (/convergence|consensus|synthesis|final/.test(lower)) {
    return { layer: 'Synthesis', color: '#06B6D4', sigil: '✦' };
  }

  for (const entry of TITLE_LAYER_MAP) {
    if (entry.keywords.some((kw) => lower.includes(kw))) return entry;
  }

  // Fallback: cycle by section index to visually distinguish
  return CYCLING_LAYERS[sectionIdx % CYCLING_LAYERS.length];
}

function stripMarkdown(text: string): string {
  return (
    text
      .replace(/\*\*(.+?)\*\*/g, '$1')
      .replace(/\*([^*\n]+?)\*/g, '$1')
      .replace(/`(.+?)`/g, '$1')
      .replace(/^\s*[-*]\s+/gm, '  \u2022 ')
      // Strip bold-wrapped section markers: **[TAG]** → nothing
      .replace(/^\s*\*\*\[[A-Z][^\]]{1,80}\]\*\*\s*:?\s*/gm, '')
      // Strip plain bracketed section markers at line start: [TAG] or [TAG]:
      .replace(/^\s*\[[A-Z][^\]]{1,80}\]\s*:?\s*/gm, '')
      // Strip bold-only section headers: **CONSENSUS:** → nothing
      .replace(/\*\*([A-Z][A-Z\s\d]+(?:\s*\([^)]+\))?)\s*:\*\*/g, '')
      // Strip inline tags
      .replace(/\[FINAL ANSWER\]:?\s*/gi, '')
      .replace(/\[RELATED\]:?[^\n]*/gi, '')
      .replace(/\[NEXT\]:?[^\n]*/gi, '')
      .replace(/^---+$/gm, '')
      .trim()
  );
}

const DENYLIST_TITLES = /^(RELATED|NEXT|FINAL ANSWER|SUGGESTED|FOLLOW[\s-]?UP)$/i;

function parseIntoSections(text: string): { title: string | null; body: string }[] {
  // Strip footer metadata tags before section detection
  const cleanedText = text
    .replace(
      /^\s*\*{0,2}\[(?:RELATED|NEXT|FINAL ANSWER|SUGGESTED|FOLLOW[\s-]?UP)\]\*{0,2}\s*:?[^\n]*$/gim,
      ''
    )
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  const sections: { title: string | null; body: string }[] = [];

  // Matches:
  //   ## Header                          → capture group 2
  //   **[TAG]**                          → capture group 3
  //   [TAG]                              → capture group 3
  //   **PATH 1 (label):** or **CONSENSUS:** → capture group 4 (bold-only with colon)
  const sectionRegex =
    /^(?:(#{1,3})\s+(.+)|\*{0,2}\[([A-Z][^\]]{1,80})\]\*{0,2}\s*:?\s*|\*\*([A-Z][A-Z\s\d]+(?:\s*\([^)]+\))?)\s*:\*\*\s*)/gm;

  const parts: { index: number; title: string }[] = [];
  let m: RegExpExecArray | null;
  while ((m = sectionRegex.exec(cleanedText)) !== null) {
    const title = (m[2] || m[3] || m[4] || '').trim();
    if (title && !DENYLIST_TITLES.test(title)) {
      parts.push({ index: m.index, title });
    }
  }

  if (parts.length === 0) {
    return [{ title: null, body: stripMarkdown(cleanedText) }];
  }

  // Content before first marker (if any)
  if (parts[0].index > 0) {
    const preface = cleanedText.slice(0, parts[0].index).trim();
    if (preface) sections.push({ title: null, body: stripMarkdown(preface) });
  }

  // Process each section
  for (let i = 0; i < parts.length; i++) {
    const start = parts[i].index;
    const end = i + 1 < parts.length ? parts[i + 1].index : cleanedText.length;
    const segment = cleanedText.slice(start, end);
    const body = segment
      .replace(
        /^(?:#{1,3}\s+.+|\*{0,2}\[[A-Z][^\]]{1,80}\]\*{0,2}\s*:?\s*|\*\*[A-Z][A-Z\s\d]+(?:\s*\([^)]+\))?\s*:\*\*\s*)/,
        ''
      )
      .trim();
    sections.push({ title: stripMarkdown(parts[i].title), body: stripMarkdown(body) });
  }

  return splitEntityParagraphs(sections);
}

function splitEntityParagraphs(
  sections: { title: string | null; body: string }[]
): { title: string | null; body: string }[] {
  const result: { title: string | null; body: string }[] = [];
  const entityPattern = /^([A-Z][\w\s'\.&]{2,60}?(?:\s*\([^)]+\))?)\s+[—–-]\s+/;

  for (const section of sections) {
    const paragraphs = section.body.split(/\n\n+/).filter((p) => p.trim());
    const entityParas = paragraphs.filter((p) => entityPattern.test(p));

    if (entityParas.length >= 3 && entityParas.length === paragraphs.length) {
      if (section.title) {
        result.push({ title: section.title, body: '' });
      }
      for (const para of paragraphs) {
        const match = para.match(entityPattern);
        const entityTitle = match ? match[1].trim() : null;
        const entityBody = match ? para.slice(match[0].length).trim() : para;
        result.push({ title: entityTitle, body: entityBody });
      }
    } else {
      result.push(section);
    }
  }

  return result;
}

// ============ COMPONENT ============

interface ResponseRendererProps {
  content: string;
  dominantLayer?: string;
  annotations?: any[];
  depthConfig?: DepthConfig;
  onExpand?: (query: string) => void;
  className?: string;
}

export default function ResponseRenderer({
  content,
  dominantLayer,
  annotations,
  depthConfig,
  onExpand,
  className,
}: ResponseRendererProps) {
  const sections = useMemo(() => parseIntoSections(content), [content]);

  return (
    <div className={className}>
      {sections.map((section, idx) => {
        const layerInfo = section.title
          ? detectLayerFromTitle(section.title, idx)
          : dominantLayer
            ? detectLayerFromTitle(dominantLayer, idx)
            : { layer: 'Embedding', color: '#F59E0B', sigil: '●' };

        const paragraphs = section.body.split(/\n\n+/).filter((p) => p.trim());

        return (
          <div key={idx} className={idx > 0 ? 'mt-5' : ''}>
            {section.title && (
              <div className="flex items-center gap-1.5 mb-2">
                <span className="text-[12px]" style={{ color: layerInfo.color }}>
                  {layerInfo.sigil}
                </span>
                <span
                  className="text-[12px] font-medium uppercase tracking-wide"
                  style={{ color: layerInfo.color }}
                >
                  {section.title}
                </span>
              </div>
            )}
            {!section.title && idx === 0 && dominantLayer && (
              <div className="flex items-center gap-1.5 mb-2">
                <span className="text-[11px]" style={{ color: layerInfo.color }}>
                  {layerInfo.sigil}
                </span>
                <span
                  className="text-[11px] font-medium tracking-wide"
                  style={{ color: layerInfo.color }}
                >
                  {layerInfo.layer}
                </span>
              </div>
            )}
            {paragraphs.map((para, pIdx) => (
              <div
                key={pIdx}
                className={`text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed ${pIdx > 0 ? 'mt-3' : ''}`}
              >
                {annotations && annotations.length > 0 ? (
                  <DepthText
                    text={para}
                    annotations={annotations.filter((a) => para.includes(a.term || ''))}
                    config={depthConfig || { ...DEFAULT_DEPTH_CONFIG, enabled: true }}
                    className=""
                    onExpand={onExpand}
                  />
                ) : (
                  para
                )}
              </div>
            ))}
            {idx < sections.length - 1 && (
              <div className="mt-4 border-t border-zinc-100 dark:border-zinc-800" />
            )}
          </div>
        );
      })}
    </div>
  );
}
