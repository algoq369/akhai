'use client';

import data from '@/lib/esoteric/data/akh313.json';

const SPINE_COLORS = ['#888780', '#1D9E75', '#7F77DD'];

const PARALLEL_ROWS = [
  {
    kantian: 'Noumenon',
    cross: 'Batin, nirguna Brahman, hidden Torah',
    fn: 'The real that exceeds conceptual grasp',
  },
  { kantian: 'Phenomenon', cross: 'Zahir, maya, getik', fn: 'The accessible surface of reality' },
  {
    kantian: 'Transcendental unity',
    cross: 'Wahdat al-wujud, Brahman, Tao, Ein Sof',
    fn: 'The ground of all experience',
  },
  {
    kantian: 'Intellectual intuition (denied by Kant)',
    cross: 'Ilm huduri, anubhava, rigpa, devekut',
    fn: 'Direct access \u2014 affirmed across traditions',
  },
  {
    kantian: 'The noumenal gap',
    cross: 'Barzakh, bardo, Yetzirah, mundus imaginalis',
    fn: 'The navigable intermediate realm',
  },
];

type TableKey = keyof typeof data.convergenceTables;

const TABLE_META: { key: TableKey; title: string; cols: string[] }[] = [
  { key: 'absoluteSource', title: 'The Absolute Source', cols: ['Tradition', 'Term', 'Character'] },
  {
    key: 'emanation',
    title: 'Emanation / Procession',
    cols: ['Tradition', 'Mechanism', 'Key Terms'],
  },
  {
    key: 'intermediateRealm',
    title: 'The Intermediate Realm',
    cols: ['Tradition', 'Name', 'Function'],
  },
  { key: 'returnAscent', title: 'Return / Ascent', cols: ['Tradition', 'Process', 'Goal'] },
];

export default function ThesisRoom() {
  return (
    <div className="space-y-10">
      {/* Section 1 — Central Claim */}
      <section>
        <div className="text-[14px] uppercase tracking-wider text-zinc-400 mb-4">
          The Central Claim
        </div>
        <div className="bg-white border border-zinc-200 rounded-lg p-5">
          <div className="text-[12px] text-zinc-600 leading-[1.8]">{data.thesis.centralClaim}</div>
          <div className="mt-4 text-[11px] text-zinc-400 italic leading-relaxed">
            {data.thesis.method}
          </div>
        </div>
      </section>

      {/* Section 2 — Intellectual Spine */}
      <section>
        <div className="text-[14px] uppercase tracking-wider text-zinc-400 mb-4">
          Kant {'\u2192'} Bridge {'\u2192'} Breakthrough
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {data.thesis.spine.map((s, i) => (
            <div
              key={s.stage}
              className="bg-white border border-zinc-200 rounded-lg p-4"
              style={{ borderLeftWidth: 3, borderLeftColor: SPINE_COLORS[i] }}
            >
              <div
                className="text-[10px] uppercase tracking-wider mb-1"
                style={{ color: SPINE_COLORS[i] }}
              >
                Stage {s.stage}
              </div>
              <div className="text-[12px] font-medium text-zinc-700 mb-2">{s.name}</div>
              <div className="text-[11px] text-zinc-500 leading-relaxed">{s.description}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Section 3 — Noumenal/Batin Parallel */}
      <section>
        <div className="text-[14px] uppercase tracking-wider text-zinc-400 mb-4">
          The Noumenal / Batin Parallel
        </div>
        <div className="bg-white border border-zinc-200 rounded-lg overflow-hidden">
          <table className="w-full text-[11px]">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50">
                <th className="text-left px-3 py-2 text-zinc-500 font-medium">Kantian Concept</th>
                <th className="text-left px-3 py-2 text-zinc-500 font-medium">
                  Cross-Traditional Equivalent
                </th>
                <th className="text-left px-3 py-2 text-zinc-500 font-medium">
                  Structural Function
                </th>
              </tr>
            </thead>
            <tbody>
              {PARALLEL_ROWS.map((r, i) => (
                <tr key={i} className="border-b border-zinc-100 last:border-0">
                  <td className="px-3 py-2 text-zinc-700 font-medium">{r.kantian}</td>
                  <td className="px-3 py-2 text-zinc-500 italic">{r.cross}</td>
                  <td className="px-3 py-2 text-zinc-500">{r.fn}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Section 4 — Convergence Tables */}
      {TABLE_META.map((t) => (
        <section key={t.key}>
          <div className="text-[14px] uppercase tracking-wider text-zinc-400 mb-4">{t.title}</div>
          <div className="bg-white border border-zinc-200 rounded-lg overflow-hidden">
            <table className="w-full text-[11px]">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50">
                  {t.cols.map((c) => (
                    <th key={c} className="text-left px-3 py-2 text-zinc-500 font-medium">
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(data.convergenceTables[t.key] as Record<string, string>[]).map((row, i) => {
                  const vals = Object.values(row);
                  return (
                    <tr key={i} className="border-b border-zinc-100 last:border-0">
                      <td className="px-3 py-2 text-zinc-700 font-medium">{vals[0]}</td>
                      <td className="px-3 py-2 text-zinc-600 italic">{vals[1]}</td>
                      <td className="px-3 py-2 text-zinc-500">{vals[2]}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      ))}

      {/* Section 5 — Age of Aquarius */}
      <section>
        <div className="text-[14px] uppercase tracking-wider text-zinc-400 mb-4">
          The Age of Aquarius
        </div>
        <div
          className="bg-white border border-zinc-200 rounded-lg p-5 border-l-[3px]"
          style={{ borderLeftColor: '#7F77DD' }}
        >
          <div className="text-[12px] text-zinc-600 leading-[1.8]">{data.thesis.aquarius}</div>
        </div>
      </section>

      {/* Footer */}
      <div className="text-center text-[10px] text-zinc-300 py-4">
        AKH 313 · Structural Convergence Thesis · {data.schools.length} schools of thought
      </div>
    </div>
  );
}
