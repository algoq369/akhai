'use client'

import { useState, useEffect } from 'react'
import { useSettingsStore } from '@/lib/stores/settings-store'
import DarkModeToggle from '@/components/DarkModeToggle'

export default function SettingsPage() {
  const { settings, updateAppearance, updateMethodology, updateFeatures, updatePrivacy, clearAllData } = useSettingsStore()
  const [isDark, setIsDark] = useState(false)

  // Detect dark mode on client-side only
  useEffect(() => {
    setIsDark(document.documentElement.classList.contains('dark'))

    // Watch for dark mode changes
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'))
    })

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    })

    return () => observer.disconnect()
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-relic-void dark:to-relic-void/90">
      <header className="border-b border-slate-200 dark:border-relic-slate/30 bg-white/80 dark:bg-relic-void/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <a href="/" className="text-sm font-mono text-slate-400 dark:text-relic-ghost hover:text-slate-600 dark:hover:text-white transition-colors">
              ← back
            </a>
            <h1 className="text-base font-light tracking-wide text-slate-700 dark:text-white">
              Settings
            </h1>
          </div>
          <DarkModeToggle />
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-12">
        <div className="bg-white dark:bg-relic-void/50 border border-relic-mist dark:border-relic-slate/30 p-8 font-mono">
          {/* Header */}
          <div className="mb-10">
            <div className="text-relic-void dark:text-white text-sm mb-2 tracking-wide">◇ SETTINGS</div>
            <div className="text-relic-mist dark:text-relic-slate text-[10px]">─────────────────────────────────────────</div>
          </div>

          {/* APPEARANCE */}
          <section className="mb-8">
            <div className="text-relic-slate dark:text-relic-ghost text-[10px] uppercase tracking-[0.2em] mb-3">▸ APPEARANCE</div>

            <div className="ml-4 space-y-2.5">
              {/* Font Size */}
              <div className="flex items-center gap-4">
                <span className="text-relic-silver dark:text-relic-ghost text-[9px] w-20">font size</span>
                <div className="flex gap-2.5">
                  {(['sm', 'md', 'lg'] as const).map((size) => (
                    <span
                      key={size}
                      onClick={() => updateAppearance('fontSize', size)}
                      className="text-[9px] cursor-pointer transition-colors"
                      style={{ color: settings.appearance.fontSize === size ? (isDark ? '#ffffff' : '#18181b') : '#94a3b8' }}
                    >
                      {settings.appearance.fontSize === size ? '●' : '○'} {size}
                    </span>
                  ))}
                </div>
              </div>

              {/* Compact */}
              <div className="flex items-center gap-4">
                <span className="text-relic-silver dark:text-relic-ghost text-[9px] w-20">compact</span>
                <span
                  onClick={() => updateAppearance('compactView', !settings.appearance.compactView)}
                  className="text-[9px] cursor-pointer hover:text-relic-void dark:hover:text-white transition-colors text-relic-slate dark:text-relic-ghost"
                >
                  [{settings.appearance.compactView ? '●' : '○'}] {settings.appearance.compactView ? 'on' : 'off'}
                </span>
              </div>

              {/* Show Layer Origins */}
              <div className="flex items-center gap-4">
                <span className="text-relic-silver dark:text-relic-ghost text-[9px] w-20">show origins</span>
                <span
                  onClick={() => updateAppearance('showLayerOrigins', !settings.appearance.showLayerOrigins)}
                  className="text-[9px] cursor-pointer hover:text-relic-void dark:hover:text-white transition-colors text-relic-slate dark:text-relic-ghost"
                >
                  [{settings.appearance.showLayerOrigins ? '●' : '○'}] {settings.appearance.showLayerOrigins ? 'on' : 'off'}
                </span>
              </div>
            </div>
          </section>

          {/* METHODOLOGY */}
          <section className="mb-8">
            <div className="text-relic-slate dark:text-relic-ghost text-[10px] uppercase tracking-[0.2em] mb-3">▸ METHODOLOGY</div>

            <div className="ml-4 space-y-2.5">
              {/* Default Method */}
              <div className="flex items-start gap-4">
                <span className="text-relic-silver dark:text-relic-ghost text-[9px] w-20 pt-0.5">default</span>
                <div className="flex flex-wrap gap-2">
                  {(['auto', 'direct', 'cod', 'bot', 'react', 'pot', 'gtp'] as const).map((method) => (
                    <span
                      key={method}
                      onClick={() => updateMethodology('defaultMethod', method)}
                      className="text-[9px] cursor-pointer transition-colors"
                      style={{ color: settings.methodology.defaultMethod === method ? (isDark ? '#ffffff' : '#18181b') : '#94a3b8' }}
                    >
                      {settings.methodology.defaultMethod === method ? '●' : '○'} {method}
                    </span>
                  ))}
                </div>
              </div>

              {/* Auto-route */}
              <div className="flex items-center gap-4">
                <span className="text-relic-silver dark:text-relic-ghost text-[9px] w-20">auto-route</span>
                <span
                  onClick={() => updateMethodology('autoRoute', !settings.methodology.autoRoute)}
                  className="text-[9px] cursor-pointer hover:text-relic-void dark:hover:text-white transition-colors text-relic-slate dark:text-relic-ghost"
                >
                  [{settings.methodology.autoRoute ? '●' : '○'}] {settings.methodology.autoRoute ? 'on' : 'off'}
                </span>
              </div>

              {/* Indicator */}
              <div className="flex items-center gap-4">
                <span className="text-relic-silver dark:text-relic-ghost text-[9px] w-20">indicator</span>
                <span
                  onClick={() => updateMethodology('showIndicator', !settings.methodology.showIndicator)}
                  className="text-[9px] cursor-pointer hover:text-relic-void dark:hover:text-white transition-colors text-relic-slate dark:text-relic-ghost"
                >
                  [{settings.methodology.showIndicator ? '●' : '○'}] {settings.methodology.showIndicator ? 'show' : 'hide'}
                </span>
              </div>
            </div>
          </section>

          {/* FEATURES */}
          <section className="mb-8">
            <div className="text-relic-slate dark:text-relic-ghost text-[10px] uppercase tracking-[0.2em] mb-3">▸ FEATURES</div>

            <div className="ml-4 space-y-2.5">
              {/* Depth */}
              <div className="flex items-center gap-4">
                <span className="text-relic-silver dark:text-relic-ghost text-[9px] w-20">depth</span>
                <div className="flex items-center gap-5">
                  <span
                    onClick={() => updateFeatures('depth', !settings.features.depth)}
                    className="text-[9px] cursor-pointer hover:text-relic-void dark:hover:text-white transition-colors text-relic-slate dark:text-relic-ghost"
                  >
                    [{settings.features.depth ? '●' : '○'}] {settings.features.depth ? 'on' : 'off'}
                  </span>
                  {settings.features.depth && (
                    <div className="flex gap-2.5 items-center">
                      <span className="text-relic-silver dark:text-relic-ghost text-[9px]">density:</span>
                      {(['min', 'std', 'max'] as const).map((density) => (
                        <span
                          key={density}
                          onClick={() => updateFeatures('depthDensity', density)}
                          className="text-[9px] cursor-pointer transition-colors"
                          style={{ color: settings.features.depthDensity === density ? (isDark ? '#ffffff' : '#18181b') : '#94a3b8' }}
                        >
                          {settings.features.depthDensity === density ? '●' : '○'} {density}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Side Canal */}
              <div className="flex items-center gap-4">
                <span className="text-relic-silver dark:text-relic-ghost text-[9px] w-20">side canal</span>
                <span
                  onClick={() => updateFeatures('sideCanal', !settings.features.sideCanal)}
                  className="text-[9px] cursor-pointer hover:text-relic-void dark:hover:text-white transition-colors text-relic-slate dark:text-relic-ghost"
                >
                  [{settings.features.sideCanal ? '●' : '○'}] {settings.features.sideCanal ? 'on' : 'off'}
                </span>
              </div>

              {/* Mind Map */}
              <div className="flex items-center gap-4">
                <span className="text-relic-silver dark:text-relic-ghost text-[9px] w-20">mind map</span>
                <span
                  onClick={() => updateFeatures('mindMap', !settings.features.mindMap)}
                  className="text-[9px] cursor-pointer hover:text-relic-void dark:hover:text-white transition-colors text-relic-slate dark:text-relic-ghost"
                >
                  [{settings.features.mindMap ? '●' : '○'}] {settings.features.mindMap ? 'on' : 'off'}
                </span>
              </div>

              {/* Quickchat */}
              <div className="flex items-center gap-4">
                <span className="text-relic-silver dark:text-relic-ghost text-[9px] w-20">quickchat</span>
                <span className="text-relic-mist dark:text-relic-slate text-[9px]">⌘⇧Q</span>
              </div>
            </div>
          </section>

          {/* PRIVACY */}
          <section className="mb-8">
            <div className="text-relic-slate dark:text-relic-ghost text-[10px] uppercase tracking-[0.2em] mb-3">▸ PRIVACY</div>

            <div className="ml-4 space-y-2.5">
              {/* History */}
              <div className="flex items-center gap-4">
                <span className="text-relic-silver dark:text-relic-ghost text-[9px] w-20">history</span>
                <span
                  onClick={() => updatePrivacy('saveHistory', !settings.privacy.saveHistory)}
                  className="text-[9px] cursor-pointer hover:text-relic-void dark:hover:text-white transition-colors text-relic-slate dark:text-relic-ghost"
                >
                  [{settings.privacy.saveHistory ? '●' : '○'}] {settings.privacy.saveHistory ? 'save' : 'off'}
                </span>
              </div>

              {/* Analytics */}
              <div className="flex items-center gap-4">
                <span className="text-relic-silver dark:text-relic-ghost text-[9px] w-20">analytics</span>
                <span
                  onClick={() => updatePrivacy('analytics', !settings.privacy.analytics)}
                  className="text-[9px] cursor-pointer hover:text-relic-void dark:hover:text-white transition-colors text-relic-slate dark:text-relic-ghost"
                >
                  [{settings.privacy.analytics ? '●' : '○'}] {settings.privacy.analytics ? 'on' : 'off'}
                </span>
              </div>

              {/* Clear all data */}
              <div className="flex items-center gap-4">
                <span className="text-relic-silver dark:text-relic-ghost text-[9px] w-20"></span>
                <span
                  onClick={() => {
                    if (confirm('Clear all data? This cannot be undone.')) {
                      clearAllData()
                    }
                  }}
                  className="text-relic-silver dark:text-relic-ghost text-[9px] cursor-pointer hover:text-relic-void dark:hover:text-white transition-colors"
                >
                  ▹ clear all data
                </span>
              </div>
            </div>
          </section>

          {/* ACCOUNT */}
          <section className="mb-8">
            <div className="text-relic-slate dark:text-relic-ghost text-[10px] uppercase tracking-[0.2em] mb-3">▸ ACCOUNT</div>

            <div className="ml-4 space-y-2.5">
              {/* Tier */}
              <div className="flex items-center gap-4">
                <span className="text-relic-silver dark:text-relic-ghost text-[9px] w-20">tier</span>
                <span className="text-relic-void dark:text-white text-[9px] font-medium">{settings.account.tier}</span>
              </div>

              {/* Queries */}
              <div className="flex items-center gap-4">
                <span className="text-relic-silver dark:text-relic-ghost text-[9px] w-20">queries</span>
                <span className="text-relic-slate dark:text-relic-ghost text-[9px]">{settings.account.queriesUsedToday} today</span>
              </div>

              {/* Tokens */}
              <div className="flex items-center gap-4">
                <span className="text-relic-silver dark:text-relic-ghost text-[9px] w-20">tokens</span>
                <span className="text-relic-slate dark:text-relic-ghost text-[9px]">{settings.account.tokensUsed.toLocaleString()} used</span>
              </div>

              {/* Upgrade */}
              <div className="flex items-center gap-4">
                <span className="text-relic-silver dark:text-relic-ghost text-[9px] w-20"></span>
                <a
                  href="/pricing"
                  className="text-relic-silver dark:text-relic-ghost text-[9px] cursor-pointer hover:text-relic-void dark:hover:text-white transition-colors"
                >
                  ▹ upgrade to pro
                </a>
              </div>
            </div>
          </section>

          {/* Footer */}
          <div className="mt-12 pt-5 border-t border-relic-mist dark:border-relic-slate/30">
            <div className="text-relic-mist dark:text-relic-slate text-[10px] mb-1.5">─────────────────────────────────────────</div>
            <div className="text-relic-silver dark:text-relic-ghost text-[9px]">◈ powered by akhai intelligence</div>
          </div>
        </div>
      </main>
    </div>
  )
}
