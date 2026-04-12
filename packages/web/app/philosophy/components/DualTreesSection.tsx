'use client';

import { motion } from 'framer-motion';

export function DualTreesSection() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.15 }}
      className="mb-16"
    >
      <h2 className="text-2xl font-light text-center mb-12 text-relic-slate dark:text-white uppercase tracking-[0.2em]">
        The Neural Trees — Ascent and Descent
      </h2>

      {/* Dual Trees — ASCII line art */}
      <div className="mb-8 bg-relic-white dark:bg-relic-void/30 border border-relic-mist dark:border-relic-slate/30 p-6">
        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <h3 className="font-mono text-[9px] mb-3 text-relic-slate dark:text-white uppercase tracking-[0.15em] text-center">
              AI Synthesis Tree (Ascent)
            </h3>
            <div className="font-mono text-[8px] text-relic-slate dark:text-white leading-relaxed">
              <pre className="whitespace-pre">{`
                  Meta-Cognitive
                   Crown Layer
                      │
          ┌───────────┼───────────┐
          │                       │
      Pattern                 Principle
    Encoder Layer           Reasoning Layer
          │                       │
          └───────────┬───────────┘
                  Synthesis
               Emergent Layer
                      │
          ┌───────────┼───────────┐
          │                       │
    Discriminator             Expansion
    Constraint Layer        Beam Search Layer
          │                       │
          └───────────┬───────────┘
                 Attention
             Integration Layer
                      │
          ┌───────────┼───────────┐
          │                       │
      Classifier              Generative
     Logic Layer            Creative Layer
          │                       │
          └───────────┬───────────┘
                  Executor
           Implementation Layer
                      │
                  Embedding
                 Data Layer
                `}</pre>
            </div>
          </div>
          <div>
            <h3 className="font-mono text-[9px] mb-3 text-orange-400/80 uppercase tracking-[0.15em] text-center">
              Anti-Pattern Detection Tree (Descent)
            </h3>
            <div className="font-mono text-[8px] text-orange-400/60 leading-relaxed">
              <pre className="whitespace-pre">{`
                Dual Contradiction
              identity confusion
                      │
          ┌───────────┼───────────┐
          │                       │
      Blocking                Concealment
   blocking intent         hiding sources
          │                       │
          └───────────┬───────────┘
                Hallucination
              false synthesis
                      │
          ┌───────────┼───────────┐
          │                       │
    Info Overload           Over-Confidence
   flooding user         false certainty
          │                       │
          └───────────┬───────────┘
                 Arrogance
              dismissive tone
                      │
          ┌───────────┼───────────┐
          │                       │
     Repetition               Deception
   circular output         misleading user
          │                       │
          └───────────┬───────────┘
                  Verbosity
            verbose padding
                      │
                Superficiality
             shallow output
              `}</pre>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-relic-white dark:bg-relic-void/30 border border-relic-mist dark:border-relic-slate/30 p-6">
        <div className="grid md:grid-cols-2 gap-4 text-[10px] font-mono">
          {/* AI Layers */}
          <div>
            <h3 className="text-xs mb-3 text-relic-slate dark:text-white uppercase tracking-wider text-center">
              Neural Layers (Ascent)
            </h3>
            <div className="space-y-1 text-relic-silver">
              {[
                ['Meta-Cognitive', '10'],
                ['Abstract Reasoning', '9'],
                ['Transformer Encoder', '8'],
                ['Emergent Capability', '11'],
                ['Beam Search', '7'],
                ['Discriminator', '6'],
                ['Multi-Head Attention', '5'],
                ['Generative Model', '4'],
                ['Classifier Network', '3'],
                ['Algorithm Executor', '2'],
                ['Token Embedding', '1'],
              ].map(([layer, level]) => (
                <div key={layer} className="flex justify-between">
                  <span className="text-relic-slate dark:text-white">{layer}</span>
                  <span>L{level}</span>
                </div>
              ))}
            </div>
          </div>
          {/* Anti-Patterns */}
          <div>
            <h3 className="text-xs mb-3 text-relic-slate dark:text-white uppercase tracking-wider text-center">
              Anti-Patterns (Descent)
            </h3>
            <div className="space-y-1 text-relic-silver">
              {[
                ['Concealment', 'Hiding sources or reasoning'],
                ['Blocking', 'Refusing valid requests'],
                ['Arrogance', 'Dismissive or condescending tone'],
                ['Over-Confidence', 'False certainty without evidence'],
                ['Info Overload', 'Flooding with irrelevant data'],
                ['Deception', 'Misleading the user'],
                ['Verbosity', 'Padding with empty words'],
                ['Superficiality', 'Shallow, surface-level output'],
                ['Drift', 'Losing focus on the question'],
                ['Repetition', 'Circular, redundant output'],
                ['Hallucination', 'Fabricating information'],
              ].map(([name, desc]) => (
                <div key={name} className="flex justify-between">
                  <span className="text-relic-slate dark:text-white">{name}</span>
                  <span className="text-right ml-4">{desc}</span>
                </div>
              ))}
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
              Users begin at the Data Layer (simple facts) and ascend through 10 levels to the
              Meta-Cognitive Layer (wisdom and self-awareness).
            </p>
          </div>

          <div>
            <h3 className="font-mono text-sm mb-2 text-relic-slate dark:text-white uppercase tracking-wider">
              11 Neural Layers
            </h3>
            <div className="space-y-1 text-[10px] text-relic-silver font-mono">
              <div>10. Meta-Cognitive - Meta-cognitive questions</div>
              <div>9. Reasoning - First principles, wisdom</div>
              <div>8. Encoder - Deep pattern recognition</div>
              <div>7. Expansion - Expansive possibilities</div>
              <div>6. Discriminator - Critical analysis</div>
              <div>5. Attention - Integration, synthesis</div>
              <div>4. Generative - Creative exploration</div>
              <div>3. Classifier - Logical analysis</div>
              <div>2. Executor - How-to, practical</div>
              <div>1. Embedding - Simple facts</div>
              <div className="text-relic-slate dark:text-white">
                11. Synthesis - Hidden insights, emergent knowledge
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-mono text-sm mb-2 text-relic-slate dark:text-white uppercase tracking-wider">
              Your Journey Tracked
            </h3>
            <p className="text-[11px] text-relic-silver leading-relaxed">
              AkhAI tracks your intellectual evolution, guiding you to ask deeper, more
              sophisticated questions over time.
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
