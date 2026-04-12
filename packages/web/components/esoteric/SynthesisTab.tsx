'use client';

import { useState, useMemo, useCallback } from 'react';
import type { NatalChart } from '@/lib/esoteric/natal-engine';
import { getNodeSignMeaning, SIGN_ABBR } from '@/lib/esoteric/natal-engine';
import { getStaticPositions, getStaticConvergence } from '@/lib/esoteric/client-data';

interface Props {
  mode: 'secular' | 'esoteric';
  chart: NatalChart | null;
  onSwitchTab?: (tab: string) => void;
}

export default function SynthesisTab({ mode, chart, onSwitchTab }: Props) {
  const [synthesis, setSynthesis] = useState('');
  const [loading, setLoading] = useState(false);
  const [cost, setCost] = useState(0);

  const positions = useMemo(() => getStaticPositions(), []);
  const convergence = useMemo(() => getStaticConvergence(), []);
  const signMeaning = useMemo(
    () => (chart ? getNodeSignMeaning(chart.northNode.sign) : null),
    [chart]
  );

  const handleGenerate = useCallback(async () => {
    if (!chart) return;
    setLoading(true);
    try {
      const res = await fetch('/api/esoteric/natal-synthesis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chart, mode }),
      });
      const data = await res.json();
      setSynthesis(data.synthesis ?? '');
      setCost(data.cost ?? 0);
    } catch {
      setSynthesis('Synthesis unavailable \u2014 connection error');
    } finally {
      setLoading(false);
    }
  }, [chart, mode]);

  if (!chart) {
    return (
      <div className="py-12 text-center">
        <div className="text-[24px] text-zinc-400 dark:text-zinc-500 mb-3">{'\u25CA'}</div>
        <div className="text-[14px] text-zinc-400 mb-2">No natal chart computed yet</div>
        <div className="text-[11px] text-zinc-500 mb-4">
          Complete your natal chart in the {'\u25C7'} Micro tab first
        </div>
        {onSwitchTab && (
          <button
            onClick={() => onSwitchTab('micro')}
            className="text-[10px] px-4 py-1.5 rounded-md border border-zinc-300 dark:border-zinc-600 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
          >
            Go to Micro tab
          </button>
        )}
      </div>
    );
  }

  const nn = chart.northNode;
  const sn = chart.southNode;
  const signLabel = nn.sign.charAt(0).toUpperCase() + nn.sign.slice(1);
  const aspectStr = chart.aspects.map((a) => `${a.symbol} ${a.type} \u260A`).join(' \u00B7 ');

  const resonance = [
    {
      label: 'Barbault',
      value: `${positions.barbault.currentIndex}`,
      detail:
        positions.barbault.trend === 'rising'
          ? `Rising index favors ${signLabel} themes of ${signMeaning?.theme?.toLowerCase()}`
          : `Falling index tests ${signLabel} resilience \u2014 ${signMeaning?.challenge?.toLowerCase()}`,
    },
    {
      label: 'Turchin',
      value: `PSI ${positions.turchin.psi}`,
      detail: `${positions.turchin.phase} phase intensifies ${nn.house}${ord(nn.house)} house themes \u2014 ${signMeaning?.growth?.toLowerCase()}`,
    },
    {
      label: 'K-wave',
      value: positions.kondratieff.phase.split(' ')[0],
      detail: `${positions.kondratieff.perezStage} stage aligns with ${signLabel} drive toward innovation and structural change`,
    },
    {
      label: 'Strauss-Howe',
      value: `${positions.straussHowe.turningName}`,
      detail: `${positions.straussHowe.turningName} calls for ${nn.house}${ord(nn.house)} house activation \u2014 ${positions.straussHowe.yearsRemaining}y remaining`,
    },
    {
      label: 'Dalio',
      value: `Stage ${positions.dalio.usStage}`,
      detail: `Power transition phase rewards ${signLabel} qualities of ${signMeaning?.theme?.toLowerCase()}`,
    },
  ];

  return (
    <>
      {/* Header */}
      <div className="mb-4">
        <div className="text-[16px] font-medium text-zinc-600 dark:text-zinc-300">
          {'\u25CA'} YOUR CHART {'\u00D7'} THE WORLD
        </div>
        <div className="text-[11px] text-zinc-500">
          Personal nodal axis through the macro-cyclical lens
        </div>
      </div>

      {/* Personal snapshot */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg p-3 mb-3">
        <div className="text-[11px] text-purple-600 font-medium">
          {'\u260A'} North Node: {signLabel} {nn.formattedDegree} · {nn.house}
          {ord(nn.house)} house
        </div>
        <div className="text-[11px] text-zinc-500">
          {'\u260B'} South Node: {SIGN_ABBR[sn.sign]} · {sn.house}
          {ord(sn.house)} house
        </div>
        {aspectStr && <div className="text-[10px] text-zinc-400 mt-1">{aspectStr}</div>}
      </div>

      {/* Macro snapshot pills */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        <Pill
          label={`Barbault ${positions.barbault.currentIndex > 0 ? '+' : ''}${positions.barbault.currentIndex} ${positions.barbault.trend === 'rising' ? '\u2191' : '\u2193'}`}
        />
        <Pill label={`PSI ${positions.turchin.psi}`} />
        <Pill label={`K-wave ${positions.kondratieff.phase.split(' ')[0]}`} />
        <Pill label={positions.straussHowe.turningName} />
        <Pill label={`Stage ${positions.dalio.usStage}`} />
        <Pill label={`${convergence.current.score}/${convergence.current.maxScore} convergence`} />
      </div>

      {/* AI Synthesis */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg p-3 mb-4">
        <div className="text-[11px] uppercase tracking-widest text-zinc-500 mb-2">
          {'\u25CA'} integral synthesis
        </div>
        {loading ? (
          <div className="animate-pulse space-y-2">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="h-2 bg-zinc-100 dark:bg-zinc-800 rounded"
                style={{ width: `${90 - i * 8}%` }}
              />
            ))}
          </div>
        ) : synthesis ? (
          <>
            <div className="text-[12px] text-zinc-600 dark:text-zinc-300 leading-[1.7] whitespace-pre-line">
              {synthesis}
            </div>
            <div className="flex gap-2 mt-3">
              {cost > 0 && (
                <span className="text-[9px] px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500">
                  ${cost.toFixed(4)}
                </span>
              )}
              <span className="text-[9px] px-2 py-0.5 rounded bg-purple-50 dark:bg-purple-900/30 text-purple-500">
                {mode}
              </span>
            </div>
          </>
        ) : (
          <button
            onClick={handleGenerate}
            className="w-full px-4 py-2 text-[10px] uppercase tracking-wider font-medium bg-zinc-800 text-white rounded-lg border border-zinc-700 hover:bg-zinc-700 transition-colors"
          >
            GENERATE SYNTHESIS
          </button>
        )}
      </div>

      {/* Framework resonance grid */}
      <div className="text-[11px] uppercase tracking-widest text-zinc-500 mb-2">
        {'\u25CA'} framework resonance
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {resonance.map((r) => (
          <div key={r.label} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg p-3">
            <div className="flex items-baseline justify-between mb-1">
              <span className="text-[10px] font-medium text-zinc-700 dark:text-zinc-200">{r.label}</span>
              <span className="text-[9px] text-zinc-400">{r.value}</span>
            </div>
            <div className="text-[10px] text-zinc-500 leading-relaxed">{r.detail}</div>
          </div>
        ))}
      </div>
    </>
  );
}

function Pill({ label }: { label: string }) {
  return (
    <span className="text-[9px] px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-500 border border-zinc-200 dark:border-zinc-700">
      {label}
    </span>
  );
}

function ord(n: number): string {
  if (n === 1 || n === 21) return 'st';
  if (n === 2 || n === 22) return 'nd';
  if (n === 3 || n === 23) return 'rd';
  return 'th';
}
