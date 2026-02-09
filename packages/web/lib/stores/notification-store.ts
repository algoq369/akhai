import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/**
 * Notification types for AkhAI system
 */
export type NotificationType = 'ai_news' | 'system' | 'insight' | 'guard_alert'

/**
 * Notification item structure
 */
export interface Notification {
  id: string
  type: NotificationType
  title: string
  message: string
  timestamp: number
  read: boolean
  url?: string
  metadata?: {
    category?: string
    source?: string
    layerNode?: number
    guardScore?: number
  }
}

/**
 * Notification State Interface
 */
interface NotificationState {
  /** List of notifications */
  notifications: Notification[]

  /** Maximum notifications to keep */
  maxNotifications: number

  /** Add a new notification */
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void

  /** Mark a notification as read */
  markAsRead: (id: string) => void

  /** Mark all notifications as read */
  markAllAsRead: () => void

  /** Remove a notification */
  removeNotification: (id: string) => void

  /** Clear all notifications */
  clearAll: () => void

  /** Get unread count */
  getUnreadCount: () => number
}

/**
 * Generate unique notification ID
 */
const generateId = () => `notif_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`

/**
 * Notification Store
 * Zustand store with localStorage persistence for notification management
 */
export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      notifications: [],
      maxNotifications: 50,

      addNotification: (notification) =>
        set((state) => {
          const newNotification: Notification = {
            ...notification,
            id: generateId(),
            timestamp: Date.now(),
            read: false
          }

          const updated = [newNotification, ...state.notifications]
            .slice(0, state.maxNotifications)

          return { notifications: updated }
        }),

      markAsRead: (id) =>
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n
          )
        })),

      markAllAsRead: () =>
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, read: true }))
        })),

      removeNotification: (id) =>
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id)
        })),

      clearAll: () => set({ notifications: [] }),

      getUnreadCount: () => {
        const state = get()
        return state.notifications.filter((n) => !n.read).length
      }
    }),
    {
      name: 'akhai-notifications',
      version: 1
    }
  )
)

/**
 * Helper to create system notification
 */
export function createSystemNotification(title: string, message: string) {
  useNotificationStore.getState().addNotification({
    type: 'system',
    title,
    message
  })
}

/**
 * Helper to create guard alert notification
 */
export function createGuardAlert(title: string, message: string, guardScore?: number) {
  useNotificationStore.getState().addNotification({
    type: 'guard_alert',
    title,
    message,
    metadata: { guardScore }
  })
}

/**
 * Helper to create insight notification
 */
export function createInsightNotification(title: string, message: string, layerNode?: number) {
  useNotificationStore.getState().addNotification({
    type: 'insight',
    title,
    message,
    metadata: { layerNode }
  })
}

/**
 * Helper to create AI news notification
 */
export function createAINewsNotification(
  title: string,
  message: string,
  category: string,
  source: string,
  url?: string
) {
  useNotificationStore.getState().addNotification({
    type: 'ai_news',
    title,
    message,
    url,
    metadata: { category, source }
  })
}
