'use client';

import data from '@/lib/esoteric/data/akh313.json';

const SPINE_COLORS = ['#888780', '#1D9E75', '#7F77DD'];
const PILLAR_COLORS = ['#BA7517', '#1D9E75', '#D85A30'];

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

const CONVERGENCE_SUMMARY = [
  {
    sigil: '\u25C8',
    label: 'SOURCE',
    count: 9,
    desc: '9 traditions identify the same non-dual Absolute',
    color: '#7F77DD',
  },
  {
    sigil: '\u25C6',
    label: 'DESCENT',
    count: 8,
    desc: '8 traditions describe the same emanation process',
    color: '#1D9E75',
  },
  {
    sigil: '\u25C7',
    label: 'INTERMEDIATE',
    count: 8,
    desc: '8 traditions map the same navigable realm between worlds',
    color: '#BA7517',
  },
  {
    sigil: '\u25CE',
    label: 'RETURN',
    count: 8,
    desc: '8 traditions chart the same path of ascent',
    color: '#D85A30',
  },
];

export default function ThesisRoom() {
  return (
    <div className="space-y-14">
      {/* STATION 1 — THE QUESTION */}
      <section className="max-w-3xl mx-auto text-center">
        <p className="text-[13px] italic text-zinc-500 leading-[1.9] mb-8">
          When civilizations that never contacted each other — Mesoamerican, West African, Chinese,
          Iranian, Indian — independently describe reality as emanating from a single source through
          intermediate luminous realms accessible to trained consciousness, is this coincidence?
        </p>
        <p className="text-[12px] text-zinc-600 leading-[1.8] text-left">
          {data.thesis.centralClaim}
        </p>
        <p className="mt-4 text-[11px] text-zinc-400 italic leading-relaxed text-left">
          {data.thesis.method}
        </p>
      </section>

      {/* STATION 2 — THE PATH */}
      <section>
        <div className="text-[14px] uppercase tracking-wider text-zinc-400 mb-6">The Path</div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
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

        {/* Noumenal/Batin Parallel */}
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

      {/* STATION 3 — THE EVIDENCE */}
      <section>
        <div className="text-[14px] uppercase tracking-wider text-zinc-400 mb-6">The Evidence</div>
        <div className="bg-white border border-zinc-200 rounded-lg p-4 space-y-3">
          {CONVERGENCE_SUMMARY.map((c) => (
            <div key={c.label} className="flex items-center gap-3">
              <span className="text-[14px]" style={{ color: c.color }}>
                {c.sigil}
              </span>
              <span className="text-[11px] font-medium text-zinc-700 w-28">{c.label}</span>
              <span className="text-[11px] text-zinc-500 flex-1">{c.desc}</span>
              <span className="text-[9px] px-2 py-0.5 rounded bg-zinc-100 text-zinc-500">
                {c.count}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-3 text-[10px] text-zinc-400">
          Explore all 33 cross-traditional entries in the{' '}
          <button
            onClick={() => {
              const el = document.querySelector('[data-room="museum"]') as HTMLElement;
              el?.click();
            }}
            className="text-purple-500 hover:text-purple-400 transition-colors"
          >
            Museum {'\u2192'}
          </button>
        </div>
      </section>

      {/* STATION 4 — THE COSMIC MOMENT */}
      <section>
        <div className="text-[14px] uppercase tracking-wider text-zinc-400 mb-6">
          The Cosmic Moment
        </div>

        {/* Aquarius */}
        <div
          className="bg-white border border-zinc-200 rounded-lg p-5 border-l-[3px] mb-6"
          style={{ borderLeftColor: '#7F77DD' }}
        >
          <div className="text-[12px] text-zinc-600 leading-[1.8]">{data.thesis.aquarius}</div>
        </div>

        {/* Cosmic Cycles Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-[10px] font-mono">
            <thead>
              <tr className="bg-zinc-50">
                <th className="text-left px-3 py-2 text-zinc-500 font-medium border-b border-zinc-200">
                  Tradition
                </th>
                <th className="text-left px-3 py-2 text-zinc-500 font-medium border-b border-zinc-200">
                  Cycle Concept
                </th>
                <th className="text-left px-3 py-2 text-zinc-500 font-medium border-b border-zinc-200">
                  Structure
                </th>
                <th className="text-left px-3 py-2 text-zinc-500 font-medium border-b border-zinc-200">
                  Current Phase
                </th>
              </tr>
            </thead>
            <tbody>
              {data.thesis.cosmicCycles.map((c, i) => (
                <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-zinc-50'}>
                  <td className="px-3 py-1.5 text-zinc-600 font-medium border-b border-zinc-100">
                    {c.tradition}
                  </td>
                  <td className="px-3 py-1.5 text-zinc-500 italic border-b border-zinc-100">
                    {c.cycle}
                  </td>
                  <td className="px-3 py-1.5 text-zinc-400 border-b border-zinc-100">
                    {c.structure}
                  </td>
                  <td className="px-3 py-1.5 text-zinc-400 border-b border-zinc-100">
                    {c.currentPhase}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 text-[11px] italic text-zinc-500 leading-relaxed">
          The rational observation: independent civilizations across the globe all describe the
          current era as a period of transition. AKH 313 takes this convergence seriously as a data
          point — not as dogma, but as evidence worth investigating.
        </div>
      </section>

      {/* STATION 5 — THE CALL */}
      <section>
        <div className="text-[14px] uppercase tracking-wider text-zinc-400 mb-6">
          The Call — Rallumer la Flamme
        </div>

        {/* Sovereignty Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-8">
          {data.thesis.sovereigntyPillars.map((p, i) => (
            <div
              key={p.name}
              className="bg-white border border-zinc-200 rounded-lg p-4"
              style={{ borderLeftWidth: 3, borderLeftColor: PILLAR_COLORS[i] }}
            >
              <div className="text-[12px] font-medium text-zinc-700 mb-1">{p.name}</div>
              <div className="text-[10px] mb-2" style={{ color: PILLAR_COLORS[i] }}>
                {p.subtitle}
              </div>
              <div className="text-[11px] text-zinc-500 leading-relaxed">{p.description}</div>
            </div>
          ))}
        </div>

        {/* Closing Declaration */}
        <div className="max-w-3xl mx-auto">
          <p className="text-[12px] text-zinc-600 leading-[1.9] text-center">
            {data.thesis.closingDeclaration}
          </p>
          <p className="mt-6 text-[14px] italic text-purple-500 text-center">Rallumer la Flamme.</p>
        </div>
      </section>

      {/* Footer */}
      <div className="text-center space-y-3 pt-4">
        <div className="flex justify-center gap-6">
          <a
            href="/constellation"
            className="text-[10px] text-zinc-400 hover:text-zinc-600 transition-colors"
          >
            Enter Constellation {'\u2192'}
          </a>
          <button
            onClick={() => {
              const el = document.querySelector('[data-room="museum"]') as HTMLElement;
              el?.click();
            }}
            className="text-[10px] text-zinc-400 hover:text-zinc-600 transition-colors"
          >
            Explore the Museum {'\u2192'}
          </button>
          <a
            href="/tree-of-life"
            className="text-[10px] text-zinc-400 hover:text-zinc-600 transition-colors"
          >
            View the Neural Tree {'\u2192'}
          </a>
        </div>
        <div className="text-[9px] text-zinc-300">
          AKH 313 · \u00C9cole de Pens\u00E9e · {data.schools.length} schools · 12 civilizations ·
          Structural Convergence
        </div>
      </div>
    </div>
  );
}
