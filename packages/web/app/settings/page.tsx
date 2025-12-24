'use client'

import { useState } from 'react'

export default function SettingsPage() {
  const [triggers, setTriggers] = useState({ turnCount: 10, tokenCount: 8000, timeMinutes: 15 })

  return (
    <div className="min-h-screen bg-relic-white matrix-grid">
      <header className="border-b border-relic-mist/50">
        <div className="relic-container py-5">
          <a href="/" className="text-[10px] uppercase tracking-[0.3em] text-relic-silver hover:text-relic-slate">← akhai</a>
        </div>
      </header>

      <main className="relic-container py-10">
        <h1 className="text-xl font-light text-relic-void mb-10">settings</h1>

        <section className="mb-10">
          <h2 className="relic-label mb-5">grounding guard</h2>
          <div className="space-y-4 max-w-xs">
            <div>
              <label className="text-xs text-relic-slate block mb-1.5">turn count</label>
              <input type="number" value={triggers.turnCount} onChange={(e) => setTriggers(t => ({ ...t, turnCount: +e.target.value }))} className="relic-input w-24 text-sm py-2" />
            </div>
            <div>
              <label className="text-xs text-relic-slate block mb-1.5">token count</label>
              <input type="number" value={triggers.tokenCount} onChange={(e) => setTriggers(t => ({ ...t, tokenCount: +e.target.value }))} className="relic-input w-24 text-sm py-2" />
            </div>
            <div>
              <label className="text-xs text-relic-slate block mb-1.5">time (min)</label>
              <input type="number" value={triggers.timeMinutes} onChange={(e) => setTriggers(t => ({ ...t, timeMinutes: +e.target.value }))} className="relic-input w-24 text-sm py-2" />
            </div>
          </div>
        </section>

        <section>
          <h2 className="relic-label mb-5">providers</h2>
          <div className="space-y-2 text-xs">
            {['anthropic', 'deepseek', 'mistral', 'xai'].map(p => (
              <div key={p} className="flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-green-500/60" />
                <span className="text-relic-slate">{p}</span>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}
