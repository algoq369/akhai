'use client'

import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import QuickChatButton from './QuickChatButton'
import QuickChatPanel from './QuickChatPanel'

/**
 * QuickChat Provider - Wraps the app with QuickChat functionality
 * Includes keyboard shortcuts and floating button/panel
 */
export function QuickChatProvider() {
  // Initialize keyboard shortcuts
  useKeyboardShortcuts()

  return (
    <>
      <QuickChatButton />
      <QuickChatPanel />
    </>
  )
}
