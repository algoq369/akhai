'use client';

import type { SettingsTabProps } from './SettingsTab.types';

export default function SettingsTab({
  settings,
  user,
  updateAppearance,
  updateMethodology,
  updateFeatures,
  updatePrivacy,
  clearAllData,
}: SettingsTabProps) {
  return (
    <div className="bg-white dark:bg-relic-void/50 border border-relic-mist dark:border-relic-slate/30 p-8 font-mono">
      {/* Header */}
      <div className="mb-10">
        <div className="text-relic-void dark:text-white text-sm mb-2 tracking-wide">◇ SETTINGS</div>
        <div className="text-relic-mist dark:text-relic-slate text-[10px]">
          ─────────────────────────────────────────
        </div>
      </div>

      {/* APPEARANCE */}
      <section className="mb-8">
        <div className="text-relic-slate dark:text-relic-ghost text-[10px] uppercase tracking-[0.2em] mb-3">
          ▸ APPEARANCE
        </div>

        <div className="ml-4 space-y-2.5">
          {/* Font Size */}
          <div className="flex items-center gap-4">
            <span className="text-relic-silver dark:text-relic-ghost text-[9px] w-20">
              font size
            </span>
            <div className="flex gap-2.5">
              {(['sm', 'md', 'lg'] as const).map((size) => (
                <span
                  key={size}
                  onClick={() => updateAppearance('fontSize', size)}
                  className="text-[9px] cursor-pointer transition-colors"
                  style={{
                    color:
                      settings.appearance.fontSize === size
                        ? document.documentElement.classList.contains('dark')
                          ? '#ffffff'
                          : '#18181b'
                        : '#94a3b8',
                  }}
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
              [{settings.appearance.compactView ? '●' : '○'}]{' '}
              {settings.appearance.compactView ? 'on' : 'off'}
            </span>
          </div>
        </div>
      </section>

      {/* METHODOLOGY */}
      <section className="mb-8">
        <div className="text-relic-slate text-[10px] uppercase tracking-[0.2em] mb-3">
          ▸ METHODOLOGY
        </div>

        <div className="ml-4 space-y-2.5">
          {/* Default Method */}
          <div className="flex items-start gap-4">
            <span className="text-relic-silver text-[9px] w-20 pt-0.5">default</span>
            <div className="flex flex-wrap gap-2">
              {(['auto', 'direct', 'cod', 'sc', 'react', 'pas', 'tot'] as const).map((method) => (
                <span
                  key={method}
                  onClick={() => updateMethodology('defaultMethod', method)}
                  className="text-[9px] cursor-pointer transition-colors"
                  style={{
                    color: settings.methodology.defaultMethod === method ? '#18181b' : '#94a3b8',
                  }}
                >
                  {settings.methodology.defaultMethod === method ? '●' : '○'} {method}
                </span>
              ))}
            </div>
          </div>

          {/* Auto-route */}
          <div className="flex items-center gap-4">
            <span className="text-relic-silver text-[9px] w-20">auto-route</span>
            <span
              onClick={() => updateMethodology('autoRoute', !settings.methodology.autoRoute)}
              className="text-[9px] cursor-pointer hover:text-relic-void transition-colors text-relic-slate"
            >
              [{settings.methodology.autoRoute ? '●' : '○'}]{' '}
              {settings.methodology.autoRoute ? 'on' : 'off'}
            </span>
          </div>

          {/* Indicator */}
          <div className="flex items-center gap-4">
            <span className="text-relic-silver text-[9px] w-20">indicator</span>
            <span
              onClick={() =>
                updateMethodology('showIndicator', !settings.methodology.showIndicator)
              }
              className="text-[9px] cursor-pointer hover:text-relic-void transition-colors text-relic-slate"
            >
              [{settings.methodology.showIndicator ? '●' : '○'}]{' '}
              {settings.methodology.showIndicator ? 'show' : 'hide'}
            </span>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="mb-8">
        <div className="text-relic-slate text-[10px] uppercase tracking-[0.2em] mb-3">
          ▸ FEATURES
        </div>

        <div className="ml-4 space-y-2.5">
          {/* Depth */}
          <div className="flex items-center gap-4">
            <span className="text-relic-silver text-[9px] w-20">depth</span>
            <div className="flex items-center gap-5">
              <span
                onClick={() => updateFeatures('depth', !settings.features.depth)}
                className="text-[9px] cursor-pointer hover:text-relic-void transition-colors text-relic-slate"
              >
                [{settings.features.depth ? '●' : '○'}] {settings.features.depth ? 'on' : 'off'}
              </span>
              {settings.features.depth && (
                <div className="flex gap-2.5 items-center">
                  <span className="text-relic-silver text-[9px]">density:</span>
                  {(['min', 'std', 'max'] as const).map((density) => (
                    <span
                      key={density}
                      onClick={() => updateFeatures('depthDensity', density)}
                      className="text-[9px] cursor-pointer transition-colors"
                      style={{
                        color: settings.features.depthDensity === density ? '#18181b' : '#94a3b8',
                      }}
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
            <span className="text-relic-silver text-[9px] w-20">side canal</span>
            <span
              onClick={() => updateFeatures('sideCanal', !settings.features.sideCanal)}
              className="text-[9px] cursor-pointer hover:text-relic-void transition-colors text-relic-slate"
            >
              [{settings.features.sideCanal ? '●' : '○'}]{' '}
              {settings.features.sideCanal ? 'on' : 'off'}
            </span>
          </div>

          {/* Mind Map */}
          <div className="flex items-center gap-4">
            <span className="text-relic-silver text-[9px] w-20">mind map</span>
            <span
              onClick={() => updateFeatures('mindMap', !settings.features.mindMap)}
              className="text-[9px] cursor-pointer hover:text-relic-void transition-colors text-relic-slate"
            >
              [{settings.features.mindMap ? '●' : '○'}] {settings.features.mindMap ? 'on' : 'off'}
            </span>
          </div>

          {/* Quickchat */}
          <div className="flex items-center gap-4">
            <span className="text-relic-silver text-[9px] w-20">quickchat</span>
            <span className="text-relic-mist text-[9px]">⌘⇧Q</span>
          </div>
        </div>
      </section>

      {/* AI MODEL */}
      <section className="mb-8">
        <div className="text-relic-slate dark:text-relic-ghost text-[10px] uppercase tracking-[0.2em] mb-3">
          ▸ AI MODEL
        </div>

        <div className="ml-4 space-y-2.5">
          {/* Primary Model */}
          <div className="flex items-start gap-4">
            <span className="text-relic-silver dark:text-relic-ghost text-[9px] w-20 pt-0.5">
              primary
            </span>
            <div className="flex gap-3">
              {[
                { id: 'claude-opus-4-7', label: 'opus 4.7', cost: '$0.075/q' },
                { id: 'claude-haiku-4-5-20251001', label: 'haiku', cost: '$0.007/q' },
              ].map((model) => (
                <span
                  key={model.id}
                  onClick={() => {
                    // Update model config via settings store
                    const newConfig = { ...settings.modelConfig, motherBase: model.id };
                    // Save to localStorage directly for now
                    localStorage.setItem('akhai-primary-model', model.id);
                  }}
                  className="text-[9px] cursor-pointer transition-colors group"
                  style={{
                    color:
                      (settings.modelConfig?.motherBase || 'claude-opus-4-7') === model.id
                        ? document.documentElement.classList.contains('dark')
                          ? '#ffffff'
                          : '#18181b'
                        : '#94a3b8',
                  }}
                >
                  {(settings.modelConfig?.motherBase || 'claude-opus-4-7') === model.id ? '●' : '○'}{' '}
                  {model.label}
                  <span className="text-relic-silver/50 ml-1">{model.cost}</span>
                </span>
              ))}
            </div>
          </div>

          {/* Legend Mode */}
          <div className="flex items-center gap-4">
            <span className="text-relic-silver dark:text-relic-ghost text-[9px] w-20">
              legend mode
            </span>
            <span
              onClick={() => {
                const current = localStorage.getItem('legendMode') === 'true';
                localStorage.setItem('legendMode', String(!current));
                window.location.reload();
              }}
              className="text-[9px] cursor-pointer hover:text-relic-void dark:hover:text-white transition-colors text-relic-slate dark:text-relic-ghost"
            >
              [{localStorage.getItem('legendMode') === 'true' ? '●' : '○'}]{' '}
              {localStorage.getItem('legendMode') === 'true' ? 'on' : 'off'}
              <span className="text-relic-silver/50 ml-2">premium R&D features</span>
            </span>
          </div>
        </div>
      </section>

      {/* PRIVACY */}
      <section className="mb-8">
        <div className="text-relic-slate text-[10px] uppercase tracking-[0.2em] mb-3">
          ▸ PRIVACY
        </div>

        <div className="ml-4 space-y-2.5">
          {/* History */}
          <div className="flex items-center gap-4">
            <span className="text-relic-silver text-[9px] w-20">history</span>
            <span
              onClick={() => updatePrivacy('saveHistory', !settings.privacy.saveHistory)}
              className="text-[9px] cursor-pointer hover:text-relic-void transition-colors text-relic-slate"
            >
              [{settings.privacy.saveHistory ? '●' : '○'}]{' '}
              {settings.privacy.saveHistory ? 'save' : 'off'}
            </span>
          </div>

          {/* Analytics */}
          <div className="flex items-center gap-4">
            <span className="text-relic-silver text-[9px] w-20">analytics</span>
            <span
              onClick={() => updatePrivacy('analytics', !settings.privacy.analytics)}
              className="text-[9px] cursor-pointer hover:text-relic-void transition-colors text-relic-slate"
            >
              [{settings.privacy.analytics ? '●' : '○'}] {settings.privacy.analytics ? 'on' : 'off'}
            </span>
          </div>

          {/* Clear all data */}
          <div className="flex items-center gap-4">
            <span className="text-relic-silver text-[9px] w-20"></span>
            <span
              onClick={() => {
                if (confirm('Clear all data? This cannot be undone.')) {
                  clearAllData();
                }
              }}
              className="text-relic-silver text-[9px] cursor-pointer hover:text-relic-void transition-colors"
            >
              ▹ clear all data
            </span>
          </div>
        </div>
      </section>

      {/* SOCIAL CONNECTORS */}
      <section className="mb-8">
        <div className="text-relic-slate text-[10px] uppercase tracking-[0.2em] mb-3">
          ▸ SOCIAL CONNECTORS
        </div>
        <div className="ml-4 space-y-3">
          <div className="text-relic-silver text-[9px] mb-2">
            Connect social accounts to enable intelligence analysis of threads, videos, and content
          </div>

          {/* X (Twitter) */}
          <div className="py-2 border-b border-relic-mist">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-3">
                <span className="text-relic-slate text-[10px] font-medium">X (Twitter)</span>
                <span className="text-relic-silver text-[9px]">
                  {user.social_connections?.find((c) => c.platform === 'x')?.username
                    ? `@${user.social_connections.find((c) => c.platform === 'x')?.username}`
                    : 'No connection needed'}
                </span>
              </div>
              <span className="text-[9px] text-relic-silver">✓ URL analysis works</span>
            </div>
            <div className="text-[8px] text-relic-silver/70 ml-0">
              Note: X OAuth requires Twitter Basic tier ($100/mo). URL fetching works without
              connection.
            </div>
          </div>

          {/* Telegram */}
          <div className="flex items-center justify-between py-2 border-b border-relic-mist">
            <div className="flex items-center gap-3">
              <span className="text-relic-slate text-[10px] font-medium">Telegram</span>
              <span className="text-relic-silver text-[9px]">Not connected</span>
            </div>
            <button
              onClick={() => {
                // TODO: Telegram bot auth
                console.log('[Profile] Connect Telegram');
              }}
              className="text-[9px] text-relic-silver hover:text-relic-void transition-colors"
            >
              ● connect
            </button>
          </div>

          {/* GitHub */}
          <div className="flex items-center justify-between py-2 border-b border-relic-mist">
            <div className="flex items-center gap-3">
              <span className="text-relic-slate text-[10px] font-medium">GitHub</span>
              <span className="text-relic-silver text-[9px]">
                {user.github_username ? `@${user.github_username}` : 'Not connected'}
              </span>
            </div>
            <button
              onClick={() => {
                if (user.github_username) {
                  // Disconnect
                  console.log('[Profile] Disconnect GitHub');
                } else {
                  // Connect via OAuth
                  window.location.href = '/api/auth/github';
                }
              }}
              className="text-[9px] text-relic-silver hover:text-relic-void transition-colors"
            >
              {user.github_username ? '○ disconnect' : '● connect'}
            </button>
          </div>

          {/* Reddit */}
          <div className="flex items-center justify-between py-2 border-b border-relic-mist">
            <div className="flex items-center gap-3">
              <span className="text-relic-slate text-[10px] font-medium">Reddit</span>
              <span className="text-relic-silver text-[9px]">Not connected</span>
            </div>
            <button
              onClick={() => {
                console.log('[Profile] Connect Reddit');
              }}
              className="text-[9px] text-relic-silver hover:text-relic-void transition-colors"
            >
              ● connect
            </button>
          </div>

          {/* Mastodon */}
          <div className="flex items-center justify-between py-2 border-b border-relic-mist">
            <div className="flex items-center gap-3">
              <span className="text-relic-slate text-[10px] font-medium">Mastodon</span>
              <span className="text-relic-silver text-[9px]">Not connected</span>
            </div>
            <button
              onClick={() => {
                console.log('[Profile] Connect Mastodon');
              }}
              className="text-[9px] text-relic-silver hover:text-relic-void transition-colors"
            >
              ● connect
            </button>
          </div>

          {/* YouTube */}
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-3">
              <span className="text-relic-slate text-[10px] font-medium">YouTube</span>
              <span className="text-relic-silver text-[9px]">Not connected</span>
            </div>
            <button
              onClick={() => {
                console.log('[Profile] Connect YouTube');
              }}
              className="text-[9px] text-relic-silver hover:text-relic-void transition-colors"
            >
              ● connect
            </button>
          </div>
        </div>
      </section>

      {/* ACCOUNT */}
      <section className="mb-8">
        <div className="text-relic-slate text-[10px] uppercase tracking-[0.2em] mb-3">
          ▸ ACCOUNT
        </div>

        <div className="ml-4 space-y-2.5">
          {/* Tier */}
          <div className="flex items-center gap-4">
            <span className="text-relic-silver text-[9px] w-20">tier</span>
            <span className="text-relic-void text-[9px] font-medium">{settings.account.tier}</span>
          </div>

          {/* Queries */}
          <div className="flex items-center gap-4">
            <span className="text-relic-silver text-[9px] w-20">queries</span>
            <span className="text-relic-slate text-[9px]">
              {settings.account.queriesUsedToday} today
            </span>
          </div>

          {/* Tokens */}
          <div className="flex items-center gap-4">
            <span className="text-relic-silver text-[9px] w-20">tokens</span>
            <span className="text-relic-slate text-[9px]">
              {settings.account.tokensUsed.toLocaleString()} used
            </span>
          </div>

          {/* Upgrade */}
          <div className="flex items-center gap-4">
            <span className="text-relic-silver text-[9px] w-20"></span>
            <a
              href="/pricing"
              className="text-relic-silver text-[9px] cursor-pointer hover:text-relic-void transition-colors"
            >
              ▹ upgrade to pro
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <div className="mt-12 pt-5 border-t border-relic-mist">
        <div className="text-relic-mist text-[10px] mb-1.5">
          ─────────────────────────────────────────
        </div>
        <div className="text-relic-silver text-[9px]">◈ powered by akhai intelligence</div>
      </div>
    </div>
  );
}
