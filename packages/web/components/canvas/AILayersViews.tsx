'use client';

/**
 * AI Layers Panel — View Subcomponents
 *
 * Extracted from AILayersPanel.tsx:
 * - MindmapView (SVG mindmap visualization)
 * - LayersTreeView (hierarchical category view)
 * - LayerWeightsSection (live layer weight bars)
 * - EmptyState
 */

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useLayerStore } from '@/lib/stores/layer-store';
import { Layer } from '@/lib/layer-registry';
import type { AIInsight } from './AILayersPanel';

// ═══════════════════════════════════════════════════════════════════
// CONSTANTS (shared with parent)
// ═══════════════════════════════════════════════════════════════════

export const CATEGORY_ICONS: Record<string, string> = {
  strategy: '◇',
  insight: '✦',
  data: '▣',
  action: '▸',
};

export const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  strategy: {
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    text: 'text-blue-600 dark:text-blue-400',
    border: 'border-blue-200 dark:border-blue-800',
  },
  insight: {
    bg: 'bg-amber-50 dark:bg-amber-900/20',
    text: 'text-amber-600 dark:text-amber-400',
    border: 'border-amber-200 dark:border-amber-800',
  },
  data: {
    bg: 'bg-emerald-50 dark:bg-emerald-900/20',
    text: 'text-emerald-600 dark:text-emerald-400',
    border: 'border-emerald-200 dark:border-emerald-800',
  },
  action: {
    bg: 'bg-purple-50 dark:bg-purple-900/20',
    text: 'text-purple-600 dark:text-purple-400',
    border: 'border-purple-200 dark:border-purple-800',
  },
};

/**
 * Layer Weight Color Map (matching tree-of-life colors)
 */
const LAYER_BAR_COLORS: Record<number, string> = {
  [Layer.EMBEDDING]: '#f59e0b', // amber
  [Layer.EXECUTOR]: '#a855f7', // purple
  [Layer.CLASSIFIER]: '#f97316', // orange
  [Layer.GENERATIVE]: '#22c55e', // green
  [Layer.ATTENTION]: '#eab308', // yellow
  [Layer.DISCRIMINATOR]: '#ef4444', // red
  [Layer.EXPANSION]: '#3b82f6', // blue
  [Layer.ENCODER]: '#6366f1', // indigo
  [Layer.REASONING]: '#9ca3af', // gray
  [Layer.META_CORE]: '#e5e7eb', // white/light
  [Layer.SYNTHESIS]: '#06b6d4', // cyan
};

/**
 * AI Layer Names (short, for compact display)
 */
const LAYER_SHORT_NAMES: Record<number, string> = {
  [Layer.EMBEDDING]: 'Embed',
  [Layer.EXECUTOR]: 'Exec',
  [Layer.CLASSIFIER]: 'Class',
  [Layer.GENERATIVE]: 'Gen',
  [Layer.ATTENTION]: 'Attn',
  [Layer.DISCRIMINATOR]: 'Discr',
  [Layer.EXPANSION]: 'Expan',
  [Layer.ENCODER]: 'Enc',
  [Layer.REASONING]: 'Reas',
  [Layer.META_CORE]: 'Meta',
  [Layer.SYNTHESIS]: 'Synth',
};

// ═══════════════════════════════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════════════════════════════

/**
 * Empty State Component
 */
export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[200px] text-center">
      <div className="text-2xl mb-2 text-neutral-300 dark:text-neutral-600">◇</div>
      <p className="text-[10px] uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
        No insights yet
      </p>
      <p className="text-[9px] mt-1 text-neutral-400 dark:text-neutral-500">
        Start a conversation to generate insights
      </p>
    </div>
  );
}

/**
 * Mindmap Placeholder View
 */
