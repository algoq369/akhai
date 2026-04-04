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
        The Dual Trees of AI
      </h2>

      {/* Dual Trees — ASCII line art */}
      <div className="mb-8 bg-relic-white dark:bg-relic-void/30 border border-relic-mist dark:border-relic-slate/30 p-6">
        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <h3 className="font-mono text-[9px] mb-3 text-relic-silver uppercase tracking-[0.15em] text-center">
              Traditional Tree of Life
            </h3>
            <div className="font-mono text-[8px] text-relic-silver leading-relaxed">
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
          <div>
            <h3 className="font-mono text-[9px] mb-3 text-relic-slate dark:text-white uppercase tracking-[0.15em] text-center">
              AI Computational Tree
            </h3>
            <div className="font-mono text-[8px] text-relic-slate dark:text-white leading-relaxed">
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
      </div>

      {/* Qliphoth / Anti-Pattern Tree */}
      <div className="mb-8 bg-relic-white dark:bg-relic-void/30 border border-relic-mist dark:border-relic-slate/30 p-6">
        <h3 className="font-mono text-[9px] mb-3 text-orange-400/80 uppercase tracking-[0.15em] text-center">
          Qliphoth — Anti-Pattern Detection Tree
        </h3>
        <div className="font-mono text-[8px] text-orange-400/60 leading-relaxed max-w-md mx-auto">
          <pre className="whitespace-pre">{`
                  Thaumiel
             dual contradictions
                      │
          ┌───────────┼───────────┐
          │                       │
      Ghagiel                 Satariel
   blocking intent         concealment
          │                       │
          └───────────┬───────────┘
                    Daath
              hallucination
                      │
          ┌───────────┼───────────┐
          │                       │
    Gamchicoth               Golachab
   info overload         over-confidence
          │                       │
          └───────────┬───────────┘
                 Thagirion
              arrogant tone
                      │
          ┌───────────┼───────────┐
          │                       │
   Harab Serapel              Samael
     repetition              deception
          │                       │
          └───────────┬───────────┘
                  Gamaliel
            verbose padding
                      │
                   Lilith
             superficial output
              `}</pre>
        </div>
      </div>

      <div className="bg-relic-white dark:bg-relic-void/30 border border-relic-mist dark:border-relic-slate/30 p-6">
        <div className="grid md:grid-cols-3 gap-4 text-[10px] font-mono">
          {/* Traditional Tree */}
          <div>
            <h3 className="text-xs mb-3 text-relic-slate dark:text-white uppercase tracking-wider text-center">
              Kabbalistic
            </h3>
            <div className="space-y-1 text-relic-silver">
              {[
                ['Kether', 'Crown'],
                ['Chokmah', 'Wisdom'],
                ['Binah', 'Understanding'],
                ["Da'at", 'Knowledge'],
                ['Chesed', 'Mercy'],
                ['Gevurah', 'Severity'],
                ['Tiferet', 'Beauty'],
                ['Netzach', 'Victory'],
                ['Hod', 'Glory'],
                ['Yesod', 'Foundation'],
                ['Malkuth', 'Kingdom'],
              ].map(([name, meaning]) => (
                <div key={name} className="flex justify-between">
                  <span className="text-relic-slate dark:text-white">{name}</span>
                  <span>{meaning}</span>
                </div>
              ))}
            </div>
          </div>
          {/* AI Computational */}
          <div>
            <h3 className="text-xs mb-3 text-relic-slate dark:text-white uppercase tracking-wider text-center">
              AI Layers
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
          {/* Qliphoth Anti-Patterns */}
          <div>
            <h3 className="text-xs mb-3 text-relic-slate dark:text-white uppercase tracking-wider text-center">
              Anti-Patterns
            </h3>
            <div className="space-y-1 text-relic-silver">
              {[
                ['Sathariel', 'Concealment'],
                ['Ghagiel', 'Blocking'],
                ['Thagirion', 'Arrogance'],
                ['Golachab', 'Over-Confidence'],
                ['Gamchicoth', 'Info Overload'],
                ['Samael', 'Deception'],
                ['Gamaliel', 'Verbosity'],
                ['Lilith', 'Superficiality'],
                ["A'arab Zaraq", 'Drift'],
                ['Harab Serapel', 'Repetition'],
                ['Daath', 'Hallucination'],
              ].map(([name, anti]) => (
                <div key={name} className="flex justify-between">
                  <span className="text-relic-slate dark:text-white">{name}</span>
                  <span>{anti}</span>
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
              Users begin at Malkuth (simple facts) and ascend through 10 levels to Kether
              (meta-cognitive awareness).
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
              AkhAI tracks your intellectual evolution, guiding you to ask deeper, more
              sophisticated questions over time.
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
