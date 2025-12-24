'use client'

import type { ThoughtNode } from '@akhai/core'

interface Props {
  thoughts: ThoughtNode[]
  onThoughtSelect?: (thought: ThoughtNode) => void
}

export function ThoughtBufferView({ thoughts, onThoughtSelect }: Props) {
  if (thoughts.length === 0) return null

  // Group thoughts by depth for hierarchical display
  const thoughtsByDepth: Record<number, ThoughtNode[]> = {}
  thoughts.forEach(thought => {
    if (!thoughtsByDepth[thought.depth]) {
      thoughtsByDepth[thought.depth] = []
    }
    thoughtsByDepth[thought.depth].push(thought)
  })

  const maxDepth = Math.max(...Object.keys(thoughtsByDepth).map(Number))

  // Stage symbols
  const stageSymbols: Record<string, string> = {
    initial: '○',
    expansion: '◇',
    refinement: '△',
    synthesis: '◉',
  }

  return (
    <div className="border-t border-relic-mist py-6">
      <h3 className="text-xs uppercase tracking-widest text-relic-silver mb-4">
        thought buffer
      </h3>

      <div className="space-y-3">
        {Object.entries(thoughtsByDepth).map(([depth, depthThoughts]) => (
          <div key={depth} className="space-y-1">
            <div className="text-xs text-relic-silver/50 font-mono">
              depth {depth}
            </div>

            {depthThoughts.map((thought) => (
              <button
                key={thought.id}
                onClick={() => onThoughtSelect?.(thought)}
                className="w-full flex items-start gap-3 p-3 hover:bg-relic-ghost/50 transition-colors text-left group"
                style={{ paddingLeft: `${12 + (Number(depth) * 16)}px` }}
              >
                {/* Stage Symbol */}
                <span className="text-relic-silver text-sm flex-shrink-0">
                  {stageSymbols[thought.metadata?.stage || 'initial']}
                </span>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-relic-slate leading-relaxed">
                    {thought.content}
                  </p>

                  {/* Metadata */}
                  <div className="flex items-center gap-3 mt-2 text-xs text-relic-silver/50 font-mono">
                    <span>conf: {(thought.confidence * 100).toFixed(0)}%</span>
                    {thought.metadata?.tokenCost && (
                      <span>tokens: {thought.metadata.tokenCost}</span>
                    )}
                    {thought.isOnSolutionPath && (
                      <span className="text-relic-void">✓ solution</span>
                    )}
                  </div>
                </div>

                {/* Confidence Bar */}
                <div className="flex-shrink-0 w-16 h-px bg-relic-mist relative self-center">
                  <div
                    className="absolute left-0 top-0 h-full bg-relic-slate group-hover:bg-relic-void transition-colors"
                    style={{ width: `${thought.confidence * 100}%` }}
                  />
                </div>
              </button>
            ))}
          </div>
        ))}
      </div>

      {/* Buffer Stats */}
      <div className="mt-4 pt-4 border-t border-relic-mist">
        <div className="grid grid-cols-3 gap-4 text-xs font-mono">
          <div>
            <span className="text-relic-silver uppercase tracking-widest">thoughts</span>
            <p className="text-relic-slate mt-1">{thoughts.length}</p>
          </div>
          <div>
            <span className="text-relic-silver uppercase tracking-widest">max depth</span>
            <p className="text-relic-slate mt-1">{maxDepth}</p>
          </div>
          <div>
            <span className="text-relic-silver uppercase tracking-widest">avg conf</span>
            <p className="text-relic-slate mt-1">
              {thoughts.length > 0
                ? Math.round((thoughts.reduce((sum, t) => sum + t.confidence, 0) / thoughts.length) * 100)
                : 0}%
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
