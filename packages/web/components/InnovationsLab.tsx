'use client'

import { useState } from 'react'

interface Innovation {
  id: string
  name: string
  category: 'ai' | 'blockchain' | 'crypto' | 'defi' | 'web3'
  description: string
  status: 'idea' | 'testing' | 'development' | 'complete'
  features: string[]
}

const INNOVATION_CATEGORIES = [
  { id: 'ai', name: 'AI & ML', sigil: '◊', description: 'machine learning | neural networks | agents' },
  { id: 'blockchain', name: 'Blockchain', sigil: '⬡', description: 'ledgers | consensus | validation' },
  { id: 'crypto', name: 'Crypto', sigil: '₿', description: 'tokens | wallets | exchange' },
  { id: 'defi', name: 'DeFi', sigil: '◈', description: 'finance | lending | staking' },
  { id: 'web3', name: 'Web3', sigil: '⟁', description: 'dapps | identity | storage' },
]

const EXPERIMENT_TEMPLATES = [
  {
    id: 'smart-contract',
    category: 'blockchain',
    name: 'smart contract builder',
    description: 'create and test solidity contracts with ai assistance',
    features: ['templates', 'security audit', 'gas optimization', 'deployment'],
  },
  {
    id: 'token-creator',
    category: 'crypto',
    name: 'token creator',
    description: 'design and deploy custom tokens (erc-20, erc-721, erc-1155)',
    features: ['standards', 'tokenomics', 'minting logic', 'transfer rules'],
  },
  {
    id: 'ai-model-test',
    category: 'ai',
    name: 'ai model playground',
    description: 'test different ai models, compare outputs, fine-tune prompts',
    features: ['comparison', 'prompt engineering', 'output analysis', 'cost tracking'],
  },
  {
    id: 'defi-protocol',
    category: 'defi',
    name: 'defi protocol designer',
    description: 'design lending pools, yield strategies, liquidity mechanisms',
    features: ['apy calculator', 'risk modeling', 'liquidation logic', 'oracle integration'],
  },
  {
    id: 'dapp-builder',
    category: 'web3',
    name: 'dapp builder',
    description: 'build decentralized applications with ai-powered code generation',
    features: ['frontend templates', 'web3 integration', 'wallet connect', 'ipfs storage'],
  },
  {
    id: 'blockchain-create',
    category: 'blockchain',
    name: 'custom blockchain',
    description: 'design your own blockchain with custom consensus and rules',
    features: ['consensus selection', 'block structure', 'validator setup', 'network config'],
  },
  {
    id: 'nft-generator',
    category: 'crypto',
    name: 'nft generator',
    description: 'create generative nft collections with ai-designed traits',
    features: ['trait design', 'rarity config', 'metadata builder', 'marketplace prep'],
  },
  {
    id: 'ai-agent-chain',
    category: 'ai',
    name: 'ai agent chain',
    description: 'create multi-agent systems that collaborate on complex tasks',
    features: ['agent roles', 'communication protocols', 'task distribution', 'result synthesis'],
  },
]

