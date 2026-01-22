import { create } from 'zustand'
import { Implementation } from '@/lib/implementation-tracker'

interface ImplementationStore {
  current: Implementation | null
  pending: Implementation[]
  all: Implementation[]
  progress: {
    total: number
    validated: number
    pending: number
    testing: number
    reverted: number
    byType: Record<string, number>
  } | null
  isLoading: boolean

  setCurrent: (impl: Implementation | null) => void
  fetchPending: () => Promise<void>
  fetchAll: () => Promise<void>
  validate: (id: number, message?: string) => Promise<void>
  reject: (id: number, reason?: string) => Promise<void>
  markTesting: (id: number) => Promise<void>
}

export const useImplementationStore = create<ImplementationStore>((set, get) => ({
  current: null,
  pending: [],
  all: [],
  progress: null,
  isLoading: false,

  setCurrent: (impl) => set({ current: impl }),

  fetchPending: async () => {
    set({ isLoading: true })
    try {
      const res = await fetch('/api/implementations?status=pending')
      const data = await res.json()
      set({ pending: data.implementations, isLoading: false })
    } catch (error) {
      console.error('Failed to fetch pending implementations:', error)
      set({ isLoading: false })
    }
  },

  fetchAll: async () => {
    set({ isLoading: true })
    try {
      const res = await fetch('/api/implementations')
      const data = await res.json()
      set({ all: data.implementations, progress: data.progress, isLoading: false })
    } catch (error) {
      console.error('Failed to fetch implementations:', error)
      set({ isLoading: false })
    }
  },

  validate: async (id, message) => {
    try {
      await fetch('/api/implementations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action: 'validate', message })
      })
      get().fetchPending()
      get().fetchAll()
    } catch (error) {
      console.error('Failed to validate implementation:', error)
    }
  },

  reject: async (id, reason) => {
    try {
      await fetch('/api/implementations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action: 'reject', message: reason })
      })
      get().fetchPending()
      get().fetchAll()
    } catch (error) {
      console.error('Failed to reject implementation:', error)
    }
  },

  markTesting: async (id) => {
    try {
      await fetch('/api/implementations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action: 'testing' })
      })
      get().fetchPending()
    } catch (error) {
      console.error('Failed to mark testing:', error)
    }
  }
}))
