'use client'

interface TeachingInterfaceProps {
  agentId: string | null
}

export default function TeachingInterface({ agentId }: TeachingInterfaceProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-mono text-relic-slate">Teaching Interface</h2>
      <div className="border border-relic-mist p-8 text-center text-relic-silver">
        <p className="text-sm">Interactive teaching tools coming soon...</p>
        <p className="text-xs mt-2">Demonstration mode, verbal instruction, visual markers</p>
      </div>
    </div>
  )
}

