'use client';

interface TurchinPanelProps {
  assessment: {
    eliteOverproduction: { value: string; metric: string };
    massWellbeing: { value: string; metric: string };
    stateFiscalHealth: { value: string; metric: string };
    institutionalTrust: { value: number; metric: string };
  };
  psi: number;
  mode: 'secular' | 'esoteric';
}

function statusColor(value: string | number): string {
  const v = typeof value === 'string' ? value.toLowerCase() : '';
  if (
    v === 'high' ||
    v === 'critical' ||
    v === 'extreme' ||
    (typeof value === 'number' && value < 30)
  )
    return '#DC2626';
  if (v === 'stagnant' || v === 'moderate' || (typeof value === 'number' && value < 50))
    return '#D97706';
  return '#1D9E75';
}

const metrics = [
  { key: 'eliteOverproduction', label: 'Elite overproduction' },
  { key: 'massWellbeing', label: 'Mass wellbeing' },
  { key: 'stateFiscalHealth', label: 'State fiscal health' },
  { key: 'institutionalTrust', label: 'Institutional trust' },
] as const;

export default function TurchinPanel({ assessment, psi, mode }: TurchinPanelProps) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-widest text-zinc-500 mb-2">
        {mode === 'esoteric'
          ? '\u25CE political stress index (turchin sdt)'
          : '\u25CB social stability indicators'}
      </div>
      <div className="grid grid-cols-2 gap-2">
        {metrics.map((m) => {
          const data = assessment[m.key];
          const val = m.key === 'institutionalTrust' ? `${data.value}%` : (data.value as string);
          const color = statusColor(data.value);
          return (
            <div key={m.key} className="bg-zinc-900/50 border border-zinc-800/50 rounded-lg p-3">
              <div className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1">
                {m.label}
              </div>
              <div className="text-[18px] font-medium" style={{ color }}>
                {val}
              </div>
              <div className="text-[9px] text-zinc-500 mt-0.5 line-clamp-2">{data.metric}</div>
            </div>
          );
        })}
      </div>
      <div className="mt-2 text-[10px] text-zinc-500">
        Composite PSI: <span className="text-zinc-300 font-medium">{psi.toFixed(2)}</span>
        {' \u2014 '}
        {psi >= 0.8 ? 'historical peak zone' : psi >= 0.6 ? 'elevated' : 'baseline'}
      </div>
    </div>
  );
}
