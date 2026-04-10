'use client';

/**
 * AI Processing Layers Tree - extracted from AIConfigUnified.
 * The colorful orb tree showing all AI layers with animations.
 */

import { motion } from 'framer-motion';
import { Layer, LAYER_METADATA } from '@/lib/layer-registry';
import {
  NODE_COLORS,
  AI_LABELS,
  CRITICAL_LAYERS,
  ALL_LAYERS,
  TREE_POSITIONS,
  TREE_PATHS,
} from './ai-config-constants';

interface AIProcessingLayersTreeProps {
  weights: Record<number, number>;
  selectedNode: Layer | null;
  hoveredNode: Layer | null;
  onSelectNode: (layer: Layer | null) => void;
  onHoverNode: (layer: Layer | null) => void;
  getWeight: (layer: Layer) => number;
}

export function AIProcessingLayersTree({
  weights,
  selectedNode,
  hoveredNode,
  onSelectNode,
  onHoverNode,
  getWeight,
}: AIProcessingLayersTreeProps) {
  return (
    <div className="bg-white border border-relic-mist rounded p-3">
      <div className="text-center text-[9px] uppercase tracking-wider text-relic-slate mb-2">
        AI Processing Layers
      </div>
      <svg viewBox="0 0 500 700" className="w-full">
        {/* Connection Paths with pillar colors */}
        {TREE_PATHS.map(([from, to], idx) => {
          const fromPos = TREE_POSITIONS[from];
          const toPos = TREE_POSITIONS[to];
          const fromMeta = LAYER_METADATA[from];
          const toMeta = LAYER_METADATA[to];
          const avgWeight = ((weights[from] ?? 0.5) + (weights[to] ?? 0.5)) / 2;

          let strokeColor = '#cbd5e1';
          if (fromMeta?.pillar === toMeta?.pillar) {
            if (fromMeta?.pillar === 'left') strokeColor = '#ef4444';
            else if (fromMeta?.pillar === 'right') strokeColor = '#3b82f6';
            else if (fromMeta?.pillar === 'middle') strokeColor = '#a855f7';
          }

          return (
            <motion.line
              key={idx}
              x1={fromPos.x}
              y1={fromPos.y}
              x2={toPos.x}
              y2={toPos.y}
              stroke={strokeColor}
              strokeWidth={1.5 + avgWeight}
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.3 + avgWeight * 0.4 }}
              transition={{ duration: 0.5, delay: idx * 0.02 }}
            />
          );
        })}

        {/* Nodes with colorful orbs */}
        {ALL_LAYERS.map((layer) => {
          const pos = TREE_POSITIONS[layer];
          const weight = getWeight(layer) || 0;
          const color = NODE_COLORS[layer];
          const label = AI_LABELS[layer];
          const isCritical = CRITICAL_LAYERS.includes(layer);
          const isSelected = selectedNode === layer;
          const isHovered = hoveredNode === layer;
          const radius = 16 + weight * 10;

          return (
            <g
              key={layer}
              className="cursor-pointer"
              onClick={() => onSelectNode(isSelected ? null : layer)}
              onMouseEnter={() => onHoverNode(layer)}
              onMouseLeave={() => onHoverNode(null)}
            >
              {/* Outer glow pulse */}
              <motion.circle
                cx={pos.x}
                cy={pos.y}
                r={radius + 12}
                fill={color}
                initial={{ opacity: 0.05 }}
                animate={{ opacity: isHovered ? 0.15 : 0.05, scale: isHovered ? 1.1 : 1 }}
                transition={{ duration: 0.3 }}
              />

              {/* Second glow layer */}
              <motion.circle
                cx={pos.x}
                cy={pos.y}
                r={radius + 6}
                fill={color}
                opacity={0.15}
                animate={{ opacity: [0.1, 0.2, 0.1] }}
                transition={{ duration: 3, repeat: Infinity }}
              />

              {/* Selection ring */}
              {isSelected && (
                <motion.circle
                  cx={pos.x}
                  cy={pos.y}
                  r={radius + 4}
                  fill="none"
                  stroke={color}
                  strokeWidth="2"
                  strokeDasharray="4 2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.8 }}
                />
              )}

              {/* Main orb - gradient effect */}
              <circle
                cx={pos.x}
                cy={pos.y}
                r={radius}
                fill="white"
                stroke={color}
                strokeWidth={isSelected ? 3 : isCritical ? 2 : 1.5}
              />

              {/* Inner colored fill based on weight */}
              <motion.circle
                cx={pos.x}
                cy={pos.y}
                r={radius * 0.75}
                fill={color}
                initial={{ opacity: 0.2 }}
                animate={{ opacity: 0.2 + weight * 0.4 }}
              />

              {/* Center highlight */}
              <circle
                cx={pos.x - radius * 0.2}
                cy={pos.y - radius * 0.2}
                r={radius * 0.15}
                fill="white"
                opacity={0.5}
              />

              {/* Percentage text */}
              <text
                x={pos.x}
                y={pos.y + 4}
                textAnchor="middle"
                fontSize="10"
                fontWeight="600"
                fill="#374151"
              >
                {Math.round(weight * 100)}%
              </text>

              {/* Label above */}
              <text
                x={pos.x}
                y={pos.y - radius - 8}
                textAnchor="middle"
                fontSize="8"
                fill="#6b7280"
              >
                {label.name}
              </text>

              {/* Concept below */}
              <text
                x={pos.x}
                y={pos.y + radius + 12}
                textAnchor="middle"
                fontSize="6"
                fill="#9ca3af"
                fontStyle="italic"
              >
                {label.concept}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Legend */}
      <div className="flex justify-center gap-4 mt-2 text-[7px] text-relic-silver">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-green-500" /> Active
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-amber-500" /> Developing
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-neutral-300" /> Planned
        </span>
      </div>
    </div>
  );
}
