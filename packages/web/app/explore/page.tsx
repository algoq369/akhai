'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { MagicBento, BentoCard, MethodologyAnimation } from '@/components/ui/MagicBento';
import { LiquidEther } from '@/components/ui/LiquidEther';
import { DecryptedTitle } from '@/components/ui/DecryptedText';

export default function ExplorePage() {
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    // Fetch stats from API
    fetch('/api/stats')
      .then(res => res.json())
      .then(data => setStats(data))
      .catch(err => console.error('Failed to fetch stats:', err));
  }, []);

  const handleMethodologyClick = (methodology: string) => {
    // Navigate to homepage with methodology pre-selected
    router.push(`/?methodology=${methodology}`);
  };

  const cards: BentoCard[] = [
    // LARGE CARD: Flash (GTP)
    {
      id: 'gtp',
      title: 'Flash',
      description: 'Parallel Multi-AI Consensus - Broadcasts to 4 AI advisors simultaneously, merges insights in real-time',
      size: 'large',
      gradient: 'from-gray-800 via-gray-700 to-gray-600',
      badge: '~25s',
      animation: <MethodologyAnimation type="flash" />,
      stats: [
        { label: 'Speed', value: 'Fast' },
        { label: 'Accuracy', value: 'High' },
        { label: 'Use Case', value: 'Comparisons' },
        { label: 'Advisors', value: '4 Parallel' },
      ],
      onClick: () => handleMethodologyClick('gtp'),
    },

    // MEDIUM CARD: Auto
    {
      id: 'auto',
      title: 'Auto',
      description: 'Smart Selection - Analyzes query complexity and automatically picks the optimal methodology',
      size: 'medium',
      gradient: 'from-gray-700 via-gray-600 to-gray-500',
      badge: 'Adaptive',
      stats: [
        { label: 'Mode', value: 'Smart' },
        { label: 'Precision', value: '95%' },
      ],
      onClick: () => handleMethodologyClick('auto'),
    },

    // MEDIUM CARD: Direct
    {
      id: 'direct',
      title: 'Direct',
      description: 'Instant Answers - Single AI response for simple factual questions and quick lookups',
      size: 'medium',
      gradient: 'from-gray-600 via-gray-700 to-gray-800',
      badge: '~5s',
      animation: <MethodologyAnimation type="direct" />,
      stats: [
        { label: 'Speed', value: 'Fastest' },
        { label: 'Best For', value: 'Facts' },
      ],
      onClick: () => handleMethodologyClick('direct'),
    },

    // SMALL CARD: Chain of Thought
    {
      id: 'cot',
      title: 'Chain of Thought',
      description: 'Step-by-Step Reasoning - Analyzes problem → reasons through steps → synthesizes final answer',
      size: 'small',
      gradient: 'from-gray-800 via-gray-700 to-gray-600',
      badge: '~30s',
      animation: <MethodologyAnimation type="cot" />,
      onClick: () => handleMethodologyClick('cot'),
    },

    // SMALL CARD: Atom of Thoughts
    {
      id: 'aot',
      title: 'Atom of Thoughts',
      description: 'Decompose & Solve - Breaks complex queries into atomic sub-questions, solves each, then contracts back',
      size: 'small',
      gradient: 'from-gray-700 via-gray-600 to-gray-500',
      badge: '~60s',
      animation: <MethodologyAnimation type="aot" />,
      onClick: () => handleMethodologyClick('aot'),
    },

    // STATS CARDS
    {
      id: 'total-queries',
      title: 'Total Queries',
      description: `${stats?.queriesToday || 0} queries processed today`,
      size: 'small',
      gradient: 'from-gray-900 via-gray-800 to-gray-700',
      stats: [
        { label: 'Today', value: String(stats?.queriesToday || 0) },
        { label: 'Month', value: String(stats?.queriesThisMonth || 0) },
      ],
      onClick: () => router.push('/dashboard'),
    },

    {
      id: 'performance',
      title: 'Performance',
      description: `Average response time: ${stats?.avgResponseTime || 0}s`,
      size: 'small',
      gradient: 'from-gray-800 via-gray-700 to-gray-600',
      stats: [
        { label: 'Avg Time', value: `${stats?.avgResponseTime || 0}s` },
        { label: 'Success', value: '100%' },
      ],
      onClick: () => router.push('/dashboard'),
    },

    {
      id: 'cost-savings',
      title: 'Cost Efficiency',
      description: `Total spend: $${stats?.totalCost?.toFixed(2) || '0.00'}`,
      size: 'small',
      gradient: 'from-gray-700 via-gray-800 to-gray-900',
      stats: [
        { label: 'Total Cost', value: `$${stats?.totalCost?.toFixed(2) || '0.00'}` },
        { label: 'Tokens', value: stats?.totalTokens ? (stats.totalTokens / 1000).toFixed(0) + 'K' : '0' },
      ],
      onClick: () => router.push('/dashboard'),
    },
  ];

  return (
    <>
      <LiquidEther />
      <div className="min-h-screen pt-16 relative">
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8 text-center">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-gray-400 hover:text-white text-xs mb-4 transition-colors"
            >
              <span>←</span>
              <span>Back to Home</span>
            </Link>

            <DecryptedTitle
              text="Explore AkhAI Methodologies"
              className="text-3xl md:text-4xl font-bold text-white mb-3"
              speed={25}
            />

            <p className="text-gray-500 text-sm max-w-2xl mx-auto font-light">
              Discover how different AI reasoning approaches solve your questions
            </p>
          </div>

          {/* Magic Bento Grid */}
          <MagicBento cards={cards} className="mb-8" />

          {/* Footer info */}
          <div className="mt-12 text-center">
            <div className="inline-flex items-center gap-4 px-6 py-3 bg-black/50 backdrop-blur-sm rounded-full border border-gray-800 shadow-sm">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">Powered by</span>
                <div className="flex items-center gap-1">
                  <span className="text-xs font-medium text-gray-400">Anthropic</span>
                  <span className="text-gray-600">•</span>
                  <span className="text-xs font-medium text-gray-400">DeepSeek</span>
                  <span className="text-gray-600">•</span>
                  <span className="text-xs font-medium text-gray-400">Grok</span>
                  <span className="text-gray-600">•</span>
                  <span className="text-xs font-medium text-gray-400">Mistral</span>
                </div>
              </div>
            </div>

            <p className="text-xs text-gray-600 mt-4 uppercase tracking-wider">
              Click any methodology card to start a query with that approach
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
