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
        <div className="text-center mb-8 max-w-4xl">
          <DecryptedTitle
            text="AkhAI"
            className="text-4xl md:text-5xl font-bold text-white tracking-tight mb-3"
          />
          <p className="text-sm md:text-base text-gray-500 font-light mb-4">
            Multi-AI Consensus Research Engine
          </p>
          <a
            href="/explore"
            className="inline-flex items-center gap-2 text-xs uppercase tracking-wider text-gray-500 hover:text-gray-300 transition-colors"
          >
            <span>Explore Methodologies</span>
          </a>
        </div>

        <form onSubmit={handleSubmit} className="w-full max-w-3xl mx-auto space-y-6">
          {/* Search Input */}
          <div className="space-y-3">
            <div className="flex gap-2">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ask anything..."
                className="flex-1 px-6 py-4 text-base text-white bg-white/5 border border-gray-800 rounded-lg focus:outline-none focus:border-gray-600 focus:bg-white/10 placeholder-gray-600 transition-all"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading || !query.trim()}
                className="px-8 py-4 text-sm font-semibold text-black bg-white rounded-lg hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                {loading ? 'Searching...' : 'Search'}
              </button>
            </div>

            {/* Run All Button */}
            <button
              type="button"
              onClick={handleRunAll}
              disabled={loading || !query.trim()}
              className="w-full px-3 py-2 text-xs uppercase tracking-wider text-gray-400 bg-gray-900 border border-gray-800 rounded-lg hover:bg-gray-800 hover:border-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              Compare All Methodologies
            </button>
          </div>

          {/* Methodology Selector */}
          <div className="space-y-3">
            <div className="text-xs uppercase tracking-wider text-gray-600 text-center">
              Reasoning Methodology
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              {METHODOLOGIES.map((method) => (
                <button
                  key={method.id}
                  type="button"
                  onClick={() => setMethodology(method.id as MethodologyType)}
                  className={`px-3 py-2 text-xs rounded-lg border transition-all ${
                    methodology === method.id
                      ? 'bg-gray-800 border-gray-600 text-white'
                      : 'bg-gray-900/50 border-gray-800 text-gray-500 hover:border-gray-700 hover:text-gray-400'
                  }`}
                >
                  {method.label}
                </button>
              ))}
            </div>
            {methodology !== 'auto' && (
              <div className="text-center text-xs text-gray-600">
                {METHODOLOGIES.find(m => m.id === methodology)?.useCase}
              </div>
            )}
          </div>
        </form>

        <p className="mt-16 text-xs text-gray-600 uppercase tracking-wider">
          Powered by Anthropic · DeepSeek · Grok · Mistral
        </p>
      </main>
    </>
  );
}
