'use client'

interface MethodologyChangePromptProps {
  isOpen: boolean
  methodologyName: string
  onContinue: () => void
  onNewChat: () => void
  onCancel: () => void
}

export default function MethodologyChangePrompt({
  isOpen,
  methodologyName,
  onContinue,
  onNewChat,
  onCancel,
}: MethodologyChangePromptProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20">
      <div className="bg-white border border-relic-mist shadow-lg p-6 max-w-sm animate-fade-in">
        {/* Title */}
        <h3 className="text-sm font-mono text-relic-slate mb-3">
          Switch to <span className="text-relic-void font-medium">{methodologyName}</span>?
        </h3>

        {/* Message */}
        <p className="text-xs text-relic-silver mb-5">
          Choose how to apply this methodology:
        </p>

        {/* Buttons - Minimalist Raw Style */}
        <div className="space-y-2">
          <button
            onClick={onContinue}
            className="w-full px-4 py-2 text-xs font-mono border border-relic-mist hover:border-relic-slate text-relic-slate hover:bg-relic-ghost/50 transition-all text-left"
          >
            Continue this chat
            <span className="block text-[10px] text-relic-silver mt-0.5">Apply to next message</span>
          </button>

          <button
            onClick={onNewChat}
            className="w-full px-4 py-2 text-xs font-mono border border-relic-mist hover:border-relic-slate text-relic-slate hover:bg-relic-ghost/50 transition-all text-left"
          >
            New chat
            <span className="block text-[10px] text-relic-silver mt-0.5">Start fresh conversation</span>
          </button>

          <button
            onClick={onCancel}
            className="w-full px-4 py-2 text-xs font-mono text-relic-silver hover:text-relic-slate transition-all text-center"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
