'use client';

interface SynthesisSectionProps {
  synthesis: string;
  mode: 'secular' | 'esoteric';
}

export default function SynthesisSection({ synthesis, mode }: SynthesisSectionProps) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-widest text-zinc-500 mb-2">
        {mode === 'esoteric' ? '\u25CA integral synthesis' : '\u25CA synthesis'}
      </div>
      <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-lg p-3">
        <div className="text-[11px] text-zinc-400 leading-[1.7] mb-3">{synthesis}</div>
        <div className="flex flex-wrap gap-2">
          <span className="text-[9px] px-2 py-0.5 rounded-md bg-purple-900/30 text-purple-400 border border-purple-800/30">
            esoteric confidence: 62%
          </span>
          <span className="text-[9px] px-2 py-0.5 rounded-md bg-amber-900/30 text-amber-400 border border-amber-800/30">
            uncertainty: model convergence {'\u2260'} certainty
          </span>
        </div>
      </div>
    </div>
  );
}
