'use client';

import { useMemo } from 'react';
import type { EntityResult } from '@/lib/god-view/scenario-engine';

interface EntityGraphProps {
  entities: EntityResult;
}

const TYPE_COLORS: Record<string, string> = {
  person: 'stroke-blue-400',
  org: 'stroke-violet-400',
  concept: 'stroke-zinc-400',
  asset: 'stroke-emerald-400',
  event: 'stroke-amber-400',
  location: 'stroke-rose-400',
};

const TYPE_FILLS: Record<string, string> = {
  person: 'fill-blue-400/20',
  org: 'fill-violet-400/20',
  concept: 'fill-zinc-400/20',
  asset: 'fill-emerald-400/20',
  event: 'fill-amber-400/20',
  location: 'fill-rose-400/20',
};

export default function EntityGraph({ entities }: EntityGraphProps) {
  const displayEntities = entities.entities.slice(0, 12);
  const displayRelationships = entities.relationships.slice(0, 10);

  // Simple circular layout
  const positions = useMemo(() => {
    const cx = 250;
    const cy = 90;
    const rx = 200;
    const ry = 60;
    return displayEntities.map((_, i) => {
      const angle = (2 * Math.PI * i) / displayEntities.length - Math.PI / 2;
      return {
        x: cx + rx * Math.cos(angle),
        y: cy + ry * Math.sin(angle),
      };
    });
  }, [displayEntities.length]);

  const entityIndex = useMemo(() => {
    const map = new Map<string, number>();
    displayEntities.forEach((e, i) => map.set(e.name, i));
    return map;
  }, [displayEntities]);

  if (displayEntities.length === 0) return null;

  return (
    <div className="w-full">
      <h3 className="font-mono text-[10px] uppercase tracking-widest text-zinc-500 dark:text-zinc-400 mb-2">
        Entity Graph
      </h3>
      <svg
        viewBox="0 0 500 180"
        className="w-full max-w-[500px]"
        role="img"
        aria-label="Entity relationship graph"
      >
        {/* Relationship lines */}
        {displayRelationships.map((rel, i) => {
          const fromIdx = entityIndex.get(rel.from);
          const toIdx = entityIndex.get(rel.to);
          if (fromIdx === undefined || toIdx === undefined) return null;
          const from = positions[fromIdx];
          const to = positions[toIdx];
          const midX = (from.x + to.x) / 2;
          const midY = (from.y + to.y) / 2;
          return (
            <g key={`rel-${i}`}>
              <line
                x1={from.x}
                y1={from.y}
                x2={to.x}
                y2={to.y}
                stroke="currentColor"
                strokeWidth={0.5}
                className="text-zinc-300 dark:text-zinc-700"
              />
              <text
                x={midX}
                y={midY - 3}
                textAnchor="middle"
                className="fill-zinc-400 dark:fill-zinc-600 text-[6px] font-mono"
              >
                {rel.label}
              </text>
            </g>
          );
        })}

        {/* Entity nodes */}
        {displayEntities.map((entity, i) => {
          const pos = positions[i];
          const strokeColor = TYPE_COLORS[entity.type] || 'stroke-zinc-400';
          const fillColor = TYPE_FILLS[entity.type] || 'fill-zinc-400/20';
          return (
            <g
              key={`entity-${i}`}
              onClick={() => console.log('Entity clicked:', entity.name)}
              className="cursor-pointer"
            >
              <circle
                cx={pos.x}
                cy={pos.y}
                r={12}
                className={`${fillColor} ${strokeColor}`}
                strokeWidth={1}
              />
              <text
                x={pos.x}
                y={pos.y + 2}
                textAnchor="middle"
                className="fill-zinc-600 dark:fill-zinc-300 text-[6px] font-mono"
              >
                {entity.name.length > 10 ? entity.name.slice(0, 9) + '…' : entity.name}
              </text>
              <text
                x={pos.x}
                y={pos.y + 22}
                textAnchor="middle"
                className="fill-zinc-400 dark:fill-zinc-500 text-[5px] font-mono uppercase"
              >
                {entity.type}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
