'use client';

import { useState, useMemo, useEffect, useCallback, useRef, Fragment } from 'react';
import {
  getStaticPositions,
  getStaticConvergence,
  getStaticChart,
  getStaticPowerIndex,
  getStaticPatterns,
} from '@/lib/esoteric/client-data';
import type { StaticPattern } from '@/lib/esoteric/client-data';
import FrameworkCards from '@/components/esoteric/FrameworkCards';
import ConvergenceSection from '@/components/esoteric/ConvergenceSection';
import CyclicalChart from '@/components/esoteric/CyclicalChart';
import PowerIndex from '@/components/esoteric/PowerIndex';
import TurchinPanel from '@/components/esoteric/TurchinPanel';
import CrossCivilizational from '@/components/esoteric/CrossCivilizational';
import AstronomicalData from '@/components/esoteric/AstronomicalData';
import SynthesisSection from '@/components/esoteric/SynthesisSection';

const EXAMPLES = [
  'What is the future of crypto?',
  'Is Western civilization declining?',
  'How will AI reshape geopolitics?',
];
const HISTORY_KEY = 'constellation-query-history';
const MAX_HISTORY = 5;
const STOP =
  'what is the of how will a an are do does can to in on for and or but has have this that be was were its it';

function extractTopics(query: string): string[] {
  const stop = new Set(STOP.split(' '));
  return query
    .toLowerCase()
    .replace(/[?.,!'"]/g, '')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !stop.has(w));
}

function SynthesisSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-3 bg-zinc-100 rounded w-1/4 mb-3" />
      <div className="bg-white border border-zinc-200 rounded-lg p-3 space-y-2">
        <div className="h-2 bg-zinc-100 rounded w-full" />
        <div className="h-2 bg-zinc-100 rounded w-5/6" />
        <div className="h-2 bg-zinc-100 rounded w-4/6" />
      </div>
    </div>
  );
}

interface MacroTabProps {
  mode: 'secular' | 'esoteric';
}

