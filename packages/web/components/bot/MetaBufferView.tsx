'use client'

import type { MetaBuffer } from '@akhai/core'

interface Props {
  metaBuffers: MetaBuffer[]
  onMetaBufferSelect?: (metaBuffer: MetaBuffer) => void
}

export function MetaBufferView({ metaBuffers, onMetaBufferSelect }: Props) {
  if (metaBuffers.length === 0) return null

  return (
    <div className="border-t border-relic-mist py-6">
      <h3 className="text-xs uppercase tracking-widest text-relic-silver mb-4">
        distilled knowledge (meta-buffers)
      </h3>

      <div className="space-y-4">
        {metaBuffers.map((mb, index) => (
          <button
            key={index}
            onClick={() => onMetaBufferSelect?.(mb)}
            className="w-full bg-relic-ghost/30 p-4 hover:bg-relic-ghost/50 transition-colors text-left"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-relic-silver font-mono uppercase tracking-widest">
                meta buffer {index + 1}
              </span>
              <div className="flex items-center gap-3 text-xs text-relic-silver/50 font-mono">
                <span>conf: {(mb.confidence * 100).toFixed(0)}%</span>
                <span className="text-relic-void">−{mb.tokensSaved} tokens</span>
              </div>
            </div>

            {/* Summary */}
            <div className="mb-3">
              <p className="text-sm text-relic-slate leading-relaxed">
                {mb.summary}
              </p>
            </div>

            {/* Template */}
            {mb.template && (
              <div className="mb-3 p-2 bg-relic-white/50 border-l-2 border-relic-silver">
                <span className="text-xs text-relic-silver uppercase tracking-widest">template</span>
                <p className="text-xs text-relic-slate mt-1 font-mono">
                  {mb.template}
                </p>
              </div>
            )}

            {/* Key Insights */}
            {mb.keyInsights.length > 0 && (
              <div>
                <span className="text-xs text-relic-silver uppercase tracking-widest">
                  key insights ({mb.keyInsights.length})
                </span>
                <ul className="mt-2 space-y-1">
                  {mb.keyInsights.map((insight, i) => (
                    <li key={i} className="text-xs text-relic-slate font-light flex items-start gap-2">
                      <span className="text-relic-silver flex-shrink-0">→</span>
                      <span>{insight}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Metadata */}
            <div className="mt-3 pt-3 border-t border-relic-mist">
              <div className="flex items-center gap-4 text-xs text-relic-silver/50 font-mono">
                <span>sources: {mb.sourceThoughtIds.length}</span>
                <span>
                  {new Date(mb.timestamp).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Summary Stats */}
      <div className="mt-4 pt-4 border-t border-relic-mist">
        <div className="grid grid-cols-3 gap-4 text-xs font-mono">
          <div>
            <span className="text-relic-silver uppercase tracking-widest">distillations</span>
            <p className="text-relic-slate mt-1">{metaBuffers.length}</p>
          </div>
          <div>
            <span className="text-relic-silver uppercase tracking-widest">total insights</span>
            <p className="text-relic-slate mt-1">
              {metaBuffers.reduce((sum, mb) => sum + mb.keyInsights.length, 0)}
            </p>
          </div>
          <div>
            <span className="text-relic-silver uppercase tracking-widest">tokens saved</span>
            <p className="text-relic-slate mt-1">
              {metaBuffers.reduce((sum, mb) => sum + mb.tokensSaved, 0)}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
