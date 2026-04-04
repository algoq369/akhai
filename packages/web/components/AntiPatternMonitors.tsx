'use client';

/**
 * Anti-Pattern Monitors - extracted from AIConfigUnified.
 * Shows anti-pattern nodes with severity indicators.
 */

import { motion } from 'framer-motion';
import { ANTIPATTERN_DATA } from './ai-config-constants';

export function AntiPatternMonitors() {
  return (
    <div className="bg-white border border-relic-mist rounded p-3">
      <div className="text-center text-[9px] uppercase tracking-wider text-red-400 mb-2">
        Anti-Pattern Monitors
      </div>
      <svg viewBox="0 0 500 580" className="w-full">
        {ANTIPATTERN_DATA.map((node) => {
          const isCritical = node.severity === 'critical';
          const isHigh = node.severity === 'high';
          const radius = isCritical ? 24 : isHigh ? 20 : 16;
          const color = isCritical ? '#ef4444' : isHigh ? '#f97316' : '#fbbf24';

          return (
            <g key={node.id}>
              {/* Outer warning glow for critical */}
              {isCritical && (
                <motion.circle
                  cx={node.x}
                  cy={node.y}
                  r={radius + 16}
                  fill={color}
                  opacity={0.1}
                  animate={{ opacity: [0.05, 0.15, 0.05], scale: [1, 1.05, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              )}

              {/* Second glow */}
              <circle cx={node.x} cy={node.y} r={radius + 8} fill={color} opacity={0.12} />

              {/* Main circle */}
              <circle
                cx={node.x}
                cy={node.y}
                r={radius}
                fill="white"
                stroke={color}
                strokeWidth={isCritical ? 2.5 : 1.5}
              />

              {/* Inner fill */}
              <circle cx={node.x} cy={node.y} r={radius * 0.5} fill={color} opacity={0.4} />

              {/* Center dot */}
              <circle cx={node.x} cy={node.y} r={3} fill={color} />

              {/* Label */}
              <text
                x={node.x}
                y={node.y - radius - 8}
                textAnchor="middle"
                fontSize="8"
                fill="#6b7280"
              >
                {node.name}
              </text>

              {/* Severity */}
              <text
                x={node.x}
                y={node.y + radius + 12}
                textAnchor="middle"
                fontSize="7"
                fill={color}
                fontWeight="500"
              >
                {node.severity}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Legend */}
      <div className="flex justify-center gap-4 mt-2 text-[7px] text-relic-silver">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-red-500" /> Critical
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-orange-500" /> High
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-amber-500" /> Medium
        </span>
      </div>
    </div>
  );
}
