'use client'

import { diffWords } from 'diff'

interface DiffViewerProps {
  textA: string
  textB: string
}

export default function DiffViewer({ textA, textB }: DiffViewerProps) {
  const differences = diffWords(textA, textB)

  return (
    <div className="mt-8 p-4 border border-relic-mist rounded bg-relic-white">
      <h3 className="text-sm font-medium mb-4 text-relic-void">
        Differences
      </h3>
      <div className="text-xs leading-relaxed">
        {differences.map((part, i) => (
          <span
            key={i}
            className={
              part.added
                ? 'bg-green-100 text-green-800'
                : part.removed
                ? 'bg-red-100 text-red-800'
                : 'text-relic-void'
            }
          >
            {part.value}
          </span>
        ))}
      </div>
    </div>
  )
}
