'use client';

import { useEffect } from 'react';
import { useEsotericStore } from '@/lib/stores/esoteric-store';
import FrameworkCards from '@/components/esoteric/FrameworkCards';
import ConvergenceSection from '@/components/esoteric/ConvergenceSection';
import CyclicalChart from '@/components/esoteric/CyclicalChart';
import PowerIndex from '@/components/esoteric/PowerIndex';
import TurchinPanel from '@/components/esoteric/TurchinPanel';
import CrossCivilizational from '@/components/esoteric/CrossCivilizational';
import AstronomicalData from '@/components/esoteric/AstronomicalData';
import SynthesisSection from '@/components/esoteric/SynthesisSection';

function LoadingSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 bg-zinc-100 rounded-lg" />
        ))}
      </div>
      <div className="h-24 bg-zinc-100 rounded-lg" />
      <div className="h-40 bg-zinc-100 rounded-lg" />
      <div className="h-32 bg-zinc-100 rounded-lg" />
    </div>
  );
}

export default function ConstellationPage() {
  const { mode, setMode, analysis, setAnalysis, isLoading, setLoading } = useEsotericStore();

  useEffect(() => {
    let cancelled = false;
    async function fetchAnalysis() {
      setLoading(true);
      try {
        const res = await fetch('/api/esoteric/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: 'Current global macro-cyclical assessment',
            topics: ['geopolitics', 'technology', 'markets'],
            mode,
          }),
        });
        const data = await res.json();
        if (!cancelled && data.relevant) {
          setAnalysis({
            positions: data.positions,
            convergence: data.convergence,
            patterns: data.patterns ?? [],
            chart: data.chart,
            powerIndex: data.powerIndex,
            synthesis: data.synthesis,
          });
        }
      } catch {
        // silently handle — data will remain null
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchAnalysis();
    return () => {
      cancelled = true;
    };
  }, [mode, setAnalysis, setLoading]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 font-mono">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-[18px] font-medium text-zinc-200 mb-1">{'\u25CA'} CONSTELLATION</h1>
        <p className="text-[11px] text-zinc-500">
          Macro-cyclical analysis — 5 frameworks · secular {'\u2194'} esoteric
        </p>
      </div>

      {/* Mode toggle */}
      <div className="flex items-center gap-1 mb-4">
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

      {/* Info line */}
      <div className="text-[10px] text-zinc-600 mb-6">
        {'\u25CA'} macro-cyclical layer · 5 frameworks · data updated apr 2026
      </div>

      {/* Content */}
      {isLoading ? (
        <LoadingSkeleton />
      ) : analysis ? (
        <div className="space-y-6">
          <FrameworkCards positions={analysis.positions} mode={mode} />
          <ConvergenceSection convergence={analysis.convergence} mode={mode} />
          <CyclicalChart chartData={analysis.chart.years} mode={mode} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <PowerIndex nations={analysis.powerIndex} mode={mode} />
            <TurchinPanel
              assessment={analysis.positions.turchin.assessment}
              psi={analysis.positions.turchin.psi}
              mode={mode}
            />
          </div>
          <CrossCivilizational patterns={analysis.patterns} mode={mode} />
          <AstronomicalData mode={mode} />
          <SynthesisSection synthesis={analysis.synthesis} mode={mode} />
        </div>
      ) : (
        <div className="text-[11px] text-zinc-500 py-8 text-center">
          No analysis data available. Refresh to retry.
        </div>
      )}
    </div>
  );
}
