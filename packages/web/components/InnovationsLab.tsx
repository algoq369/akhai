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
  { id: 'ai', name: 'AI & ML', icon: '🤖', description: 'Machine learning models, neural networks, agents' },
  { id: 'blockchain', name: 'Blockchain', icon: '⛓️', description: 'Decentralized ledgers, consensus mechanisms' },
  { id: 'crypto', name: 'Crypto', icon: '₿', description: 'Tokens, wallets, exchanges' },
  { id: 'defi', name: 'DeFi', icon: '💰', description: 'Decentralized finance, lending, staking' },
  { id: 'web3', name: 'Web3', icon: '🌐', description: 'Decentralized apps, identity, storage' },
]

const EXPERIMENT_TEMPLATES = [
  {
    id: 'smart-contract',
    category: 'blockchain',
    name: 'Smart Contract Builder',
    description: 'Create and test Solidity smart contracts with AI assistance',
    features: ['Contract templates', 'Security audit', 'Gas optimization', 'Deployment helper'],
  },
  {
    id: 'token-creator',
    category: 'crypto',
    name: 'Token Creator',
    description: 'Design and deploy custom tokens (ERC-20, ERC-721, ERC-1155)',
    features: ['Token standards', 'Tokenomics design', 'Minting logic', 'Transfer rules'],
  },
  {
    id: 'ai-model-test',
    category: 'ai',
    name: 'AI Model Playground',
    description: 'Test different AI models, compare outputs, fine-tune prompts',
    features: ['Model comparison', 'Prompt engineering', 'Output analysis', 'Cost tracking'],
  },
  {
    id: 'defi-protocol',
    category: 'defi',
    name: 'DeFi Protocol Designer',
    description: 'Design lending pools, yield strategies, liquidity mechanisms',
    features: ['APY calculator', 'Risk modeling', 'Liquidation logic', 'Oracle integration'],
  },
  {
    id: 'dapp-builder',
    category: 'web3',
    name: 'dApp Builder',
    description: 'Build decentralized applications with AI-powered code generation',
    features: ['Frontend templates', 'Web3 integration', 'Wallet connect', 'IPFS storage'],
  },
  {
    id: 'blockchain-create',
    category: 'blockchain',
    name: 'Custom Blockchain',
    description: 'Design your own blockchain with custom consensus and rules',
    features: ['Consensus selection', 'Block structure', 'Validator setup', 'Network config'],
  },
  {
    id: 'nft-generator',
    category: 'crypto',
    name: 'NFT Generator',
    description: 'Create generative NFT collections with AI-designed traits',
    features: ['Trait design', 'Rarity config', 'Metadata builder', 'Marketplace prep'],
  },
  {
    id: 'ai-agent-chain',
    category: 'ai',
    name: 'AI Agent Chain',
    description: 'Create multi-agent systems that collaborate on complex tasks',
    features: ['Agent roles', 'Communication protocols', 'Task distribution', 'Result synthesis'],
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
    <div className="space-y-8">
      {/* Introduction */}
      <div className="bg-gradient-to-r from-relic-ghost/50 to-transparent border-l-4 border-relic-slate p-6">
        <h2 className="text-xl font-mono text-relic-slate mb-2">🔬 Innovations Lab</h2>
        <p className="text-sm text-relic-silver">
          Experiment with cutting-edge AI, blockchain, and crypto technologies. 
          Build smart contracts, create tokens, design DeFi protocols, and explore Web3.
        </p>
      </div>

      {/* Category Selection */}
      <div>
        <h3 className="text-xs uppercase tracking-wider text-relic-silver mb-4">Select Category</h3>
        <div className="grid grid-cols-5 gap-4">
          {INNOVATION_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(selectedCategory === cat.id ? null : cat.id)}
              className={`p-4 border transition-all text-left ${
                selectedCategory === cat.id
                  ? 'border-relic-slate bg-relic-ghost'
                  : 'border-relic-mist hover:border-relic-silver hover:bg-relic-ghost/30'
              }`}
            >
              <div className="text-2xl mb-2">{cat.icon}</div>
              <div className="text-sm font-mono text-relic-slate">{cat.name}</div>
              <div className="text-[10px] text-relic-silver mt-1">{cat.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Experiment Templates */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs uppercase tracking-wider text-relic-silver">
            Experiments {selectedCategory && `· ${INNOVATION_CATEGORIES.find(c => c.id === selectedCategory)?.name}`}
          </h3>
          {activeExperiments.length > 0 && (
            <span className="text-[10px] text-relic-slate bg-relic-ghost px-2 py-1">
              {activeExperiments.length} active
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          {filteredTemplates.map((template) => (
            <div
              key={template.id}
              className={`p-5 border transition-all ${
                activeExperiments.includes(template.id)
                  ? 'border-green-500/50 bg-green-50/30'
                  : 'border-relic-mist hover:border-relic-silver'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="text-sm font-mono text-relic-slate">{template.name}</h4>
                  <span className="text-[10px] px-2 py-0.5 bg-relic-ghost text-relic-silver mt-1 inline-block">
                    {INNOVATION_CATEGORIES.find(c => c.id === template.category)?.name}
                  </span>
                </div>
                {activeExperiments.includes(template.id) && (
                  <span className="text-[10px] text-green-600 font-medium">● Active</span>
                )}
              </div>
              
              <p className="text-xs text-relic-silver mb-4">{template.description}</p>
              
              <div className="flex flex-wrap gap-1 mb-4">
                {template.features.map((feature, i) => (
                  <span key={i} className="text-[9px] px-2 py-0.5 bg-relic-mist/50 text-relic-slate">
                    {feature}
                  </span>
                ))}
              </div>

              <button
                onClick={() => handleStartExperiment(template.id)}
                className={`w-full py-2 text-xs font-mono transition-colors ${
                  activeExperiments.includes(template.id)
                    ? 'bg-relic-ghost text-relic-slate border border-relic-mist'
                    : 'bg-relic-slate text-white hover:bg-relic-void'
                }`}
              >
                {activeExperiments.includes(template.id) ? 'Continue →' : 'Start Experiment'}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Active Experiment Panel */}
      {selectedExperiment && selectedTemplate && (
        <div className="border border-relic-slate bg-relic-ghost/20 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-mono text-relic-slate">{selectedTemplate.name}</h3>
              <p className="text-xs text-relic-silver">{selectedTemplate.description}</p>
            </div>
            <button
              onClick={() => setSelectedExperiment(null)}
              className="text-relic-silver hover:text-relic-slate"
            >
              ×
            </button>
          </div>

          {/* Experiment Workspace */}
          <div className="grid grid-cols-2 gap-6">
            {/* Left: Configuration */}
            <div className="space-y-4">
              <h4 className="text-xs uppercase tracking-wider text-relic-silver">Configuration</h4>
              
              {selectedTemplate.id === 'smart-contract' && (
                <div className="space-y-3">
                  <select className="w-full p-2 text-xs border border-relic-mist bg-white text-relic-slate">
                    <option>ERC-20 Token</option>
                    <option>ERC-721 NFT</option>
                    <option>ERC-1155 Multi-Token</option>
                    <option>Custom Contract</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Contract Name"
                    className="w-full p-2 text-xs border border-relic-mist"
                  />
                  <textarea
                    placeholder="Contract description..."
                    className="w-full p-2 text-xs border border-relic-mist h-20"
                  />
                </div>
              )}

              {selectedTemplate.id === 'token-creator' && (
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="Token Name"
                    className="w-full p-2 text-xs border border-relic-mist"
                  />
                  <input
                    type="text"
                    placeholder="Token Symbol (e.g., AKHAI)"
                    className="w-full p-2 text-xs border border-relic-mist"
                  />
                  <input
                    type="number"
                    placeholder="Total Supply"
                    className="w-full p-2 text-xs border border-relic-mist"
                  />
                  <input
                    type="number"
                    placeholder="Decimals (e.g., 18)"
                    className="w-full p-2 text-xs border border-relic-mist"
                  />
                </div>
              )}

              {selectedTemplate.id === 'ai-model-test' && (
                <div className="space-y-3">
                  <select className="w-full p-2 text-xs border border-relic-mist bg-white text-relic-slate">
                    <option>Claude Opus 4.5</option>
                    <option>Claude Haiku</option>
                    <option>GPT-4o</option>
                    <option>Gemini Pro</option>
                  </select>
                  <textarea
                    placeholder="Enter your prompt..."
                    className="w-full p-2 text-xs border border-relic-mist h-32"
                  />
                </div>
              )}

              {!['smart-contract', 'token-creator', 'ai-model-test'].includes(selectedTemplate.id) && (
                <div className="text-xs text-relic-silver p-4 bg-relic-mist/30 text-center">
                  Coming soon - Under development
                </div>
              )}
            </div>

            {/* Right: Output/Preview */}
            <div className="space-y-4">
              <h4 className="text-xs uppercase tracking-wider text-relic-silver">Output / Preview</h4>
              <div className="bg-relic-void text-green-400 p-4 font-mono text-[10px] h-48 overflow-auto">
                <div>// {selectedTemplate.name} Output</div>
                <div>// Ready for configuration...</div>
                <div className="mt-4 text-relic-silver">
                  → Configure parameters on the left<br />
                  → Click "Generate" to create output<br />
                  → Review and export results
                </div>
              </div>
              
              <div className="flex gap-2">
                <button className="flex-1 py-2 text-xs font-mono bg-relic-slate text-white hover:bg-relic-void transition-colors">
                  Generate
                </button>
                <button className="px-4 py-2 text-xs font-mono border border-relic-mist text-relic-slate hover:bg-relic-ghost transition-colors">
                  Export
                </button>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="mt-6 pt-6 border-t border-relic-mist">
            <h4 className="text-xs uppercase tracking-wider text-relic-silver mb-2">Experiment Notes</h4>
            <textarea
              value={experimentNotes[selectedExperiment] || ''}
              onChange={(e) => setExperimentNotes(prev => ({
                ...prev,
                [selectedExperiment]: e.target.value
              }))}
              placeholder="Record your observations, ideas, and results..."
              className="w-full p-3 text-xs border border-relic-mist h-24"
            />
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-4 gap-4">
        <button className="p-4 border border-relic-mist hover:border-relic-slate hover:bg-relic-ghost/30 transition-all text-left">
          <div className="text-lg mb-1">📚</div>
          <div className="text-xs font-mono text-relic-slate">Documentation</div>
          <div className="text-[10px] text-relic-silver">Learn the basics</div>
        </button>
        <button className="p-4 border border-relic-mist hover:border-relic-slate hover:bg-relic-ghost/30 transition-all text-left">
          <div className="text-lg mb-1">🔗</div>
          <div className="text-xs font-mono text-relic-slate">Open Source</div>
          <div className="text-[10px] text-relic-silver">Community projects</div>
        </button>
        <button className="p-4 border border-relic-mist hover:border-relic-slate hover:bg-relic-ghost/30 transition-all text-left">
          <div className="text-lg mb-1">🧪</div>
          <div className="text-xs font-mono text-relic-slate">Testnet</div>
          <div className="text-[10px] text-relic-silver">Safe testing env</div>
        </button>
        <button className="p-4 border border-relic-mist hover:border-relic-slate hover:bg-relic-ghost/30 transition-all text-left">
          <div className="text-lg mb-1">🚀</div>
          <div className="text-xs font-mono text-relic-slate">Deploy</div>
          <div className="text-[10px] text-relic-silver">Go live</div>
        </button>
      </div>
    </div>
  )
}






