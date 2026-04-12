'use client';

import EsotericTooltip from './EsotericTooltip';

const tooltipIds: Record<string, string> = {
  barbault: 'barbault',
  turchin: 'structural-demographic-theory',
  kondratieff: 'k-wave',
  straussHowe: 'fourth-turning',
  dalio: 'big-cycle',
};

interface FrameworkCardsProps {
  positions: {
    barbault: { currentIndex: number; trend: string };
    turchin: { psi: number; phase: string };
    kondratieff: { phase: string; waveName: string };
    straussHowe: { turningName: string; yearsRemaining: number };
    dalio: { usStageName: string; usStage: number };
  };
  mode: 'secular' | 'esoteric';
}

const cards = [
  { key: 'barbault', secular: 'PCI', esoteric: 'Barbault', sub: 'Celestial concentration' },
  { key: 'turchin', secular: 'PSI', esoteric: 'Turchin SDT', sub: 'Political stress' },
  { key: 'kondratieff', secular: 'K-Wave', esoteric: 'Kondratieff', sub: 'Economic cycle' },
  { key: 'straussHowe', secular: '4th Turn', esoteric: 'Strauss-Howe', sub: 'Generational' },
  { key: 'dalio', secular: 'Big Cycle', esoteric: 'Dalio', sub: 'Geopolitical' },
] as const;

function getValueAndColor(key: string, positions: FrameworkCardsProps['positions']) {
  switch (key) {
    case 'barbault': {
      const b = positions.barbault;
      const color =
        b.trend === 'rising' ? '#1D9E75' : b.trend === 'falling' ? '#DC2626' : '#94a3b8';
      return { value: `${b.currentIndex} (${b.trend})`, color };
    }
    case 'turchin': {
      const t = positions.turchin;
      const color = t.psi >= 0.8 ? '#DC2626' : t.psi >= 0.6 ? '#D97706' : '#1D9E75';
      return { value: `${t.psi.toFixed(2)}`, color };
    }
    case 'kondratieff':
      return { value: positions.kondratieff.phase, color: '#D97706' };
    case 'straussHowe': {
      const s = positions.straussHowe;
      return { value: `${s.turningName} (${s.yearsRemaining}y left)`, color: '#DC2626' };
    }
    case 'dalio': {
      const d = positions.dalio;
      const color = d.usStage >= 5 ? '#DC2626' : d.usStage >= 4 ? '#D97706' : '#1D9E75';
      return { value: `Stage ${d.usStage}: ${d.usStageName}`, color };
    }
    default:
      return { value: '—', color: '#94a3b8' };
  }
}

export default function FrameworkCards({ positions, mode }: FrameworkCardsProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
      {cards.map((card) => {
        const { value, color } = getValueAndColor(card.key, positions);
        return (
          <div
            key={card.key}
            className={`bg-white border border-zinc-200 rounded-lg p-2.5 ${card.key === 'dalio' ? 'col-span-2 sm:col-span-1' : ''}`}
          >
            <div className="text-[10px] font-medium text-zinc-300">
              <EsotericTooltip termId={tooltipIds[card.key]}>
                {mode === 'secular' ? card.secular : card.esoteric}
              </EsotericTooltip>
            </div>
            <div className="text-[9px] text-zinc-500 mb-1">{card.sub}</div>
            <div className="text-[13px] font-medium truncate" style={{ color }}>
              {value}
            </div>
          </div>
        );
      })}
    </div>
  );
}
