'use client'

import { useState, useRef } from 'react'
import { useSettingsStore } from '@/lib/stores/settings-store'

interface ConversationConsoleProps {
  instinctMode: boolean
  onInstinctModeChange: (enabled: boolean) => void
  suggestions: boolean
  onSuggestionsChange: (enabled: boolean) => void
  audit: boolean
  onAuditChange: (enabled: boolean) => void
  mindmapConnector: boolean
  onMindmapConnectorChange: (enabled: boolean) => void
  sideCanalEnabled: boolean
  onSideCanalChange: (enabled: boolean) => void
  selectedModel: string
  onModelChange: (model: string) => void
  visualizationMode: 'off' | 'synthesis' | 'insight'
  onVisualizationChange: (mode: 'off' | 'synthesis' | 'insight') => void
  attachedFilesCount?: number
  onFilesClick?: () => void
}

const MODELS = ['claude', 'deepseek', 'mistral', 'grok', 'gtp']

export default function ConversationConsole({
  instinctMode, onInstinctModeChange,
  suggestions, onSuggestionsChange,
  audit, onAuditChange,
  mindmapConnector, onMindmapConnectorChange,
  sideCanalEnabled, onSideCanalChange,
  selectedModel, onModelChange,
  visualizationMode, onVisualizationChange,
  attachedFilesCount = 0,
  onFilesClick,
}: ConversationConsoleProps) {
  const [expanded, setExpanded] = useState(false)
  const { settings, setInstinctMode } = useSettingsStore()

  const features = [
    {
      key: 'instinct',
      on: settings.instinctMode,
      set: () => setInstinctMode(!settings.instinctMode)
    },
    { key: 'suggest', on: suggestions, set: onSuggestionsChange },
    { key: 'audit', on: audit, set: onAuditChange },
    { key: 'canal', on: sideCanalEnabled, set: onSideCanalChange },
  ]

  const activeCount = features.filter(f => f.on).length
  
  if (!expanded) {
    return (
      <button
        onClick={() => setExpanded(true)}
        className="flex items-center gap-1.5 text-[9px] font-mono text-relic-slate hover:text-relic-void transition-colors"
      >
        <span className={`w-1.5 h-1.5 rounded-full ${activeCount > 0 ? 'bg-emerald-500' : 'bg-relic-silver'}`} />
        <span>console ({activeCount})</span>
        <span className="text-relic-silver">↑</span>
      </button>
    )
  }
  
  return (
    <div className="flex items-center gap-3 text-[9px] font-mono text-relic-slate">
      {/* Features */}
      {features.map(({ key, on, set }) => (
        <button
          key={key}
          onClick={() => set(!on)}
          className={`transition-colors ${on ? 'text-emerald-500 font-medium' : 'hover:text-relic-void'}`}
        >
          {key}
        </button>
      ))}

      {/* File Attachment Button */}
      <button
        onClick={onFilesClick}
        className={`transition-colors ${attachedFilesCount > 0 ? 'text-blue-500 font-medium' : 'hover:text-relic-void'}`}
        title="Attach files"
      >
        files{attachedFilesCount > 0 && ` (${attachedFilesCount})`}
      </button>

      <span className="text-relic-mist">│</span>

      {/* Models */}
      {MODELS.map(m => (
        <button
          key={m}
          onClick={() => onModelChange(m)}
          className={`transition-colors ${selectedModel === m ? 'text-blue-500 font-medium' : 'hover:text-relic-void'}`}
        >
          {m}
        </button>
      ))}

      <button
        onClick={() => setExpanded(false)}
        className="text-relic-silver hover:text-relic-slate ml-1"
      >
        ↓
      </button>
    </div>
  )
}

export function InlineConsole({ onVisualize, count }: { onVisualize: () => void; count?: number }) {
  return (
    <button
      onClick={onVisualize}
      className="inline-flex items-center gap-1 text-[9px] font-mono text-relic-slate hover:text-purple-500 transition-colors"
    >
      <span className="w-1 h-1 rounded-full bg-purple-500" />
      visualize {count && `(${count})`}
    </button>
  )
}
