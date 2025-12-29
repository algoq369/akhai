'use client'

import RobotIntelligence from './RobotIntelligence'

interface TrainingEnvironmentProps {
  agentId: string | null
}

export default function TrainingEnvironment({ agentId }: TrainingEnvironmentProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-mono text-relic-slate mb-2">Training Environment</h2>
        <p className="text-sm text-relic-silver">
          Monitor and train your AI agent's neural components
        </p>
      </div>

      {/* Robot Intelligence Architecture */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left side - Robot Visualization */}
        <div>
          <h3 className="text-sm font-mono text-relic-slate mb-4">Neural Architecture</h3>
          <div className="h-[700px] border border-relic-mist rounded-lg overflow-hidden bg-white">
            <RobotIntelligence
              initialScale="human"
              embedded={true}
              showToggle={true}
              theme="light"
            />
          </div>
        </div>

        {/* Right side - Training Controls */}
        <div className="space-y-6">
          <div className="border border-relic-mist rounded-lg p-6">
            <h3 className="text-sm font-mono text-relic-slate mb-4">Training Controls</h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-relic-silver mb-2 block">Training Mode</label>
                <select className="w-full px-4 py-2 border border-relic-mist bg-relic-white text-relic-slate text-sm font-mono focus:outline-none focus:border-relic-slate">
                  <option>Supervised Learning</option>
                  <option>Reinforcement Learning</option>
                  <option>Transfer Learning</option>
                  <option>Online Learning</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-relic-silver mb-2 block">Learning Rate</label>
                <input
                  type="range"
                  min="0.001"
                  max="1"
                  step="0.001"
                  defaultValue="0.01"
                  className="w-full accent-relic-slate"
                />
                <div className="flex justify-between text-[10px] text-relic-silver mt-1">
                  <span>Slow (0.001)</span>
                  <span>Fast (1.0)</span>
                </div>
              </div>

              <div>
                <label className="text-xs text-relic-silver mb-2 block">Training Iterations</label>
                <input
                  type="number"
                  defaultValue="1000"
                  className="w-full px-4 py-2 border border-relic-mist bg-relic-white text-relic-slate text-sm font-mono focus:outline-none focus:border-relic-slate"
                />
              </div>

              <button className="w-full px-4 py-3 bg-relic-slate text-white text-sm font-mono hover:bg-relic-slate/90 transition-colors">
                Start Training
              </button>
            </div>
          </div>

          {/* Training Stats */}
          <div className="border border-relic-mist rounded-lg p-6">
            <h3 className="text-sm font-mono text-relic-slate mb-4">Training Progress</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-relic-ghost/30 p-4 rounded">
                <div className="text-[10px] text-relic-silver uppercase mb-1">Accuracy</div>
                <div className="text-2xl font-mono text-relic-slate">0%</div>
              </div>
              <div className="bg-relic-ghost/30 p-4 rounded">
                <div className="text-[10px] text-relic-silver uppercase mb-1">Loss</div>
                <div className="text-2xl font-mono text-relic-slate">—</div>
              </div>
              <div className="bg-relic-ghost/30 p-4 rounded">
                <div className="text-[10px] text-relic-silver uppercase mb-1">Epoch</div>
                <div className="text-2xl font-mono text-relic-slate">0</div>
              </div>
              <div className="bg-relic-ghost/30 p-4 rounded">
                <div className="text-[10px] text-relic-silver uppercase mb-1">Time</div>
                <div className="text-2xl font-mono text-relic-slate">0s</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
