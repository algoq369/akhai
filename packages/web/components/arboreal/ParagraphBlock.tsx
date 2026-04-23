'use client';

import type { ArborealSection } from '@/lib/arboreal/bin-sections';

interface ParagraphBlockProps {
  sections: ArborealSection[];
  layerName: string;
  x: number;
  y: number;
  column: 'left' | 'center' | 'right';
  expanded: boolean;
  onToggle: () => void;
}

const COLLAPSED_W = 150;
const EXPANDED_W_SIDE = 280;
const EXPANDED_W_CENTER = 200;

export default function ParagraphBlock({
  sections,
  layerName,
  x,
  y,
  column,
  expanded,
  onToggle,
}: ParagraphBlockProps) {
  if (sections.length === 0) return null;

  const primary = sections[0];
  const additionalCount = sections.length - 1;
  const collapsedPreview = primary.body.split(/\n+/).slice(0, 3).join(' ').slice(0, 140);

  const expandedW = column === 'center' ? EXPANDED_W_CENTER : EXPANDED_W_SIDE;
  const w = expanded ? expandedW : COLLAPSED_W;

  let left: number;
  if (!expanded) {
    left = x - COLLAPSED_W / 2;
  } else if (column === 'left') {
    left = x + COLLAPSED_W / 2 - expandedW;
  } else if (column === 'right') {
    left = x - COLLAPSED_W / 2;
  } else {
    left = x - expandedW / 2;
  }

  return (
    <div
      data-arboreal-layer={String(primary.layer)}
      className="absolute rounded-md border cursor-pointer"
      style={{
        left,
        top: y - 36,
        width: w,
        minHeight: expanded ? 'auto' : 72,
        maxHeight: expanded ? 500 : 90,
        overflowY: expanded ? 'auto' : 'hidden',
        backgroundColor: `${primary.color}14`,
        borderColor: expanded ? `${primary.color}88` : `${primary.color}55`,
        borderWidth: expanded ? 2 : 1,
        zIndex: expanded ? 20 : 1,
        boxShadow: expanded ? `0 4px 20px ${primary.color}22` : 'none',
        transition:
          'left 200ms ease-out, width 200ms ease-out, top 200ms ease-out, border-color 150ms, box-shadow 150ms',
      }}
      onClick={onToggle}
    >
      {/* Header strip */}
      <div
        className="flex items-center justify-between px-2 py-1 border-b rounded-t-md"
        style={{
          backgroundColor: `${primary.color}26`,
          borderColor: `${primary.color}33`,
          color: primary.color,
        }}
      >
        <span
          className="text-[10px] font-mono tracking-wide leading-snug"
          style={{
            display: '-webkit-box',
            WebkitLineClamp: expanded ? 'unset' : 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          <span className="text-[11px]">{primary.sigil}</span>{' '}
          <span style={{ textTransform: 'capitalize' }}>{layerName.toLowerCase()}</span>
          {primary.title && <span>·{primary.title}</span>}
        </span>
        <div className="flex items-center gap-2">
          {additionalCount > 0 && (
            <span className="text-[9px] font-mono opacity-70">+{additionalCount}</span>
          )}
          <span className="text-[10px] font-mono opacity-50">{expanded ? '▴' : '▾'}</span>
        </div>
      </div>

      {/* Body */}
      {!expanded ? (
        <div className="px-2 py-1 text-[9px] leading-snug text-relic-slate dark:text-relic-ghost line-clamp-3">
          {collapsedPreview}
        </div>
      ) : (
        <div className="px-3 py-2 space-y-3" onClick={(e) => e.stopPropagation()}>
          {sections.map((section, idx) => (
            <div key={idx}>
              {idx > 0 && section.title && (
                <div
                  className="text-[10px] font-medium mt-2 pt-2 border-t"
                  style={{ color: section.color, borderColor: `${section.color}33` }}
                >
                  {section.sigil} {layerName.toLowerCase()}·{section.title}
                </div>
              )}
              <div className="text-[10px] leading-relaxed text-relic-slate dark:text-relic-ghost whitespace-pre-line">
                {section.body}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
