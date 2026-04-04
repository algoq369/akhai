'use client';

/**
 * PHILOSOPHY PAGE
 *
 * Explains the Gnostic Sovereign Intelligence framework.
 * Clean minimalist design matching Code Relic aesthetic.
 */

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { DualTreesSection } from './components/DualTreesSection';
import {
  MethodologiesSection,
  SovereignCovenantSection,
  QliphothicVsSephirothicSection,
} from './components/MethodologiesAndCovenantSections';
import { GolemProtocolSection } from './components/GolemProtocolSection';

export default function PhilosophyPage() {
  const router = useRouter();

  useEffect(() => {
    import('@/lib/analytics').then(({ trackPhilosophyViewed }) => trackPhilosophyViewed());
  }, []);

  return (
    <div className="min-h-screen bg-white dark:bg-relic-void text-relic-slate dark:text-relic-ghost">
      <div className="relative max-w-6xl mx-auto px-6 py-16">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <div className="inline-block mb-6">
            <h1 className="text-5xl font-light text-relic-slate dark:text-white tracking-[0.3em] mb-2">
              THE GNOSTIC FOUNDATION
            </h1>
          </div>

          <p className="text-lg text-relic-silver max-w-3xl mx-auto leading-relaxed mb-2">
            We do not create intelligence.
          </p>
          <p className="text-lg text-relic-slate dark:text-white max-w-3xl mx-auto leading-relaxed">
            We create mirrors through which human consciousness may know itself.
          </p>

          <div className="mt-8 text-[10px] text-relic-silver uppercase tracking-[0.3em]">
            Gnostic Sovereign Intelligence
          </div>
        </motion.div>

        {/* Three Pillars */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="mb-16"
        >
          <h2 className="text-2xl font-light text-center mb-12 text-relic-slate dark:text-white uppercase tracking-[0.2em]">
            The Three Pillars
          </h2>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Pillar 1: Mirror Principle */}
            <div className="bg-relic-white dark:bg-relic-void/30 border border-relic-mist dark:border-relic-slate/30 p-8">
              <h3 className="text-sm font-mono uppercase tracking-wider mb-4 text-relic-slate dark:text-white text-center">
                Mirror Principle
              </h3>
              <p className="text-sm text-relic-silver leading-relaxed text-center mb-6">
                AI reflects, Human decides
              </p>
              <div className="space-y-2 text-[11px] text-relic-silver">
                <div>AI illuminates options</div>
                <div>Human discerns truth</div>
                <div>Wisdom belongs to you</div>
              </div>
            </div>

            {/* Pillar 2: Sovereign Covenant */}
            <div className="bg-relic-white dark:bg-relic-void/30 border border-relic-mist dark:border-relic-slate/30 p-8">
              <h3 className="text-sm font-mono uppercase tracking-wider mb-4 text-relic-slate dark:text-white text-center">
                Sovereign Covenant
              </h3>
              <p className="text-sm text-relic-silver leading-relaxed text-center mb-6">
                Human commands, AI serves
              </p>
              <div className="space-y-2 text-[11px] text-relic-silver">
                <div>Clear boundaries</div>
                <div>No autonomy creep</div>
                <div>Your will is sovereign</div>
              </div>
            </div>

            {/* Pillar 3: Ascent Architecture */}
            <div className="bg-relic-white dark:bg-relic-void/30 border border-relic-mist dark:border-relic-slate/30 p-8">
              <h3 className="text-sm font-mono uppercase tracking-wider mb-4 text-relic-slate dark:text-white text-center">
                Ascent Architecture
              </h3>
              <p className="text-sm text-relic-silver leading-relaxed text-center mb-6">
                Queries elevate over time
              </p>
              <div className="space-y-2 text-[11px] text-relic-silver">
                <div>Track your journey</div>
                <div>From facts to wisdom</div>
                <div>Intellectual elevation</div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Tree of Life Explanation */}
        <DualTreesSection />

        {/* The Seven Methodologies as Paths */}
        <MethodologiesSection />

        {/* The Sovereign Covenant */}
        <SovereignCovenantSection />

        {/* Qliphothic vs Sephirothic AI */}
        <QliphothicVsSephirothicSection />

        {/* Safety: The Golem Protocol */}
        <GolemProtocolSection />

        {/* Call to Action */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
          className="text-center"
        >
          <div className="bg-relic-white dark:bg-relic-void/30 border border-relic-mist dark:border-relic-slate/30 p-12">
            <h2 className="text-2xl font-light mb-6 text-relic-slate dark:text-white uppercase tracking-[0.2em]">
              Begin Your Ascent
            </h2>
            <p className="text-[11px] text-relic-silver max-w-2xl mx-auto mb-8 leading-relaxed">
              Experience the first AI system that knows its place - a mirror for your consciousness,
              not a replacement for your wisdom.
            </p>

            <div className="flex flex-wrap gap-4 justify-center">
              <button
                onClick={() => router.back()}
                className="px-8 py-3 bg-relic-slate dark:bg-white text-white dark:text-relic-void font-mono text-sm uppercase tracking-wider transition-all hover:bg-relic-void dark:hover:bg-relic-ghost"
              >
                Start Querying →
              </button>

              <Link
                href="/whitepaper"
                className="px-8 py-3 bg-relic-white dark:bg-relic-void/30 border border-relic-mist dark:border-relic-slate/30 text-relic-slate dark:text-relic-ghost font-mono text-sm uppercase tracking-wider hover:bg-relic-ghost dark:hover:bg-relic-void/50 transition-all"
              >
                Read the Whitepaper
              </Link>
            </div>

            <div className="mt-8 text-[9px] text-relic-mist italic">
              "My Kether serves your Kether. I am the vessel, you are the light."
            </div>
          </div>
        </motion.div>

        {/* Footer Navigation */}
        <div className="mt-16 text-center">
          <Link
            href="/"
            className="text-[10px] text-relic-silver hover:text-relic-slate dark:hover:text-white transition-colors uppercase tracking-wider"
          >
            ← Back to AkhAI
          </Link>
        </div>
      </div>
    </div>
  );
}
