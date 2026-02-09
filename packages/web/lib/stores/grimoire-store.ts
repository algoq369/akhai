/**
 * GRIMOIRE STORE
 *
 * Persistent workspaces with memory
 * Like Claude Projects - isolated contexts with conversation history
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface Grimoire {
  id: string
  name: string
  description?: string
  icon: string
  color: string
  instructions?: string
  userId: string
  createdAt: number
  updatedAt: number
  archived: boolean
}

export interface Memory {
  id: string
  grimoireId: string
  content: string
  type: 'insight' | 'fact' | 'preference' | 'context'
  sourceMessageId?: string
  confidence: number
  relevanceScore: number // 0-1 score based on recency and access frequency
  accessCount: number // Number of times this memory was accessed
  createdAt: number
  lastAccessed?: number
  archived?: boolean // Memories inactive for 90+ days get archived
}

// 90 days in milliseconds
const MEMORY_TTL_MS = 90 * 24 * 60 * 60 * 1000

/**
 * Calculate memory relevance score based on recency and access frequency
 */
function calculateRelevance(memory: Memory): number {
  const now = Date.now()
  const ageMs = now - memory.createdAt
  const lastAccessMs = memory.lastAccessed ? now - memory.lastAccessed : ageMs

  // Recency factor (0-1): more recent = higher score
  // Decays over 30 days
  const recencyFactor = Math.max(0, 1 - (lastAccessMs / (30 * 24 * 60 * 60 * 1000)))

  // Access frequency factor (0-1): more accesses = higher score
  // Caps at 10 accesses
  const accessFactor = Math.min(1, (memory.accessCount || 0) / 10)

  // Confidence contributes to relevance
  const confidenceFactor = memory.confidence || 0.5

  // Weighted combination: 40% recency, 30% access, 30% confidence
  return (recencyFactor * 0.4) + (accessFactor * 0.3) + (confidenceFactor * 0.3)
}

/**
 * Check if memory should be archived (inactive for 90+ days)
 */
function shouldArchive(memory: Memory): boolean {
  const now = Date.now()
  const lastActivity = memory.lastAccessed || memory.createdAt
  return (now - lastActivity) > MEMORY_TTL_MS
}

export interface GrimoireFile {
  id: string
  grimoireId: string
  name: string
  type: string
  size: number
  path: string
  createdAt: number
}

export interface GrimoireLink {
  id: string
  grimoireId: string
  url: string
  title?: string
  description?: string
  createdAt: number
}

export interface GrimoireConversation {
  id: string
  grimoireId: string
  title?: string
  createdAt: number
  updatedAt: number
}

interface GrimoireStore {
  // State
  grimoires: Grimoire[]
  activeGrimoireId: string | null
  memories: Record<string, Memory[]> // keyed by grimoireId
  files: Record<string, GrimoireFile[]> // keyed by grimoireId
  links: Record<string, GrimoireLink[]> // keyed by grimoireId

  // Grimoire actions
  createGrimoire: (name: string, description?: string, userId?: string) => Grimoire
  setActiveGrimoire: (id: string | null) => void
  updateGrimoire: (id: string, updates: Partial<Grimoire>) => void
  deleteGrimoire: (id: string) => void
  getGrimoire: (id: string) => Grimoire | undefined

  // Memory actions
  addMemory: (grimoireId: string, memory: Omit<Memory, 'id' | 'createdAt' | 'relevanceScore' | 'accessCount' | 'archived'>) => void
  getMemories: (grimoireId: string) => Memory[]
  getActiveMemories: (grimoireId: string) => Memory[] // Returns non-archived memories sorted by relevance
  clearMemories: (grimoireId: string) => void
  updateMemoryAccess: (memoryId: string) => void
  archiveStaleMemories: () => void // Archive memories inactive for 90+ days

  // File actions
  addFile: (grimoireId: string, file: Omit<GrimoireFile, 'id' | 'createdAt'>) => void
  getFiles: (grimoireId: string) => GrimoireFile[]
  deleteFile: (fileId: string) => void

  // Link actions
  addLink: (grimoireId: string, link: Omit<GrimoireLink, 'id' | 'createdAt'>) => void
  getLinks: (grimoireId: string) => GrimoireLink[]
  deleteLink: (linkId: string) => void

  // Utility
  reset: () => void
}

