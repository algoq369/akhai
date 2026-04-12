'use client';

interface PowerIndexProps {
  nations: Array<{ name: string; score: number; stage: number }>;
  mode: 'secular' | 'esoteric';
}

const nationColors: Record<string, string> = {
  'United States': '#378ADD',
  China: '#D85A30',
  'European Union': '#1D9E75',
  Japan: '#7F77DD',
  'United Kingdom': '#D4537E',
  Germany: '#5DCAA5',
  India: '#BA7517',
  Russia: '#888780',
  'Saudi Arabia': '#D97706',
  Brazil: '#22C55E',
};

export default function PowerIndex({ nations, mode }: PowerIndexProps) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-widest text-zinc-500 mb-2">
        {mode === 'esoteric' ? '\u25C9' : '\u25CB'} power index — top nations (dalio)
      </div>
      <div className="bg-white border border-zinc-200 rounded-lg p-3 space-y-1.5">
        {nations.map((nation) => {
          const color = nationColors[nation.name] ?? '#64748b';
          return (
            <div key={nation.name} className="flex items-center gap-2">
              <span className="text-[10px] text-zinc-400 w-[100px] truncate">{nation.name}</span>
              <div className="flex-1 h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${nation.score * 100}%`, backgroundColor: color }}
                />
              </div>
              <span className="text-[10px] text-zinc-500 w-[30px] text-right">
                {(nation.score * 100).toFixed(0)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
