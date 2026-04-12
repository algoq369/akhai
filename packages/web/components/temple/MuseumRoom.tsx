'use client';

import { useState, useMemo } from 'react';
import data from '@/lib/esoteric/data/akh313.json';

type Section = 'exhibits' | 'convergence';
type Family = 'all' | 'gateway' | 'islamic' | 'western' | 'universal' | 'comparative';
type TableKey = keyof typeof data.convergenceTables;

const FAMILIES: { id: Family; label: string; color: string }[] = [
  { id: 'all', label: 'All', color: '#71717a' },
  { id: 'gateway', label: 'Gateway', color: data.familyColors.gateway },
  { id: 'islamic', label: 'Islamic Synthesis', color: data.familyColors.islamic },
  { id: 'western', label: 'Western Esoteric', color: data.familyColors.western },
  { id: 'universal', label: 'Universal', color: data.familyColors.universal },
  { id: 'comparative', label: 'Comparative', color: data.familyColors.comparative },
];

const TABLES: {
  key: TableKey;
  numeral: string;
  title: string;
  subtitle: string;
  cols: string[];
}[] = [
  {
    key: 'absoluteSource',
    numeral: 'I',
    title: 'THE ABSOLUTE SOURCE',
    subtitle: 'Every tradition identifies a single, non-dual Absolute as the ground of all reality',
    cols: ['Tradition', 'Term', 'Character'],
  },
  {
    key: 'emanation',
    numeral: 'II',
    title: 'THE EMANATION / DESCENT',
    subtitle: 'How the One becomes the many',
    cols: ['Tradition', 'Mechanism', 'Key Terms'],
  },
  {
    key: 'intermediateRealm',
    numeral: 'III',
    title: 'THE INTERMEDIATE REALM',
    subtitle: 'The key ontological zone between intellect and matter',
    cols: ['Tradition', 'Name', 'Function'],
  },
  {
    key: 'returnAscent',
    numeral: 'IV',
    title: 'THE RETURN / ASCENT',
    subtitle: 'The soul\u2019s journey back to the source',
    cols: ['Tradition', 'Process', 'Goal'],
  },
];

export default function MuseumRoom() {
  const [section, setSection] = useState<Section>('exhibits');
  const [family, setFamily] = useState<Family>('all');
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    let list = data.schools;
    if (family !== 'all') list = list.filter((s) => s.family === family);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (s) => s.name.toLowerCase().includes(q) || s.texts.some((t) => t.toLowerCase().includes(q))
      );
    }
    return list;
  }, [family, search]);

  return (
    <div>
      {/* Header */}
      <div className="mb-4">
        <div className="text-[14px] uppercase tracking-wider text-zinc-300">
          {'\u25C7'} THE MUSEUM
        </div>
        <div className="text-[11px] text-zinc-500">
          A curated exhibition of universal metaphysical knowledge — 24 schools of thought across 12
          civilizations
        </div>
      </div>

      {/* Sub-tabs */}
      <div className="flex items-center gap-1 mb-5">
        {(['exhibits', 'convergence'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setSection(s)}
            className={`text-[10px] px-3 py-1 rounded-md border transition-colors ${section === s ? 'bg-zinc-100 border-zinc-300 text-zinc-800' : 'border-zinc-800/50 text-zinc-500 hover:text-zinc-400'}`}
          >
            {s === 'exhibits' ? 'EXHIBITS' : 'CONVERGENCE'}
          </button>
        ))}
      </div>

      {section === 'exhibits' ? (
        <Exhibits
          family={family}
          setFamily={setFamily}
          search={search}
          setSearch={setSearch}
          filtered={filtered}
        />
      ) : (
        <Convergence />
      )}

      {/* Footer */}
      <div className="text-center mt-10 space-y-1">
        <div className="text-[9px] text-zinc-400">
          24 schools · 48 essential texts · 4 ontological layers · 12+ civilizations
        </div>
        <div className="text-[9px] text-zinc-400">
          Source: AKH 313 — \u00C9cole de Pens\u00E9e · Structural Convergence Thesis
        </div>
      </div>
    </div>
  );
}

