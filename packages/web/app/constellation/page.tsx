'use client';

import { useState, useEffect, useCallback } from 'react';
import { useEsotericStore } from '@/lib/stores/esoteric-store';
import type { NatalChart } from '@/lib/esoteric/natal-engine';
import { loadBirthData, computeNatalChart } from '@/lib/esoteric/natal-engine';
import MacroTab from '@/components/esoteric/MacroTab';
import MicroTab from '@/components/esoteric/MicroTab';
import SynthesisTab from '@/components/esoteric/SynthesisTab';

type Tab = 'macro' | 'micro' | 'synthesis';

const TABS: { id: Tab; label: string }[] = [
  { id: 'macro', label: '\u25C8 Macro' },
  { id: 'micro', label: '\u25C7 Micro' },
  { id: 'synthesis', label: '\u25CA Synthesis' },
];

export default function ConstellationPage() {
  const { mode, setMode } = useEsotericStore();
  const [activeTab, setActiveTab] = useState<Tab>('macro');
  const [natalChart, setNatalChart] = useState<NatalChart | null>(null);

  // Load saved chart from localStorage on mount
  useEffect(() => {
    const saved = loadBirthData();
    if (saved) {
      try {
        setNatalChart(computeNatalChart(saved));
      } catch {
        /* ignore */
      }
    }
  }, []);

  const handleChartComputed = useCallback((chart: NatalChart) => {
    setNatalChart(chart);
  }, []);

  const handleSwitchTab = useCallback((tab: string) => {
    setActiveTab(tab as Tab);
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 font-mono">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-[18px] font-medium text-zinc-200 mb-1">{'\u25CA'} CONSTELLATION</h1>
        <p className="text-[11px] text-zinc-500">
          Macro-cyclical analysis · personal natal chart · combined synthesis
        </p>
      </div>

      {/* Tab bar */}
      <div className="flex items-center gap-1 mb-3">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`text-[10px] px-3 py-1 rounded-md border transition-colors ${
              activeTab === tab.id
                ? 'bg-zinc-100 border-zinc-300 text-zinc-800'
                : 'border-zinc-800/50 text-zinc-500 hover:text-zinc-400'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Mode toggle */}
      <div className="flex items-center gap-1 mb-6">
        <button
          onClick={() => setMode('secular')}
          className={`text-[10px] px-3 py-1 rounded-md border transition-colors ${
            mode === 'secular'
              ? 'bg-zinc-100 border-zinc-300 text-zinc-800'
              : 'border-zinc-800/50 text-zinc-500 hover:text-zinc-400'
          }`}
        >
          Standard analysis
        </button>
        <button
          onClick={() => setMode('esoteric')}
          className={`text-[10px] px-3 py-1 rounded-md border transition-colors ${
            mode === 'esoteric'
              ? 'bg-purple-900/30 border-purple-800/50 text-purple-400'
              : 'border-zinc-800/50 text-zinc-500 hover:text-zinc-400'
          }`}
        >
          Full spectrum analysis
        </button>
      </div>

      {/* Active tab */}
      {activeTab === 'macro' && <MacroTab mode={mode} />}
      {activeTab === 'micro' && <MicroTab mode={mode} onChartComputed={handleChartComputed} />}
      {activeTab === 'synthesis' && (
        <SynthesisTab mode={mode} chart={natalChart} onSwitchTab={handleSwitchTab} />
      )}
    </div>
  );
}
