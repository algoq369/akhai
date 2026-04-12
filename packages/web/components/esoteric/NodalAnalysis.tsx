'use client';

import type { NatalChart, Transit } from '@/lib/esoteric/natal-engine';
import {
  getNodeSignMeaning,
  getNodeHouseMeaning,
  getCurrentTransitsToNodes,
  SIGN_ABBR,
} from '@/lib/esoteric/natal-engine';
import { useMemo } from 'react';

interface Props {
  chart: NatalChart;
  mode: 'secular' | 'esoteric';
}

export default function NodalAnalysis({ chart, mode }: Props) {
  const signMeaning = useMemo(
    () => getNodeSignMeaning(chart.northNode.sign),
    [chart.northNode.sign]
  );
  const houseMeaning = useMemo(
    () => getNodeHouseMeaning(chart.northNode.house),
    [chart.northNode.house]
  );
  const transits = useMemo(
    () => getCurrentTransitsToNodes(chart.northNode.longitude),
    [chart.northNode.longitude]
  );

  const signLabel =
    mode === 'esoteric'
      ? chart.northNode.sign.charAt(0).toUpperCase() + chart.northNode.sign.slice(1)
      : SIGN_ABBR[chart.northNode.sign];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="text-[11px] uppercase tracking-widest text-zinc-500">
        {'\u260A'} North Node analysis
      </div>

      {/* Position card */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg p-3">
        <div className="text-[12px] font-medium text-purple-600 mb-2">
          {'\u260A'} North Node in {signLabel} {chart.northNode.formattedDegree} ·{' '}
          {chart.northNode.house}
          {ordinal(chart.northNode.house)} house
        </div>
        <div className="space-y-2">
          <div>
            <div className="text-[9px] uppercase tracking-wider text-zinc-400 mb-0.5">Theme</div>
            <div className="text-[11px] text-zinc-600 dark:text-zinc-300 leading-relaxed">{signMeaning.theme}</div>
          </div>
          <div>
            <div className="text-[9px] uppercase tracking-wider text-zinc-400 mb-0.5">
              Growth direction
            </div>
            <div className="text-[11px] text-zinc-600 dark:text-zinc-300 leading-relaxed">{signMeaning.growth}</div>
          </div>
          <div>
            <div className="text-[9px] uppercase tracking-wider text-zinc-400 mb-0.5">
              Challenge
            </div>
            <div className="text-[11px] text-zinc-600 dark:text-zinc-300 leading-relaxed">{signMeaning.challenge}</div>
          </div>
        </div>
      </div>

      {/* House meaning */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg p-3">
        <div className="text-[10px] font-medium text-zinc-700 dark:text-zinc-200 mb-1">
          {chart.northNode.house}
          {ordinal(chart.northNode.house)} House — {houseMeaning.lifeArea}
        </div>
        <div className="text-[11px] text-zinc-500 leading-relaxed">{houseMeaning.focus}</div>
      </div>

      {/* South Node */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg p-3">
        <div className="text-[10px] font-medium text-zinc-500 mb-1">
          {'\u260B'} South Node in {SIGN_ABBR[chart.southNode.sign]}{' '}
          {chart.southNode.formattedDegree} · {chart.southNode.house}
          {ordinal(chart.southNode.house)} house
        </div>
        <div className="text-[11px] text-zinc-400 leading-relaxed italic">
          Comfort zone and past-life patterns. Growth comes from moving toward the North Node
          qualities.
        </div>
      </div>

      {/* Natal aspects to North Node */}
      {chart.aspects.length > 0 && (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg p-3">
          <div className="text-[10px] font-medium text-zinc-700 dark:text-zinc-200 mb-2">
            Natal aspects to North Node
          </div>
          <div className="space-y-1">
            {chart.aspects.map((a) => (
              <div key={a.planet} className="flex items-center gap-2 text-[11px]">
                <span className="text-zinc-500">{a.symbol}</span>
                <span className="text-zinc-600 capitalize">{a.planet}</span>
                <span
                  className={`text-[9px] px-1.5 py-0.5 rounded ${
                    a.type === 'trine' || a.type === 'sextile'
                      ? 'bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                      : a.type === 'conjunction'
                        ? 'bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400'
                        : 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                  }`}
                >
                  {a.type} ({a.orb}\u00B0)
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Current transits */}
      {transits.length > 0 && (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg p-3">
          <div className="text-[10px] font-medium text-zinc-700 dark:text-zinc-200 mb-2">
            Current transits to North Node
          </div>
          <div className="space-y-1">
            {transits.map((t) => (
              <TransitRow key={`${t.planet}-${t.type}`} transit={t} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function TransitRow({ transit }: { transit: Transit }) {
  return (
    <div className="flex items-center gap-2 text-[11px]">
      <span className="text-zinc-500">{transit.symbol}</span>
      <span className="text-zinc-600 capitalize">{transit.planet}</span>
      <span
        className={`text-[9px] px-1.5 py-0.5 rounded ${
          transit.type === 'trine' || transit.type === 'sextile'
            ? 'bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400'
            : transit.type === 'conjunction'
              ? 'bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400'
              : 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400'
        }`}
      >
        {transit.type} ({transit.orb}\u00B0)
      </span>
      <span className="text-[9px] text-zinc-400">
        {transit.applying ? 'applying' : 'separating'}
      </span>
    </div>
  );
}

function ordinal(n: number): string {
  if (n === 1 || n === 21) return 'st';
  if (n === 2 || n === 22) return 'nd';
  if (n === 3 || n === 23) return 'rd';
  return 'th';
}
