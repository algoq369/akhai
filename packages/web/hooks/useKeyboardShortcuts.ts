'use client'

import { useEffect } from 'react'
import { useQuickChatStore } from '@/lib/stores/quick-chat-store'

/**
 * Keyboard shortcuts hook for global app shortcuts
 *
 * Shortcuts:
 * - Cmd+K / Ctrl+K: Focus search input
 * - Cmd+M / Ctrl+M: Open Mind Map
 * - Cmd+S / Ctrl+S: Open Sefirot Dashboard
 * - Cmd+H / Ctrl+H: Open History
 * - Cmd+, / Ctrl+,: Open Settings
 * - Cmd+Shift+Q / Ctrl+Shift+Q: Toggle Quick Chat
 * - Escape: Close modals
 */
export function useKeyboardShortcuts({
  onSearch,
  onMindMap,
  onSefirot,
  onHistory,
  onSettings,
}: {
  onSearch?: () => void
  onMindMap?: () => void
  onSefirot?: () => void
  onHistory?: () => void
  onSettings?: () => void
} = {}) {
  const { toggle } = useQuickChatStore()

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in input fields
      const target = event.target as HTMLElement
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return
      }

      const isMac = /Mac/.test(navigator.platform)
      const modKey = isMac ? event.metaKey : event.ctrlKey

      // Cmd/Ctrl + K: Focus search
      if (modKey && event.key === 'k') {
        event.preventDefault()
        onSearch?.()
        return
      }

      // Cmd/Ctrl + M: Open Mind Map
      if (modKey && event.key === 'm') {
        event.preventDefault()
        onMindMap?.()
        return
      }

      // Cmd/Ctrl + S: Open Sefirot Dashboard
      if (modKey && event.key === 's') {
        event.preventDefault()
        onSefirot?.()
        return
      }

      // Cmd/Ctrl + H: Open History
      if (modKey && event.key === 'h') {
        event.preventDefault()
        onHistory?.()
        return
      }

      // Cmd/Ctrl + ,: Open Settings
      if (modKey && event.key === ',') {
        event.preventDefault()
        onSettings?.()
        return
      }

      // Cmd+Shift+Q (Mac) or Ctrl+Shift+Q (Win) - Toggle Quick Chat
      if (modKey && event.shiftKey && event.key === 'Q') {
        event.preventDefault()
        toggle()
        return
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [toggle, onSearch, onMindMap, onSefirot, onHistory, onSettings])
}

/**
 * Get keyboard shortcut display text
 */
export function getShortcutDisplay(key: string, withModifier = true): string {
  const isMac = typeof navigator !== 'undefined' && /Mac/.test(navigator.platform)
  const modKey = isMac ? '⌘' : 'Ctrl'

  if (!withModifier) return key.toUpperCase()

  switch (key.toLowerCase()) {
    case 'k':
      return `${modKey}K`
    case 'm':
      return `${modKey}M`
    case 's':
      return `${modKey}S`
    case 'h':
      return `${modKey}H`
    case ',':
      return `${modKey},`
    case 'q':
      return `${modKey}⇧Q`
    default:
      return key.toUpperCase()
  }
}
