'use client';

interface SynthesisTabProps {
  mode: 'secular' | 'esoteric';
}

export default function SynthesisTab({ mode }: SynthesisTabProps) {
  return (
    <div className="py-12 text-center">
      <div className="text-[14px] font-medium text-zinc-300 mb-2">
        {'\u25CA'} SYNTHESIS —{' '}
        {mode === 'esoteric'
          ? 'Your chart through the macro lens'
          : 'Personal meets macro analysis'}
      </div>
      <div className="text-[11px] text-zinc-500 mb-6">
        Combines your personal natal data with the 5-framework macro-cyclical analysis
      </div>
      <div className="inline-block bg-white border border-zinc-200 rounded-lg px-6 py-4">
        <div className="text-[11px] text-zinc-400 italic">
          Requires both Macro framework data and Micro birth data. Complete your chart in the Micro
          tab first.
        </div>
      </div>
    </div>
  );
}