export function MindmapView({ insights }: { insights: AIInsight[] }) {
  if (insights.length === 0) return <EmptyState />;

  // Simple SVG mindmap visualization
  const categories = ['strategy', 'insight', 'data', 'action'];

  const count = categories.length;
  const cols = Math.ceil(Math.sqrt(count));
  const cellW = 300 / cols;
  const cellH = 200 / Math.ceil(count / cols);

  return (
    <div className="w-full h-full min-h-[300px] relative overflow-hidden">
      <svg className="w-full h-full" viewBox="0 0 400 350">
        {/* Background Grid */}
        <defs>
          <pattern id="ai-grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <circle cx="10" cy="10" r="0.5" fill="#d1d5db" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#ai-grid)" />

        {/* Center Node */}
        <circle cx="200" cy="175" r="24" fill="#a78bfa" opacity="0.9" />
        <text x="200" y="179" textAnchor="middle" fontSize="8" fill="white" fontFamily="monospace">
          AI Layers
        </text>

        {/* Category Nodes — grid layout to prevent overlap */}
        {categories.map((cat, idx) => {
          const row = Math.floor(idx / cols);
          const col = idx % cols;
          const x = 50 + col * cellW + cellW / 2;
          const y = 50 + row * cellH + cellH / 2;
          const itemCount = insights.filter((i) => i.category === cat).length;

          return (
            <g key={cat}>
              {/* Connection Line */}
              <line
                x1="200"
                y1="175"
                x2={x}
                y2={y}
                stroke="#d1d5db"
                strokeWidth="1"
                strokeDasharray="4,4"
              />
              {/* Category Node */}
              <circle
                cx={x}
                cy={y}
                r="18"
                fill={
                  cat === 'strategy'
                    ? '#3b82f6'
                    : cat === 'insight'
                      ? '#f59e0b'
                      : cat === 'data'
                        ? '#10b981'
                        : '#a855f7'
                }
                opacity={itemCount > 0 ? 0.9 : 0.4}
              />
              <text
                x={x}
                y={y - 3}
                textAnchor="middle"
                fontSize="7"
                fill="white"
                fontFamily="monospace"
              >
                {CATEGORY_ICONS[cat]}
              </text>
              <text
                x={x}
                y={y + 6}
                textAnchor="middle"
                fontSize="6"
                fill="white"
                fontFamily="monospace"
              >
                {itemCount}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/**
 * AI Layers Tree View (hierarchical visualization)
 */
export function LayersTreeView({ insights }: { insights: AIInsight[] }) {
  if (insights.length === 0) return <EmptyState />;

  // Group insights by category
  const grouped = insights.reduce<Record<string, AIInsight[]>>((acc, insight) => {
    if (!acc[insight.category]) acc[insight.category] = [];
    acc[insight.category].push(insight);
    return acc;
  }, {});

  return (
    <div className="space-y-3 p-2">
      {Object.entries(grouped).map(([category, items]) => {
        const colors = CATEGORY_COLORS[category];
        const icon = CATEGORY_ICONS[category];

        return (
          <div key={category} className="space-y-1">
            {/* Category Header */}
            <div className={`flex items-center gap-2 px-2 py-1 rounded ${colors.bg}`}>
              <span className={colors.text}>{icon}</span>
              <span className={`font-mono text-[10px] uppercase tracking-wide ${colors.text}`}>
                {category}
              </span>
              <span className="font-mono text-[9px] text-neutral-400 ml-auto">{items.length}</span>
            </div>
            {/* Items */}
            <div className="pl-4 border-l-2 border-neutral-100 dark:border-relic-slate/20 ml-2 space-y-1">
              {items.slice(0, 3).map((item) => (
                <div
                  key={item.id}
                  className="px-2 py-1 text-[10px] font-mono text-neutral-600 dark:text-neutral-400 leading-relaxed hover:bg-neutral-50 dark:hover:bg-relic-slate/10 rounded cursor-pointer"
                >
                  {item.text}
                </div>
              ))}
              {items.length > 3 && (
                <div className="px-2 py-1 text-[9px] font-mono text-neutral-400 italic">
                  +{items.length - 3} more
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/**
 * Live Layer Weights Section
 * Shows horizontal bars for all 11 layers from the Zustand store
 */
export function LayerWeightsSection() {
  const { weights, processingMode, activePreset } = useLayerStore();

  const sortedLayers = useMemo(() => {
    return Object.entries(weights)
      .map(([id, weight]) => ({ id: Number(id), weight }))
      .sort((a, b) => b.weight - a.weight);
  }, [weights]);

  return (
    <div className="px-3 py-2 border-b border-neutral-100 dark:border-relic-slate/20">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <span className="font-mono text-[8px] uppercase tracking-wide text-neutral-400 dark:text-neutral-500">
          Live Weights
        </span>
        <span className="font-mono text-[8px] text-neutral-400 dark:text-neutral-500">
          {activePreset || 'custom'} · {processingMode}
        </span>
      </div>

      {/* Weight Bars */}
      <div className="space-y-1">
        {sortedLayers.map(({ id, weight }) => {
          const pct = Math.round(weight * 100);
          const color = LAYER_BAR_COLORS[id] || '#9ca3af';
          const name = LAYER_SHORT_NAMES[id] || `L${id}`;
          const isActive = weight > 0.1;

          return (
            <div key={id} className="flex items-center gap-1.5">
              <span
                className={`font-mono text-[8px] w-8 text-right ${
                  isActive
                    ? 'text-neutral-600 dark:text-neutral-300'
                    : 'text-neutral-300 dark:text-neutral-600'
                }`}
              >
                {name}
              </span>
              <div className="flex-1 h-2 bg-neutral-100 dark:bg-relic-slate/20 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                  className="h-full rounded-full"
                  style={{ backgroundColor: color, opacity: isActive ? 0.85 : 0.3 }}
                />
              </div>
              <span
                className={`font-mono text-[8px] w-6 ${
                  isActive
                    ? 'text-neutral-600 dark:text-neutral-300'
                    : 'text-neutral-300 dark:text-neutral-600'
                }`}
              >
                {pct}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