export const useGrimoireStore = create<GrimoireStore>()(
  persist(
    (set, get) => ({
      grimoires: [],
      activeGrimoireId: null,
      memories: {},
      files: {},
      links: {},

      // Grimoire actions
      createGrimoire: (name, description, userId = 'local') => {
        const grimoire: Grimoire = {
          id: crypto.randomUUID(),
          name,
          description,
          icon: '📜',
          color: 'zinc',
          userId,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          archived: false
        }
        set(state => ({
          grimoires: [...state.grimoires, grimoire]
        }))
        return grimoire
      },

      setActiveGrimoire: (id) => {
        set({ activeGrimoireId: id })
      },

      updateGrimoire: (id, updates) => {
        set(state => ({
          grimoires: state.grimoires.map(g =>
            g.id === id
              ? { ...g, ...updates, updatedAt: Date.now() }
              : g
          )
        }))
      },

      deleteGrimoire: (id) => {
        set(state => ({
          grimoires: state.grimoires.filter(g => g.id !== id),
          activeGrimoireId: state.activeGrimoireId === id ? null : state.activeGrimoireId,
          // Also remove memories for this grimoire
          memories: Object.fromEntries(
            Object.entries(state.memories).filter(([key]) => key !== id)
          )
        }))
      },

      getGrimoire: (id) => {
        return get().grimoires.find(g => g.id === id)
      },

      // Memory actions
      addMemory: (grimoireId, memory) => {
        const newMemory: Memory = {
          ...memory,
          id: crypto.randomUUID(),
          grimoireId,
          createdAt: Date.now(),
          relevanceScore: memory.confidence || 0.5, // Initial relevance based on confidence
          accessCount: 0,
          archived: false,
        }

        set(state => ({
          memories: {
            ...state.memories,
            [grimoireId]: [
              ...(state.memories[grimoireId] || []),
              newMemory
            ]
          }
        }))
      },

      getMemories: (grimoireId) => {
        return get().memories[grimoireId] || []
      },

      getActiveMemories: (grimoireId) => {
        const memories = get().memories[grimoireId] || []
        return memories
          .filter(m => !m.archived)
          .map(m => ({ ...m, relevanceScore: calculateRelevance(m) }))
          .sort((a, b) => b.relevanceScore - a.relevanceScore)
      },

      clearMemories: (grimoireId) => {
        set(state => ({
          memories: {
            ...state.memories,
            [grimoireId]: []
          }
        }))
      },

      updateMemoryAccess: (memoryId) => {
        set(state => ({
          memories: Object.fromEntries(
            Object.entries(state.memories).map(([gId, mems]) => [
              gId,
              mems.map(m => {
                if (m.id !== memoryId) return m
                const updated = {
                  ...m,
                  lastAccessed: Date.now(),
                  accessCount: (m.accessCount || 0) + 1,
                }
                return { ...updated, relevanceScore: calculateRelevance(updated) }
              })
            ])
          )
        }))
      },

      archiveStaleMemories: () => {
        set(state => ({
          memories: Object.fromEntries(
            Object.entries(state.memories).map(([gId, mems]) => [
              gId,
              mems.map(m => shouldArchive(m) ? { ...m, archived: true } : m)
            ])
          )
        }))
      },

      // File actions
      addFile: (grimoireId, file) => {
        const newFile: GrimoireFile = {
          ...file,
          id: crypto.randomUUID(),
          grimoireId,
          createdAt: Date.now()
        }

        set(state => ({
          files: {
            ...state.files,
            [grimoireId]: [
              ...(state.files[grimoireId] || []),
              newFile
            ]
          }
        }))
      },

      getFiles: (grimoireId) => {
        return get().files[grimoireId] || []
      },

      deleteFile: (fileId) => {
        set(state => ({
          files: Object.fromEntries(
            Object.entries(state.files).map(([gId, files]) => [
              gId,
              files.filter(f => f.id !== fileId)
            ])
          )
        }))
      },

      // Link actions
      addLink: (grimoireId, link) => {
        const newLink: GrimoireLink = {
          ...link,
          id: crypto.randomUUID(),
          grimoireId,
          createdAt: Date.now()
        }

        set(state => ({
          links: {
            ...state.links,
            [grimoireId]: [
              ...(state.links[grimoireId] || []),
              newLink
            ]
          }
        }))
      },

      getLinks: (grimoireId) => {
        return get().links[grimoireId] || []
      },

      deleteLink: (linkId) => {
        set(state => ({
          links: Object.fromEntries(
            Object.entries(state.links).map(([gId, links]) => [
              gId,
              links.filter(l => l.id !== linkId)
            ])
          )
        }))
      },

      // Utility
      reset: () => {
        set({
          grimoires: [],
          activeGrimoireId: null,
          memories: {},
          files: {},
          links: {}
        })
      }
    }),
    {
      name: 'akhai-grimoires',
      // Only persist grimoires list and activeId, not all memories
      partialize: (state) => ({
        grimoires: state.grimoires,
        activeGrimoireId: state.activeGrimoireId,
        // Memories are fetched from database
      }),
    }
  )
)
