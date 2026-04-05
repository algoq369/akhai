'use client';

import type { Message } from '@/lib/chat-store';

type Intelligence = NonNullable<Message['intelligence']>;

interface LayerResponseDataPanelProps {
  intelligence: Intelligence;
}

const LAYER_COLORS: Record<string, string> = {
  Embedding: 'bg-amber-500',
  Executor: 'bg-orange-500',
  Classifier: 'bg-rose-500',
  Generative: 'bg-pink-500',
  Attention: 'bg-purple-500',
  Discriminator: 'bg-red-500',
  Expansion: 'bg-blue-500',
  Encoder: 'bg-cyan-500',
  Reasoning: 'bg-indigo-500',
  'Meta-Core': 'bg-violet-500',
  Synthesis: 'bg-emerald-500',
};

const LAYER_SIGILS: Record<string, string> = {
  Embedding: '◎',
  Executor: '⚙',
  Classifier: '◇',
  Generative: '✦',
  Attention: '◈',
  Discriminator: '⊘',
  Expansion: '↗',
  Encoder: '⬡',
  Reasoning: '∵',
  'Meta-Core': '☿',
  Synthesis: '△',
};

export default function LayerResponseDataPanel({ intelligence }: LayerResponseDataPanelProps) {
  const { layerActivations, dominantLayers, methodologySelection, guard, instinct } = intelligence;

  const visibleLayers = layerActivations.filter((l) => l.effectiveWeight > 0.05);
  const maxWeight = Math.max(...visibleLayers.map((l) => l.effectiveWeight), 0.01);
  const dominantSet = new Set(dominantLayers || []);

  return (
    <div className="px-4 py-3 space-y-3 border-b border-slate-100 dark:border-relic-slate/30 bg-slate-50/30 dark:bg-relic-slate/10">
      {/* Layer Activations */}
      <div>
        <div className="text-[9px] text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 font-mono">
          Layer Activations
        </div>
        <div className="space-y-1 max-h-[180px] overflow-y-auto">
          {visibleLayers.map((layer) => {
            const pct = Math.round(layer.effectiveWeight * 100);
            const barWidth = Math.round((layer.effectiveWeight / maxWeight) * 100);
            const color = LAYER_COLORS[layer.name] || 'bg-slate-400';
            const sigil = LAYER_SIGILS[layer.name] || '·';
            const isDominant = dominantSet.has(layer.name);

            return (
              <div key={layer.layerNode} className="flex items-center gap-2 group">
                <span className="text-[10px] w-3 text-slate-400 dark:text-slate-500 font-mono">
                  {sigil}
                </span>
                <span className="text-[10px] w-20 text-slate-600 dark:text-slate-300 font-mono truncate">
                  {layer.name}
                </span>
                <div className="flex-1 h-2.5 bg-slate-100 dark:bg-relic-slate/40 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${color} transition-all duration-500`}
                    style={{ width: `${barWidth}%` }}
                  />
                </div>
                <span className="text-[10px] w-8 text-right text-slate-500 dark:text-slate-400 font-mono tabular-nums">
                  {pct}%
                </span>
                {isDominant && (
                  <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-300 font-mono uppercase tracking-wider">
                    dom
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Methodology + Guard + Lenses row */}
      <div className="flex flex-wrap items-center gap-3 pt-1 border-t border-slate-100 dark:border-relic-slate/20">
        {/* Methodology */}
        {methodologySelection && (
          <div className="flex items-center gap-1.5">
            <span className="text-[9px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-mono">
              Method:
            </span>
            <span className="text-[10px] text-slate-700 dark:text-slate-200 font-mono font-medium">
              {methodologySelection.selected.toUpperCase()}
            </span>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
              {Math.round(methodologySelection.confidence * 100)}%
            </span>
          </div>
        )}

        {/* Guard */}
        {guard && (
          <div className="flex items-center gap-1.5">
            <span className="text-[9px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-mono">
              Guard:
            </span>
            <span
              className={`text-[10px] font-mono font-medium ${
                guard.recommendation === 'proceed'
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : guard.recommendation === 'warn'
                    ? 'text-amber-600 dark:text-amber-400'
                    : 'text-red-600 dark:text-red-400'
              }`}
            >
              {guard.recommendation}
            </span>
          </div>
        )}

        {/* Active Lenses */}
        {instinct?.enabled && instinct.activeLenses.length > 0 && (
          <div className="flex items-center gap-1.5">
            <span className="text-[9px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-mono">
              Lenses:
            </span>
            <span className="text-[10px] text-slate-600 dark:text-slate-300 font-mono">
              {instinct.activeLenses.join(', ')}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
