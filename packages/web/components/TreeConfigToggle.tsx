'use client'

/**
 * Tree Configuration Toggle Button
 *
 * Floating button to open/close tree configuration panel
 */

import { useState } from 'react'
import TreeConfigurationPanel from './TreeConfigurationPanel'

export default function TreeConfigToggle() {
  const [showConfig, setShowConfig] = useState(false)

  return (
    <>
      {/* Floating Toggle Button */}
      <button
        onClick={() => setShowConfig(!showConfig)}
        className={`fixed top-20 right-4 px-3 py-1.5 text-xs font-mono border border-relic-mist bg-white hover:bg-relic-ghost transition-colors z-40 shadow-sm ${
          showConfig ? 'bg-purple-50 border-purple-300' : ''
        }`}
        title="Configure Tree Weights"
      >
        <span className={showConfig ? 'text-purple-700' : 'text-relic-slate'}>
          {showConfig ? '◆' : '◇'} Configure
        </span>
      </button>

      {/* Configuration Panel */}
      <TreeConfigurationPanel
        isOpen={showConfig}
        onClose={() => setShowConfig(false)}
        onConfigChange={(config) => {
          console.log('Configuration changed:', config.name)
          // TODO: Trigger re-analysis or show notification
        }}
      />

      {/* Backdrop */}
      {showConfig && (
        <div
          className="fixed inset-0 bg-black/10 z-40"
          onClick={() => setShowConfig(false)}
        />
      )}
    </>
  )
}
