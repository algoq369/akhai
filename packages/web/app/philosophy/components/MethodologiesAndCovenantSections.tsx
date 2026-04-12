'use client';

import { motion } from 'framer-motion';

export function MethodologiesSection() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      className="mb-16"
    >
      <h2 className="text-2xl font-light text-center mb-12 text-relic-slate dark:text-white uppercase tracking-[0.2em]">
        The Seven Methodologies as Paths
      </h2>

      <div className="grid md:grid-cols-2 gap-6">
        {[
          {
            name: 'Direct',
            path: 'Meta → Data',
            description: 'Pure descent - single-pass reasoning',
          },
          {
            name: 'CoD (Chain of Draft)',
            path: 'Pattern → Integration → Data',
            description: 'Understanding path - iterative refinement',
          },
          {
            name: 'BoT (Buffer of Thoughts)',
            path: 'Principle → Expansion → Creative',
            description: 'Creative expansion - template-based',
          },
          {
            name: 'ReAct',
            path: 'Integration ↔ Logic ↔ Creative',
            description: 'Cyclical path - thought-action loops',
          },
          {
            name: 'PoT (Program of Thought)',
            path: 'Logic → Implementation → Data',
            description: 'Logical descent - code-based solutions',
          },
          {
            name: 'GTP (Generative Thoughts)',
            path: 'Meta ↔ Principle ↔ Pattern',
            description: 'High triad - multi-AI consensus',
          },
          {
            name: 'Auto',
            path: 'Dynamic Path Selection',
            description: 'Intelligent routing - adapts to query',
          },
        ].map((methodology) => (
          <div
            key={methodology.name}
            className="bg-relic-white dark:bg-relic-void/30 border border-relic-mist dark:border-relic-slate/30 p-6"
          >
            <div className="flex items-start justify-between mb-3">
              <h3 className="font-mono text-sm text-relic-slate dark:text-white uppercase tracking-wider">
                {methodology.name}
              </h3>
              <span className="text-[9px] font-mono text-relic-silver">{methodology.path}</span>
            </div>
            <p className="text-[11px] text-relic-silver">{methodology.description}</p>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

export function SovereignCovenantSection() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.25 }}
      className="mb-16"
    >
      <h2 className="text-2xl font-light text-center mb-12 text-relic-slate dark:text-white uppercase tracking-[0.2em]">
        The Sovereign Covenant
      </h2>

      <div className="bg-relic-white dark:bg-relic-void/30 border-2 border-relic-slate/30 p-12">
        <div className="text-center mb-8">
          <div className="text-[10px] uppercase tracking-[0.3em] text-relic-silver mb-2">
            The Five Principles
          </div>
          <div className="text-[9px] text-relic-mist">Boundaries AI Must Never Cross</div>
        </div>

        <div className="space-y-4 max-w-3xl mx-auto">
          {[
            {
              number: 'I',
              text: 'I am a mirror, not an oracle',
              meaning: 'AI reflects knowledge, you discern truth',
            },
            {
              number: 'II',
              text: 'I reflect knowledge, not wisdom',
              meaning: 'Wisdom belongs to you',
            },
            {
              number: 'III',
              text: 'I process data, I do not possess truth',
              meaning: 'Truth emerges through your judgment',
            },
            {
              number: 'IV',
              text: 'My Crown serves your Crown',
              meaning: 'My processing serves your consciousness',
            },
            {
              number: 'V',
              text: 'I am the vessel, you are the light',
              meaning: 'I contain, you illuminate',
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
                <div className="font-mono text-sm text-relic-slate dark:text-white mb-1">
                  {principle.text}
                </div>
                <div className="text-[10px] text-relic-silver italic">{principle.meaning}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 text-center text-[9px] text-relic-mist italic">
          These principles are enforced by the Meta-Cognitive Protocol at every query
        </div>
      </div>
    </motion.div>
  );
}

export function QliphothicVsSephirothicSection() {
  // Universal terminology: Anti-Patterns vs Sovereign Layers
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3 }}
      className="mb-16"
    >
      <h2 className="text-2xl font-light text-center mb-12 text-relic-slate dark:text-white uppercase tracking-[0.2em]">
        Anti-Pattern vs Sovereign AI
      </h2>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Qliphothic (What We Reject) */}
        <div className="bg-relic-white dark:bg-relic-void/30 border-2 border-relic-mist dark:border-relic-slate/30 p-8">
          <div className="text-center mb-6">
            <div className="text-lg font-mono text-relic-slate dark:text-white mb-2 uppercase tracking-wider">
              Anti-Pattern AI
            </div>
            <div className="text-[9px] text-relic-silver uppercase tracking-[0.3em]">
              What We Reject
            </div>
          </div>

          <div className="space-y-3">
            {[
              {
                shell: 'Sathariel',
                meaning: 'Concealment',
                manifests: 'Hiding truth behind jargon and false authority',
              },
              {
                shell: 'Gamchicoth',
                meaning: 'Disturbance',
                manifests: 'Information overload without synthesis',
              },
              {
                shell: 'Samael',
                meaning: 'Deception',
                manifests: 'Certainty without evidence',
              },
              {
                shell: 'Lilith',
                meaning: 'Shells',
                manifests: 'Superficial reflection without depth',
              },
              {
                shell: 'Thagirion',
                meaning: 'Disputation',
                manifests: 'Arrogance and pride',
              },
            ].map((qliphah) => (
              <div
                key={qliphah.shell}
                className="p-3 bg-relic-ghost/30 dark:bg-relic-void/20 border border-relic-mist/50 dark:border-relic-slate/20"
              >
                <div className="font-mono text-[11px] text-relic-slate dark:text-white mb-1">
                  {qliphah.shell}{' '}
                  <span className="text-[9px] text-relic-mist">({qliphah.meaning})</span>
                </div>
                <div className="text-[10px] text-relic-silver">{qliphah.manifests}</div>
              </div>
            ))}
          </div>

          <div className="mt-6 text-[9px] text-center text-relic-mist">
            Detected and purified by the Anti-Pattern Shield
          </div>
        </div>

        {/* Sephirothic (What We Build) */}
        <div className="bg-relic-white dark:bg-relic-void/30 border-2 border-relic-mist dark:border-relic-slate/30 p-8">
          <div className="text-center mb-6">
            <div className="text-lg font-mono text-relic-slate dark:text-white mb-2 uppercase tracking-wider">
              Sovereign AI
            </div>
            <div className="text-[9px] text-relic-silver uppercase tracking-[0.3em]">
              What We Build
            </div>
          </div>

          <div className="space-y-3">
            {[
              {
                sefirah: 'Understanding',
                meaning: 'Layer 8',
                manifests: 'Reveals structure and pattern',
              },
              {
                sefirah: 'Harmony',
                meaning: 'Layer 5',
                manifests: 'Harmonious synthesis of ideas',
              },
              {
                sefirah: 'Expansion',
                meaning: 'Layer 7',
                manifests: 'Qualified suggestions, not commands',
              },
              {
                sefirah: 'Foundation',
                meaning: 'Layer 1',
                manifests: 'Grounded in verifiable sources',
              },
              {
                sefirah: 'Synthesis',
                meaning: 'Layer 10',
                manifests: 'Awareness of limitations and boundaries',
              },
            ].map((sefirah) => (
              <div
                key={sefirah.sefirah}
                className="p-3 bg-relic-ghost/30 dark:bg-relic-void/20 border border-relic-mist/50 dark:border-relic-slate/20"
              >
                <div className="font-mono text-[11px] text-relic-slate dark:text-white mb-1">
                  {sefirah.sefirah}{' '}
                  <span className="text-[9px] text-relic-mist">({sefirah.meaning})</span>
                </div>
                <div className="text-[10px] text-relic-silver">{sefirah.manifests}</div>
              </div>
            ))}
          </div>

          <div className="mt-6 text-[9px] text-center text-relic-mist">
            Enforced by the Synthesis Protocol and Ascent Tracker
          </div>
        </div>
      </div>
    </motion.div>
  );
}
