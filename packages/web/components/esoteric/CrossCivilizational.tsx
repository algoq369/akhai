'use client';

interface CrossCivilizationalProps {
  patterns: Array<{
    traditionName: string;
    sigil: string;
    color: string;
    topic: string;
    formatted: string;
  }>;
  mode: 'secular' | 'esoteric';
}

export default function CrossCivilizational({ patterns, mode }: CrossCivilizationalProps) {
  if (mode !== 'esoteric' || !patterns.length) return null;

  return (
    <div className="border-l-2 border-purple-800/50 pl-3">
      <div className="text-[11px] uppercase tracking-widest text-purple-400/70 mb-2">
        {'\u2623'} cross-civilizational pattern matching
      </div>
      <div className="space-y-2">
        {patterns.map((p, i) => (
          <div
            key={i}
            className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg p-3"
            style={{ borderLeftWidth: 2, borderLeftColor: p.color }}
          >
            <div
              className="text-[10px] uppercase tracking-wider font-medium mb-1"
              style={{ color: p.color }}
            >
              {p.sigil} {p.traditionName} — {p.topic}
            </div>
            <div className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-[1.7]">{p.formatted}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
