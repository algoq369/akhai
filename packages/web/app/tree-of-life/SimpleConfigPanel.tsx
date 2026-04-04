'use client';

/**
 * SimpleConfigPanel — 3-slider AI configuration view
 * Extracted from tree-of-life/page.tsx
 */

import { useRouter } from 'next/navigation';
import { Layer } from '@/lib/layer-registry';
import { useLayerStore } from '@/lib/stores/layer-store';
import { LAYER_PRESETS } from '@/lib/layer-presets';

const SIMPLE_LAYER_COLORS: Record<number, string> = {
  [Layer.REASONING]: '#4f46e5',
  [Layer.ATTENTION]: '#22c55e',
  [Layer.GENERATIVE]: '#f97316',
};

const SIMPLE_SLIDERS = [
  { layer: Layer.REASONING, label: 'Reasoning', left: 'surface', right: 'deep analysis' },
  { layer: Layer.ATTENTION, label: 'Attention', left: 'broad', right: 'laser focus' },
  { layer: Layer.GENERATIVE, label: 'Generative', left: 'factual', right: 'creative' },
] as const;

const SIMPLE_PRESETS = [
  { key: 'analytical' as const, label: 'analytical' },
  { key: 'creative' as const, label: 'creative' },
  { key: 'balanced' as const, label: 'balanced' },
  { key: 'deep' as const, label: 'thorough' },
];

export function SimpleConfigPanel({ onAdvanced }: { onAdvanced: () => void }) {
  const router = useRouter();
  const weights = useLayerStore((s) => s.weights);
  const activePreset = useLayerStore((s) => s.activePreset);

  return (
    <div className="max-w-xl mx-auto pt-16 pb-12 px-4">
      {/* Header */}
      <button
        onClick={() => router.back()}
        className="text-[9px] font-mono text-[#94a3b8] hover:text-[#64748b] transition-colors uppercase tracking-widest mb-6 inline-block"
      >
        &larr; back to chat
      </button>
      <h1 className="text-[11px] uppercase tracking-[0.3em] text-[#94a3b8] font-mono mb-1">
        AI CONFIGURATION
      </h1>
      <h2 className="text-2xl font-mono text-[#18181b] mb-1">Tune Your Research Engine</h2>
      <p className="text-[10px] text-[#94a3b8] font-mono mb-10">
        Adjust how the AI processes your queries
      </p>

      {/* Sliders */}
      <div className="space-y-8 mb-10">
        {SIMPLE_SLIDERS.map(({ layer, label, left, right }) => {
          const value = Math.round((weights[layer] ?? 0.5) * 100);
          const color = SIMPLE_LAYER_COLORS[layer];
          return (
            <div key={layer}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] uppercase tracking-[0.2em] font-mono text-[#18181b]">
                  {label}
                </span>
                <span className="text-[11px] font-mono tabular-nums" style={{ color }}>
                  {value}%
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={value}
                onChange={(e) => {
                  useLayerStore.getState().setWeight(layer, Number(e.target.value) / 100);
                }}
                className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, ${color} ${value}%, #e2e8f0 ${value}%)`,
                  accentColor: color,
                }}
              />
              <div className="flex justify-between mt-1">
                <span className="text-[9px] text-[#94a3b8] font-mono">{left}</span>
                <span className="text-[9px] text-[#94a3b8] font-mono">{right}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Preset Buttons */}
      <div className="grid grid-cols-4 gap-2 mb-10">
        {SIMPLE_PRESETS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => {
              useLayerStore.getState().applyPreset({ ...LAYER_PRESETS[key] }, key);
            }}
            className={`py-2 px-3 text-[10px] uppercase tracking-[0.15em] font-mono border transition-all ${
              activePreset === key
                ? 'border-[#18181b] text-[#18181b] bg-[#f1f5f9]'
                : 'border-[#e2e8f0] text-[#94a3b8] hover:border-[#94a3b8] hover:text-[#64748b]'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Advanced toggle */}
      <button
        onClick={onAdvanced}
        className="text-[10px] uppercase tracking-[0.2em] text-[#94a3b8] hover:text-[#18181b] font-mono transition-colors"
      >
        advanced configuration &rarr;
      </button>
    </div>
  );
}
