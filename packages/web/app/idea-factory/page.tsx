'use client'

import { useState } from 'react'
import AgentCustomizer from '@/components/AgentCustomizer'
import TrainingEnvironment from '@/components/TrainingEnvironment'
import TeachingInterface from '@/components/TeachingInterface'
import IdeaGenerator from '@/components/IdeaGenerator'

export default function IdeaFactoryPage() {
  const [activeTab, setActiveTab] = useState<'customize' | 'train' | 'teach' | 'ideas'>('customize')
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null)

  return (
    <div className="min-h-screen bg-relic-white">
      {/* Header */}
      <div className="border-b border-relic-mist bg-relic-white sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <h1 className="text-2xl font-mono text-relic-slate mb-2">Idea Factory</h1>
          <p className="text-sm text-relic-silver">
            Train and customize AI agents for real-world physical interaction
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-relic-mist">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-4">
            {[
              { id: 'customize', label: 'Customize Agent' },
              { id: 'train', label: 'Training Environment' },
              { id: 'teach', label: 'Teaching Interface' },
              { id: 'ideas', label: 'Idea Generator' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`
                  px-4 py-2 text-xs font-mono border-b-2 transition-colors
                  ${activeTab === tab.id
                    ? 'border-relic-slate text-relic-slate'
                    : 'border-transparent text-relic-silver hover:text-relic-slate'
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

