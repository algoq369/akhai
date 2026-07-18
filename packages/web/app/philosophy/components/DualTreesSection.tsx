'use client';

export function DualTreesSection() {
  // Static figure: the paper's blueprint must render without animation (M5).
  return (
    <div className="mb-16">
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

    </div>
  );
}
