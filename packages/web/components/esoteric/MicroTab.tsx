'use client';

interface MicroTabProps {
  mode: 'secular' | 'esoteric';
}

export default function MicroTab({ mode }: MicroTabProps) {
  return (
    <div className="py-12 text-center">
      <div className="text-[14px] font-medium text-zinc-300 mb-2">
        {'\u25C7'} MICRO —{' '}
        {mode === 'esoteric' ? 'Personal natal chart analysis' : 'Personal cyclical position'}
      </div>
      <div className="text-[11px] text-zinc-500 mb-6">
        Enter your birth data to compute your North Node position and natal chart
      </div>
      <div className="inline-block bg-white border border-zinc-200 rounded-lg px-6 py-4">
        <div className="text-[11px] text-zinc-400 italic">
          Coming soon — birth data input, natal chart SVG, nodal axis analysis
        </div>
      </div>
    </div>
  );
}
