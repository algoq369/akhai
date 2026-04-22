'use client';

import type { ArborealSection } from '@/lib/arboreal/bin-sections';

interface ParagraphBlockProps {
  sections: ArborealSection[];
  layerName: string;
  x: number;
  y: number;
}

export default function ParagraphBlock({ sections, layerName, x, y }: ParagraphBlockProps) {
  if (sections.length === 0) return null;

  const primary = sections[0];
  const firstThreeLines = primary.body.split(/\n+/).slice(0, 3).join(' ').slice(0, 160);
  const additionalCount = sections.length - 1;

  return (
    <div
      className="absolute rounded-md border shadow-sm transition-all cursor-pointer hover:scale-[1.02]"
      style={{
        left: x - 90,
        top: y - 40,
        width: 180,
        minHeight: 80,
        backgroundColor: `${primary.color}14`,
        borderColor: `${primary.color}55`,
      }}
      onClick={() => {
        // Commit 3 will handle expansion.
        console.log('[arboreal] block clicked:', layerName, primary.title);
      }}
    >
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
        {additionalCount > 0 && (
          <span className="text-[9px] font-mono opacity-70">+{additionalCount}</span>
        )}
      </div>
      {primary.title && (
        <div
          className="px-2 pt-1 text-[10px] font-medium leading-tight line-clamp-1"
          style={{ color: primary.color }}
        >
          {primary.title}
        </div>
      )}
      <div className="px-2 py-1 text-[9px] leading-snug text-relic-slate dark:text-relic-ghost line-clamp-3">
        {firstThreeLines}
      </div>
      <div
        className="absolute bottom-1 right-2 text-[10px] font-mono opacity-50"
        style={{ color: primary.color }}
      >
        ▾
      </div>
    </div>
  );
}
