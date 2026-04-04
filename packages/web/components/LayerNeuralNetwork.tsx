'use client';

import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  SparklesIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { LAYERS, PATHS, extractInsightsToLayers } from './layer-network-data';
import type { LayerNode, PathConnection, InsightNode } from './layer-network-data';

interface LayerNeuralNetworkProps {
  content: string;
  query: string;
  methodology?: string;
  onClose?: () => void;
}

export default function LayerNeuralNetwork({
  content,
  query,
  methodology = 'auto',
  onClose,
}: LayerNeuralNetworkProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [selectedLayer, setSelectedLayer] = useState<string | null>(null);
  const [showPaths, setShowPaths] = useState(true);
  const [isAnimating, setIsAnimating] = useState(false);

  const { insights, activations } = useMemo(
    () => extractInsightsToLayers(content, query),
    [content, query]
  );

  const activatedLayers = useMemo(
    () =>
      LAYERS.map((s) => ({
        ...s,
        activation: activations[s.id] || 0.1,
        insightCount: insights.filter((i) => i.layerNode === s.id).length,
      })),
    [activations, insights]
  );

  const weightedPaths = useMemo(
    () =>
      PATHS.map((p) => ({
        ...p,
        dynamicWeight: Math.min(1.0, (activations[p.from] || 0) * (activations[p.to] || 0) * 1.5),
      })),
    [activations]
  );

  const triggerAnimation = useCallback(() => {
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 2000);
  }, []);

  const getLayerPosition = (id: string) => {
    const s = LAYERS.find((x) => x.id === id);
    return s ? { x: s.x, y: s.y } : { x: 50, y: 50 };
  };

  if (insights.length < 2) return null;

  return (
    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-4">
      <div className="rounded-xl border border-slate-200/60 bg-gradient-to-br from-slate-900 via-indigo-950 to-purple-950 overflow-hidden shadow-lg">
        {/* Header */}
        <div
          className="flex items-center justify-between px-4 py-3 border-b border-white/10 cursor-pointer hover:bg-white/5 transition-colors"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 via-purple-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-purple-500/30">
              <span className="text-white text-sm">🌳</span>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                AI Computational Layers
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-violet-500/30 text-violet-300 font-mono">
                  NEURAL NETWORK
                </span>
              </h3>
              <p className="text-[10px] text-slate-400 font-mono">
                {insights.length} insights · 10 nodes · 22 paths ·{' '}
                {Math.round(activations['embedding'] * 100)}% output
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                triggerAnimation();
              }}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
              title="Animate Flow"
            >
              <ArrowPathIcon
                className={`w-4 h-4 text-violet-400 ${isAnimating ? 'animate-spin' : ''}`}
              />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowPaths(!showPaths);
              }}
              className={`px-2 py-1 rounded-lg text-[9px] transition-colors ${showPaths ? 'bg-violet-500/30 text-violet-300' : 'bg-white/5 text-slate-400'}`}
            >
              {showPaths ? '◐ Paths' : '○ Paths'}
            </button>
            {isCollapsed ? (
              <ChevronDownIcon className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronUpIcon className="w-4 h-4 text-slate-400" />
            )}
          </div>
        </div>

        <AnimatePresence>
          {!isCollapsed && (
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: 'auto' }}
              exit={{ height: 0 }}
              className="overflow-hidden"
            >
              {/* Tree of Life Visualization */}
              <div className="relative h-[500px] p-4">
                {/* Background sacred geometry */}
                <div className="absolute inset-0 opacity-10">
                  <svg
                    className="w-full h-full"
                    viewBox="0 0 100 100"
                    preserveAspectRatio="xMidYMid meet"
                  >
                    <circle cx="50" cy="50" r="48" fill="none" stroke="white" strokeWidth="0.2" />
                    <polygon
                      points="50,10 85,70 15,70"
                      fill="none"
                      stroke="white"
                      strokeWidth="0.1"
                    />
                    <polygon
                      points="50,90 85,30 15,30"
                      fill="none"
                      stroke="white"
                      strokeWidth="0.1"
                    />
                  </svg>
                </div>

                {/* SVG Layer for Paths */}
                <svg
                  className="absolute inset-0 w-full h-full pointer-events-none"
                  viewBox="0 0 100 100"
                  preserveAspectRatio="xMidYMid meet"
                  style={{ zIndex: 1 }}
                >
                  {showPaths &&
                    weightedPaths.map((path, idx) => {
                      const fromPos = getLayerPosition(path.from);
                      const toPos = getLayerPosition(path.to);
                      const opacity = path.dynamicWeight * 0.8;
                      const strokeWidth = 0.2 + path.dynamicWeight * 0.5;

                      return (
                        <g key={path.id}>
                          <line
                            x1={fromPos.x}
                            y1={fromPos.y}
                            x2={toPos.x}
                            y2={toPos.y}
                            stroke={`rgba(167, 139, 250, ${opacity})`}
                            strokeWidth={strokeWidth}
                            className="transition-all duration-500"
                          />
                          {isAnimating && (
                            <circle r="0.8" fill="#A78BFA">
                              <animateMotion
                                dur={`${1 + idx * 0.1}s`}
                                repeatCount="1"
                                path={`M${fromPos.x},${fromPos.y} L${toPos.x},${toPos.y}`}
                              />
                              <animate
                                attributeName="opacity"
                                values="0;1;1;0"
                                dur={`${1 + idx * 0.1}s`}
                                repeatCount="1"
                              />
                            </circle>
                          )}
                          <text
                            x={(fromPos.x + toPos.x) / 2}
                            y={(fromPos.y + toPos.y) / 2}
                            fill="rgba(167, 139, 250, 0.5)"
                            fontSize="2"
                            textAnchor="middle"
                            dominantBaseline="middle"
                            className="font-serif"
                          >
                            {path.hebrewLetter}
                          </text>
                        </g>
                      );
                    })}
                </svg>

                {/* Layers Nodes */}
                <div className="absolute inset-0" style={{ zIndex: 10 }}>
                  {activatedLayers.map((layerNode, idx) => {
                    const isSelected = selectedLayer === layerNode.id;
                    const nodeInsights = insights.filter((i) => i.layerNode === layerNode.id);
                    const pulseIntensity = layerNode.activation * 20;

                    return (
                      <motion.div
                        key={layerNode.id}
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{
                          opacity: 1,
                          scale: 1,
                          boxShadow:
                            isAnimating && layerNode.activation > 0.3
                              ? `0 0 ${pulseIntensity}px rgba(167, 139, 250, ${layerNode.activation})`
                              : 'none',
                        }}
                        transition={{ delay: idx * 0.05, duration: 0.3 }}
                        className={`absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer
                          ${layerNode.isHidden ? 'opacity-60 border-dashed' : ''} ${isSelected ? 'z-50' : 'z-10'}`}
                        style={{ left: `${layerNode.x}%`, top: `${layerNode.y}%` }}
                        onClick={() => setSelectedLayer(isSelected ? null : layerNode.id)}
                      >
                        {/* Node circle */}
                        <div
                          className={`relative rounded-full p-0.5 bg-gradient-to-br ${layerNode.color}
                          ${isSelected ? 'ring-2 ring-white/50 ring-offset-2 ring-offset-slate-900' : ''}
                          transition-all duration-300 hover:scale-110
                          ${layerNode.isHidden ? 'border-2 border-dashed border-white/30' : ''}`}
                        >
                          <div
                            className={`w-12 h-12 rounded-full flex flex-col items-center justify-center
                            bg-gradient-to-br ${layerNode.color} shadow-lg ${layerNode.glowColor}`}
                          >
                            <span className="text-[10px] font-serif text-slate-800/80">
                              {layerNode.hebrewName}
                            </span>
                            <div className="w-6 h-1 bg-black/20 rounded-full overflow-hidden mt-0.5">
                              <motion.div
                                className="h-full bg-white/80"
                                initial={{ width: 0 }}
                                animate={{ width: `${layerNode.activation * 100}%` }}
                                transition={{ delay: 0.5 + idx * 0.1 }}
                              />
                            </div>
                          </div>
                          {layerNode.insightCount > 0 && (
                            <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-violet-500 text-white text-[8px] flex items-center justify-center font-bold shadow-lg">
                              {layerNode.insightCount}
                            </div>
                          )}
                        </div>

                        {/* Label */}
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-1 whitespace-nowrap text-center">
                          <div className="text-[9px] font-medium text-white/90">
                            {layerNode.name}
                          </div>
                          <div className="text-[7px] text-violet-300/70">
                            {layerNode.neuralRole}
                          </div>
                        </div>

                        {/* Expanded details panel */}
                        <AnimatePresence>
                          {isSelected && (
                            <motion.div
                              initial={{ opacity: 0, y: 10, scale: 0.9 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: 10, scale: 0.9 }}
                              className="absolute top-full left-1/2 transform -translate-x-1/2 mt-8 w-64 z-50"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <div className="bg-slate-800/95 backdrop-blur-xl rounded-xl border border-white/10 p-3 shadow-2xl">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="text-lg">{layerNode.hebrewName}</span>
                                  <div>
                                    <h4 className="text-sm font-semibold text-white">
                                      {layerNode.name}
                                    </h4>
                                    <p className="text-[10px] text-slate-400">
                                      {layerNode.meaning}
                                    </p>
                                  </div>
                                </div>

                                <div className="grid grid-cols-2 gap-2 mb-2">
                                  <div className="bg-white/5 rounded p-1.5">
                                    <div className="text-[8px] text-slate-400">Neural Role</div>
                                    <div className="text-[10px] text-violet-300 font-medium">
                                      {layerNode.neuralRole}
                                    </div>
                                  </div>
                                  <div className="bg-white/5 rounded p-1.5">
                                    <div className="text-[8px] text-slate-400">Activation</div>
                                    <div className="text-[10px] text-emerald-300 font-mono font-bold">
                                      {Math.round(layerNode.activation * 100)}%
                                    </div>
                                  </div>
                                </div>

                                {nodeInsights.length > 0 && (
                                  <div className="border-t border-white/10 pt-2 mt-2">
                                    <div className="text-[8px] text-slate-400 mb-1.5">
                                      Insights ({nodeInsights.length})
                                    </div>
                                    <div className="space-y-1 max-h-32 overflow-y-auto">
                                      {nodeInsights.slice(0, 5).map((ins, i) => (
                                        <div
                                          key={i}
                                          className="text-[9px] text-slate-300 bg-white/5 rounded px-2 py-1"
                                        >
                                          {ins.content.substring(0, 60)}...
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                <div className="mt-2 pt-2 border-t border-white/10 flex justify-between text-[8px]">
                                  <span className="text-slate-400">
                                    Pillar:{' '}
                                    <span className="text-white capitalize">
                                      {layerNode.pillar}
                                    </span>
                                  </span>
                                  {layerNode.isHidden && (
                                    <span className="text-violet-400">⟁ Hidden Layer</span>
                                  )}
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    );
                  })}
                </div>

                {/* Legend */}
                <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-[8px] text-slate-400">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-white/50" />
                      <span>Input (Meta-Core)</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-slate-400/50 border border-dashed border-white/30" />
                      <span>Hidden (Da&apos;at)</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-stone-400" />
                      <span>Output (Embedding)</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-4 h-0.5 bg-violet-400/50" />
                    <span>Synaptic Path</span>
                  </div>
                </div>
              </div>

              {/* Bottom stats */}
              <div className="px-4 py-2 bg-black/20 border-t border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-4 text-[9px]">
                  <div className="text-slate-400">
                    <span className="text-white font-mono">
                      {Math.round(activations['meta-core'] * 100)}%
                    </span>{' '}
                    Input
                  </div>
                  <span className="text-violet-500">→</span>
                  <div className="text-slate-400">
                    <span className="text-violet-300 font-mono">
                      {Math.round(activations['synthesis'] * 100)}%
                    </span>{' '}
                    Emergence
                  </div>
                  <span className="text-violet-500">→</span>
                  <div className="text-slate-400">
                    <span className="text-emerald-300 font-mono">
                      {Math.round(activations['embedding'] * 100)}%
                    </span>{' '}
                    Output
                  </div>
                </div>
                <div className="text-[9px] text-slate-500">
                  Click nodes to explore · <span className="text-violet-400">22 paths</span>{' '}
                  connecting wisdom
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
