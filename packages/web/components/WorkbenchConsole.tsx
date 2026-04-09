'use client';

/**
 * WORKBENCH CONSOLE - AI COMPUTATIONAL CONFIG
 *
 * Features:
 * - Left: Interconnected Tree Visualization (processing flow)
 * - Right: Quick Config (top 3 layers) + Config History
 * - Bottom: Presets + Expand All Layers
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLayerStore } from '@/lib/stores/layer-store';
import { Layer } from '@/lib/layer-registry';
import {
  AI_LAYERS,
  CRITICAL_LAYERS,
  TREE_POSITIONS,
  TREE_PATHS,
  PRESETS,
} from './WorkbenchConsole.constants';
import { WorkbenchRightPanel } from './WorkbenchConsole.tabs';

interface ConfigHistory {
  id: string;
  name: string;
  date: string;
  testCount: number;
}

// ═══════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════

export function WorkbenchConsole() {
  const { weights, setWeight } = useLayerStore();
  const [activePreset, setActivePreset] = useState('balanced');
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [testQuery, setTestQuery] = useState('');
  const [isTestOpen, setIsTestOpen] = useState(false);
  const [hoveredNode, setHoveredNode] = useState<number | null>(null);
  const [selectedNode, setSelectedNode] = useState<number | null>(null);

  const [configHistory] = useState<ConfigHistory[]>([
    { id: '1', name: 'Deep Research', date: 'Jan 29', testCount: 3 },
    { id: '2', name: 'Creative Session', date: 'Jan 28', testCount: 7 },
  ]);

  const getWeight = (id: number) => weights[id] ?? 0.5;
  const getLayer = (id: number) => AI_LAYERS.find((l) => l.id === id);

  const handleWeightChange = (id: number, value: number) => {
    setWeight(id, value);
    setActivePreset('custom');
  };

  const applyPreset = (presetId: string) => {
    setActivePreset(presetId);
    const preset = PRESETS.find((p) => p.id === presetId);
    if (preset) {
      Object.entries(preset.weights).forEach(([id, weight]) => {
        setWeight(parseInt(id), weight);
      });
    }
  };

  return (
    <div className="bg-white font-mono text-xs">
      {/* Header */}
      <div className="border-b border-neutral-100 px-4 py-3 flex items-center justify-between">
        <div>
          <div className="text-[10px] uppercase tracking-widest text-neutral-400">
            AI Computational Config
          </div>
          <div className="text-neutral-500 mt-0.5">
            configure processing layers for optimal responses
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="px-3 py-1.5 text-[10px] border border-neutral-200 rounded hover:bg-neutral-50">
            Save
          </button>
          <span className="text-neutral-300">⌘S</span>
        </div>
      </div>

      {/* Main Content - Two Columns */}
      <div className="flex">
        {/* Left: Tree Visualization */}
        <div className="w-[240px] border-r border-neutral-100 p-3">
          <div className="text-[9px] uppercase tracking-wider text-neutral-400 mb-2 text-center">
            Processing Flow
          </div>

          <svg viewBox="0 0 200 400" className="w-full">
            {/* Connection Paths */}
            {TREE_PATHS.map(([from, to], idx) => {
              const fromPos = TREE_POSITIONS[from];
              const toPos = TREE_POSITIONS[to];
              const fromWeight = getWeight(from);
              const toWeight = getWeight(to);
              const avgWeight = (fromWeight + toWeight) / 2;

              return (
                <line
                  key={idx}
                  x1={fromPos.x}
                  y1={fromPos.y}
                  x2={toPos.x}
                  y2={toPos.y}
                  stroke="#e5e7eb"
                  strokeWidth={1 + avgWeight * 1.5}
                  strokeOpacity={0.5 + avgWeight * 0.3}
                />
              );
            })}

            {/* Flow arrows (subtle) */}
            <defs>
              <marker
                id="arrowhead"
                markerWidth="6"
                markerHeight="6"
                refX="3"
                refY="3"
                orient="auto"
              >
                <path d="M0,0 L6,3 L0,6 Z" fill="#d4d4d4" />
              </marker>
            </defs>

            {/* Nodes */}
            {AI_LAYERS.map((layer) => {
              const pos = TREE_POSITIONS[layer.id];
              if (!pos) return null;

              const weight = getWeight(layer.id) || 0;
              const isHovered = hoveredNode === layer.id;
              const isSelected = selectedNode === layer.id;
              const radius = 10 + weight * 6;

              return (
                <g
                  key={layer.id}
                  className="cursor-pointer"
                  onMouseEnter={() => setHoveredNode(layer.id)}
                  onMouseLeave={() => setHoveredNode(null)}
                  onClick={() => setSelectedNode(selectedNode === layer.id ? null : layer.id)}
                >
                  {/* Selection ring */}
                  {isSelected && (
                    <circle
                      cx={pos.x}
                      cy={pos.y}
                      r={radius + 4}
                      fill="none"
                      stroke={layer.color}
                      strokeWidth="1.5"
                      strokeDasharray="3 2"
                    />
                  )}

                  {/* Hover glow */}
                  {isHovered && !isSelected && (
                    <circle
                      cx={pos.x}
                      cy={pos.y}
                      r={radius + 3}
                      fill={layer.color}
                      fillOpacity={0.15}
                    />
                  )}

                  {/* Critical indicator */}
                  {layer.critical && (
                    <circle
                      cx={pos.x}
                      cy={pos.y}
                      r={radius + 2}
                      fill="none"
                      stroke={layer.color}
                      strokeWidth="1"
                      strokeOpacity={0.5}
                    />
                  )}

                  {/* Main circle */}
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r={radius}
                    fill="white"
                    stroke={layer.color}
                    strokeWidth={layer.critical ? 2 : 1.5}
                  />

                  {/* Inner fill based on weight */}
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r={radius * weight}
                    fill={layer.color}
                    fillOpacity={0.3 + weight * 0.4}
                  />

                  {/* Percentage */}
                  <text
                    x={pos.x}
                    y={pos.y + 3}
                    textAnchor="middle"
                    fontSize="7"
                    fill="#374151"
                    fontWeight="500"
                  >
                    {Math.round(weight * 100)}%
                  </text>

                  {/* Label (always show for critical, on hover for others) */}
                  {(layer.critical || isHovered || isSelected) && (
                    <text
                      x={pos.x > 100 ? pos.x + radius + 4 : pos.x - radius - 4}
                      y={pos.y + 3}
                      textAnchor={pos.x > 100 ? 'start' : 'end'}
                      fontSize="7"
                      fill={layer.critical ? '#374151' : '#9ca3af'}
                      fontWeight={layer.critical ? '600' : '400'}
                    >
                      {layer.name}
                      {layer.critical && ' ★'}
                    </text>
                  )}
                </g>
              );
            })}

            {/* Phase labels */}
            <text x="10" y="15" fontSize="6" fill="#d4d4d4" className="uppercase">
              input
            </text>
            <text x="10" y="100" fontSize="6" fill="#d4d4d4" className="uppercase">
              understanding
            </text>
            <text x="10" y="175" fontSize="6" fill="#d4d4d4" className="uppercase">
              reasoning
            </text>
            <text x="10" y="300" fontSize="6" fill="#d4d4d4" className="uppercase">
              output
            </text>
          </svg>

          {/* Selected Node Editor */}
          <AnimatePresence>
            {selectedNode && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 5 }}
                className="mt-2 p-2 border border-neutral-200 rounded bg-neutral-50"
              >
                {(() => {
                  const layer = getLayer(selectedNode);
                  if (!layer) return null;
                  const weight = getWeight(selectedNode);
                  return (
                    <>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-medium" style={{ color: layer.color }}>
                          {layer.name}
                        </span>
                        <span className="text-[9px] text-neutral-400">
                          {Math.round(weight * 100)}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={Math.round(weight * 100)}
                        onChange={(e) =>
                          handleWeightChange(selectedNode, parseInt(e.target.value) / 100)
                        }
                        className="w-full h-1 bg-neutral-200 rounded appearance-none cursor-pointer
                                 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2.5 
                                 [&::-webkit-slider-thumb]:h-2.5 [&::-webkit-slider-thumb]:rounded-full 
                                 [&::-webkit-slider-thumb]:bg-neutral-700"
                      />
                      <div className="flex justify-between text-[8px] text-neutral-400 mt-0.5">
                        <span>{layer.extremes.low}</span>
                        <span>{layer.extremes.high}</span>
                      </div>
                    </>
                  );
                })()}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right: Quick Settings + History */}
        <WorkbenchRightPanel
          configHistory={configHistory}
          activePreset={activePreset}
          isAdvancedOpen={isAdvancedOpen}
          setIsAdvancedOpen={setIsAdvancedOpen}
          applyPreset={applyPreset}
          getWeight={getWeight}
          handleWeightChange={handleWeightChange}
        />
      </div>

      {/* Bottom: Test Query */}
      <div className="border-t border-neutral-100">
        <button
          onClick={() => setIsTestOpen(!isTestOpen)}
          className="w-full px-4 py-2 flex items-center justify-between text-[10px] text-neutral-500 hover:bg-neutral-50"
        >
          <span className="uppercase tracking-wider">Test Query</span>
          <span>{isTestOpen ? '▴' : '▾'}</span>
        </button>
        <AnimatePresence>
          {isTestOpen && (
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: 'auto' }}
              exit={{ height: 0 }}
              className="overflow-hidden"
            >
              <div className="px-4 pb-3 flex gap-2">
                <input
                  type="text"
                  value={testQuery}
                  onChange={(e) => setTestQuery(e.target.value)}
                  placeholder="Enter test query..."
                  className="flex-1 px-3 py-2 text-xs border border-neutral-200 rounded bg-white placeholder:text-neutral-400"
                />
                <button className="px-4 py-2 text-[10px] bg-neutral-900 text-white rounded hover:bg-neutral-800">
                  Run
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default WorkbenchConsole;
