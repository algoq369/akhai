'use client';

import { useSideCanalStore } from '@/lib/stores/side-canal-store';
import { useMetadataPanelStore } from '@/lib/stores/metadata-panel-store';
import { Layer, LAYER_METADATA } from '@/lib/layer-registry';

interface ParsedEntry {
  queryId: string;
  query: string;
  timestamp: number;
  methodology: string;
  provider: string;
  cost: string;
  tokens: number;
  latency: string;
  guard: { score: number; reasons: string[] };
  layers: { name: string; activation: number }[];
  topics: string[];
  confidence: number;
}

function parseEntry(raw: {
  queryId: string;
  timestamp: number;
  data: Record<string, any>;
}): ParsedEntry {
  const d = raw.data;
  const fusion = d.fusion || {};
  const guard = d.guardResult || {};
  const metrics = d.metrics || {};
  const sideCanal = d.sideCanal || {};

  // Extract top 3 layers by activation
  const layers: { name: string; activation: number }[] = [];
  if (fusion.layerActivations) {
    const sorted = [...fusion.layerActivations]
      .sort((a: any, b: any) => (b.effectiveWeight || 0) - (a.effectiveWeight || 0))
      .slice(0, 3);
    for (const la of sorted) {
      const node = la.layerNode ?? la.layer ?? la.layerId ?? la.id;
      const meta = node != null ? LAYER_METADATA[node as Layer] : null;
      const weight = la.effectiveWeight ?? la.weight ?? la.activation ?? 0;
      layers.push({
        name: meta?.aiName || la.name || la.label || `Layer ${node ?? '?'}`,
        activation: Math.round(weight * (weight < 1 ? 100 : 1)),
      });
    }
  }

  // Extract dominant layers as fallback
  if (layers.length === 0 && fusion.dominantLayers) {
    for (const l of fusion.dominantLayers.slice(0, 3)) {
      const meta = LAYER_METADATA[l as Layer];
      layers.push({ name: meta?.aiName || `Layer ${l}`, activation: 0 });
    }
  }

  const costVal = metrics.cost;
  const costStr =
    typeof costVal === 'number'
      ? costVal > 0
        ? `$${costVal.toFixed(4)}`
        : '$0'
      : String(costVal || '$0');

  return {
    queryId: raw.queryId,
    query: (d.query || '').slice(0, 60),
    timestamp: raw.timestamp,
    methodology: typeof fusion.methodology === 'string'
      ? fusion.methodology
      : fusion.methodology?.family || fusion.selectedMethodology || 'unknown',
    provider: typeof d.provider === 'string'
      ? d.provider
      : d.provider?.model || fusion.processingMode || 'N/A',
    cost: costStr,
    tokens: metrics.tokens || 0,
    latency: metrics.duration ? `${Math.round(metrics.duration)}ms` : 'N/A',
    guard: {
      score: guard.riskScore ?? (guard.passed ? 0 : 1),
      reasons: guard.issues || guard.guardReasons || [],
    },
    layers,
    topics: sideCanal.topics || [],
    confidence: fusion.confidence || 0,
  };
}