// === Exhibits Section ===

interface ExhibitsProps {
  family: Family;
  setFamily: (f: Family) => void;
  search: string;
  setSearch: (s: string) => void;
  filtered: typeof data.schools;
}

function Exhibits({ family, setFamily, search, setSearch, filtered }: ExhibitsProps) {
  return (
    <>
      {/* Family filter */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {FAMILIES.map((f) => (
          <button
            key={f.id}
            onClick={() => setFamily(f.id)}
            className={`text-[9px] px-2.5 py-1 rounded-full border transition-colors flex items-center gap-1.5 ${family === f.id ? 'bg-zinc-100 border-zinc-300 text-zinc-700' : 'border-zinc-200 text-zinc-400 hover:text-zinc-600 hover:border-zinc-400'}`}
          >
            {f.id !== 'all' && (
              <span
                className="w-1.5 h-1.5 rounded-full inline-block"
                style={{ backgroundColor: f.color }}
              />
            )}
            {f.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search schools or texts\u2026"
        className="w-full bg-white border border-zinc-200 rounded-lg px-3 py-1.5 text-[11px] font-mono text-zinc-700 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-400 mb-4"
      />

      {/* Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {filtered.map((s) => {
          const color = data.familyColors[s.family as keyof typeof data.familyColors] ?? '#71717a';
          const label = data.familyLabels[s.family as keyof typeof data.familyLabels] ?? s.family;
          return (
            <div
              key={s.id}
              className="bg-white border border-zinc-200 rounded-lg p-3"
              style={{ borderLeftWidth: 3, borderLeftColor: color }}
            >
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-500">
                  #{s.id}
                </span>
                <span className="text-[12px] font-medium text-zinc-700">{s.name}</span>
              </div>
              <span
                className="inline-block text-[9px] px-2 py-0.5 rounded-full mb-2"
                style={{ backgroundColor: color + '18', color }}
              >
                {label}
              </span>
              <div className="space-y-0.5">
                {s.texts.map((t, i) => (
                  <div key={i} className="text-[10px] text-zinc-400 italic">
                    {'\u2022'} {t}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-8 text-[11px] text-zinc-400 italic">
          No schools match your search
        </div>
      )}
    </>
  );
}

// === Convergence Section ===

function Convergence() {
  return (
    <div className="space-y-8">
      {TABLES.map((t) => (
        <div key={t.key}>
          <div className="mb-2">
            <div className="text-[12px] font-medium text-zinc-600">
              {t.numeral}. {t.title}
            </div>
            <div className="text-[10px] text-zinc-400 italic">{t.subtitle}</div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[10px] font-mono">
              <thead>
                <tr className="bg-zinc-100">
                  {t.cols.map((c) => (
                    <th
                      key={c}
                      className="text-left px-3 py-2 text-zinc-500 font-medium border-b border-zinc-200"
                    >
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(data.convergenceTables[t.key] as Record<string, string>[]).map((row, i) => {
                  const vals = Object.values(row);
                  return (
                    <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-zinc-50'}>
                      <td className="px-3 py-1.5 text-zinc-600 font-medium border-b border-zinc-100">
                        {vals[0]}
                      </td>
                      <td className="px-3 py-1.5 text-zinc-500 italic border-b border-zinc-100">
                        {vals[1]}
                      </td>
                      <td className="px-3 py-1.5 text-zinc-400 border-b border-zinc-100">
                        {vals[2]}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Barzakh/Bardo note after Intermediate Realm */}
          {t.key === 'intermediateRealm' && (
            <div
              className="mt-3 bg-white border border-zinc-200 rounded-lg p-3 border-l-[3px]"
              style={{ borderLeftColor: '#7F77DD' }}
            >
              <div className="text-[11px] italic text-zinc-500 leading-relaxed">
                <span className="font-medium text-zinc-600 not-italic">
                  The Barzakh/Bardo Parallel:
                </span>{' '}
                Both Islamic barzakh and Tibetan bardo describe an ontologically real intermediate
                realm where consciousness navigates between death and transformation. Corbin&apos;s
                mundus imaginalis provides the philosophical bridge.
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
