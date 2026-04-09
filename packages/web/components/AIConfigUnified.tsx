'use client';

/**
 * AI CONFIG PAGE - UNIFIED & OPTIMIZED v2
 *
 * Tab 1: Configuration
 *   - Ultra-compact number inputs for layers
 *   - Configuration console with tree visual
 *   - Original dual trees with colorful orbs
 *
 * Tab 2: History
 *   - Descent tree history from training
 *   - Chat history connection
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { Layer } from '@/lib/layer-registry';
import { useLayerStore } from '@/lib/stores/layer-store';
import {
  NODE_COLORS,
  AI_LABELS,
  CRITICAL_LAYERS,
  ALL_LAYERS,
  PRESETS,
  TREE_POSITIONS,
  TREE_PATHS,
} from './ai-config-constants';
import { AIProcessingLayersTree } from './AIProcessingLayersTree';
import { AntiPatternMonitors } from './AntiPatternMonitors';
import { AIConfigHistoryTab } from './AIConfigHistoryTab';
import { NodeEditorPopup } from './NodeEditorPopup';

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export default function AIConfigUnified() {
  const router = useRouter();
  const { weights, setWeight } = useLayerStore();

  const [activeTab, setActiveTab] = useState<'config' | 'history'>('config');
  const [activePreset, setActivePreset] = useState<string>('balanced');
  const [selectedNode, setSelectedNode] = useState<Layer | null>(null);
  const [hoveredNode, setHoveredNode] = useState<Layer | null>(null);

  const getWeight = (layer: Layer): number => weights[layer] ?? 0.5;

  const applyPreset = (presetId: string) => {
    const preset = PRESETS.find((p) => p.id === presetId);
    if (preset) {
      setActivePreset(presetId);
      Object.entries(preset.weights).forEach(([layer, weight]) => {
        setWeight(parseInt(layer) as Layer, weight);
      });
    }
  };

  const handleWeightChange = (layer: Layer, value: number) => {
    const clamped = Math.max(0, Math.min(100, value));
    setWeight(layer, clamped / 100);
    setActivePreset('custom');
  };

  return (
    <div className="min-h-screen bg-relic-ghost/30 font-mono">
      {/* Header */}
      <div className="bg-white border-b border-relic-mist px-4 py-2">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="p-1 hover:bg-relic-ghost rounded">
              <ArrowLeftIcon className="w-4 h-4 text-relic-slate" />
            </button>
            <div>
              <h1 className="text-[9px] uppercase tracking-widest text-relic-silver">
                AI Reasoning Architecture
              </h1>
              <h2 className="text-base font-medium text-relic-void">AI Computational Config</h2>
            </div>
          </div>
          <button className="px-2 py-1 text-[8px] border border-relic-mist rounded hover:bg-relic-ghost">
            Save ⌘S
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white border-b border-relic-mist">
        <div className="max-w-7xl mx-auto px-4 flex gap-4">
          <button
            onClick={() => setActiveTab('config')}
            className={`py-1.5 text-[8px] uppercase tracking-wider border-b-2 transition-colors ${
              activeTab === 'config'
                ? 'border-purple-500 text-relic-void'
                : 'border-transparent text-relic-slate'
            }`}
          >
            ◆ Configuration
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`py-1.5 text-[8px] uppercase tracking-wider border-b-2 transition-colors ${
              activeTab === 'history'
                ? 'border-purple-500 text-relic-void'
                : 'border-transparent text-relic-slate'
            }`}
          >
            ◇ History
          </button>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* TAB 1: CONFIGURATION */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'config' && (
        <div className="max-w-7xl mx-auto px-4 py-3">
          {/* Configuration Console + Tree Visual */}
          <div className="grid grid-cols-3 gap-3 mb-3">
            {/* LEFT: Compact Layer Controls */}
            <div className="bg-white border border-relic-mist rounded p-2">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[8px] uppercase tracking-wider text-relic-silver">
                  Layer Weights
                </span>
                <div className="flex gap-1">
                  {PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      onClick={() => applyPreset(preset.id)}
                      className={`px-1.5 py-0.5 text-[7px] rounded transition-all ${
                        activePreset === preset.id
                          ? 'bg-relic-void text-white'
                          : 'bg-relic-ghost text-relic-slate hover:bg-relic-mist'
                      }`}
                    >
                      {preset.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Compact number inputs grid */}
              <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                {ALL_LAYERS.map((layer) => {
                  const isCritical = CRITICAL_LAYERS.includes(layer);
                  const color = NODE_COLORS[layer];
                  const weight = Math.round(getWeight(layer) * 100);
                  return (
                    <div key={layer} className="flex items-center gap-1">
                      {isCritical && <span className="text-amber-500 text-[6px]">★</span>}
                      <div
                        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: color }}
                      />
                      <span className="text-[7px] text-relic-slate flex-1 truncate">
                        {AI_LABELS[layer].name}
                      </span>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={weight}
                        onChange={(e) => handleWeightChange(layer, parseInt(e.target.value) || 0)}
                        className="w-8 h-4 text-[8px] text-center border border-relic-mist rounded
                                 focus:outline-none focus:border-purple-400 bg-white"
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* CENTER + RIGHT: Configuration Tree Visual */}
            <div className="col-span-2 bg-white border border-relic-mist rounded p-2">
              <div className="text-[8px] uppercase tracking-wider text-relic-silver mb-1">
                Configuration Tree
              </div>
              <svg viewBox="0 0 500 280" className="w-full h-48">
                {/* Paths */}
                {TREE_PATHS.map(([from, to], idx) => {
                  const fromPos = TREE_POSITIONS[from];
                  const toPos = TREE_POSITIONS[to];
                  const avgWeight = ((weights[from] ?? 0.5) + (weights[to] ?? 0.5)) / 2;
                  return (
                    <line
                      key={idx}
                      x1={fromPos.x}
                      y1={fromPos.y * 0.5}
                      x2={toPos.x}
                      y2={toPos.y * 0.5}
                      stroke="#e5e7eb"
                      strokeWidth={0.5 + avgWeight}
                      opacity={0.4 + avgWeight * 0.3}
                    />
                  );
                })}
                {/* Nodes */}
                {ALL_LAYERS.map((layer) => {
                  const pos = TREE_POSITIONS[layer];
                  const weight = getWeight(layer) || 0;
                  const color = NODE_COLORS[layer];
                  const label = AI_LABELS[layer];
                  const isCritical = CRITICAL_LAYERS.includes(layer);
                  const isSelected = selectedNode === layer;
                  const radius = 10 + weight * 6;

                  return (
                    <g
                      key={layer}
                      className="cursor-pointer"
                      onClick={() => setSelectedNode(isSelected ? null : layer)}
                    >
                      {/* Outer glow */}
                      <circle
                        cx={pos.x}
                        cy={pos.y * 0.5}
                        r={radius + 4}
                        fill={color}
                        opacity={isSelected ? 0.25 : 0.1}
                      />
                      {/* Main circle */}
                      <circle
                        cx={pos.x}
                        cy={pos.y * 0.5}
                        r={radius}
                        fill="white"
                        stroke={color}
                        strokeWidth={isCritical ? 2 : 1}
                      />
                      {/* Inner fill */}
                      <circle
                        cx={pos.x}
                        cy={pos.y * 0.5}
                        r={radius * weight * 0.7}
                        fill={color}
                        opacity={0.4}
                      />
                      {/* Percentage */}
                      <text
                        x={pos.x}
                        y={pos.y * 0.5 + 3}
                        textAnchor="middle"
                        fontSize="7"
                        fill="#374151"
                      >
                        {Math.round(weight * 100)}
                      </text>
                      {/* Label below */}
                      <text
                        x={pos.x}
                        y={pos.y * 0.5 + radius + 8}
                        textAnchor="middle"
                        fontSize="6"
                        fill="#9ca3af"
                      >
                        {label.name}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>

          {/* Dual Advanced Trees with Original Colorful Orbs */}
          <div className="grid grid-cols-2 gap-3">
            {/* LEFT: AI Processing Layers - Original Style */}
            <AIProcessingLayersTree
              weights={weights}
              selectedNode={selectedNode}
              hoveredNode={hoveredNode}
              onSelectNode={setSelectedNode}
              onHoverNode={setHoveredNode}
              getWeight={getWeight}
            />

            {/* RIGHT: Anti-Pattern Monitors - Original Style */}
            <AntiPatternMonitors />
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* TAB 2: HISTORY */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'history' && <AIConfigHistoryTab />}

      {/* Node Editor Popup */}
      <NodeEditorPopup
        selectedNode={selectedNode}
        visible={activeTab === 'config'}
        getWeight={getWeight}
        onWeightChange={handleWeightChange}
        onClose={() => setSelectedNode(null)}
      />
    </div>
  );
}
