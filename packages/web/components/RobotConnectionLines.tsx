'use client';

import React from 'react';
import { RobotPart } from './RobotIntelligenceTypes';

// ============================================
// COMPONENT: Connection Lines
// ============================================

export function ConnectionLines({
  parts,
  selectedPartId,
  hoveredPartId,
  scale,
}: {
  parts: RobotPart[];
  selectedPartId: string | null;
  hoveredPartId: string | null;
  scale: 'human' | 'handball';
}) {
  const paths: React.ReactElement[] = [];

  parts.forEach((part) => {
    part.connections.forEach((targetId) => {
      const target = parts.find((p) => p.id === targetId);
      if (!target) return;

      const isHighlighted =
        selectedPartId === part.id ||
        selectedPartId === targetId ||
        hoveredPartId === part.id ||
        hoveredPartId === targetId;

      const x1 = part.position.x;
      const y1 = part.position.y;
      const x2 = target.position.x;
      const y2 = target.position.y;

      const midX = (x1 + x2) / 2;
      const midY = (y1 + y2) / 2;

      // Add slight curve
      const curveOffset = Math.abs(x2 - x1) > Math.abs(y2 - y1) ? 5 : 0;

      paths.push(
        <g key={`${part.id}-${targetId}`}>
          {isHighlighted && (
            <path
              d={`M ${x1} ${y1} Q ${midX} ${midY + curveOffset} ${x2} ${y2}`}
              fill="none"
              stroke="#3B82F6"
              strokeWidth={scale === 'human' ? 4 : 2}
              opacity={0.3}
            />
          )}
          <path
            d={`M ${x1} ${y1} Q ${midX} ${midY + curveOffset} ${x2} ${y2}`}
            fill="none"
            stroke={isHighlighted ? '#3B82F6' : '#64748B'}
            strokeWidth={scale === 'human' ? 2 : 1}
            strokeDasharray={isHighlighted ? 'none' : '4 4'}
            opacity={isHighlighted ? 1 : 0.4}
            className="transition-all duration-300"
          />
          {/* Data flow animation */}
          {isHighlighted && (
            <circle r={scale === 'human' ? 3 : 2} fill="#3B82F6">
              <animateMotion
                dur="2s"
                repeatCount="indefinite"
                path={`M ${x1} ${y1} Q ${midX} ${midY + curveOffset} ${x2} ${y2}`}
              />
            </circle>
          )}
        </g>
      );
    });
  });

  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
    >
      {paths}
    </svg>
  );
}
