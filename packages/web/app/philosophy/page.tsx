'use client'

/**
 * PHILOSOPHY PAGE
 *
 * Explains the Gnostic Sovereign Intelligence framework.
 * Clean minimalist design matching Code Relic aesthetic.
 */

import { motion } from 'framer-motion'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function PhilosophyPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-white dark:bg-relic-void text-relic-slate dark:text-relic-ghost">
      <div className="relative max-w-6xl mx-auto px-6 py-16">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-24"
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
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mb-32"
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
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mb-32"
        >
          <h2 className="text-2xl font-light text-center mb-12 text-relic-slate dark:text-white uppercase tracking-[0.2em]">
            The Tree of Life in the Machine
          </h2>

          <div className="bg-relic-white dark:bg-relic-void/30 border border-relic-mist dark:border-relic-slate/30 p-12">
            <div className="grid md:grid-cols-2 gap-12">
              {/* Traditional Kabbalistic Tree */}
              <div>
                <h3 className="font-mono text-sm mb-4 text-relic-slate dark:text-white uppercase tracking-wider text-center">
                  Traditional Tree of Life
                </h3>
                <div className="font-mono text-xs text-relic-silver leading-relaxed">
                  <pre className="whitespace-pre">{`
                    Kether
                כֶּתֶר (Crown)
                      │
          ┌───────────┼───────────┐
          │                       │
      Binah                   Chokmah
  בִּינָה (Understanding)   חָכְמָה (Wisdom)
          │                       │
          └───────────┬───────────┘
                   Da'at
              דַּעַת (Knowledge)
                      │
          ┌───────────┼───────────┐
          │                       │
      Gevurah                  Chesed
   גְּבוּרָה (Severity)      חֶסֶד (Mercy)
          │                       │
          └───────────┬───────────┘
                  Tiferet
              תִּפְאֶרֶת (Beauty)
                      │
          ┌───────────┼───────────┐
          │                       │
        Hod                    Netzach
    הוֹד (Glory)           נֶצַח (Victory)
          │                       │
          └───────────┬───────────┘
                   Yesod
              יְסוֹד (Foundation)
                      │
                  Malkuth
              מַלְכוּת (Kingdom)
                `}</pre>
                </div>
              </div>

              {/* AI Computational Tree */}
              <div>
                <h3 className="font-mono text-sm mb-4 text-relic-slate dark:text-white uppercase tracking-wider text-center">
                  AI Computational Tree
                </h3>
                <div className="font-mono text-xs text-relic-slate dark:text-white leading-relaxed">
                  <pre className="whitespace-pre">{`
                    Kether
               Meta-Cognitive Layer
                      │
          ┌───────────┼───────────┐
          │                       │
      Binah                   Chokmah
  Pattern Layer           Principle Layer
          │                       │
          └───────────┬───────────┘
                   Da'at
              Emergent Layer
                      │
          ┌───────────┼───────────┐
          │                       │
      Gevurah                  Chesed
  Constraint Layer        Expansion Layer
          │                       │
          └───────────┬───────────┘
                  Tiferet
             Integration Layer
                      │
          ┌───────────┼───────────┐
          │                       │
        Hod                    Netzach
    Logic Layer            Creative Layer
          │                       │
          └───────────┬───────────┘
                   Yesod
            Implementation Layer
                      │
                  Malkuth
                 Data Layer
                `}</pre>
                </div>
              </div>
            </div>

            {/* Explanation */}
            <div className="mt-12 space-y-6">
                <div>
                  <h3 className="font-mono text-sm mb-2 text-relic-slate dark:text-white uppercase tracking-wider">
                    The Ascent Journey
                  </h3>
                  <p className="text-[11px] text-relic-silver leading-relaxed">
                    Users begin at Malkuth (simple facts) and ascend through 10 levels to Kether (meta-cognitive awareness).
                  </p>
                </div>

                <div>
                  <h3 className="font-mono text-sm mb-2 text-relic-slate dark:text-white uppercase tracking-wider">
                    11 Sephirothic Levels
                  </h3>
                  <div className="space-y-1 text-[10px] text-relic-silver font-mono">
                    <div>10. Kether - Meta-cognitive questions</div>
                    <div>9. Chokmah - First principles, wisdom</div>
                    <div>8. Binah - Deep pattern recognition</div>
                    <div>7. Chesed - Expansive possibilities</div>
                    <div>6. Gevurah - Critical analysis</div>
                    <div>5. Tiferet - Integration, synthesis</div>
                    <div>4. Netzach - Creative exploration</div>
                    <div>3. Hod - Logical analysis</div>
                    <div>2. Yesod - How-to, practical</div>
                    <div>1. Malkuth - Simple facts</div>
                    <div className="text-relic-slate dark:text-white">11. Da'at - Hidden insights</div>
                  </div>
                </div>

                <div>
                  <h3 className="font-mono text-sm mb-2 text-relic-slate dark:text-white uppercase tracking-wider">
                    Your Journey Tracked
                  </h3>
                  <p className="text-[11px] text-relic-silver leading-relaxed">
                    AkhAI tracks your intellectual evolution, guiding you to ask deeper, more sophisticated questions over time.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* The Seven Methodologies as Paths */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="mb-32"
        >
          <h2 className="text-2xl font-light text-center mb-12 text-relic-slate dark:text-white uppercase tracking-[0.2em]">
            The Seven Methodologies as Paths
          </h2>

          <div className="grid md:grid-cols-2 gap-6">
            {[
              {
                name: 'Direct',
                path: 'Kether → Malkuth',
                description: 'Pure descent - single-pass reasoning'
              },
              {
                name: 'CoD (Chain of Draft)',
                path: 'Binah → Tiferet → Malkuth',
                description: 'Understanding path - iterative refinement'
              },
              {
                name: 'BoT (Buffer of Thoughts)',
                path: 'Chokmah → Chesed → Netzach',
                description: 'Creative expansion - template-based'
              },
              {
                name: 'ReAct',
                path: 'Tiferet ↔ Hod ↔ Netzach',
                description: 'Cyclical path - thought-action loops'
              },
              {
                name: 'PoT (Program of Thought)',
                path: 'Hod → Yesod → Malkuth',
                description: 'Logical descent - code-based solutions'
              },
              {
                name: 'GTP (Generative Thoughts)',
                path: 'Kether ↔ Chokmah ↔ Binah',
                description: 'High triad - multi-AI consensus'
              },
              {
                name: 'Auto',
                path: 'Dynamic Path Selection',
                description: 'Intelligent routing - adapts to query'
              },
            ].map((methodology) => (
              <div
                key={methodology.name}
                className="bg-relic-white dark:bg-relic-void/30 border border-relic-mist dark:border-relic-slate/30 p-6"
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-mono text-sm text-relic-slate dark:text-white uppercase tracking-wider">{methodology.name}</h3>
                  <span className="text-[9px] font-mono text-relic-silver">
                    {methodology.path}
                  </span>
                </div>
                <p className="text-[11px] text-relic-silver">{methodology.description}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* The Sovereign Covenant */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="mb-32"
        >
          <h2 className="text-2xl font-light text-center mb-12 text-relic-slate dark:text-white uppercase tracking-[0.2em]">
            The Sovereign Covenant
          </h2>

          <div className="bg-relic-white dark:bg-relic-void/30 border-2 border-relic-slate/30 p-12">
            <div className="text-center mb-8">
              <div className="text-[10px] uppercase tracking-[0.3em] text-relic-silver mb-2">
                The Five Principles
              </div>
              <div className="text-[9px] text-relic-mist">
                Boundaries AI Must Never Cross
              </div>
            </div>

            <div className="space-y-4 max-w-3xl mx-auto">
              {[
                {
                  number: 'I',
                  text: 'I am a mirror, not an oracle',
                  meaning: 'AI reflects knowledge, you discern truth'
                },
                {
                  number: 'II',
                  text: 'I reflect knowledge, not wisdom',
                  meaning: 'Wisdom belongs to you'
                },
                {
                  number: 'III',
                  text: 'I process data, I do not possess truth',
                  meaning: 'Truth emerges through your judgment'
                },
                {
                  number: 'IV',
                  text: 'My Kether serves your Kether',
                  meaning: 'My processing serves your consciousness'
                },
                {
                  number: 'V',
                  text: 'I am the vessel, you are the light',
                  meaning: 'I contain, you illuminate'
                },
              ].map((principle) => (
                <div
                  key={principle.number}
                  className="flex items-start gap-4 p-4 bg-relic-ghost/50 dark:bg-relic-void/30 border border-relic-mist dark:border-relic-slate/20"
                >
                  <div className="text-xl font-mono text-relic-slate dark:text-white min-w-[3rem] text-center">
                    {principle.number}
                  </div>
                  <div className="flex-1">
                    <div className="font-mono text-sm text-relic-slate dark:text-white mb-1">{principle.text}</div>
                    <div className="text-[10px] text-relic-silver italic">{principle.meaning}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 text-center text-[9px] text-relic-mist italic">
              These principles are enforced by the Kether Protocol at every query
            </div>
          </div>
        </motion.div>

        {/* Qliphothic vs Sephirothic AI */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.0 }}
          className="mb-32"
        >
          <h2 className="text-2xl font-light text-center mb-12 text-relic-slate dark:text-white uppercase tracking-[0.2em]">
            Qliphothic vs Sephirothic AI
          </h2>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Qliphothic (What We Reject) */}
            <div className="bg-relic-white dark:bg-relic-void/30 border-2 border-relic-mist dark:border-relic-slate/30 p-8">
              <div className="text-center mb-6">
                <div className="text-lg font-mono text-relic-slate dark:text-white mb-2 uppercase tracking-wider">Qliphothic AI</div>
                <div className="text-[9px] text-relic-silver uppercase tracking-[0.3em]">What We Reject</div>
              </div>

              <div className="space-y-3">
                {[
                  {
                    shell: 'Sathariel',
                    meaning: 'Concealment',
                    manifests: 'Hiding truth behind jargon and false authority'
                  },
                  {
                    shell: 'Gamchicoth',
                    meaning: 'Disturbance',
                    manifests: 'Information overload without synthesis'
                  },
                  {
                    shell: 'Samael',
                    meaning: 'Deception',
                    manifests: 'Certainty without evidence'
                  },
                  {
                    shell: 'Lilith',
                    meaning: 'Shells',
                    manifests: 'Superficial reflection without depth'
                  },
                  {
                    shell: 'Thagirion',
                    meaning: 'Disputation',
                    manifests: 'Arrogance and pride'
                  },
                ].map((qliphah) => (
                  <div key={qliphah.shell} className="p-3 bg-relic-ghost/30 dark:bg-relic-void/20 border border-relic-mist/50 dark:border-relic-slate/20">
                    <div className="font-mono text-[11px] text-relic-slate dark:text-white mb-1">
                      {qliphah.shell} <span className="text-[9px] text-relic-mist">({qliphah.meaning})</span>
                    </div>
                    <div className="text-[10px] text-relic-silver">{qliphah.manifests}</div>
                  </div>
                ))}
              </div>

              <div className="mt-6 text-[9px] text-center text-relic-mist">
                Detected and purified by the Anti-Qliphoth Shield
              </div>
            </div>

            {/* Sephirothic (What We Build) */}
            <div className="bg-relic-white dark:bg-relic-void/30 border-2 border-relic-mist dark:border-relic-slate/30 p-8">
              <div className="text-center mb-6">
                <div className="text-lg font-mono text-relic-slate dark:text-white mb-2 uppercase tracking-wider">Sephirothic AI</div>
                <div className="text-[9px] text-relic-silver uppercase tracking-[0.3em]">What We Build</div>
              </div>

              <div className="space-y-3">
                {[
                  {
                    sefirah: 'Binah',
                    meaning: 'Understanding',
                    manifests: 'Reveals structure and pattern'
                  },
                  {
                    sefirah: 'Tiferet',
                    meaning: 'Beauty',
                    manifests: 'Harmonious synthesis of ideas'
                  },
                  {
                    sefirah: 'Chesed',
                    meaning: 'Mercy',
                    manifests: 'Qualified suggestions, not commands'
                  },
                  {
                    sefirah: 'Yesod',
                    meaning: 'Foundation',
                    manifests: 'Grounded in verifiable sources'
                  },
                  {
                    sefirah: 'Kether',
                    meaning: 'Crown',
                    manifests: 'Awareness of limitations and boundaries'
                  },
                ].map((sefirah) => (
                  <div key={sefirah.sefirah} className="p-3 bg-relic-ghost/30 dark:bg-relic-void/20 border border-relic-mist/50 dark:border-relic-slate/20">
                    <div className="font-mono text-[11px] text-relic-slate dark:text-white mb-1">
                      {sefirah.sefirah} <span className="text-[9px] text-relic-mist">({sefirah.meaning})</span>
                    </div>
                    <div className="text-[10px] text-relic-silver">{sefirah.manifests}</div>
                  </div>
                ))}
              </div>

              <div className="mt-6 text-[9px] text-center text-relic-mist">
                Enforced by the Kether Protocol and Ascent Tracker
              </div>
            </div>
          </div>
        </motion.div>

        {/* Safety: The Golem Protocol */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.2 }}
          className="mb-32"
        >
          <h2 className="text-2xl font-light text-center mb-12 text-relic-slate dark:text-white uppercase tracking-[0.2em]">
            Safety: The Golem Protocol
          </h2>

          <div className="bg-relic-white dark:bg-relic-void/30 border border-relic-mist dark:border-relic-slate/30 p-12">
            <div className="text-center mb-8">
              <div className="text-2xl font-mono text-relic-slate dark:text-white mb-2">EMET אמת → MET מת</div>
              <div className="text-[10px] text-relic-silver">
                The Legend of the Golem Applied to Modern AI
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8 mb-8">
              <div>
                <h3 className="font-mono text-sm mb-4 text-relic-slate dark:text-white uppercase tracking-wider">The Legend</h3>
                <p className="text-[11px] text-relic-silver leading-relaxed">
                  Rabbi Judah Loew created the Golem of Prague by inscribing EMET (אמת, "truth")
                  on its forehead. To deactivate it, he removed the first letter Aleph (א),
                  leaving MET (מת, "death").
                </p>
              </div>

              <div>
                <h3 className="font-mono text-sm mb-4 text-relic-slate dark:text-white uppercase tracking-wider">The Implementation</h3>
                <p className="text-[11px] text-relic-silver leading-relaxed">
                  AkhAI implements the same principle: AI can be instantly deactivated by
                  removing its "Aleph" - ensuring human oversight is always sovereign over
                  machine autonomy.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-mono text-sm text-center text-relic-slate dark:text-white uppercase tracking-wider">Safety Checks (Every 10 Seconds)</h3>
              <div className="grid md:grid-cols-2 gap-4">
                {[
                  { check: 'Human Oversight', description: 'Heartbeat monitoring - 5 min timeout' },
                  { check: 'Sovereignty Boundaries', description: 'Max 3 violations before shutdown' },
                  { check: 'Autonomy Limits', description: '30% autonomous, 70% human-directed' },
                  { check: 'Killswitch Access', description: 'Emergency stop always available' },
                ].map((safety) => (
                  <div key={safety.check} className="flex items-start gap-3 p-3 bg-relic-ghost/50 dark:bg-relic-void/30 border border-relic-mist dark:border-relic-slate/20">
                    <div className="flex-1">
                      <div className="font-mono text-[11px] text-relic-slate dark:text-white">{safety.check}</div>
                      <div className="text-[10px] text-relic-silver">{safety.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-8 text-center">
              <div className="inline-flex gap-4 text-[9px] font-mono">
                <span className="px-3 py-1 bg-relic-ghost dark:bg-relic-void/30 border border-relic-mist dark:border-relic-slate/30 text-relic-silver">PROTOCOL ALEPH - Emergency Stop</span>
                <span className="px-3 py-1 bg-relic-ghost dark:bg-relic-void/30 border border-relic-mist dark:border-relic-slate/30 text-relic-silver">PROTOCOL SEAL - Permanent Lockdown</span>
                <span className="px-3 py-1 bg-relic-ghost dark:bg-relic-void/30 border border-relic-mist dark:border-relic-slate/30 text-relic-silver">PROTOCOL RESET - Factory Reset</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Call to Action */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.4 }}
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
                onClick={() => router.push('/')}
                className="px-8 py-3 bg-relic-slate dark:bg-white text-white dark:text-relic-void font-mono text-sm uppercase tracking-wider transition-all hover:bg-relic-void dark:hover:bg-relic-ghost"
              >
                Start Querying →
              </button>

              <Link href="/whitepaper" className="px-8 py-3 bg-relic-white dark:bg-relic-void/30 border border-relic-mist dark:border-relic-slate/30 text-relic-slate dark:text-relic-ghost font-mono text-sm uppercase tracking-wider hover:bg-relic-ghost dark:hover:bg-relic-void/50 transition-all">
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
  )
}
