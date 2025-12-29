'use client'

import { useState } from 'react'
import RobotIntelligence from './RobotIntelligence'

interface TeachingInterfaceProps {
  agentId: string | null
}

export default function TeachingInterface({ agentId }: TeachingInterfaceProps) {
  const [teachingMode, setTeachingMode] = useState<'demonstration' | 'verbal' | 'visual'>('demonstration')

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-mono text-relic-slate mb-2">Teaching Interface</h2>
        <p className="text-sm text-relic-silver">
          Guide your AI agent through demonstrations and instructions
        </p>
      </div>

      {/* Teaching Mode Selection */}
      <div className="flex gap-2">
        {[
          { id: 'demonstration', label: 'Demonstration Mode', icon: '👁' },
          { id: 'verbal', label: 'Verbal Instructions', icon: '🗣' },
          { id: 'visual', label: 'Visual Markers', icon: '📍' },
        ].map((mode) => (
          <button
            key={mode.id}
            onClick={() => setTeachingMode(mode.id as any)}
            className={`px-4 py-2 border text-sm font-mono transition-colors ${
              teachingMode === mode.id
                ? 'border-relic-slate bg-relic-ghost text-relic-slate'
                : 'border-relic-mist text-relic-silver hover:border-relic-silver'
            }`}
          >
            {mode.icon} {mode.label}
          </button>
        ))}
      </div>

      {/* Main Teaching Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left side - Robot Visualization */}
        <div>
          <h3 className="text-sm font-mono text-relic-slate mb-4">Agent Intelligence</h3>
          <div className="h-[700px] border border-relic-mist rounded-lg overflow-hidden bg-white">
            <RobotIntelligence
              initialScale="human"
              embedded={true}
              showToggle={true}
              theme="light"
            />
          </div>
        </div>

        {/* Right side - Teaching Tools */}
        <div className="space-y-6">
          {/* Demonstration Mode */}
          {teachingMode === 'demonstration' && (
            <div className="border border-relic-mist rounded-lg p-6">
              <h3 className="text-sm font-mono text-relic-slate mb-4">Record Demonstration</h3>
              <div className="space-y-4">
                <p className="text-xs text-relic-silver">
                  Perform the task while the agent observes and learns from your actions
                </p>
                <div className="bg-relic-ghost/30 p-4 rounded border border-dashed border-relic-mist">
                  <div className="text-center text-relic-silver text-xs">
                    <div className="mb-2">📹</div>
                    <p>Click "Start Recording" to begin demonstration</p>
                  </div>
                </div>
                <button className="w-full px-4 py-3 bg-relic-slate text-white text-sm font-mono hover:bg-relic-slate/90 transition-colors">
                  Start Recording
                </button>
              </div>
            </div>
          )}

          {/* Verbal Instructions Mode */}
          {teachingMode === 'verbal' && (
            <div className="border border-relic-mist rounded-lg p-6">
              <h3 className="text-sm font-mono text-relic-slate mb-4">Verbal Instructions</h3>
              <div className="space-y-4">
                <textarea
                  placeholder="Describe the task step-by-step..."
                  rows={8}
                  className="w-full px-4 py-3 border border-relic-mist bg-relic-white text-relic-slate text-sm font-mono focus:outline-none focus:border-relic-slate resize-none"
                />
                <button className="w-full px-4 py-3 bg-relic-slate text-white text-sm font-mono hover:bg-relic-slate/90 transition-colors">
                  Teach Instructions
                </button>
              </div>
            </div>
          )}

          {/* Visual Markers Mode */}
          {teachingMode === 'visual' && (
            <div className="border border-relic-mist rounded-lg p-6">
              <h3 className="text-sm font-mono text-relic-slate mb-4">Visual Markers</h3>
              <div className="space-y-4">
                <p className="text-xs text-relic-silver">
                  Place visual markers in the environment to guide the agent
                </p>
                <div className="space-y-2">
                  {['Target Point', 'Obstacle', 'Path Waypoint', 'Reference Object'].map((marker) => (
                    <button
                      key={marker}
                      className="w-full px-4 py-2 border border-relic-mist text-left text-sm font-mono text-relic-slate hover:bg-relic-ghost transition-colors"
                    >
                      + Add {marker}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Teaching History */}
          <div className="border border-relic-mist rounded-lg p-6">
            <h3 className="text-sm font-mono text-relic-slate mb-4">Teaching Sessions</h3>
            <div className="text-center text-relic-silver text-xs py-8">
              <p>No teaching sessions yet</p>
              <p className="mt-2">Start by creating your first demonstration</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