export default function MacroTab({ mode }: MacroTabProps) {
  const [query, setQuery] = useState('');
  const [submittedQuery, setSubmittedQuery] = useState('');
  const [synthesis, setSynthesis] = useState('');
  const [synthLoading, setSynthLoading] = useState(false);
  const [apiPatterns, setApiPatterns] = useState<StaticPattern[]>([]);
  const [queryHistory, setQueryHistory] = useState<string[]>([]);
  const abortRef = useRef<AbortController | null>(null);

  // Static data — computed once, no API needed
  const positions = useMemo(() => getStaticPositions(), []);
  const convergenceData = useMemo(() => getStaticConvergence(), []);
  const chartData = useMemo(() => getStaticChart(), []);
  const powerIndex = useMemo(() => getStaticPowerIndex(), []);
  const defaultPatterns = useMemo(
    () => getStaticPatterns(['geopolitics', 'technology', 'markets'], mode),
    [mode]
  );

  useEffect(() => {
    try {
      const s = localStorage.getItem(HISTORY_KEY);
      if (s) setQueryHistory(JSON.parse(s));
    } catch {
      /* ignore */
    }
  }, []);

  const saveHistory = useCallback((q: string) => {
    setQueryHistory((prev) => {
      const next = [q, ...prev.filter((h) => h !== q)].slice(0, MAX_HISTORY);
      localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const handleSubmit = useCallback(
    async (q: string) => {
      const trimmed = q.trim();
      if (!trimmed) return;
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      setSubmittedQuery(trimmed);
      setSynthLoading(true);
      saveHistory(trimmed);
      try {
        const res = await fetch('/api/esoteric/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: trimmed, topics: extractTopics(trimmed), mode }),
          signal: controller.signal,
        });
        const data = await res.json();
        if (data.relevant) {
          setSynthesis(data.synthesis ?? '');
          setApiPatterns(data.patterns ?? []);
        } else {
          setSynthesis(
            'Query not relevant to macro-cyclical analysis. Try a broader geopolitical, economic, or civilizational question.'
          );
          setApiPatterns([]);
        }
        setSynthLoading(false);
      } catch (e) {
        if (e instanceof DOMException && e.name === 'AbortError') return;
        setSynthesis('Synthesis unavailable \u2014 connection error');
        setSynthLoading(false);
      }
    },
    [mode, saveHistory]
  );

  const handleExampleClick = useCallback(
    (example: string) => {
      setQuery(example);
      handleSubmit(example);
    },
    [handleSubmit]
  );

  const handleTextareaChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setQuery(e.target.value);
    const el = e.target;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 96) + 'px';
  }, []);

  const patterns = submittedQuery ? apiPatterns : defaultPatterns;

  return (
    <>
      {/* Query input */}
      <div className="mb-4">
        <div className="flex gap-2">
          <textarea
            value={query}
            onChange={handleTextareaChange}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(query);
              }
            }}
            rows={2}
            placeholder="Ask the constellation \u2014 what macro pattern do you want to understand?"
            className="flex-1 bg-white border border-zinc-200 rounded-lg px-3 py-2 text-[11px] font-mono text-zinc-700 placeholder:text-zinc-400 resize-none focus:outline-none focus:border-zinc-400"
            style={{ maxHeight: 96 }}
          />
          <button
            onClick={() => handleSubmit(query)}
            disabled={!query.trim() || synthLoading}
            className="self-end px-4 py-2 text-[10px] uppercase tracking-wider font-medium bg-zinc-800 text-zinc-200 rounded-lg border border-zinc-700 hover:bg-zinc-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {synthLoading ? '\u2026' : 'ANALYZE'}
          </button>
        </div>
        <div className="mt-2 text-[9px] text-zinc-400">
          {EXAMPLES.map((eq, i) => (
            <Fragment key={eq}>
              {i > 0 && ' \u00B7 '}
              <button
                onClick={() => handleExampleClick(eq)}
                className="hover:text-zinc-600 transition-colors"
              >
                {'\u2018'}
                {eq}
                {'\u2019'}
              </button>
            </Fragment>
          ))}
        </div>
      </div>

      {/* Recent queries */}
      {queryHistory.length > 0 && (
        <div className="mb-4 flex items-center gap-1.5 flex-wrap">
          <span className="text-[9px] text-zinc-500 uppercase tracking-wider">recent:</span>
          {queryHistory.map((h) => (
            <button
              key={h}
              onClick={() => handleExampleClick(h)}
              className="text-[9px] px-2 py-0.5 rounded-full border border-zinc-200 text-zinc-400 hover:text-zinc-600 hover:border-zinc-400 transition-colors"
            >
              {h}
            </button>
          ))}
          <button
            onClick={() => {
              setQueryHistory([]);
              localStorage.removeItem(HISTORY_KEY);
            }}
            className="text-[9px] text-zinc-300 hover:text-zinc-500 transition-colors ml-1"
          >
            clear
          </button>
        </div>
      )}

      {/* Info line */}
      <div className="text-[10px] text-zinc-500 mb-2">
        {'\u25CA'} macro-cyclical layer · 5 frameworks · data updated apr 2026
      </div>
      <div className="text-[9px] text-zinc-400 mb-6 leading-relaxed max-w-3xl">
        Framework values below are pre-computed from published research data (Barbault ephemeris, Turchin SDT indicators, Kondratieff wave dating, Strauss-Howe turning chronology, Dalio Power Index). They represent the objective state of the world — not your query. The AI synthesis section updates per-query, weaving your question through these static framework positions.
      </div>

      {/* Framework data — static, always visible */}
      <div className="space-y-6">
        <FrameworkCards positions={positions} mode={mode} />
        <ConvergenceSection convergence={convergenceData} mode={mode} />
        <CyclicalChart chartData={chartData.years} mode={mode} />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <PowerIndex nations={powerIndex} mode={mode} />
          <TurchinPanel
            assessment={positions.turchin.assessment}
            psi={positions.turchin.psi}
            mode={mode}
          />
        </div>
        <CrossCivilizational patterns={patterns} mode={mode} />
        <AstronomicalData mode={mode} />

        {/* Synthesis — query-dependent */}
        {synthLoading ? (
          <SynthesisSkeleton />
        ) : submittedQuery ? (
          <div>
            <div className="text-[11px] text-zinc-500 mb-2">
              Analysis for: {'\u201C'}
              {submittedQuery}
              {'\u201D'}
            </div>
            <SynthesisSection synthesis={synthesis} mode={mode} />
          </div>
        ) : (
          <div>
            <div className="text-[11px] uppercase tracking-widest text-zinc-500 mb-2">
              {'\u25CA'} synthesis
            </div>
            <div className="bg-white border border-zinc-200 rounded-lg p-3">
              <div className="text-[11px] italic text-zinc-400">
                Submit a query to receive a macro-cyclical analysis through 5 frameworks
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="text-center mt-8 mb-4">
        <a
          href="/guide"
          className="text-[10px] font-mono text-zinc-400 hover:text-zinc-600 transition-colors"
        >
          ? guide — understand the terminology
        </a>
      </div>
    </>
  );
}
