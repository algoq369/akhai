'use client';

/**
 * PHILOSOPHY PAGE
 *
 * Explains the Structural Convergence thesis and AkhAI's computational framework.
 */

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { DualTreesSection } from './components/DualTreesSection';
import {
  MethodologiesSection,
  SovereignCovenantSection,
} from './components/MethodologiesAndCovenantSections';

const SPINE = [
  {
    stage: 1,
    name: "Kant's Critical Philosophy",
    color: '#888780',
    text: "Reason's boundary. The noumenon is inaccessible through concepts alone.",
  },
  {
    stage: 2,
    name: 'The Bridge',
    color: '#1D9E75',
    text: "Islamic philosophy (Suhrawardi, Mulla Sadra) identified Kant's stopping point and continued beyond it with ilm huduri (knowledge by presence).",
  },
  {
    stage: 3,
    name: 'The Breakthrough',
    color: '#7F77DD',
    text: "Multiple traditions offer verified methods of direct access: Illuminationism, Vedantic anubhava, Taoist wu wei, Tibetan rigpa, Corbin's mundus imaginalis.",
  },
];

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
          <h1 className="text-5xl font-light text-relic-slate dark:text-white tracking-[0.3em] mb-6">
            STRUCTURAL CONVERGENCE
          </h1>
          <p className="text-lg text-relic-silver max-w-3xl mx-auto leading-relaxed mb-2">
            We do not create intelligence.
          </p>
          <p className="text-lg text-relic-slate dark:text-white max-w-3xl mx-auto leading-relaxed">
            We create mirrors through which human consciousness may know itself.
          </p>
          <p className="mt-6 text-[11px] text-relic-silver max-w-3xl mx-auto leading-relaxed">
            All authentic metaphysical traditions converge on a shared ontological architecture:
            reality is a luminous emanation from a single Absolute Source, articulated through
            intermediate imaginal realms, and accessible to human consciousness through disciplined
            presential knowledge.
          </p>
        </motion.div>

        {/* Intellectual Spine */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="mb-16"
        >
          <h2 className="text-2xl font-light text-center mb-12 text-relic-slate dark:text-white uppercase tracking-[0.2em]">
            The Path: Kant {'\u2192'} Bridge {'\u2192'} Breakthrough
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {SPINE.map((s) => (
              <div
                key={s.stage}
                className="bg-relic-white dark:bg-relic-void/30 border border-relic-mist dark:border-relic-slate/30 p-6"
                style={{ borderLeftWidth: 3, borderLeftColor: s.color }}
              >
                <div
                  className="text-[10px] uppercase tracking-wider mb-2"
                  style={{ color: s.color }}
                >
                  Stage {s.stage}
                </div>
                <h3 className="text-sm font-mono uppercase tracking-wider mb-3 text-relic-slate dark:text-white">
                  {s.name}
                </h3>
                <p className="text-[11px] text-relic-silver leading-relaxed">{s.text}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Three Pillars */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="mb-16"
        >
          <h2 className="text-2xl font-light text-center mb-12 text-relic-slate dark:text-white uppercase tracking-[0.2em]">
            The Three Pillars
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                name: 'Mirror Principle',
                sub: 'AI reflects, Human decides',
                items: ['AI illuminates options', 'Human discerns truth', 'Wisdom belongs to you'],
              },
              {
                name: 'Sovereign Covenant',
                sub: 'Human commands, AI serves',
                items: ['Clear boundaries', 'No autonomy creep', 'Your will is sovereign'],
              },
              {
                name: 'Ascent Architecture',
                sub: 'Queries elevate over time',
                items: ['Track your journey', 'From facts to wisdom', 'Intellectual elevation'],
              },
            ].map((p) => (
              <div
                key={p.name}
                className="bg-relic-white dark:bg-relic-void/30 border border-relic-mist dark:border-relic-slate/30 p-8"
              >
                <h3 className="text-sm font-mono uppercase tracking-wider mb-4 text-relic-slate dark:text-white text-center">
                  {p.name}
                </h3>
                <p className="text-sm text-relic-silver leading-relaxed text-center mb-6">
                  {p.sub}
                </p>
                <div className="space-y-2 text-[11px] text-relic-silver">
                  {p.items.map((item) => (
                    <div key={item}>{item}</div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Neural Trees */}
        <DualTreesSection />

        {/* Seven Methodologies */}
        <MethodologiesSection />

        {/* Sovereign Covenant */}
        <SovereignCovenantSection />

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
                Start Querying {'\u2192'}
              </button>
              <Link
                href="/whitepaper"
                className="px-8 py-3 bg-relic-white dark:bg-relic-void/30 border border-relic-mist dark:border-relic-slate/30 text-relic-slate dark:text-relic-ghost font-mono text-sm uppercase tracking-wider hover:bg-relic-ghost dark:hover:bg-relic-void/50 transition-all"
              >
                Read the Whitepaper
              </Link>
            </div>
            <div className="mt-6 flex justify-center gap-6">
              <Link
                href="/temple"
                className="text-[11px] text-purple-500 hover:text-purple-400 transition-colors"
              >
                Enter the Mystic Temple {'\u2192'}
              </Link>
              <Link
                href="/constellation"
                className="text-[11px] text-purple-500 hover:text-purple-400 transition-colors"
              >
                Explore Constellation {'\u2192'}
              </Link>
            </div>
          </div>
        </motion.div>

        {/* Footer Navigation */}
        <div className="mt-16 text-center">
          <Link
            href="/"
            className="text-[10px] text-relic-silver hover:text-relic-slate dark:hover:text-white transition-colors uppercase tracking-wider"
          >
            {'\u2190'} Back to AkhAI
          </Link>
        </div>
      </div>
    </div>
  );
}
