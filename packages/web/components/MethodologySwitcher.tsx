'use client'

import { useState } from 'react'
const METHODOLOGIES = [
  { id: 'auto', symbol: '◎', name: 'auto' },
  { id: 'direct', symbol: '→', name: 'direct' },
  { id: 'cod', symbol: '⋯', name: 'cod' },
  { id: 'bot', symbol: '◇', name: 'bot' },
  { id: 'react', symbol: '⟳', name: 'react' },
  { id: 'pot', symbol: '△', name: 'pot' },
  { id: 'gtp', symbol: '◯', name: 'gtp' },
]

interface MethodologySwitcherProps {
  currentMethodology: string
  onMethodologyChange: (methodology: string, option: 'same' | 'side' | 'new') => void
}

export default function MethodologySwitcher({ currentMethodology, onMethodologyChange }: MethodologySwitcherProps) {
  const [showOptions, setShowOptions] = useState(false)
  const [selectedMethodology, setSelectedMethodology] = useState<string | null>(null)

  const handleMethodologySelect = (methodologyId: string) => {
    if (methodologyId === currentMethodology) {
      setShowOptions(false)
      return
    }
    setSelectedMethodology(methodologyId)
    setShowOptions(true)
  }

  const handleOptionSelect = (option: 'same' | 'side' | 'new') => {
    if (selectedMethodology) {
      onMethodologyChange(selectedMethodology, option)
      setShowOptions(false)
      setSelectedMethodology(null)
    }
  }

  const currentMethod = METHODOLOGIES.find(m => m.id === currentMethodology)

  return (
    <div className="relative">
      {/* Current Methodology Display */}
      <button
        onClick={() => setShowOptions(!showOptions)}
        className="w-full px-3 py-2 border border-relic-mist bg-relic-white hover:bg-relic-ghost text-xs font-mono text-relic-slate transition-colors flex items-center justify-between"
      >
        <span>
          <span className="mr-1.5 opacity-70">{currentMethod?.symbol}</span>
          {currentMethod?.name || currentMethodology}
        </span>
        <span className="text-relic-silver">▼</span>
      </button>

      {/* Methodology Options Modal */}
      {showOptions && (
        <>
          <div
            className="fixed inset-0 z-50"
            onClick={() => setShowOptions(false)}
          />
          <div className="absolute top-full left-0 mt-2 w-full bg-relic-white border border-relic-mist shadow-lg z-50">
            {/* Methodology List */}
            {!selectedMethodology ? (
              <div className="max-h-48 overflow-y-auto">
                {METHODOLOGIES.map((method) => (
                  <button
                    key={method.id}
                    onClick={() => handleMethodologySelect(method.id)}
                    className={`
                      w-full px-3 py-2 text-left text-xs font-mono transition-colors
                      ${method.id === currentMethodology
                        ? 'bg-relic-ghost text-relic-slate'
                        : 'hover:bg-relic-ghost/50 text-relic-silver hover:text-relic-slate'
                      }
                    `}
                  >
                    <span className="mr-1.5 opacity-70">{method.symbol}</span>
                    {method.name}
                  </button>
                ))}
              </div>
            ) : (
              /* Continuation Options */
              <div className="p-3 space-y-2">
                <div className="text-xs text-relic-silver mb-2">
                  Switch to <span className="font-mono text-relic-slate">{METHODOLOGIES.find(m => m.id === selectedMethodology)?.name}</span>:
                </div>
                <button
                  onClick={() => handleOptionSelect('same')}
                  className="w-full px-3 py-2 text-xs font-mono border border-relic-mist bg-relic-white hover:bg-relic-ghost text-relic-slate transition-colors text-left"
                >
                  Continue in Same Chat
                </button>
                <button
                  onClick={() => handleOptionSelect('side')}
                  className="w-full px-3 py-2 text-xs font-mono border border-relic-mist bg-relic-white hover:bg-relic-ghost text-relic-slate transition-colors text-left"
                >
                  Open Side Chat
                </button>
                <button
                  onClick={() => handleOptionSelect('new')}
                  className="w-full px-3 py-2 text-xs font-mono border border-relic-mist bg-relic-white hover:bg-relic-ghost text-relic-slate transition-colors text-left"
                >
                  New Chat
                </button>
                <button
                  onClick={() => {
                    setShowOptions(false)
                    setSelectedMethodology(null)
                  }}
                  className="w-full px-3 py-2 text-xs font-mono text-relic-silver hover:text-relic-slate transition-colors text-center mt-2"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

