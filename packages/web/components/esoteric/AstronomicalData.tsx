'use client';

interface AstronomicalDataProps {
  mode: 'secular' | 'esoteric';
}

const planets = [
  { symbol: '\u2643', name: 'Jupiter', sign: 'Gemini 18\u00B0' },
  { symbol: '\u2644', name: 'Saturn', sign: 'Pisces 24\u00B0' },
  { symbol: '\u2645', name: 'Uranus', sign: 'Taurus 27\u00B0' },
  { symbol: '\u2646', name: 'Neptune', sign: 'Aries 2\u00B0' },
  { symbol: '\u2647', name: 'Pluto', sign: 'Aquarius 4\u00B0' },
];

export default function AstronomicalData({ mode }: AstronomicalDataProps) {
  if (mode !== 'esoteric') return null;

  return (
    <div className="border-l-2 border-purple-800/50 pl-3">
      <div className="text-[11px] uppercase tracking-widest text-purple-400/70 mb-2">
        {'\u25C7'} astronomical data — april 2026
      </div>
      <div className="bg-white border border-zinc-200 rounded-lg p-3">
        <div className="grid grid-cols-2 gap-x-6 gap-y-1">
          {planets.map((p) => (
            <div key={p.name} className="text-[11px] text-zinc-400">
              <span className="text-purple-400">{p.symbol}</span> {p.name} — {p.sign}
            </div>
          ))}
          <div className="text-[11px] text-purple-400 font-medium">Index: +127 (rising)</div>
        </div>
        <div className="text-[10px] text-purple-400/60 italic mt-2">
          Saturn-Neptune conjunction approaching (Feb 2026) — ideological restructuring cycle
        </div>
      </div>
    </div>
  );
}
