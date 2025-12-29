'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import AgentCustomizer from '@/components/AgentCustomizer'
import TrainingEnvironment from '@/components/TrainingEnvironment'
import TeachingInterface from '@/components/TeachingInterface'
import IdeaGenerator from '@/components/IdeaGenerator'
import InnovationsLab from '@/components/InnovationsLab'

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
    <div className="min-h-screen bg-relic-white">
      {/* Header */}
      <div className="border-b border-relic-mist bg-relic-white sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-mono text-relic-slate mb-2">Idea Factory</h1>
              <p className="text-sm text-relic-silver">
                Innovate, experiment, and build with AI, blockchain, and crypto technologies
              </p>
            </div>
            <Link 
              href="/"
              className="text-xs text-relic-silver hover:text-relic-slate transition-colors"
            >
              ← back to akhai
            </Link>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-relic-mist">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-4 overflow-x-auto">
            {[
              { id: 'innovations', label: '🔬 Innovations Lab', highlight: true },
              { id: 'customize', label: '🤖 Customize Agent' },
              { id: 'train', label: '🏋️ Training' },
              { id: 'teach', label: '📚 Teaching' },
              { id: 'ideas', label: '💡 Ideas' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`
                  px-4 py-3 text-xs font-mono border-b-2 transition-colors whitespace-nowrap
                  ${activeTab === tab.id
                    ? 'border-relic-slate text-relic-slate'
                    : 'border-transparent text-relic-silver hover:text-relic-slate'
                  }
                  ${tab.highlight && activeTab !== tab.id ? 'text-relic-slate font-medium' : ''}
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
      <div className="min-h-screen bg-relic-white flex items-center justify-center">
        <p className="text-relic-silver">Loading...</p>
      </div>
    }>
      <IdeaFactoryContent />
    </Suspense>
  )
}

