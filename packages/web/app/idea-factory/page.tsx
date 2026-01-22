'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import AgentCustomizer from '@/components/AgentCustomizer'
import TrainingEnvironment from '@/components/TrainingEnvironment'
import TeachingInterface from '@/components/TeachingInterface'
import IdeaGenerator from '@/components/IdeaGenerator'
import InnovationsLab from '@/components/InnovationsLab'
import DarkModeToggle from '@/components/DarkModeToggle'

function IdeaFactoryContent() {
  const searchParams = useSearchParams()
  const tabParam = searchParams.get('tab') as 'innovations' | 'customize' | 'train' | 'teach' | 'ideas' | null
  const [activeTab, setActiveTab] = useState<'innovations' | 'customize' | 'train' | 'teach' | 'ideas'>(tabParam || 'innovations')
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null)

  // Update tab when URL parameter changes
  useEffect(() => {
    if (tabParam && ['innovations', 'customize', 'train', 'teach', 'ideas'].includes(tabParam)) {
      setActiveTab(tabParam)
    }
  }, [tabParam])

  return (
    <div className="min-h-screen bg-relic-white dark:bg-relic-void">
      {/* Header - Minimal */}
      <div className="bg-white dark:bg-relic-void/80 sticky top-0 z-10 border-b border-slate-200/0 dark:border-relic-slate/30">
        <div className="max-w-7xl mx-auto px-6 py-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[9px] uppercase tracking-[0.3em] text-relic-silver dark:text-relic-ghost mb-1">SYSTEM</div>
              <h1 className="text-sm font-mono text-relic-slate dark:text-white">idea factory</h1>
            </div>
            <div className="flex items-center gap-3">
              <DarkModeToggle />
              <Link
                href="/"
                className="text-[9px] uppercase tracking-[0.2em] text-relic-silver dark:text-relic-ghost hover:text-relic-slate dark:hover:text-white transition-colors"
              >
                ← akhai
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs - Raw Text Only */}
      <div className="bg-relic-ghost/30 dark:bg-relic-slate/10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-6 overflow-x-auto">
            {[
              { id: 'innovations', label: '◊ innovations', sigil: '◊' },
              { id: 'customize', label: '▸ customize', sigil: '▸' },
              { id: 'train', label: '◈ training', sigil: '◈' },
              { id: 'teach', label: '◐ teaching', sigil: '◐' },
              { id: 'ideas', label: '⟡ ideation', sigil: '⟡' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`
                  px-2 py-2 text-[10px] font-mono transition-colors whitespace-nowrap
                  ${activeTab === tab.id
                    ? 'text-relic-void dark:text-white'
                    : 'text-relic-silver dark:text-relic-ghost hover:text-relic-slate dark:hover:text-white'
                  }
                `}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {activeTab === 'innovations' && (
          <InnovationsLab />
        )}
        {activeTab === 'customize' && (
          <AgentCustomizer
            agentId={selectedAgent}
            onAgentSelect={setSelectedAgent}
          />
        )}
        {activeTab === 'train' && (
          <TrainingEnvironment agentId={selectedAgent} />
        )}
        {activeTab === 'teach' && (
          <TeachingInterface agentId={selectedAgent} />
        )}
        {activeTab === 'ideas' && (
          <IdeaGenerator />
        )}
      </div>
    </div>
  )
}

export default function IdeaFactoryPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-relic-white dark:bg-relic-void flex items-center justify-center">
        <p className="text-relic-silver dark:text-relic-ghost">Loading...</p>
      </div>
    }>
      <IdeaFactoryContent />
    </Suspense>
  )
}

