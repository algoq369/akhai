'use client';

import { useState, useCallback } from 'react';
import type { NatalChart, BirthData } from '@/lib/esoteric/natal-engine';
import BirthDataInput from '@/components/esoteric/BirthDataInput';
import NatalChartSVG from '@/components/esoteric/NatalChartSVG';
import NodalAnalysis from '@/components/esoteric/NodalAnalysis';

interface MicroTabProps {
  mode: 'secular' | 'esoteric';
  onChartComputed?: (chart: NatalChart) => void;
}

export default function MicroTab({ mode, onChartComputed }: MicroTabProps) {
  const [chart, setChart] = useState<NatalChart | null>(null);
  const [birthName, setBirthName] = useState('');

  const handleChartComputed = useCallback(
    (c: NatalChart, data: BirthData) => {
      setChart(c);
      setBirthName(data.name || 'You');
      onChartComputed?.(c);
    },
    [onChartComputed]
  );

  return (
    <>
      <div className="text-[10px] text-zinc-600 mb-4">
        {'\u25C7'} personal natal chart · North Node analysis ·{' '}
        {mode === 'esoteric' ? 'karmic path' : 'growth direction'}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <BirthDataInput onChartComputed={handleChartComputed} />
        {chart ? (
          <div className="bg-white border border-zinc-200 rounded-lg p-3">
            <div className="text-[11px] uppercase tracking-widest text-zinc-500 mb-2">
              {birthName}&apos;s natal chart
            </div>
            <NatalChartSVG chart={chart} />
          </div>
        ) : (
          <div className="bg-white border border-zinc-200 rounded-lg p-3 flex items-center justify-center">
            <div className="text-center">
              <div className="text-[24px] text-zinc-200 mb-2">{'\u260A'}</div>
              <div className="text-[11px] text-zinc-400 italic">
                Enter birth data and compute to see your natal chart
              </div>
            </div>
          </div>
        )}
      </div>

      {chart ? (
        <NodalAnalysis chart={chart} mode={mode} />
      ) : (
        <div className="bg-white border border-zinc-200 rounded-lg p-4 text-center">
          <div className="text-[11px] text-zinc-400 italic">
            {mode === 'esoteric'
              ? 'Your North Node reveals the karmic direction of this lifetime. Compute your chart to begin.'
              : 'The North Node indicates your primary growth direction. Compute your chart to see the analysis.'}
          </div>
        </div>
      )}
    </>
  );
}
