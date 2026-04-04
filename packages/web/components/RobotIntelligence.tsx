'use client';

import React, { useState } from 'react';
import { CpuChipIcon, ChartBarIcon } from '@heroicons/react/24/outline';
import { RobotPart, robotParts, statusColors, categoryColors } from './RobotIntelligenceTypes';
import { RobotPartNode } from './RobotPartNode';
import { ConnectionLines } from './RobotConnectionLines';
import { DetailsPanel } from './RobotDetailsPanel';

// ============================================
// MAIN COMPONENT
// ============================================

interface RobotIntelligenceProps {
  initialScale?: 'human' | 'handball';
  embedded?: boolean;
  showToggle?: boolean;
  onPartSelect?: (part: RobotPart | null) => void;
  theme?: 'light' | 'dark';
}

export default function RobotIntelligence({
  initialScale = 'human',
  embedded = false,
  showToggle = true,
  onPartSelect,
  theme = 'dark',
}: RobotIntelligenceProps = {}) {
  const [selectedPart, setSelectedPart] = useState<RobotPart | null>(null);
  const [hoveredPartId, setHoveredPartId] = useState<string | null>(null);
  const [scale, setScale] = useState<'human' | 'handball'>(initialScale);
  const [showStats, setShowStats] = useState(true);

  const handlePartSelect = (part: RobotPart | null) => {
    setSelectedPart(part);
    onPartSelect?.(part);
  };

  // Calculate overall stats
  const overallStats = {
    totalParts: robotParts.length,
    activeParts: robotParts.filter((p) => p.status === 'active').length,
    avgEfficiency: Math.round(
      robotParts.reduce((acc, p) => acc + p.metrics.efficiency, 0) / robotParts.length
    ),
    totalEnergy: robotParts.reduce((acc, p) => acc + p.metrics.energyConsumption, 0),
    avgDevelopment: Math.round(
      robotParts.reduce((acc, p) => acc + p.metrics.development, 0) / robotParts.length
    ),
  };

  const containerClass =
    theme === 'light'
      ? embedded
        ? 'h-full bg-white text-relic-slate rounded-lg'
        : 'min-h-screen bg-white text-relic-slate'
      : embedded
        ? 'h-full bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white rounded-lg'
        : 'min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white';

  return (
    <div className={containerClass}>
      {/* Header */}
      {!embedded && (
        <div className="px-8 py-6 border-b border-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl shadow-lg shadow-violet-500/30">
                <CpuChipIcon className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Robot Intelligence Architecture</h1>
                <p className="text-slate-400">AkhAI Neural Development System</p>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-4">
              {showToggle && (
                <div className="flex items-center gap-2 bg-slate-800 rounded-xl p-1">
                  <button
                    onClick={() => setScale('human')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      scale === 'human'
                        ? 'bg-violet-600 text-white shadow-lg'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Human Size
                  </button>
                  <button
                    onClick={() => setScale('handball')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      scale === 'handball'
                        ? 'bg-violet-600 text-white shadow-lg'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Compact
                  </button>
                </div>
              )}

              {/* Stats toggle */}
              <button
                onClick={() => setShowStats(!showStats)}
                className="p-2 bg-slate-800 rounded-xl hover:bg-slate-700 transition-colors"
              >
                <ChartBarIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex h-[calc(100vh-100px)]">
        {/* Robot Visualization */}
        <div className="flex-1 relative p-8">
          {/* Grid background */}
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: `
                linear-gradient(rgba(148,163,184,0.3) 1px, transparent 1px),
                linear-gradient(90deg, rgba(148,163,184,0.3) 1px, transparent 1px)
              `,
              backgroundSize: '40px 40px',
            }}
          />

          {/* Robot body outline */}
          <div
            className={`
            relative mx-auto
            ${scale === 'human' ? 'w-[600px] h-[700px]' : 'w-[400px] h-[450px]'}
            transition-all duration-500
          `}
          >
            {/* Body silhouette */}
            <div className="absolute inset-0 bg-gradient-to-b from-slate-800/30 to-slate-800/10 rounded-[40%_40%_35%_35%] border border-slate-700/30" />

            {/* Connection lines */}
            <ConnectionLines
              parts={robotParts}
              selectedPartId={selectedPart?.id || null}
              hoveredPartId={hoveredPartId}
              scale={scale}
            />

            {/* Robot parts */}
            {robotParts.map((part) => (
              <RobotPartNode
                key={part.id}
                part={part}
                isSelected={selectedPart?.id === part.id}
                isHovered={hoveredPartId === part.id}
                onSelect={handlePartSelect}
                onHover={setHoveredPartId}
                scale={scale}
              />
            ))}
          </div>

          {/* Legend */}
          <div className="absolute bottom-8 left-8 flex items-center gap-6 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-emerald-500" />
              <span>Active</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-amber-500" />
              <span>Developing</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-slate-400" />
              <span>Planned</span>
            </div>
          </div>
        </div>

        {/* Side Panel */}
        <div className="w-96 border-l border-slate-800 p-6 overflow-y-auto">
          {selectedPart ? (
            <DetailsPanel part={selectedPart} onClose={() => setSelectedPart(null)} />
          ) : (
            <div className="space-y-6">
              {/* Overview stats */}
              {showStats && (
                <div className="bg-slate-800/50 rounded-2xl p-5 border border-slate-700">
                  <h3 className="text-lg font-semibold mb-4">System Overview</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-emerald-400">
                        {overallStats.activeParts}/{overallStats.totalParts}
                      </div>
                      <div className="text-xs text-slate-400">Active Systems</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-blue-400">
                        {overallStats.avgEfficiency}%
                      </div>
                      <div className="text-xs text-slate-400">Avg Efficiency</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-amber-400">
                        {overallStats.totalEnergy}%
                      </div>
                      <div className="text-xs text-slate-400">Total Energy</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-violet-400">
                        {overallStats.avgDevelopment}%
                      </div>
                      <div className="text-xs text-slate-400">Development</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Component list */}
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-slate-400 px-2">All Components</h3>
                {robotParts.map((part) => {
                  const Icon = part.icon;
                  const status = statusColors[part.status];
                  return (
                    <button
                      key={part.id}
                      onClick={() => setSelectedPart(part)}
                      className={`
                        w-full flex items-center gap-3 px-4 py-3 rounded-xl
                        bg-slate-800/30 hover:bg-slate-800/60 border border-slate-700/50
                        transition-all duration-200
                        ${hoveredPartId === part.id ? 'border-blue-500/50' : ''}
                      `}
                      onMouseEnter={() => setHoveredPartId(part.id)}
                      onMouseLeave={() => setHoveredPartId(null)}
                    >
                      <div
                        className={`p-2 rounded-lg bg-gradient-to-br ${categoryColors[part.category]}`}
                      >
                        <Icon className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1 text-left">
                        <div className="text-sm font-medium">{part.name}</div>
                        <div className="text-xs text-slate-500">
                          {part.metrics.efficiency}% efficiency
                        </div>
                      </div>
                      <div className={`w-2 h-2 rounded-full ${status.bg}`} />
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
