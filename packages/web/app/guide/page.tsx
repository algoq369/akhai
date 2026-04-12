'use client';

import { useState, useCallback } from 'react';
import type { LexiconTerm } from '@/lib/esoteric/types';
import lexiconRaw from '@/lib/esoteric/data/lexicon.json';

const terms = lexiconRaw.terms as LexiconTerm[];

const categories = [
  { id: 'all', label: 'All' },
  { id: 'celestial', label: 'Celestial', color: '#7F77DD' },
  { id: 'sociopolitical', label: 'Social', color: '#1D9E75' },
  { id: 'economic', label: 'Economic', color: '#BA7517' },
  { id: 'generational', label: 'Generational', color: '#D85A30' },
  { id: 'geopolitical', label: 'Geopolitical', color: '#378ADD' },
  { id: 'meta', label: 'Wisdom', color: '#888780' },
];

const categoryColors: Record<string, string> = {
  celestial: '#7F77DD',
  sociopolitical: '#1D9E75',
  economic: '#BA7517',
  generational: '#D85A30',
  geopolitical: '#378ADD',
  meta: '#888780',
};

export default function GuidePage() {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const toggleExpand = useCallback((id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleRelatedClick = useCallback((relatedId: string) => {
    setSearch(relatedId);
    setActiveCategory('all');
    setExpanded((prev) => new Set(prev).add(relatedId));
  }, []);

  const filtered = terms.filter((t) => {
    const matchesCategory = activeCategory === 'all' || t.category === activeCategory;
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      t.id.includes(q) ||
      t.name.toLowerCase().includes(q) ||
      t.plain.toLowerCase().includes(q) ||
      t.secularName.toLowerCase().includes(q);
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 font-mono">
      <div className="mb-6">
        <h1 className="text-[18px] font-medium text-zinc-800 mb-1">
          Macro-cyclical analysis guide
        </h1>
        <p className="text-[13px] text-zinc-400 leading-relaxed">
          Every term used in the analysis layer, explained for someone encountering these ideas for
          the first time.
        </p>
      </div>

      {/* Color legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 mb-4">
        {categories.slice(1).map((c) => (
          <div key={c.id} className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: c.color }} />
            <span className="text-[9px] text-zinc-400 uppercase tracking-wider">{c.label}</span>
          </div>
        ))}
      </div>

      {/* Search */}
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search terms..."
        className="w-full text-[12px] font-mono px-3 py-2 mb-3 border border-zinc-200 rounded-md bg-white text-zinc-800 placeholder:text-zinc-300 focus:outline-none focus:border-zinc-400"
      />

      {/* Category tabs */}
      <div className="flex flex-wrap gap-1 mb-5">
        {categories.map((c) => (
          <button
            key={c.id}
            onClick={() => setActiveCategory(c.id)}
            className={`text-[10px] px-2.5 py-1 rounded-md border transition-colors ${
              activeCategory === c.id
                ? 'bg-zinc-100 border-zinc-300 text-zinc-800'
                : 'border-zinc-200 text-zinc-400 hover:text-zinc-600'
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Terms */}
      <div className="space-y-1.5">
        {filtered.map((term) => {
          const isExpanded = expanded.has(term.id);
          const color = categoryColors[term.category] ?? '#888780';
          return (
            <div key={term.id} className="border border-zinc-200 rounded-lg overflow-hidden">
              <button
                onClick={() => toggleExpand(term.id)}
                className="w-full flex items-center gap-2 px-3 py-2.5 text-left hover:bg-zinc-50 transition-colors"
              >
                <span className="text-[14px]" style={{ color }}>
                  {term.sigil}
                </span>
                <span className="text-[13px] font-medium text-zinc-700 flex-1">{term.name}</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-400">
                  {term.type}
                </span>
                <span className="text-[10px] text-zinc-300">
                  {isExpanded ? '\u25BE' : '\u25B8'}
                </span>
              </button>

              {isExpanded && (
                <div className="px-3 pb-3 border-t border-zinc-100">
                  <p className="text-[12px] text-zinc-600 leading-[1.7] mt-2.5 mb-3">
                    {term.plain}
                  </p>

                  <div className="text-[9px] uppercase tracking-wider text-zinc-400 mb-1">
                    Real-world example
                  </div>
                  <div className="bg-zinc-50 rounded-md px-2.5 py-2 mb-3">
                    <p className="text-[11px] text-zinc-500 leading-relaxed">{term.example}</p>
                  </div>

                  <div className="flex items-center gap-1 mb-2">
                    <span className="text-[9px] uppercase tracking-wider text-zinc-400">
                      Secular mode:
                    </span>
                    <span className="text-[11px] italic text-zinc-500">{term.secularName}</span>
                  </div>

                  {term.related.length > 0 && (
                    <div className="flex items-center gap-1 flex-wrap">
                      <span className="text-[9px] uppercase tracking-wider text-zinc-400">
                        Related:
                      </span>
                      {term.related.map((r) => (
                        <button
                          key={r}
                          onClick={() => handleRelatedClick(r)}
                          className="text-[10px] text-zinc-500 hover:text-zinc-700 border-b border-dotted border-zinc-300 transition-colors"
                        >
                          {r}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-[11px] text-zinc-400 text-center py-8">
          No terms match your search.
        </div>
      )}

      <div className="text-center mt-8 mb-4">
        <a
          href="/constellation"
          className="text-[10px] font-mono text-zinc-400 hover:text-zinc-600 transition-colors"
        >
          {'\u25CA'} back to constellation
        </a>
      </div>
    </div>
  );
}
