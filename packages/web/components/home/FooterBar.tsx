'use client'

import FinanceBanner from '@/components/FinanceBanner'
import SuperSaiyanIcon from '@/components/SuperSaiyanIcon'
import NavigationMenu from '@/components/NavigationMenu'
import { useSettingsStore } from '@/lib/stores/settings-store'

interface FooterBarProps {
  user: any
  showLayerDashboard: boolean
  setShowLayerDashboard: (v: boolean) => void
  onMindMapClick: () => void
}

export default function FooterBar({ user, showLayerDashboard, setShowLayerDashboard, onMindMapClick }: FooterBarProps) {
  const { settings } = useSettingsStore()

  return (
    <footer className="fixed bottom-0 left-0 right-0 z-50 border-t border-relic-mist/20 dark:border-relic-slate/10 bg-relic-white/95 dark:bg-relic-void/95 backdrop-blur-sm" style={{ height: 28, fontFamily: "'JetBrains Mono', ui-monospace, monospace" }}>
      <div className="w-full h-full px-3 flex items-center justify-between">
          {/* Left side - description text */}
          <span className="text-[11px] text-relic-silver/60 dark:text-relic-ghost/40 whitespace-nowrap">
            self aware — autonomous intelligence
          </span>

          {/* Center - Finance ticker */}
          <div className="flex-1 overflow-hidden mx-2">
            <FinanceBanner inline />
          </div>

          {/* Right side - navigation and toggles */}
          <div className="flex items-center gap-2 pr-0">
            {/* Instinct Mode Toggle */}
            <button
              onClick={() => {
                const { settings, setInstinctMode } = useSettingsStore.getState();
                setInstinctMode(!settings.instinctMode);
                import('@/lib/analytics').then(({ trackInstinctModeToggled }) => trackInstinctModeToggled(!settings.instinctMode))
              }}
              className="flex items-center gap-1 text-[11px] font-mono text-relic-silver dark:text-relic-ghost hover:text-relic-slate dark:hover:text-white transition-colors group"
            >
              <SuperSaiyanIcon size={13} active={settings.instinctMode} />
              <span className={settings.instinctMode ? 'text-relic-void dark:text-white' : ''}>
                instinct
              </span>
            </button>

            {/* AI Config Console Toggle */}
            <button
              onClick={() => setShowLayerDashboard(!showLayerDashboard)}
              className="flex items-center gap-1 text-[11px] font-mono text-relic-silver dark:text-relic-ghost hover:text-relic-slate dark:hover:text-white transition-colors group"
            >
              <span
                className="text-[11px] transition-all"
                style={{
                  color: showLayerDashboard ? '#a855f7' : '#94a3b8',
                  filter: showLayerDashboard ? 'drop-shadow(0 0 3px #a855f7)' : 'none',
                }}
              >
                ✦
              </span>
              <span className={showLayerDashboard ? 'text-relic-void dark:text-white' : ''}>
                ai config
              </span>
            </button>

            <NavigationMenu
              user={user}
              onMindMapClick={onMindMapClick}
            />
          </div>
      </div>
    </footer>
  )
}