function formatTime(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function GuardBadge({ score }: { score: number }) {
  const color =
    score <= 0.2
      ? 'text-emerald-400 border-emerald-400/30'
      : score <= 0.5
        ? 'text-amber-400 border-amber-400/30'
        : 'text-red-400 border-red-400/30';
  return (
    <span className={`text-[8px] font-mono px-1 py-0.5 border rounded ${color}`}>
      {score <= 0.2 ? 'PASS' : score <= 0.5 ? 'WARN' : 'FLAG'} {(score * 100).toFixed(0)}%
    </span>
  );
}

function LayerBar({ name, activation }: { name: string; activation: number }) {
  const w = Math.min(activation, 100);
  return (
    <div className="flex items-center gap-1">
      <span className="text-[7px] text-zinc-500 w-[60px] truncate">{name}</span>
      <div className="flex-1 h-[3px] bg-zinc-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-zinc-400 rounded-full transition-all"
          style={{ width: `${Math.max(w, 2)}%` }}
        />
      </div>
      <span className="text-[7px] text-zinc-500 w-[22px] text-right">{activation}%</span>
    </div>
  );
}

function EntryCard({ entry, index }: { entry: ParsedEntry; index: number }) {
  return (
    <div className="px-3 py-2 border-b border-zinc-800/60 last:border-b-0">
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <div className="flex-1 min-w-0">
          <span className="text-[7px] text-zinc-600 font-mono">#{index + 1}</span>
          <p className="text-[9px] text-zinc-300 font-mono truncate leading-tight">
            {entry.query || 'No query text'}
          </p>
        </div>
        <span className="text-[7px] text-zinc-600 font-mono whitespace-nowrap">
          {formatTime(entry.timestamp)}
        </span>
      </div>

      {/* Methodology + Provider + Cost row */}
      <div className="flex items-center gap-1.5 flex-wrap mb-1">
        <span className="text-[8px] font-mono text-zinc-400 bg-zinc-800/50 px-1 py-0.5 rounded">
          {entry.methodology}
        </span>
        <span className="text-[8px] font-mono text-zinc-500">{entry.provider}</span>
        <span className="text-[8px] font-mono text-zinc-500">
          {entry.cost} · {entry.tokens} tok · {entry.latency}
        </span>
      </div>

      {/* Guard + Layers row */}
      <div className="flex items-start gap-3 mb-1">
        <GuardBadge score={entry.guard.score} />
        {entry.layers.length > 0 && (
          <div className="flex-1 space-y-0.5">
            {entry.layers.map((l, i) => (
              <LayerBar key={i} name={l.name} activation={l.activation} />
            ))}
          </div>
        )}
      </div>

      {/* Topics */}
      {entry.topics.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-1">
          {entry.topics.slice(0, 5).map((t, i) => (
            <span key={i} className="text-[7px] text-zinc-500 bg-zinc-800/40 px-1 py-0.5 rounded">
              {t}
            </span>
          ))}
        </div>
      )}

      {/* Guard reasons */}
      {entry.guard.reasons.length > 0 && (
        <div className="mt-1">
          {entry.guard.reasons.slice(0, 2).map((r, i) => (
            <p key={i} className="text-[7px] text-amber-500/70 truncate">
              {r}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

export default function MetadataSidePanel() {
  const isOpen = useMetadataPanelStore((s) => s.isOpen);
  const toggle = useMetadataPanelStore((s) => s.toggle);
  const responseMetadata = useSideCanalStore((s) => s.responseMetadata);

  const entries = responseMetadata.slice(-50).map(parseEntry).reverse();

  return (
    <>
      {/* Toggle button — always visible */}
      <button
        onClick={toggle}
        className="fixed right-0 top-1/2 -translate-y-1/2 z-40 bg-white border border-zinc-200 border-r-0 rounded-l px-0.5 py-3 hover:bg-zinc-50 transition-colors group shadow-sm"
        title="Toggle metadata panel"
        style={{ writingMode: 'vertical-rl' }}
      >
        <span className="text-[7px] text-zinc-400 font-mono tracking-widest group-hover:text-zinc-700 transition-colors uppercase">
          {'◊ metadata'}
        </span>
      </button>

      {/* Panel */}
      <div
        className={`fixed right-0 top-0 h-full z-30 bg-zinc-950/95 backdrop-blur-sm border-l border-zinc-800/50 transition-transform duration-200 ease-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{ width: 320 }}
      >
        {/* Panel header */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-800/50">
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-mono uppercase tracking-wider text-zinc-500">
              Engine Metadata
            </span>
            <span className="text-[8px] font-mono text-zinc-600">{entries.length} queries</span>
          </div>
          <button
            onClick={toggle}
            className="text-[10px] text-zinc-600 hover:text-zinc-300 font-mono transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Scrollable entries */}
        <div className="overflow-y-auto h-[calc(100%-36px)] scrollbar-thin scrollbar-track-transparent scrollbar-thumb-zinc-800">
          {entries.length === 0 ? (
            <div className="p-4 text-center">
              <p className="text-[9px] text-zinc-600 font-mono italic">
                No queries yet. Submit a query to see engine metadata.
              </p>
            </div>
          ) : (
            entries.map((entry, i) => (
              <EntryCard
                key={entry.queryId + '-' + i}
                entry={entry}
                index={entries.length - 1 - i}
              />
            ))
          )}
        </div>
      </div>
    </>
  );
}
