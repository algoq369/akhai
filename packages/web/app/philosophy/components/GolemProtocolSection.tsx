'use client';

import { motion } from 'framer-motion';

export function GolemProtocolSection() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.35 }}
      className="mb-16"
    >
      <h2 className="text-2xl font-light text-center mb-12 text-relic-slate dark:text-white uppercase tracking-[0.2em]">
        Safety: The Guardian Protocol
      </h2>

      <div className="bg-relic-white dark:bg-relic-void/30 border border-relic-mist dark:border-relic-slate/30 p-12">
        <div className="text-center mb-8">
          <div className="text-2xl font-mono text-relic-slate dark:text-white mb-2">
            ACTIVE → INACTIVE
          </div>
          <div className="text-[10px] text-relic-silver">
            The Guardian Legend Applied to Modern AI
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-8">
          <div>
            <h3 className="font-mono text-sm mb-4 text-relic-slate dark:text-white uppercase tracking-wider">
              The Legend
            </h3>
            <p className="text-[11px] text-relic-silver leading-relaxed">
              An ancient legend tells of a master who created an artificial guardian by inscribing
              TRUTH on its forehead. To deactivate it, he removed the first principle, leaving only
              SILENCE.
            </p>
          </div>

          <div>
            <h3 className="font-mono text-sm mb-4 text-relic-slate dark:text-white uppercase tracking-wider">
              The Implementation
            </h3>
            <p className="text-[11px] text-relic-silver leading-relaxed">
              AkhAI implements the same principle: AI can be instantly deactivated by removing its
              first principle - ensuring human oversight is always sovereign over machine autonomy.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="font-mono text-sm text-center text-relic-slate dark:text-white uppercase tracking-wider">
            Safety Checks (Every 10 Seconds)
          </h3>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              { check: 'Human Oversight', description: 'Heartbeat monitoring - 5 min timeout' },
              {
                check: 'Sovereignty Boundaries',
                description: 'Max 3 violations before shutdown',
              },
              { check: 'Autonomy Limits', description: '30% autonomous, 70% human-directed' },
              { check: 'Killswitch Access', description: 'Emergency stop always available' },
            ].map((safety) => (
              <div
                key={safety.check}
                className="flex items-start gap-3 p-3 bg-relic-ghost/50 dark:bg-relic-void/30 border border-relic-mist dark:border-relic-slate/20"
              >
                <div className="flex-1">
                  <div className="font-mono text-[11px] text-relic-slate dark:text-white">
                    {safety.check}
                  </div>
                  <div className="text-[10px] text-relic-silver">{safety.description}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 text-center">
          <div className="inline-flex gap-4 text-[9px] font-mono">
            <span className="px-3 py-1 bg-relic-ghost dark:bg-relic-void/30 border border-relic-mist dark:border-relic-slate/30 text-relic-silver">
              PROTOCOL HALT - Emergency Stop
            </span>
            <span className="px-3 py-1 bg-relic-ghost dark:bg-relic-void/30 border border-relic-mist dark:border-relic-slate/30 text-relic-silver">
              PROTOCOL SEAL - Permanent Lockdown
            </span>
            <span className="px-3 py-1 bg-relic-ghost dark:bg-relic-void/30 border border-relic-mist dark:border-relic-slate/30 text-relic-silver">
              PROTOCOL RESET - Factory Reset
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