export default function InnovationsLab() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedExperiment, setSelectedExperiment] = useState<string | null>(null)
  const [activeExperiments, setActiveExperiments] = useState<string[]>([])
  const [experimentNotes, setExperimentNotes] = useState<Record<string, string>>({})

  const filteredTemplates = selectedCategory
    ? EXPERIMENT_TEMPLATES.filter(t => t.category === selectedCategory)
    : EXPERIMENT_TEMPLATES

  const handleStartExperiment = (experimentId: string) => {
    if (!activeExperiments.includes(experimentId)) {
      setActiveExperiments(prev => [...prev, experimentId])
    }
    setSelectedExperiment(experimentId)
  }

  const selectedTemplate = EXPERIMENT_TEMPLATES.find(t => t.id === selectedExperiment)

  return (
    <div className="font-mono text-relic-void space-y-6">
      {/* Header - Minimal */}
      <div>
        <div className="text-[9px] uppercase tracking-[0.3em] text-relic-silver mb-2">▸ INNOVATIONS</div>
        <div className="text-[10px] text-relic-slate leading-relaxed">
          experiment with cutting-edge ai, blockchain, and crypto technologies<br />
          build smart contracts | create tokens | design defi protocols | explore web3
        </div>
      </div>

      {/* Category Selection - Console Style */}
      <div>
        <div className="text-[9px] uppercase tracking-[0.2em] text-relic-silver mb-3">CATEGORY</div>
        <div className="space-y-1">
          {INNOVATION_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(selectedCategory === cat.id ? null : cat.id)}
              className={`
                w-full text-left px-3 py-2 text-[10px] transition-all
                ${selectedCategory === cat.id
                  ? 'bg-relic-ghost text-relic-void'
                  : 'text-relic-slate hover:bg-relic-ghost/50 hover:text-relic-void'
                }
              `}
            >
              <span className="text-relic-silver mr-2">{cat.sigil}</span>
              <span className="mr-3">{cat.name}</span>
              <span className="text-relic-silver text-[9px]">{cat.description}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Active Counter */}
      {activeExperiments.length > 0 && (
        <div className="text-[9px] text-relic-silver">
          ▸ {activeExperiments.length} active experiment{activeExperiments.length !== 1 ? 's' : ''}
        </div>
      )}

      {/* Experiment Templates - Console List */}
      <div>
        <div className="text-[9px] uppercase tracking-[0.2em] text-relic-silver mb-3">
          EXPERIMENTS {selectedCategory && `· ${INNOVATION_CATEGORIES.find(c => c.id === selectedCategory)?.name.toUpperCase()}`}
        </div>

        <div className="space-y-3">
          {filteredTemplates.map((template) => {
            const isActive = activeExperiments.includes(template.id)
            const categoryInfo = INNOVATION_CATEGORIES.find(c => c.id === template.category)

            return (
              <div key={template.id} className="space-y-1">
                {/* Experiment Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-relic-silver text-[10px]">{categoryInfo?.sigil}</span>
                    <span className="text-[10px] text-relic-void">{template.name}</span>
                    {isActive && <span className="text-[8px] text-green-600">● active</span>}
                  </div>
                  <span className="text-[8px] uppercase tracking-wider text-relic-silver">{categoryInfo?.name}</span>
                </div>

                {/* Description */}
                <div className="text-[9px] text-relic-silver pl-5">{template.description}</div>

                {/* Features */}
                <div className="pl-5 flex flex-wrap gap-2">
                  {template.features.map((feature, i) => (
                    <span key={i} className="text-[8px] text-relic-slate">
                      · {feature}
                    </span>
                  ))}
                </div>

                {/* Action */}
                <div className="pl-5">
                  <button
                    onClick={() => handleStartExperiment(template.id)}
                    className="text-[9px] text-relic-slate hover:text-relic-void transition-colors"
                  >
                    {isActive ? '▸ continue' : '▸ start experiment'}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Active Experiment Panel - Console Output */}
      {selectedExperiment && selectedTemplate && (
        <div className="bg-relic-ghost/30 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[9px] uppercase tracking-[0.3em] text-relic-silver">ACTIVE SESSION</div>
              <div className="text-[11px] text-relic-void mt-1">{selectedTemplate.name}</div>
            </div>
            <button
              onClick={() => setSelectedExperiment(null)}
              className="text-[10px] text-relic-silver hover:text-relic-slate"
            >
              × close
            </button>
          </div>

          {/* Configuration & Output Grid */}
          <div className="grid grid-cols-2 gap-6">
            {/* Left: Configuration */}
            <div className="space-y-3">
              <div className="text-[9px] uppercase tracking-[0.2em] text-relic-silver">CONFIGURATION</div>

              {selectedTemplate.id === 'smart-contract' && (
                <div className="space-y-2">
                  <select className="w-full p-2 text-[10px] bg-white text-relic-slate border-0 focus:outline-none">
                    <option>erc-20 token</option>
                    <option>erc-721 nft</option>
                    <option>erc-1155 multi-token</option>
                    <option>custom contract</option>
                  </select>
                  <input
                    type="text"
                    placeholder="contract name"
                    className="w-full p-2 text-[10px] bg-white text-relic-slate border-0 focus:outline-none"
                  />
                  <textarea
                    placeholder="description..."
                    className="w-full p-2 text-[10px] bg-white text-relic-slate border-0 focus:outline-none h-20 resize-none"
                  />
                </div>
              )}

              {selectedTemplate.id === 'token-creator' && (
                <div className="space-y-2">
                  <input type="text" placeholder="token name" className="w-full p-2 text-[10px] bg-white border-0" />
                  <input type="text" placeholder="symbol (e.g., AKHAI)" className="w-full p-2 text-[10px] bg-white border-0" />
                  <input type="number" placeholder="total supply" className="w-full p-2 text-[10px] bg-white border-0" />
                  <input type="number" placeholder="decimals (e.g., 18)" className="w-full p-2 text-[10px] bg-white border-0" />
                </div>
              )}

              {selectedTemplate.id === 'ai-model-test' && (
                <div className="space-y-2">
                  <select className="w-full p-2 text-[10px] bg-white border-0">
                    <option>claude opus 4.5</option>
                    <option>claude haiku</option>
                    <option>gpt-4o</option>
                    <option>gemini pro</option>
                  </select>
                  <textarea
                    placeholder="enter prompt..."
                    className="w-full p-2 text-[10px] bg-white border-0 h-32 resize-none"
                  />
                </div>
              )}

              {!['smart-contract', 'token-creator', 'ai-model-test'].includes(selectedTemplate.id) && (
                <div className="text-[9px] text-relic-silver p-4 bg-white/50 text-center">
                  under development
                </div>
              )}
            </div>

            {/* Right: Output Console */}
            <div className="space-y-3">
              <div className="text-[9px] uppercase tracking-[0.2em] text-relic-silver">OUTPUT</div>
              <div className="bg-relic-void text-green-400 p-3 font-mono text-[9px] h-48 overflow-auto">
                <div>// {selectedTemplate.name}</div>
                <div>// awaiting configuration</div>
                <div className="mt-3 text-relic-silver/70">
                  → configure parameters<br />
                  → generate output<br />
                  → export results
                </div>
              </div>

              <div className="flex gap-2">
                <button className="flex-1 py-1.5 text-[9px] bg-relic-void text-white hover:bg-black transition-colors">
                  generate
                </button>
                <button className="px-4 py-1.5 text-[9px] text-relic-slate hover:bg-relic-ghost/50 transition-colors">
                  export
                </button>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="pt-4 space-y-2">
            <div className="text-[9px] uppercase tracking-[0.2em] text-relic-silver">NOTES</div>
            <textarea
              value={experimentNotes[selectedExperiment] || ''}
              onChange={(e) => setExperimentNotes(prev => ({
                ...prev,
                [selectedExperiment]: e.target.value
              }))}
              placeholder="record observations, ideas, and results..."
              className="w-full p-3 text-[10px] bg-white text-relic-slate border-0 focus:outline-none h-20 resize-none"
            />
          </div>
        </div>
      )}

      {/* Quick Actions - Minimal */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { sigil: '◈', label: 'documentation', desc: 'learn basics' },
          { sigil: '⬡', label: 'open source', desc: 'community projects' },
          { sigil: '◐', label: 'testnet', desc: 'safe testing' },
          { sigil: '▸', label: 'deploy', desc: 'go live' },
        ].map((action, i) => (
          <button key={i} className="p-3 text-left hover:bg-relic-ghost/30 transition-colors">
            <div className="text-relic-silver mb-1">{action.sigil}</div>
            <div className="text-[10px] text-relic-slate">{action.label}</div>
            <div className="text-[8px] text-relic-silver">{action.desc}</div>
          </button>
        ))}
      </div>
    </div>
  )
}
