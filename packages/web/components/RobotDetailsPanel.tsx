'use client';

import React from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { RobotPart, statusColors, categoryColors, robotParts } from './RobotIntelligenceTypes';

// ============================================
// COMPONENT: Details Panel
// ============================================

export function DetailsPanel({ part, onClose }: { part: RobotPart; onClose: () => void }) {
  const status = statusColors[part.status];
  const Icon = part.icon;

  return (
    <div className="bg-slate-900/95 backdrop-blur-xl rounded-2xl border border-slate-700 overflow-hidden shadow-2xl">
      {/* Header */}
      <div className={`bg-gradient-to-r ${categoryColors[part.category]} px-5 py-4`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl">
              <Icon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-white text-lg">{part.name}</h3>
              <span
                className={`text-xs px-2 py-0.5 rounded-full ${status.bg} text-white capitalize`}
              >
                {part.status}
              </span>
            </div>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-lg transition-colors">
            <XMarkIcon className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>

      {/* Description */}
      <div className="px-5 py-3 border-b border-slate-700">
        <p className="text-sm text-slate-300">{part.description}</p>
      </div>

      {/* Metrics Grid */}
      <div className="px-5 py-4 grid grid-cols-2 gap-3 border-b border-slate-700">
        {[
          { label: 'Efficiency', value: part.metrics.efficiency, color: 'emerald' },
          { label: 'Development', value: part.metrics.development, color: 'blue' },
          { label: 'Energy Use', value: part.metrics.energyConsumption, color: 'amber' },
          { label: 'Reliability', value: part.metrics.reliability, color: 'violet' },
        ].map((metric) => (
          <div key={metric.label} className="bg-slate-800 rounded-xl p-3">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs text-slate-400">{metric.label}</span>
              <span className="text-sm font-bold text-white">{metric.value}%</span>
            </div>
            <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
              <div
                className={`h-full bg-${metric.color}-500 rounded-full transition-all duration-500`}
                style={{ width: `${metric.value}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Sub-components */}
      <div className="px-5 py-4">
        <h4 className="text-sm font-semibold text-slate-300 mb-3">Sub-Components</h4>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {part.subComponents.map((sub) => (
            <div
              key={sub.id}
              className="flex items-center justify-between px-3 py-2 bg-slate-800/50 rounded-lg"
            >
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${statusColors[sub.status].bg}`} />
                <span className="text-sm text-slate-300">{sub.name}</span>
              </div>
              <span className="text-sm font-mono text-slate-400">
                {sub.value}
                {sub.unit}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Connections */}
      <div className="px-5 py-3 bg-slate-800/30 border-t border-slate-700">
        <span className="text-xs text-slate-500">
          Connected to:{' '}
          {part.connections
            .map((c) => robotParts.find((p) => p.id === c)?.name)
            .filter(Boolean)
            .join(', ')}
        </span>
      </div>
    </div>
  );
}
