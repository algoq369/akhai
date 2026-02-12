/**
 * Pipeline Store
 * State management for SSE pipeline events and metadata
 */

import { create } from 'zustand'
import type { ThoughtEvent, PipelineSummary } from '@/lib/thought-stream'
import { generatePipelineSummary } from '@/lib/thought-stream'

export interface PipelineState {
  // Live metadata for currently processing messages
  currentMetadata: Record<string, ThoughtEvent | null>

  // Historical metadata for completed messages
  messageMetadata: Record<string, ThoughtEvent[]>

  // Query ID to Message ID mapping (backend uses queryId, frontend uses messageId)
  queryToMessageMap: Record<string, string>

  // Active EventSource connections
  activeConnections: Record<string, boolean>

  // Panel visibility
  historyPanelOpen: boolean

  // Actions
  setCurrentMetadata: (messageId: string, event: ThoughtEvent | null) => void
  addMetadataEvent: (messageId: string, event: ThoughtEvent) => void
  clearMetadata: (messageId: string) => void
  mapQueryToMessage: (queryId: string, messageId: string) => void
  getMessageIdForQuery: (queryId: string) => string | null
  setConnectionActive: (queryId: string, active: boolean) => void
  isConnectionActive: (queryId: string) => boolean
  setHistoryPanelOpen: (open: boolean) => void
  getPipelineSummary: (messageId: string) => PipelineSummary | null
  reset: () => void
}

export const usePipelineStore = create<PipelineState>()((set, get) => ({
  // Initial State
  currentMetadata: {},
  messageMetadata: {},
  queryToMessageMap: {},
  activeConnections: {},
  historyPanelOpen: false,

  // Actions

  /**
   * Set current (live) metadata for a message
   */
  setCurrentMetadata: (messageId, event) =>
    set((state) => ({
      currentMetadata: {
        ...state.currentMetadata,
        [messageId]: event
      }
    })),

  /**
   * Add a metadata event to the message timeline
   */
  addMetadataEvent: (messageId, event) =>
    set((state) => ({
      messageMetadata: {
        ...state.messageMetadata,
        [messageId]: [...(state.messageMetadata[messageId] || []), event]
      }
    })),

  /**
   * Clear all metadata for a message
   */
  clearMetadata: (messageId) =>
    set((state) => {
      const { [messageId]: _current, ...restCurrent } = state.currentMetadata
      const { [messageId]: _history, ...restHistory } = state.messageMetadata
      return {
        currentMetadata: restCurrent,
        messageMetadata: restHistory
      }
    }),

  /**
   * Map a backend queryId to a frontend messageId
   */
  mapQueryToMessage: (queryId, messageId) =>
    set((state) => ({
      queryToMessageMap: {
        ...state.queryToMessageMap,
        [queryId]: messageId
      }
    })),

  /**
   * Get the messageId for a queryId
   */
  getMessageIdForQuery: (queryId) => {
    return get().queryToMessageMap[queryId] || null
  },

  /**
   * Mark a connection as active/inactive
   */
  setConnectionActive: (queryId, active) =>
    set((state) => ({
      activeConnections: {
        ...state.activeConnections,
        [queryId]: active
      }
    })),

  /**
   * Check if a connection is active
   */
  isConnectionActive: (queryId) => {
    return get().activeConnections[queryId] || false
  },

  /**
   * Toggle history panel
   */
  setHistoryPanelOpen: (open) =>
    set({ historyPanelOpen: open }),

  /**
   * Get pipeline summary for a message
   */
  getPipelineSummary: (messageId) => {
    const events = get().messageMetadata[messageId]
    return events ? generatePipelineSummary(events) : null
  },

  /**
   * Reset all state
   */
  reset: () =>
    set({
      currentMetadata: {},
      messageMetadata: {},
      queryToMessageMap: {},
      activeConnections: {},
      historyPanelOpen: false
    })
}))
