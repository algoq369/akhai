'use client'

interface TrainingEnvironmentProps {
  agentId: string | null
}

export default function TrainingEnvironment({ agentId }: TrainingEnvironmentProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-mono text-relic-slate">Training Environment</h2>
      <div className="border border-relic-mist p-8 text-center text-relic-silver">
        <p className="text-sm">3D simulation view coming soon...</p>
        <p className="text-xs mt-2">Connect to physical agent via API</p>
      </div>
    </div>
  )
}

