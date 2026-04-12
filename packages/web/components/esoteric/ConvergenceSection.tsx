'use client';

interface ConvergenceSectionProps {
  convergence: {
    current: {
      score: number;
      maxScore: number;
      label: string;
      frameworks: Array<{ name: string; status: string; signal: string }>;
    };
  };
  mode: 'secular' | 'esoteric';
}

function signalColor(signal: string): string {
  if (signal.includes('crisis')) return '#DC2626';
  if (signal.includes('transition')) return '#D97706';
  return '#1D9E75';
}

export default function ConvergenceSection({ convergence, mode }: ConvergenceSectionProps) {
  const { score, maxScore, label, frameworks } = convergence.current;
  const badgeColor =
    score >= 4
      ? 'bg-red-900/50 text-red-400 border-red-800/50'
      : score >= 3
        ? 'bg-amber-900/50 text-amber-400 border-amber-800/50'
        : 'bg-green-900/50 text-green-400 border-green-800/50';

  return (
    <div>
      <div className="text-[11px] uppercase tracking-widest text-zinc-500 mb-2">
        {mode === 'esoteric' ? '\u25C8 cross-framework convergence' : '\u25C8 framework alignment'}
      </div>
      <div className="bg-white border border-zinc-200 rounded-lg p-3">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[16px] font-medium text-zinc-200">
            {score}/{maxScore} frameworks signal crisis phase
          </span>
          <span className={`text-[9px] px-2 py-0.5 rounded-md border ${badgeColor}`}>{label}</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {frameworks.map((fw) => (
            <span
              key={fw.name}
              className="text-[9px] px-2 py-0.5 rounded-full border border-zinc-700/50 text-zinc-400"
            >
              <span
                className="inline-block w-1.5 h-1.5 rounded-full mr-1"
                style={{ backgroundColor: signalColor(fw.signal) }}
              />
              {fw.name}: {fw.status.length > 40 ? fw.status.slice(0, 40) + '...' : fw.status}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
