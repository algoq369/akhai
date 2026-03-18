'use client'

import { useQuickChatStore } from '@/lib/stores/quick-chat-store'

export default function QuickChatButton() {
  const { isOpen, toggle } = useQuickChatStore()

  return (
    <button
      onClick={toggle}
      className="fixed bottom-8 right-3 sm:right-6 z-40 w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center text-sm font-mono text-relic-silver hover:text-relic-slate dark:text-relic-ghost dark:hover:text-white transition-colors duration-200"
      title="Quick Chat (⌘⇧Q)"
      aria-label="Toggle Quick Chat"
    >
      Q
    </button>
  )
}
