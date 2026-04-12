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
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg p-3">
        <div className="text-[11px] text-zinc-600 dark:text-zinc-300 leading-[1.7] mb-3">{synthesis}</div>
        <div className="flex flex-wrap gap-2">
          <span className="text-[9px] px-2 py-0.5 rounded-md bg-purple-100 text-purple-700 border border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800/30">
            esoteric confidence: 62%
          </span>
          <span className="text-[9px] px-2 py-0.5 rounded-md bg-amber-100 text-amber-700 border border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800/30">
            uncertainty: model convergence {'\u2260'} certainty
          </span>
        </div>
      </div>
    </div>
  );
}
