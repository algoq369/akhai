'use client'

import type { DistillationStrategy } from '@akhai/core'

interface Props {
  isDistilling: boolean
  bufferSize: number
  maxBufferSize: number
  strategy?: DistillationStrategy
  progress?: number
}

export function DistillationProgress({
  isDistilling,
  bufferSize,
  maxBufferSize,
  strategy = 'hierarchical',
  progress = 0,
}: Props) {
  const strategyLabels: Record<DistillationStrategy, string> = {
    summarize: 'summarizing thoughts',
    template: 'extracting template',
    prune: 'pruning low-confidence',
    cluster: 'clustering similar thoughts',
    hierarchical: 'creating hierarchy',
  }

  if (!isDistilling && bufferSize < maxBufferSize) return null

  return (
    <div className="border-t border-relic-mist py-6">
      <div className="bg-relic-ghost/30 p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-xs uppercase tracking-widest text-relic-silver">
              {isDistilling ? 'distilling...' : 'buffer ready'}
            </h3>
            <p className="text-xs text-relic-slate mt-1">
              {isDistilling ? strategyLabels[strategy] : `${bufferSize}/${maxBufferSize} thoughts`}
            </p>
          </div>

          {/* Status Indicator */}
          <div className="flex items-center gap-2">
            <span className="text-lg text-relic-silver">
              {isDistilling ? '◯' : '◉'}
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        {isDistilling && (
          <div className="mt-3">
            <div className="h-px bg-relic-mist relative">
              <div
                className="absolute left-0 top-0 h-full bg-relic-slate transition-all duration-300"
                style={{ width: `${progress * 100}%` }}
              />
            </div>
            <div className="flex items-center justify-between mt-2 text-xs text-relic-silver/50 font-mono">
              <span>{Math.round(progress * 100)}%</span>
              <span>compressing knowledge...</span>
            </div>
          </div>
        )}

        {/* Buffer Fullness Indicator */}
        {!isDistilling && (
          <div className="mt-3">
            <div className="h-px bg-relic-mist relative">
              <div
                className="absolute left-0 top-0 h-full bg-relic-void"
                style={{ width: `${(bufferSize / maxBufferSize) * 100}%` }}
              />
            </div>
            <div className="flex items-center justify-between mt-2 text-xs text-relic-silver/50 font-mono">
              <span>{bufferSize}/{maxBufferSize}</span>
              <span>
                {bufferSize >= maxBufferSize ? 'distillation pending' : 'accumulating thoughts'}
              </span>
            </div>
          </div>
        )}

        {/* Strategy Info */}
        <div className="mt-4 pt-4 border-t border-relic-mist">
          <div className="grid grid-cols-2 gap-4 text-xs font-mono">
            <div>
              <span className="text-relic-silver uppercase tracking-widest">strategy</span>
              <p className="text-relic-slate mt-1">{strategy}</p>
            </div>
            <div>
              <span className="text-relic-silver uppercase tracking-widest">phase</span>
              <p className="text-relic-slate mt-1">
                {isDistilling ? 'compressing' : 'buffering'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
