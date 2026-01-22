import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { generateSuggestions, type QuickChatSuggestion } from '../quickchat-suggestions'

// Re-export for convenience
export type { QuickChatSuggestion }

export interface QuickChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
}

interface QuickChatStore {
  isOpen: boolean
  messages: QuickChatMessage[]
  isLoading: boolean
  suggestions: QuickChatSuggestion[]
  suggestionsEnabled: boolean

  // Actions
  toggle: () => void
  open: () => void
  close: () => void
  addMessage: (message: QuickChatMessage) => void
  setLoading: (loading: boolean) => void
  clear: () => void
  setSuggestions: (suggestions: QuickChatSuggestion[]) => void
  clearSuggestions: () => void
  toggleSuggestions: () => void
  refreshSuggestions: () => void
}

export const useQuickChatStore = create<QuickChatStore>()(
  persist(
    (set, get) => ({
      isOpen: false,
      messages: [],
      isLoading: false,
      suggestions: [],
      suggestionsEnabled: false, // Disabled by default until improved

      toggle: () => set((state) => ({ isOpen: !state.isOpen })),

      open: () => set({ isOpen: true }),

      close: () => set({ isOpen: false }),

      addMessage: (message) => {
        set((state) => ({
          messages: [...state.messages, message],
        }))

        // Auto-generate suggestions after assistant responses
        if (message.role === 'assistant' && get().suggestionsEnabled) {
          const updatedMessages = get().messages
          const newSuggestions = generateSuggestions(updatedMessages, 3)
          set({ suggestions: newSuggestions })
        }
      },

      setLoading: (loading) => set({ isLoading: loading }),

      clear: () => set({ messages: [], suggestions: [] }),

      setSuggestions: (suggestions) => set({ suggestions }),

      clearSuggestions: () => set({ suggestions: [] }),

      toggleSuggestions: () =>
        set((state) => ({
          suggestionsEnabled: !state.suggestionsEnabled,
          suggestions: !state.suggestionsEnabled ? [] : state.suggestions,
        })),

      refreshSuggestions: () => {
        const { messages, suggestionsEnabled } = get()
        if (suggestionsEnabled) {
          const newSuggestions = generateSuggestions(messages, 3)
          set({ suggestions: newSuggestions })
        }
      },
    }),
    {
      name: 'akhai-quick-chat',
      partialize: (state) => ({
        // Don't persist isOpen or isLoading, only messages and settings
        messages: state.messages,
        suggestionsEnabled: state.suggestionsEnabled,
      }),
    }
  )
)
