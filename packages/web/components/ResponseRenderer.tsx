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

// ============ HELPERS ============

function detectLayerFromTitle(title: string): { layer: string; color: string; sigil: string } {
  const lower = title.toLowerCase();
  for (const entry of TITLE_LAYER_MAP) {
    if (entry.keywords.some((kw) => lower.includes(kw))) return entry;
  }
  return { layer: 'Attention', color: '#EAB308', sigil: '☉' };
}

function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/`(.+?)`/g, '$1')
    .replace(/^\s*[-*]\s+/gm, '  \u2022 ')
    .replace(/\[FINAL ANSWER\]:?\s*/gi, '')
    .replace(/\[RELATED\]:?[^\n]*/gi, '')
    .replace(/\[NEXT\]:?[^\n]*/gi, '')
    .replace(/^---+$/gm, '')
    .trim();
}

function parseIntoSections(text: string): { title: string | null; body: string }[] {
  const parts = text.split(/^(#{1,3})\s+(.+)$/m);
  const sections: { title: string | null; body: string }[] = [];

  if (parts[0]?.trim()) {
    sections.push({ title: null, body: stripMarkdown(parts[0].trim()) });
  }

  for (let i = 1; i < parts.length; i += 3) {
    const title = parts[i + 1]?.trim();
    const body = parts[i + 2]?.trim();
    if (title && body) {
      sections.push({ title: stripMarkdown(title), body: stripMarkdown(body) });
    }
  }

  if (sections.length === 0) {
    sections.push({ title: null, body: stripMarkdown(text) });
  }

  return sections;
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
          ? detectLayerFromTitle(section.title)
          : dominantLayer
            ? detectLayerFromTitle(dominantLayer)
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
