'use client';

/**
 * AntipatternTreePanel — right-side anti-pattern monitor SVG tree
 * Extracted from tree-of-life/page.tsx
 */

import { motion } from 'framer-motion';
import {
  ANTIPATTERN_METADATA,
  antipatternPositions,
  antipatternPaths,
  getAntipatternColor,
} from './tree-data';

interface AntipatternTreePanelProps {
  hoveredQliphah: string | null;
  selectedQliphah: string | null;
  setHoveredQliphah: (id: string | null) => void;
  setSelectedQliphah: (id: string | null) => void;
}

export function AntipatternTreePanel({
  hoveredQliphah,
  selectedQliphah,
  setHoveredQliphah,
  setSelectedQliphah,
}: AntipatternTreePanelProps) {
  return (
    <div className="bg-white border border-red-900/20 p-2">
      <div className="text-center text-sm font-mono mb-4 text-red-600 uppercase tracking-wider">
        Anti-Pattern Monitors
      </div>
      <div className="relative mx-auto" style={{ width: '450px', height: '600px' }}>
        {/* Antipattern SVG Tree */}
        <svg viewBox="0 0 500 650" className="w-full h-full">
          {/* Antipattern paths (dashed, red) */}
          {antipatternPaths.map(([from, to], index) => {
            const fromPos = antipatternPositions[from];
            const toPos = antipatternPositions[to];
            if (!fromPos || !toPos) return null;

            return (
              <motion.line
                key={`qliph-dual-path-${index}`}
                x1={fromPos.x}
                y1={fromPos.y}
                x2={toPos.x}
                y2={toPos.y}
                stroke="rgba(239, 68, 68, 0.4)"
                strokeWidth="2"
                strokeDasharray="6,4"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 0.4 }}
                transition={{ duration: 0.8, delay: index * 0.02, ease: 'easeOut' }}
              />
            );
          })}

          {/* Antipattern nodes */}
          {Object.entries(ANTIPATTERN_METADATA).map(([id, node]) => {
            const pos = antipatternPositions[id];
            if (!pos) return null;

            const color = getAntipatternColor(node.severity);
            const radius = 25;
            const isHovered = hoveredQliphah === id;
            const isSelected = selectedQliphah === id;

            return (
              <motion.g
                key={`antipattern-dual-${id}`}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{
                  delay: 0.1,
                  type: 'spring',
                  stiffness: 260,
                  damping: 20,
                }}
                onMouseEnter={() => setHoveredQliphah(id)}
                onMouseLeave={() => setHoveredQliphah(null)}
                onClick={() => setSelectedQliphah(id === selectedQliphah ? null : id)}
                style={{ cursor: 'pointer' }}
              >
                {/* Outer energy glow - VIBRANT (v5) */}
                <motion.circle
                  cx={pos.x}
                  cy={pos.y}
                  r={radius + 16}
                  fill="none"
                  stroke={color}
                  strokeWidth="2"
                  opacity={0.4}
                  filter={`drop-shadow(0 0 8px ${color})`}
                  animate={{
                    opacity: [0.4, 0.7, 0.4],
                    r: [radius + 16, radius + 20, radius + 16],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                />

                {/* Middle glow ring - VIBRANT (v5) */}
                <motion.circle
                  cx={pos.x}
                  cy={pos.y}
                  r={radius + 8}
                  fill="none"
                  stroke={color}
                  strokeWidth="1.5"
                  opacity={0.5}
                  filter="blur(1px)"
                  animate={{
                    opacity: [0.5, 0.7, 0.5],
                  }}
                  transition={{
                    duration: 2.5,
                    repeat: Infinity,
                    ease: 'easeInOut',
                    delay: 0.3,
                  }}
                />

                {/* Hover enhancement glow */}
                {isHovered && (
                  <motion.circle
                    cx={pos.x}
                    cy={pos.y}
                    r={radius + 10}
                    fill="none"
                    stroke={color}
                    strokeWidth="2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.4 }}
                    transition={{ duration: 0.3 }}
                  />
                )}

                {/* Selection glow */}
                {isSelected && (
                  <motion.circle
                    cx={pos.x}
                    cy={pos.y}
                    r={radius + 8}
                    fill="none"
                    stroke={color}
                    strokeWidth="2.5"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.5 }}
                    transition={{ duration: 0.3 }}
                  />
                )}

                {/* Main lighting circle (laser-style outline) */}
                <motion.circle
                  cx={pos.x}
                  cy={pos.y}
                  r={radius}
                  fill="none"
                  stroke={color}
                  strokeWidth={isSelected ? '3' : '2'}
                  opacity={0.6}
                  animate={{
                    opacity: [0.6, 0.8, 0.6],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                />

                {/* Inner energy core - VIBRANT (v5) */}
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={radius * 0.6}
                  fill={color}
                  opacity={0.3}
                  filter="blur(3px)"
                />

                {/* Center activation dot - BRIGHTEST (v5) */}
                <motion.circle
                  cx={pos.x}
                  cy={pos.y}
                  r={radius * 0.2}
                  fill={color}
                  opacity={0.9}
                  filter={`drop-shadow(0 0 4px ${color})`}
                  animate={{
                    scale: [1, 1.3, 1],
                    opacity: [0.9, 1, 0.9],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                />

                {/* Severity badge */}
                {node.severity === 'critical' && (
                  <circle
                    cx={pos.x + radius - 5}
                    cy={pos.y - radius + 5}
                    r="6"
                    fill="#dc2626"
                    stroke="white"
                    strokeWidth="1.5"
                  />
                )}

                {/* Anti-Pattern (primary label) */}
                <text
                  x={pos.x}
                  y={pos.y + radius + 18}
                  textAnchor="middle"
                  fontSize="10"
                  fill={color}
                  fontFamily="monospace"
                  fontWeight="600"
                >
                  {node.pattern}
                </text>

                {/* Severity indicator */}
                <text
                  x={pos.x}
                  y={pos.y + radius + 32}
                  textAnchor="middle"
                  fontSize="8"
                  fill="#94a3b8"
                  fontFamily="monospace"
                  fontWeight="500"
                >
                  {node.severity.toUpperCase()}
                </text>
              </motion.g>
            );
          })}

          {/* Center text - AI only */}
          <motion.text
            x="250"
            y="295"
            textAnchor="middle"
            fontSize="9"
            fill="#fca5a5"
            fontFamily="monospace"
            letterSpacing="1"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0.4, 0.6, 0.4] }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          >
            AI WEAKNESS DETECTION
          </motion.text>
        </svg>

        {/* Status legend for Antipattern */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-4 text-[9px] font-mono text-relic-slate">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-red-600" />
            Critical
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-orange-600" />
            High
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-orange-500" />
            Medium
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-slate-400" />
            Low
          </div>
        </div>
      </div>
    </div>
  );
}
