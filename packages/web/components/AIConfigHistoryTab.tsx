'use client';

/**
 * AI Config History Tab - extracted from AIConfigUnified.
 * Shows descent tree history, linked chat sessions, and preview.
 */

import { useState, useMemo } from 'react';
import { ANTIPATTERN_DATA } from './ai-config-constants';

export function AIConfigHistoryTab() {
  const [historyFilter, setHistoryFilter] = useState<'all' | 'training' | 'chat'>('all');
  const [selectedHistory, setSelectedHistory] = useState<string | null>(null);

  const historyData = useMemo(
    () => [
      {
        id: '1',
        type: 'training',
        name: 'Deep Research Session',
        date: 'Jan 30',
        patterns: 3,
        score: 87,
      },
      {
        id: '2',
        type: 'chat',
        name: 'Philosophy Discussion',
        date: 'Jan 29',
        patterns: 5,
        score: 72,
      },
      { id: '3', type: 'training', name: 'Code Analysis', date: 'Jan 28', patterns: 2, score: 94 },
      { id: '4', type: 'chat', name: 'Creative Writing', date: 'Jan 27', patterns: 7, score: 65 },
      { id: '5', type: 'training', name: 'Data Synthesis', date: 'Jan 26', patterns: 4, score: 81 },
    ],
    []
  );

  const filteredHistory =
    historyFilter === 'all' ? historyData : historyData.filter((h) => h.type === historyFilter);

  return (
    <div className="max-w-7xl mx-auto px-4 py-3">
      {/* Filter Bar */}
      <div className="bg-white border border-relic-mist rounded p-2 mb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-[7px] uppercase tracking-wider text-relic-silver">Filter</span>
            <div className="flex gap-1">
              {['all', 'training', 'chat'].map((filter) => (
                <button
                  key={filter}
                  onClick={() => setHistoryFilter(filter as typeof historyFilter)}
                  className={`px-1.5 py-0.5 text-[7px] rounded transition-all ${
                    historyFilter === filter
                      ? 'bg-relic-void text-white'
                      : 'bg-relic-ghost text-relic-slate hover:bg-relic-mist'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>
          <button className="text-[7px] text-purple-500 hover:text-purple-700">
            Connect Chat History →
          </button>
        </div>
      </div>

      {/* History Grid */}
      <div className="grid grid-cols-3 gap-3">
        {/* History List */}
        <div className="bg-white border border-relic-mist rounded p-2">
          <div className="text-[7px] uppercase tracking-wider text-relic-silver mb-2">
            Descent Tree History
          </div>
          <div className="space-y-1.5">
            {filteredHistory.map((item) => (
              <button
                key={item.id}
                onClick={() => setSelectedHistory(item.id)}
                className={`w-full text-left p-1.5 rounded border transition-all ${
                  selectedHistory === item.id
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-relic-mist hover:border-relic-slate'
                }`}
              >
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-[8px] font-medium text-relic-void">{item.name}</span>
                  <span
                    className={`text-[6px] px-1 py-0.5 rounded ${
                      item.type === 'training'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}
                  >
                    {item.type}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[7px] text-relic-silver">
                  <span>{item.date}</span>
                  <span>·</span>
                  <span>{item.patterns} patterns</span>
                  <span>·</span>
                  <span
                    className={
                      item.score >= 80
                        ? 'text-green-600'
                        : item.score >= 60
                          ? 'text-amber-600'
                          : 'text-red-600'
                    }
                  >
                    {item.score}%
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Selected History Preview */}
        <div className="col-span-2 bg-white border border-relic-mist rounded p-2">
          {selectedHistory ? (
            <>
              <div className="flex items-center justify-between mb-2">
                <div className="text-[7px] uppercase tracking-wider text-relic-silver">
                  Tree Visualization
                </div>
                <div className="flex gap-1">
                  <button className="px-1.5 py-0.5 text-[7px] bg-relic-ghost text-relic-slate rounded hover:bg-relic-mist">
                    Load Config
                  </button>
                  <button className="px-1.5 py-0.5 text-[7px] bg-relic-ghost text-relic-slate rounded hover:bg-relic-mist">
                    Compare
                  </button>
                </div>
              </div>

              <svg viewBox="0 0 500 250" className="w-full h-40 bg-relic-ghost/30 rounded">
                {ANTIPATTERN_DATA.slice(0, 8).map((node) => {
                  const color =
                    node.severity === 'critical'
                      ? '#ef4444'
                      : node.severity === 'high'
                        ? '#f97316'
                        : '#fbbf24';
                  const radius =
                    node.severity === 'critical' ? 16 : node.severity === 'high' ? 14 : 12;
                  return (
                    <g key={node.id}>
                      <circle
                        cx={node.x}
                        cy={node.y * 0.45 + 20}
                        r={radius + 4}
                        fill={color}
                        opacity={0.15}
                      />
                      <circle
                        cx={node.x}
                        cy={node.y * 0.45 + 20}
                        r={radius}
                        fill="white"
                        stroke={color}
                        strokeWidth="1.5"
                      />
                      <circle
                        cx={node.x}
                        cy={node.y * 0.45 + 20}
                        r={radius * 0.4}
                        fill={color}
                        opacity={0.5}
                      />
                      <text
                        x={node.x}
                        y={node.y * 0.45}
                        textAnchor="middle"
                        fontSize="6"
                        fill="#6b7280"
                      >
                        {node.name}
                      </text>
                    </g>
                  );
                })}
              </svg>

              <div className="grid grid-cols-4 gap-1.5 mt-2">
                {[
                  { label: 'Patterns', value: '5', color: 'text-red-500' },
                  { label: 'Quality', value: '72%', color: 'text-amber-500' },
                  { label: 'Messages', value: '23', color: 'text-blue-500' },
                  { label: 'Duration', value: '45m', color: 'text-green-500' },
                ].map((stat) => (
                  <div key={stat.label} className="text-center p-1.5 bg-relic-ghost/50 rounded">
                    <div className={`text-sm font-medium ${stat.color}`}>{stat.value}</div>
                    <div className="text-[6px] text-relic-silver uppercase">{stat.label}</div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-48 flex items-center justify-center text-[8px] text-relic-silver">
              Select a history item to view its descent tree
            </div>
          )}
        </div>
      </div>

      {/* Linked Chat Sessions */}
      <div className="mt-3 bg-white border border-relic-mist rounded p-2">
        <div className="flex items-center justify-between mb-2">
          <div className="text-[7px] uppercase tracking-wider text-relic-silver">
            Linked Chat Sessions
          </div>
          <button className="text-[7px] text-purple-500 hover:text-purple-700">+ Link New</button>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {[
            { name: 'Philosophy Deep Dive', date: 'Jan 29', trees: 3 },
            { name: 'Code Review Session', date: 'Jan 28', trees: 2 },
            { name: 'Research Analysis', date: 'Jan 27', trees: 5 },
            { name: 'Creative Writing', date: 'Jan 26', trees: 1 },
          ].map((session, idx) => (
            <div
              key={idx}
              className="p-1.5 border border-relic-mist rounded hover:border-purple-300 cursor-pointer"
            >
              <div className="text-[8px] font-medium text-relic-void mb-0.5">{session.name}</div>
              <div className="flex items-center gap-1.5 text-[6px] text-relic-silver">
                <span>{session.date}</span>
                <span>·</span>
                <span>{session.trees} trees</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
