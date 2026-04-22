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
const EXPANDED_W = 280;

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

  const w = expanded ? EXPANDED_W : COLLAPSED_W;

  // Expand direction anchors the edge closest to the tree's center column.
  let left: number;
  if (!expanded) {
    left = x - COLLAPSED_W / 2;
  } else if (column === 'left') {
    // Anchor right edge where the collapsed right edge was; grow leftward.
    left = x + COLLAPSED_W / 2 - EXPANDED_W;
  } else if (column === 'right') {
    // Anchor left edge where the collapsed left edge was; grow rightward.
    left = x - COLLAPSED_W / 2;
  } else {
    // Center column expands equally to both sides.
    left = x - EXPANDED_W / 2;
  }

  return (
    <div
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
          'left 200ms ease-out, width 200ms ease-out, top 200ms ease-out, min-height 200ms ease-out, border-color 150ms, box-shadow 150ms',
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
        <span className="text-[10px] font-mono tracking-wider flex items-center gap-1">
          <span className="text-[11px]">{primary.sigil}</span>
          <span className="uppercase">{layerName}</span>
        </span>
        <div className="flex items-center gap-2">
          {additionalCount > 0 && (
            <span className="text-[9px] font-mono opacity-70">+{additionalCount}</span>
          )}
          <span className="text-[10px] font-mono opacity-50">{expanded ? '▴' : '▾'}</span>
        </div>
      </div>

      {/* Title */}
      {primary.title && (
        <div
          className={`px-2 pt-1 text-[10px] font-medium leading-tight ${expanded ? '' : 'line-clamp-1'}`}
          style={{ color: primary.color }}
        >
          {primary.title}
        </div>
      )}

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
                  {section.sigil} {section.title}
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
