/**
 * Side Canal Store
 * State management for topic extraction, synopsis generation, and suggestions
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Topic, Suggestion } from '@/lib/side-canal'
import type { ThoughtEvent } from '@/lib/thought-stream'

export type RefinementType = 'refine' | 'enhance' | 'correct' | 'instruct'

export interface LiveRefinement {
  id: string
  text: string
  timestamp: Date
  type: RefinementType
}

export interface SideCanalState {
  // Domain State
  topics: Topic[]
  currentTopics: Topic[] // Topics from current conversation
  suggestions: Suggestion[]
  synopses: Record<string, string> // topicId -> synopsis text
  liveRefinements: LiveRefinement[]

  // Metadata Thought Stream
  metadataHistory: ThoughtEvent[]
  messageMetadata: Record<string, ThoughtEvent[]> // messageId → ordered pipeline events
  currentMetadata: Record<string, ThoughtEvent> // messageId → current live stage

  // UI State
  loading: boolean
  error: string | null
  toastVisible: boolean
  panelOpen: boolean

  // Feature Flags (persisted to localStorage)
  enabled: boolean
  contextInjectionEnabled: boolean
  autoExtractEnabled: boolean
  autoSynopsisEnabled: boolean

  // Metadata Actions
  pushMetadata: (event: ThoughtEvent) => void
  getMessageTimeline: (messageId: string) => ThoughtEvent[]
  clearMetadataForMessage: (messageId: string) => void

  // Actions
  extractAndStoreTopics: (query: string, response: string, queryId: string) => Promise<Topic[]>
  generateSynopsisForTopic: (topicId: string) => Promise<void>
  refreshSuggestions: () => Promise<void>
  loadTopics: () => Promise<void>
  removeSuggestion: (topicId: string) => void
  addRefinement: (text: string) => void
  clearRefinements: () => void
  getRefinementContext: () => string | null
  toggleEnabled: (enabled: boolean) => void
  toggleContextInjection: (enabled: boolean) => void
  toggleAutoExtract: (enabled: boolean) => void
  toggleAutoSynopsis: (enabled: boolean) => void
  setToastVisible: (visible: boolean) => void
  setPanelOpen: (open: boolean) => void
  reset: () => void
}

export const useSideCanalStore = create<SideCanalState>()(
  persist(
    (set, get) => ({
      // Initial State
      topics: [],
      currentTopics: [],
      suggestions: [],
      synopses: {},
      liveRefinements: [],
      metadataHistory: [],
      messageMetadata: {},
      currentMetadata: {},
      loading: false,
      error: null,
      toastVisible: false,
      panelOpen: false,

      // Feature Flags (defaults)
      enabled: true,
      contextInjectionEnabled: true,
      autoExtractEnabled: true,
      autoSynopsisEnabled: false, // Disabled to prevent errors (user can enable manually)

      // Metadata Actions

      pushMetadata: (event: ThoughtEvent) => {
        set((state) => {
          const messageId = event.messageId || ''
          const old = state.currentMetadata[messageId]
          const existingTimeline = state.messageMetadata[messageId] || []
          return {
            currentMetadata: { ...state.currentMetadata, [messageId]: event },
            metadataHistory: old
              ? [...state.metadataHistory, old]
              : state.metadataHistory,
            messageMetadata: {
              ...state.messageMetadata,
              [messageId]: [...existingTimeline, event],
            },
          }
        })
      },

      getMessageTimeline: (messageId: string) => {
        return get().messageMetadata[messageId] || []
      },

      clearMetadataForMessage: (messageId: string) => {
        set((state) => {
          const { [messageId]: _, ...restCurrent } = state.currentMetadata
          const { [messageId]: __, ...restTimeline } = state.messageMetadata
          return { currentMetadata: restCurrent, messageMetadata: restTimeline }
        })
      },

      // Actions

      /**
       * Extract topics from query/response pair and store them
       */
      extractAndStoreTopics: async (query: string, response: string, queryId: string) => {
        if (!get().enabled || !get().autoExtractEnabled) {
          return []
        }

        set({ loading: true, error: null })

        try {
          // Call extraction API endpoint
          const res = await fetch('/api/side-canal/extract', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query, response, queryId }),
          })

          if (!res.ok) {
            throw new Error('Failed to extract topics')
          }

          const data = await res.json()
          const extractedTopics: Topic[] = data.topics || []

          // Update current topics
          set({ currentTopics: extractedTopics, loading: false })

          // Refresh suggestions based on new topics
          if (extractedTopics.length > 0) {
            await get().refreshSuggestions()
          }

          return extractedTopics
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : 'Unknown error'
          set({ error: errorMsg, loading: false })
          console.error('[Side Canal] Topic extraction failed:', error)
          return []
        }
      },

      /**
       * Generate synopsis for a specific topic
       */
      generateSynopsisForTopic: async (topicId: string) => {
        set({ loading: true, error: null })

        try {
          // Get queries associated with this topic
          const topicRes = await fetch(`/api/side-canal/topics/${topicId}`)
          if (!topicRes.ok) {
            throw new Error('Failed to fetch topic details')
          }

          const topicData = await topicRes.json()
          const queryIds = topicData.relatedQueries?.map((q: any) => q.id) || []

          if (queryIds.length === 0) {
            set({ loading: false })
            return
          }

          // Call synopsis generation API
          const synopsisRes = await fetch('/api/side-canal/synopsis', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ topicId, queryIds }),
          })

          if (!synopsisRes.ok) {
            throw new Error('Failed to generate synopsis')
          }

          const { synopsis } = await synopsisRes.json()

          // Store synopsis in state
          set((state) => ({
            synopses: {
              ...state.synopses,
              [topicId]: synopsis,
            },
            loading: false,
          }))
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : 'Unknown error'
          set({ error: errorMsg, loading: false })
          console.error('[Side Canal] Synopsis generation failed:', error)
        }
      },

      /**
       * Refresh suggestions based on current topics
       */
      refreshSuggestions: async () => {
        const { currentTopics, enabled } = get()

        if (!enabled || currentTopics.length === 0) {
          set({ suggestions: [] })
          return
        }

        try {
          const topicIds = currentTopics.map((t) => t.id).join(',')
          const res = await fetch(`/api/side-canal/suggestions?topics=${topicIds}`)

          if (!res.ok) {
            throw new Error('Failed to fetch suggestions')
          }

          const data = await res.json()
          const newSuggestions: Suggestion[] = data.suggestions || []

          set({
            suggestions: newSuggestions,
            toastVisible: newSuggestions.length > 0,
          })
        } catch (error) {
          console.error('[Side Canal] Suggestion refresh failed:', error)
          set({ suggestions: [] })
        }
      },

      /**
       * Load all topics from database
       */
      loadTopics: async () => {
        set({ loading: true, error: null })

        try {
          const res = await fetch('/api/side-canal/topics')

          if (!res.ok) {
            throw new Error('Failed to load topics')
          }

          const data = await res.json()
          const allTopics: Topic[] = data.topics || []

          set({ topics: allTopics, loading: false })
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : 'Unknown error'
          set({ error: errorMsg, loading: false })
          console.error('[Side Canal] Topic loading failed:', error)
        }
      },

      /**
       * Remove a suggestion from the list
       */
      removeSuggestion: (topicId: string) => {
        set((state) => ({
          suggestions: state.suggestions.filter((s) => s.topicId !== topicId),
        }))

        // Hide toast if no suggestions remain
        if (get().suggestions.length === 0) {
          set({ toastVisible: false })
        }
      },

      /**
       * Add a live refinement with auto-classified type
       */
      addRefinement: (text: string) => {
        const lower = text.toLowerCase()
        let type: RefinementType = 'instruct'
        if (/\b(focus|narrow|specific|only|limit|restrict)\b/.test(lower)) type = 'refine'
        else if (/\b(more|deeper|detail|expand|elaborate|further)\b/.test(lower)) type = 'enhance'
        else if (/\b(wrong|correct|actually|no|fix|instead|not)\b/.test(lower)) type = 'correct'

        set((state) => ({
          liveRefinements: [
            ...state.liveRefinements,
            { id: Math.random().toString(36).slice(2, 10), text, timestamp: new Date(), type },
          ],
        }))
      },

      /**
       * Clear all live refinements
       */
      clearRefinements: () => {
        set({ liveRefinements: [] })
      },

      /**
       * Get formatted refinement context for AI injection
       */
      getRefinementContext: () => {
        const { liveRefinements } = get()
        if (liveRefinements.length === 0) return null
        return liveRefinements.map((r) => `- [${r.type}] ${r.text}`).join('\n')
      },

      /**
       * Toggle Side Canal feature on/off
       */
      toggleEnabled: (enabled: boolean) => {
        set({ enabled })
      },

      /**
       * Toggle context injection on/off
       */
      toggleContextInjection: (enabled: boolean) => {
        set({ contextInjectionEnabled: enabled })
      },

      /**
       * Toggle auto-extraction on/off
       */
      toggleAutoExtract: (enabled: boolean) => {
        set({ autoExtractEnabled: enabled })
      },

      /**
       * Toggle auto-synopsis generation on/off
       */
      toggleAutoSynopsis: (enabled: boolean) => {
        set({ autoSynopsisEnabled: enabled })
      },

      /**
       * Show/hide suggestion toast
       */
      setToastVisible: (visible: boolean) => {
        set({ toastVisible: visible })
      },

      /**
       * Open/close topics panel
       */
      setPanelOpen: (open: boolean) => {
        set({ panelOpen: open })
      },

      /**
       * Reset all state (except persisted feature flags)
       */
      reset: () => {
        set({
          topics: [],
          currentTopics: [],
          suggestions: [],
          synopses: {},
          metadataHistory: [],
          messageMetadata: {},
          currentMetadata: {},
          loading: false,
          error: null,
          toastVisible: false,
        })
      },
    }),
    {
      name: 'akhai-side-canal',
      partialize: (state) => ({
        enabled: state.enabled,
        contextInjectionEnabled: state.contextInjectionEnabled,
        autoExtractEnabled: state.autoExtractEnabled,
        autoSynopsisEnabled: state.autoSynopsisEnabled,
      }),
    }
  )
)
