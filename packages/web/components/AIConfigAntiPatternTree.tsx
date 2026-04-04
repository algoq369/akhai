'use client';

import { ANTIPATTERN_DATA, ANTIPATTERN_POSITIONS } from './ai-config-data';

/**
 * Anti-Pattern Monitors SVG tree.
 * Extracted from AIConfigPage for file-size compliance.
 */
export function AIConfigAntiPatternTree() {
  return (
    <svg viewBox="0 0 280 340" className="w-full max-w-[280px] mx-auto">
      {/* Antipatterns nodes */}
      {ANTIPATTERN_DATA.map((node) => {
        const pos = ANTIPATTERN_POSITIONS[node.id];
        const isCritical = node.severity === 'critical';
        const isHigh = node.severity === 'high';
        const radius = isCritical ? 18 : isHigh ? 15 : 12;
        const baseColor = isCritical ? '#ef4444' : isHigh ? '#f97316' : '#fbbf24';

        return (
          <g key={node.id}>
            {/* Outer glow for critical */}
            {isCritical && (
              <circle
                cx={pos.x}
                cy={pos.y}
                r={radius + 8}
                fill={baseColor}
                fillOpacity={0.1}
              />
            )}

            {/* Main circle */}
            <circle
              cx={pos.x}
              cy={pos.y}
              r={radius}
              fill="white"
              stroke={baseColor}
              strokeWidth={isCritical ? 2 : 1}
            />

            {/* Inner dot */}
            <circle
              cx={pos.x}
              cy={pos.y}
              r={radius * 0.4}
              fill={baseColor}
              fillOpacity={0.5}
            />

            {/* Label */}
            <text
              x={pos.x}
              y={pos.y - radius - 4}
              textAnchor="middle"
              fontSize="6"
              fill="#6b7280"
            >
              {node.name}
            </text>

            {/* Severity badge */}
            <text
              x={pos.x}
              y={pos.y + radius + 10}
              textAnchor="middle"
              fontSize="5"
              fill={baseColor}
              style={{ textTransform: 'uppercase' }}
            >
              {node.severity}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
