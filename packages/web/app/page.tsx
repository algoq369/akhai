'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LiquidEther } from '@/components/ui/LiquidEther';
import { DecryptedTitle } from '@/components/ui/DecryptedText';

type MethodologyType = 'auto' | 'direct' | 'cot' | 'aot' | 'gtp';

const METHODOLOGIES = [
  {
    id: 'auto',
    label: 'Auto',
    description: 'Analyzes your query and selects the best methodology automatically',
    useCase: 'Unknown complexity, let AI decide'
  },
  {
    id: 'gtp',
    label: 'Flash',
    description: 'Broadcasts to 4 AI advisors in parallel',
    useCase: 'Comparisons, pros/cons analysis'
  },
  {
    id: 'direct',
    label: 'Direct',
    description: 'Single AI response for simple questions',
    useCase: 'Quick facts, definitions'
  },
  {
    id: 'cot',
    label: 'Chain',
    description: 'Step-by-step reasoning',
    useCase: 'Math problems, logical puzzles'
  },
  {
    id: 'aot',
    label: 'Atom',
    description: 'Decomposes complex queries',
    useCase: 'Complex research, deep analysis'
  },
] as const;

export default function HomePage() {
  const [query, setQuery] = useState('');
  const [methodology, setMethodology] = useState<MethodologyType>('auto');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Check for methodology in URL params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const methodologyParam = params.get('methodology');
    if (methodologyParam && ['auto', 'direct', 'cot', 'aot', 'gtp'].includes(methodologyParam)) {
      setMethodology(methodologyParam as MethodologyType);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || loading) return;

    setLoading(true);
    try {
      const res = await fetch('/api/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, methodology }),
      });

      if (!res.ok) throw new Error('Failed to start query');

      const data = await res.json();
      router.push(`/query/${data.queryId}`);
    } catch (error) {
      console.error('Query failed:', error);
      alert('Failed to start query. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRunAll = async () => {
    if (!query.trim() || loading) return;

    setLoading(true);
    try {
      const res = await fetch('/api/query-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });

      if (!res.ok) throw new Error('Failed to start comparison');

      const data = await res.json();
      const queriesParam = encodeURIComponent(JSON.stringify(data));
      router.push(`/compare/${data.comparisonId}?queries=${queriesParam}`);
    } catch (error) {
      console.error('Comparison failed:', error);
      alert('Failed to start comparison. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <LiquidEther />
      <main className="min-h-screen pt-16 flex flex-col items-center justify-center px-4 relative">
        {/* Hero Section */}
        <div className="text-center mb-12 max-w-4xl">
          <DecryptedTitle
            text="AkhAI"
            className="text-5xl md:text-7xl font-bold text-white tracking-tight mb-4"
          />
          <p className="text-base md:text-lg text-gray-400 font-light mb-2">
            Multi-AI Consensus Research Engine
          </p>
          <p className="text-sm text-gray-500 font-light">
            Powered by Anthropic · DeepSeek · Grok · Mistral
          </p>
        </div>

        {/* Main Search Form */}
        <form onSubmit={handleSubmit} className="w-full max-w-4xl mx-auto space-y-6">
          {/* Search Input with Glass Morphism */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-white/10 rounded-2xl blur-xl"></div>
            <div className="relative bg-gray-900/80 backdrop-blur-xl border border-gray-800 rounded-2xl p-6 shadow-2xl">
              <div className="flex gap-3">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Ask anything..."
                    className="w-full px-6 py-4 text-base text-white bg-white/5 border border-gray-700 rounded-xl focus:outline-none focus:border-white/30 focus:bg-white/10 placeholder-gray-500 transition-all"
                    disabled={loading}
                  />
                  {query && (
                    <button
                      type="button"
                      onClick={() => setQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={loading || !query.trim()}
                  className="px-10 py-4 text-sm font-bold text-black bg-white rounded-xl hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl hover:scale-105 active:scale-95"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="animate-spin h-4 w-4 border-2 border-black border-t-transparent rounded-full"></span>
                      Searching
                    </span>
                  ) : (
                    'Search'
                  )}
                </button>
              </div>

              {/* Compare All Button */}
              <button
                type="button"
                onClick={handleRunAll}
                disabled={loading || !query.trim()}
                className="mt-4 w-full px-4 py-3 text-sm font-medium text-white bg-white/5 border border-gray-700 rounded-xl hover:bg-white/10 hover:border-gray-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  Compare All Methodologies
                </span>
              </button>
            </div>
          </div>

          {/* Methodology Selector with Cards */}
          <div className="space-y-4">
            <div className="text-sm font-medium text-gray-400 text-center">
              Choose Reasoning Methodology
            </div>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              {METHODOLOGIES.map((method) => {
                const isSelected = methodology === method.id;
                return (
                  <button
                    key={method.id}
                    type="button"
                    onClick={() => setMethodology(method.id as MethodologyType)}
                    className={`group relative p-4 rounded-xl border transition-all ${
                      isSelected
                        ? 'bg-white/10 border-white/30 shadow-lg scale-105'
                        : 'bg-gray-900/50 border-gray-800 hover:border-gray-700 hover:bg-gray-800/50'
                    }`}
                  >
                    <div className="text-center">
                      <p className={`text-sm font-bold mb-1 ${isSelected ? 'text-white' : 'text-gray-400 group-hover:text-gray-300'}`}>
                        {method.label}
                      </p>
                      <p className={`text-xs ${isSelected ? 'text-gray-300' : 'text-gray-600'}`}>
                        {method.description}
                      </p>
                    </div>
                    {isSelected && (
                      <div className="absolute top-2 right-2">
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
            {methodology !== 'auto' && (
              <div className="text-center">
                <p className="inline-block px-4 py-2 text-xs text-gray-400 bg-gray-900/50 border border-gray-800 rounded-full">
                  Use Case: {METHODOLOGIES.find(m => m.id === methodology)?.useCase}
                </p>
              </div>
            )}
          </div>
        </form>

        {/* Quick Links */}
        <div className="mt-12 flex items-center gap-6 text-sm">
          <a
            href="/explore"
            className="flex items-center gap-2 text-gray-500 hover:text-gray-300 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Learn More</span>
          </a>
          <a
            href="/dashboard"
            className="flex items-center gap-2 text-gray-500 hover:text-gray-300 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span>Dashboard</span>
          </a>
          <a
            href="/profile"
            className="flex items-center gap-2 text-gray-500 hover:text-gray-300 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span>Profile</span>
          </a>
        </div>
      </main>
    </>
  );
}
