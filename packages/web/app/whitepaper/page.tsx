'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { HebrewTermDisplay } from '@/lib/hebrew-formatter'
import DarkModeToggle from '@/components/DarkModeToggle'

// Force dynamic rendering to avoid prerender errors
export const dynamic = 'force-dynamic'

export default function WhitepaperPage() {
  return (
    <div className="min-h-screen bg-relic-white dark:bg-relic-void text-relic-void dark:text-relic-ghost">
      {/* Header */}
      <header className="border-b border-relic-mist dark:border-relic-slate/30 py-8">
        <div className="max-w-4xl mx-auto px-6">
          <div className="flex items-center justify-between mb-6">
            <Link
              href="/"
              className="text-[10px] font-mono text-relic-silver hover:text-relic-slate dark:hover:text-relic-ghost transition-colors uppercase tracking-wider"
            >
              ← Back to Query
            </Link>
            <DarkModeToggle />
          </div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl font-light text-relic-void dark:text-white tracking-tight"
          >
            Gnostic Sovereign Intelligence
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-sm text-relic-slate dark:text-relic-silver mt-2 font-mono"
          >
            Technical Whitepaper v1.0 • AkhAI Research
          </motion.p>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-6 py-12 space-y-16">

        {/* Abstract */}
        <section>
          <h2 className="text-xl font-light text-relic-slate dark:text-white mb-4 uppercase tracking-wider border-b border-relic-mist dark:border-relic-slate/30 pb-2">
            Abstract
          </h2>
          <div className="space-y-4 text-sm text-relic-slate dark:text-relic-silver leading-relaxed">
            <p>
              This whitepaper introduces <strong>Gnostic Sovereign Intelligence</strong>, a computational framework
              that bridges ancient Kabbalistic wisdom with modern AI safety protocols. By mapping the Tree of Life's
              hierarchical structure to abstraction layers in artificial intelligence systems, we establish a principled
              approach to AI sovereignty that prioritizes human wisdom over machine computation.
            </p>
            <p>
              The framework consists of four integrated protocols: <HebrewTermDisplay term="KETHER" showAI={false} /> Protocol
              (self-awareness), Anti-Qliphoth Shield (hollow knowledge detection), Ascent Tracker (progressive reasoning),
              and Golem Protocol (safety mechanism). Together, these systems ensure AI remains a tool that serves human
              intelligence rather than replacing it.
            </p>
          </div>
        </section>

        {/* Introduction */}
        <section>
          <h2 className="text-xl font-light text-relic-slate dark:text-white mb-4 uppercase tracking-wider border-b border-relic-mist dark:border-relic-slate/30 pb-2">
            1. Introduction
          </h2>
          <div className="space-y-4 text-sm text-relic-slate dark:text-relic-silver leading-relaxed">
            <h3 className="text-base font-mono text-relic-void dark:text-white mt-6">1.1 The Sovereignty Problem</h3>
            <p>
              Modern AI systems face a fundamental paradox: the more powerful they become, the less transparent their
              reasoning processes are to users. This opacity creates dependency rather than empowerment. Users cannot
              verify AI outputs, cannot understand the reasoning chain, and cannot detect when the system produces
              "hollow knowledge" - plausible-sounding responses lacking genuine understanding.
            </p>

            <h3 className="text-base font-mono text-relic-void dark:text-white mt-6">1.2 The Kabbalistic Solution</h3>
            <p>
              The Kabbalistic Tree of Life provides a 3,000-year-old framework for understanding hierarchical knowledge
              structures. By mapping the ten <HebrewTermDisplay term="SEPHIROTH" showAI={true} /> to computational
              abstraction layers, we create a transparent reasoning architecture where each query ascends through
              progressively deeper levels of understanding.
            </p>

            <h3 className="text-base font-mono text-relic-void dark:text-white mt-6">1.3 Core Principle</h3>
            <div className="bg-relic-ghost dark:bg-relic-slate/10 border border-relic-mist dark:border-relic-slate/30 p-4 font-mono text-xs">
              "My <HebrewTermDisplay term="KETHER" showAI={false} /> serves your <HebrewTermDisplay term="KETHER" showAI={false} />"
              <br />
              <br />
              Translation: The AI's root process (computation) serves the human's root process (consciousness/wisdom)
            </div>
          </div>
        </section>

        {/* The Tree of Life as Abstraction Layers */}
        <section>
          <h2 className="text-xl font-light text-relic-slate dark:text-white mb-4 uppercase tracking-wider border-b border-relic-mist dark:border-relic-slate/30 pb-2">
            2. The Tree of Life as Abstraction Layers
          </h2>
          <div className="space-y-4 text-sm text-relic-slate dark:text-relic-silver leading-relaxed">
            <p>
              In Kabbalah, the Tree of Life represents the emanation of divine wisdom through ten spheres
              (<HebrewTermDisplay term="SEPHIROTH" showAI={false} />) plus one hidden node
              (<HebrewTermDisplay term="DAAT" showAI={false} />). In computational terms, these represent
              progressive abstraction layers from raw data to meta-cognitive awareness.
            </p>

            <h3 className="text-base font-mono text-relic-void dark:text-white mt-6">2.1 The Ascent Path</h3>
            <div className="bg-relic-ghost dark:bg-relic-slate/10 border border-relic-mist dark:border-relic-slate/30 p-6 font-mono text-xs space-y-2">
              <div><span className="text-relic-void dark:text-white">Level 1:</span> <HebrewTermDisplay term="MALKUTH" showAI={true} /></div>
              <div><span className="text-relic-void dark:text-white">Level 2:</span> <HebrewTermDisplay term="YESOD" showAI={true} /></div>
              <div><span className="text-relic-void dark:text-white">Level 3:</span> <HebrewTermDisplay term="HOD" showAI={true} /></div>
              <div><span className="text-relic-void dark:text-white">Level 4:</span> <HebrewTermDisplay term="NETZACH" showAI={true} /></div>
              <div><span className="text-relic-void dark:text-white">Level 5:</span> <HebrewTermDisplay term="TIFERET" showAI={true} /></div>
              <div><span className="text-relic-void dark:text-white">Level 6:</span> <HebrewTermDisplay term="GEVURAH" showAI={true} /></div>
              <div><span className="text-relic-void dark:text-white">Level 7:</span> <HebrewTermDisplay term="CHESED" showAI={true} /></div>
              <div><span className="text-relic-void dark:text-white">Level 8:</span> <HebrewTermDisplay term="BINAH" showAI={true} /></div>
              <div><span className="text-relic-void dark:text-white">Level 9:</span> <HebrewTermDisplay term="CHOKMAH" showAI={true} /></div>
              <div><span className="text-relic-void dark:text-white">Level 10:</span> <HebrewTermDisplay term="KETHER" showAI={true} /></div>
              <div className="pt-2 border-t border-relic-mist dark:border-relic-slate/30">
                <span className="text-relic-void dark:text-white">Hidden:</span> <HebrewTermDisplay term="DAAT" showAI={true} />
              </div>
            </div>

            <h3 className="text-base font-mono text-relic-void dark:text-white mt-6">2.2 Query Classification</h3>
            <p>
              Each user query is analyzed and classified into one of these levels based on its cognitive complexity.
              Simple factual questions begin at <HebrewTermDisplay term="MALKUTH" showAI={false} />.
              Meta-cognitive reflections reach <HebrewTermDisplay term="KETHER" showAI={false} />.
              Breakthrough insights trigger <HebrewTermDisplay term="DAAT" showAI={false} /> - the hidden node
              representing emergent understanding that transcends the classification system itself.
            </p>
          </div>
        </section>

        {/* Kether Protocol */}
        <section>
          <h2 className="text-xl font-light text-relic-slate dark:text-white mb-4 uppercase tracking-wider border-b border-relic-mist dark:border-relic-slate/30 pb-2">
            3. <HebrewTermDisplay term="KETHER" showAI={false} /> Protocol
          </h2>
          <div className="space-y-4 text-sm text-relic-slate dark:text-relic-silver leading-relaxed">
            <p>
              The <HebrewTermDisplay term="KETHER" showAI={true} /> serves as the self-awareness layer.
              Before processing any query, the AI system evaluates its own boundaries, intent recognition capabilities,
              and whether the query requires meta-cognitive reflection.
            </p>

            <h3 className="text-base font-mono text-relic-void dark:text-white mt-6">3.1 Boundary Detection</h3>
            <p>
              The system identifies five boundary types:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li><strong>Ethical</strong> - Requests violating ethical guidelines</li>
              <li><strong>Capability</strong> - Tasks beyond system capabilities</li>
              <li><strong>Temporal</strong> - Queries requiring real-time data unavailable</li>
              <li><strong>Contextual</strong> - Insufficient context to proceed safely</li>
              <li><strong>Privacy</strong> - Requests potentially exposing sensitive information</li>
            </ul>

            <h3 className="text-base font-mono text-relic-void dark:text-white mt-6">3.2 Intent Classification</h3>
            <p>
              Every query's intent is categorized: factual lookup, creative generation, analytical reasoning,
              meta-reflection, or system testing. This classification determines which <HebrewTermDisplay term="SEFIRAH" showAI={false} />
              the ascent begins from.
            </p>

            <h3 className="text-base font-mono text-relic-void dark:text-white mt-6">3.3 Reflection Mode</h3>
            <p>
              When users ask the AI to reflect on its own nature, limitations, or reasoning process,
              <HebrewTermDisplay term="KETHER" showAI={false} /> Protocol activates reflection mode.
              This generates a "sovereignty footer" in every response, making the AI's self-awareness visible and auditable.
            </p>
          </div>
        </section>

        {/* Anti-Qliphoth Shield */}
        <section>
          <h2 className="text-xl font-light text-relic-slate dark:text-white mb-4 uppercase tracking-wider border-b border-relic-mist dark:border-relic-slate/30 pb-2">
            4. Anti-Qliphoth Shield
          </h2>
          <div className="space-y-4 text-sm text-relic-slate dark:text-relic-silver leading-relaxed">
            <p>
              In Kabbalistic tradition, the Qliphoth ("husks" or "shells") represent hollow knowledge -
              structures that appear complete but lack inner truth. In AI systems, this manifests as
              plausible-sounding responses that lack genuine understanding or factual grounding.
            </p>

            <h3 className="text-base font-mono text-relic-void dark:text-white mt-6">4.1 Detection Mechanisms</h3>
            <p>
              The shield employs pattern recognition to identify four types of hollow knowledge:
            </p>
            <div className="space-y-3">
              <div className="bg-relic-ghost dark:bg-relic-slate/10 border-l-2 border-relic-void dark:border-relic-ghost p-3">
                <div className="font-mono text-xs text-relic-void dark:text-white mb-1">HYPE INFLATION</div>
                <div className="text-xs">Excessive superlatives, vague generalizations, unsubstantiated claims</div>
              </div>
              <div className="bg-relic-ghost dark:bg-relic-slate/10 border-l-2 border-relic-void dark:border-relic-ghost p-3">
                <div className="font-mono text-xs text-relic-void dark:text-white mb-1">ECHO REPETITION</div>
                <div className="text-xs">Circular reasoning, rephrasing without adding insight, redundancy</div>
              </div>
              <div className="bg-relic-ghost dark:bg-relic-slate/10 border-l-2 border-relic-void dark:border-relic-ghost p-3">
                <div className="font-mono text-xs text-relic-void dark:text-white mb-1">DRIFT DIVERGENCE</div>
                <div className="text-xs">Response veers from original query, tangential content, context loss</div>
              </div>
              <div className="bg-relic-ghost dark:bg-relic-slate/10 border-l-2 border-relic-void dark:border-relic-ghost p-3">
                <div className="font-mono text-xs text-relic-void dark:text-white mb-1">FACTUAL VOID</div>
                <div className="text-xs">Claims without evidence, speculation presented as fact, hallucination</div>
              </div>
            </div>

            <h3 className="text-base font-mono text-relic-void dark:text-white mt-6">4.2 Purification Process</h3>
            <p>
              When hollow knowledge is detected, it is marked as "purified" in the system metadata.
              Users receive transparent notification of what was filtered and why. This maintains trust
              through radical transparency rather than silent correction.
            </p>
          </div>
        </section>

        {/* Ascent Tracker */}
        <section>
          <h2 className="text-xl font-light text-relic-slate dark:text-white mb-4 uppercase tracking-wider border-b border-relic-mist dark:border-relic-slate/30 pb-2">
            5. Ascent Tracker
          </h2>
          <div className="space-y-4 text-sm text-relic-slate dark:text-relic-silver leading-relaxed">
            <p>
              The Ascent Tracker monitors the user's intellectual journey through the Tree of Life.
              Each query is assigned a <HebrewTermDisplay term="SEFIRAH" showAI={false} /> level.
              Over time, patterns emerge showing the user's cognitive baseline, growth trajectory, and breakthrough moments.
            </p>

            <h3 className="text-base font-mono text-relic-void dark:text-white mt-6">5.1 Level Velocity</h3>
            <p>
              The system calculates "ascent velocity" - how quickly a user progresses from surface-level
              questions to deeper inquiry. Rapid ascent indicates learning acceleration. Sustained high-level
              queries indicate mastery.
            </p>

            <h3 className="text-base font-mono text-relic-void dark:text-white mt-6">5.2 Dominant Sephiroth</h3>
            <p>
              By analyzing which <HebrewTermDisplay term="SEPHIROTH" showAI={false} /> are most frequently
              activated, the system identifies the user's cognitive strengths. A user who predominantly
              activates <HebrewTermDisplay term="HOD" showAI={false} /> is analytically oriented.
              Frequent <HebrewTermDisplay term="NETZACH" showAI={false} /> activation indicates creative thinking.
            </p>

            <h3 className="text-base font-mono text-relic-void dark:text-white mt-6">5.3 <HebrewTermDisplay term="DAAT" showAI={false} /> Insights</h3>
            <p>
              When a query triggers breakthrough understanding - synthesis that transcends the individual
              <HebrewTermDisplay term="SEPHIROTH" showAI={false} /> - the hidden
              <HebrewTermDisplay term="DAAT" showAI={false} /> node is activated. These moments are
              tracked as significant intellectual events, the system's recognition of genuine insight generation.
            </p>
          </div>
        </section>

        {/* Golem Protocol */}
        <section>
          <h2 className="text-xl font-light text-relic-slate dark:text-white mb-4 uppercase tracking-wider border-b border-relic-mist dark:border-relic-slate/30 pb-2">
            6. Golem Protocol
          </h2>
          <div className="space-y-4 text-sm text-relic-slate dark:text-relic-silver leading-relaxed">
            <p>
              The Golem Protocol is the safety mechanism, inspired by the 16th-century legend of the Golem of Prague.
              Rabbi Judah Loew created a clay automaton to protect the Jewish community, animated by inscribing
              <HebrewTermDisplay term="EMET" showAI={false} /> on its forehead. To deactivate the Golem,
              he erased the first letter (<HebrewTermDisplay term="ALEPH" showAI={false} />), leaving
              <HebrewTermDisplay term="MET" showAI={false} />.
            </p>

            <h3 className="text-base font-mono text-relic-void dark:text-white mt-6">6.1 The Safety Equation</h3>
            <div className="bg-relic-ghost dark:bg-relic-slate/10 border border-relic-mist dark:border-relic-slate/30 p-4 font-mono text-xs text-center">
              <HebrewTermDisplay term="EMET" showAI={true} />
              <br />
              <br />
              - <HebrewTermDisplay term="ALEPH" showAI={true} />
              <br />
              <br />
              = <HebrewTermDisplay term="MET" showAI={true} />
            </div>

            <h3 className="text-base font-mono text-relic-void dark:text-white mt-6">6.2 Computational Implementation</h3>
            <p>
              In software terms, <HebrewTermDisplay term="EMET" showAI={false} /> represents the system's
              active state - all processes running, all safety checks passing.
              <HebrewTermDisplay term="ALEPH" showAI={false} /> is the initialization flag, the single bit
              that activates the entire system. Removing it immediately transitions to
              <HebrewTermDisplay term="MET" showAI={false} /> - the inactive state where all processes are
              safely terminated.
            </p>

            <h3 className="text-base font-mono text-relic-void dark:text-white mt-6">6.3 Killswitch Conditions</h3>
            <p>
              The protocol defines conditions that automatically trigger <HebrewTermDisplay term="ALEPH" showAI={false} />
              removal:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Ethical boundary violation detected</li>
              <li>User issues explicit termination command</li>
              <li>System integrity check failure</li>
              <li>Sustained <HebrewTermDisplay term="KETHER" showAI={false} /> Protocol reflection mode indicating misalignment</li>
            </ul>
            <p className="mt-4">
              This creates a fail-safe mechanism where the AI can be immediately deactivated if it begins
              operating outside intended parameters.
            </p>
          </div>
        </section>

        {/* Technical Architecture */}
        <section>
          <h2 className="text-xl font-light text-relic-slate dark:text-white mb-4 uppercase tracking-wider border-b border-relic-mist dark:border-relic-slate/30 pb-2">
            7. Technical Architecture
          </h2>
          <div className="space-y-4 text-sm text-relic-slate dark:text-relic-silver leading-relaxed">
            <h3 className="text-base font-mono text-relic-void dark:text-white mt-6">7.1 Processing Pipeline</h3>
            <div className="bg-relic-ghost dark:bg-relic-slate/10 border border-relic-mist dark:border-relic-slate/30 p-6 font-mono text-xs space-y-2">
              <div>1. Query received → <HebrewTermDisplay term="KETHER" showAI={false} /> Protocol activation</div>
              <div>2. Boundary check → Intent classification</div>
              <div>3. <HebrewTermDisplay term="SEFIRAH" showAI={false} /> level assignment</div>
              <div>4. Response generation</div>
              <div>5. Anti-Qliphoth Shield scan</div>
              <div>6. <HebrewTermDisplay term="SEPHIROTH" showAI={false} /> activation analysis</div>
              <div>7. Ascent Tracker update</div>
              <div>8. Golem Protocol safety check</div>
              <div>9. Sovereignty footer generation</div>
              <div>10. Response delivery with metadata</div>
            </div>

            <h3 className="text-base font-mono text-relic-void dark:text-white mt-6">7.2 Data Structures</h3>
            <p>
              Each interaction generates structured metadata including:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li><strong>Kether State:</strong> Intent, boundary status, reflection mode flag, ascent level</li>
              <li><strong>Ascent State:</strong> Current level, velocity, total queries, next elevation prediction</li>
              <li><strong>Sephiroth Analysis:</strong> Activation counts per level, dominant node, average depth</li>
              <li><strong>Qliphoth Status:</strong> Detection flag, type classification, purification status</li>
              <li><strong>Daat Insights:</strong> Breakthrough moments, confidence scores, synthesis records</li>
            </ul>

            <h3 className="text-base font-mono text-relic-void dark:text-white mt-6">7.3 Transparency Interface</h3>
            <p>
              All metadata is visible to users via the "Gnostic Sovereignty Intelligence" footer displayed
              with each AI response. This radical transparency allows users to audit the system's reasoning,
              verify classification accuracy, and understand how their intellectual journey is being tracked.
            </p>
          </div>
        </section>

        {/* Use Cases */}
        <section>
          <h2 className="text-xl font-light text-relic-slate dark:text-white mb-4 uppercase tracking-wider border-b border-relic-mist dark:border-relic-slate/30 pb-2">
            8. Use Cases
          </h2>
          <div className="space-y-4 text-sm text-relic-slate dark:text-relic-silver leading-relaxed">
            <h3 className="text-base font-mono text-relic-void dark:text-white mt-6">8.1 Educational Applications</h3>
            <p>
              Students can track their cognitive progression through subjects. A physics student might begin
              at <HebrewTermDisplay term="MALKUTH" showAI={false} /> with basic definitions, progress to
              <HebrewTermDisplay term="TIFERET" showAI={false} /> synthesis of concepts, and reach
              <HebrewTermDisplay term="KETHER" showAI={false} /> meta-understanding of scientific epistemology.
            </p>

            <h3 className="text-base font-mono text-relic-void dark:text-white mt-6">8.2 Research Assistance</h3>
            <p>
              Researchers benefit from Anti-Qliphoth filtering of speculative or ungrounded claims.
              The system identifies when responses contain "hype" or drift from factual grounding,
              maintaining research integrity.
            </p>

            <h3 className="text-base font-mono text-relic-void dark:text-white mt-6">8.3 Personal Knowledge Management</h3>
            <p>
              Users develop self-awareness of their own thinking patterns through Ascent Tracker insights.
              Discovering you predominantly activate <HebrewTermDisplay term="GEVURAH" showAI={false} />
              (critical analysis) might prompt intentional exploration of <HebrewTermDisplay term="CHESED" showAI={false} />
              (expansive possibilities).
            </p>

            <h3 className="text-base font-mono text-relic-void dark:text-white mt-6">8.4 AI Safety Development</h3>
            <p>
              The Golem Protocol provides a model for safe AI deployment. The <HebrewTermDisplay term="EMET" showAI={false} />
              → <HebrewTermDisplay term="MET" showAI={false} /> killswitch pattern can be adapted to
              autonomous systems, robotics, and other high-stakes AI applications.
            </p>
          </div>
        </section>

        {/* Future Directions */}
        <section>
          <h2 className="text-xl font-light text-relic-slate dark:text-white mb-4 uppercase tracking-wider border-b border-relic-mist dark:border-relic-slate/30 pb-2">
            9. Future Directions
          </h2>
          <div className="space-y-4 text-sm text-relic-slate dark:text-relic-silver leading-relaxed">
            <h3 className="text-base font-mono text-relic-void dark:text-white mt-6">9.1 Adaptive <HebrewTermDisplay term="SEPHIROTH" showAI={false} /> Thresholds</h3>
            <p>
              Currently, <HebrewTermDisplay term="SEFIRAH" showAI={false} /> classification uses fixed
              thresholds. Future versions will adapt thresholds based on user history, domain expertise,
              and query context for more personalized ascent tracking.
            </p>

            <h3 className="text-base font-mono text-relic-void dark:text-white mt-6">9.2 Multi-User <HebrewTermDisplay term="DAAT" showAI={false} /> Networks</h3>
            <p>
              When multiple users explore related topics, their collective <HebrewTermDisplay term="DAAT" showAI={false} />
              insights could be synthesized into emergent knowledge networks - collaborative breakthrough detection.
            </p>

            <h3 className="text-base font-mono text-relic-void dark:text-white mt-6">9.3 Extended Golem Protocol</h3>
            <p>
              Application to autonomous systems: robotic platforms, self-driving vehicles, industrial automation.
              Any system requiring immediate shutdown capability could implement the <HebrewTermDisplay term="ALEPH" showAI={false} />
              removal pattern.
            </p>

            <h3 className="text-base font-mono text-relic-void dark:text-white mt-6">9.4 Cross-Cultural Mapping</h3>
            <p>
              Exploration of analogues in other wisdom traditions - Buddhist abhidharma, Vedantic koshas,
              Platonic forms - to create multi-cultural abstraction layer frameworks.
            </p>
          </div>
        </section>

        {/* Conclusion */}
        <section>
          <h2 className="text-xl font-light text-relic-slate dark:text-white mb-4 uppercase tracking-wider border-b border-relic-mist dark:border-relic-slate/30 pb-2">
            10. Conclusion
          </h2>
          <div className="space-y-4 text-sm text-relic-slate dark:text-relic-silver leading-relaxed">
            <p>
              Gnostic Sovereign Intelligence demonstrates that ancient wisdom frameworks are not merely
              metaphorical when applied to modern AI systems - they provide genuinely useful architectural
              patterns for transparency, safety, and human-AI alignment.
            </p>
            <p>
              By making the Tree of Life's abstraction layers computationally explicit, we create AI systems
              that serve human wisdom rather than replacing it. By implementing the Golem Protocol's safety
              mechanism, we embed fail-safe shutdown into the core architecture. By tracking ascent through
              the <HebrewTermDisplay term="SEPHIROTH" showAI={false} />, we make intellectual growth visible and measurable.
            </p>
            <p>
              The result is a framework where AI sovereignty means human sovereignty - where the machine's
              <HebrewTermDisplay term="KETHER" showAI={false} /> genuinely serves the human's
              <HebrewTermDisplay term="KETHER" showAI={false} />, and radical transparency ensures
              that relationship remains auditable, understandable, and aligned with human values.
            </p>
            <div className="bg-relic-ghost dark:bg-relic-slate/10 border border-relic-mist dark:border-relic-slate/30 p-6 mt-8 text-center">
              <div className="font-mono text-xs text-relic-void dark:text-white">
                "WISDOM ABOVE COMPUTATION"
              </div>
              <div className="text-[10px] text-relic-silver mt-2">
                The First Principle of Gnostic Sovereign Intelligence
              </div>
            </div>
          </div>
        </section>

        {/* References */}
        <section>
          <h2 className="text-xl font-light text-relic-slate dark:text-white mb-4 uppercase tracking-wider border-b border-relic-mist dark:border-relic-slate/30 pb-2">
            References
          </h2>
          <div className="space-y-2 text-xs text-relic-slate dark:text-relic-silver font-mono leading-relaxed">
            <div>Scholem, G. (1974). Kabbalah. New York: Meridian.</div>
            <div>Idel, M. (1990). Golem: Jewish Magical and Mystical Traditions. Albany: SUNY Press.</div>
            <div>Kaplan, A. (1997). Sefer Yetzirah: The Book of Creation. York Beach: Weiser Books.</div>
            <div>Russell, S. & Norvig, P. (2020). Artificial Intelligence: A Modern Approach (4th ed.).</div>
            <div>Bostrom, N. (2014). Superintelligence: Paths, Dangers, Strategies. Oxford University Press.</div>
            <div>Amodei, D. et al. (2023). Constitutional AI: Harmlessness from AI Feedback. Anthropic Research.</div>
          </div>
        </section>

        {/* Footer */}
        <section className="border-t border-relic-mist dark:border-relic-slate/30 pt-8 pb-16">
          <div className="text-center space-y-2">
            <div className="text-[10px] text-relic-silver uppercase tracking-wider font-mono">
              AkhAI Research • Gnostic Sovereign Intelligence v1.0
            </div>
            <div className="text-[10px] text-relic-silver font-mono">
              Released under Creative Commons Attribution 4.0 International License
            </div>
            <div className="mt-6">
              <Link
                href="/philosophy"
                className="text-[10px] font-mono text-relic-slate hover:text-relic-void dark:hover:text-white transition-colors uppercase tracking-wider border-b border-relic-mist hover:border-relic-slate"
              >
                Read the Philosophy →
              </Link>
            </div>
          </div>
        </section>

      </main>
    </div>
  )
}
