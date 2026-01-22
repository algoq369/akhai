'use client'

import { useState, useRef, useEffect } from 'react'
import { BellIcon, XMarkIcon, CheckIcon } from '@heroicons/react/24/outline'
import { useNotificationStore, Notification, NotificationType } from '@/lib/stores/notification-store'

/**
 * Format relative time from timestamp
 */
function formatRelativeTime(timestamp: number): string {
  const now = Date.now()
  const diff = now - timestamp
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return 'now'
  if (minutes < 60) return `${minutes}m`
  if (hours < 24) return `${hours}h`
  return `${days}d`
}

/**
 * Get notification type indicator
 */
function getTypeIndicator(type: NotificationType): { label: string; color: string } {
  switch (type) {
    case 'ai_news':
      return { label: 'news', color: 'text-relic-slate' }
    case 'system':
      return { label: 'sys', color: 'text-relic-silver' }
    case 'insight':
      return { label: 'insight', color: 'text-cyan-500' }
    case 'guard_alert':
      return { label: 'guard', color: 'text-amber-500' }
    default:
      return { label: 'notif', color: 'text-relic-silver' }
  }
}

/**
 * Single notification item component
 */
function NotificationItem({
  notification,
  onMarkRead,
  onRemove
}: {
  notification: Notification
  onMarkRead: () => void
  onRemove: () => void
}) {
  const { label, color } = getTypeIndicator(notification.type)

  return (
    <div
      className={`group px-2 py-1.5 border-b border-relic-mist last:border-b-0 ${
        notification.read ? 'opacity-60' : ''
      }`}
    >
      <div className="flex items-start gap-1.5">
        <span className={`font-mono text-[7px] uppercase ${color} mt-0.5`}>
          {label}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1">
            <span className="font-mono text-[9px] text-relic-void dark:text-relic-ghost truncate">
              {notification.title}
            </span>
            <span className="font-mono text-[7px] text-relic-silver">
              {formatRelativeTime(notification.timestamp)}
            </span>
          </div>
          <p className="font-mono text-[8px] text-relic-slate dark:text-relic-silver truncate">
            {notification.message}
          </p>
          {notification.url && (
            <a
              href={notification.url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-[7px] text-cyan-600 hover:underline"
            >
              view
            </a>
          )}
        </div>
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          {!notification.read && (
            <button
              onClick={onMarkRead}
              className="p-0.5 hover:bg-relic-ghost dark:hover:bg-relic-void/20 rounded"
              title="Mark as read"
            >
              <CheckIcon className="w-2.5 h-2.5 text-relic-silver" />
            </button>
          )}
          <button
            onClick={onRemove}
            className="p-0.5 hover:bg-relic-ghost dark:hover:bg-relic-void/20 rounded"
            title="Remove"
          >
            <XMarkIcon className="w-2.5 h-2.5 text-relic-silver" />
          </button>
        </div>
      </div>
    </div>
  )
}

/**
 * NotificationBell Component
 * Displays notification bell icon with badge and dropdown panel
 * Code Relic aesthetic: grey, monospace, no emojis
 */
export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const {
    notifications,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll,
    getUnreadCount
  } = useNotificationStore()

  const unreadCount = getUnreadCount()

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Keyboard shortcut: Escape to close
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false)
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-1 hover:bg-relic-ghost dark:hover:bg-relic-void/20 rounded transition-colors"
        title={`${unreadCount} unread notifications`}
      >
        <BellIcon className="w-4 h-4 text-relic-slate dark:text-relic-silver" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[12px] h-3 flex items-center justify-center bg-relic-void dark:bg-relic-ghost text-relic-white dark:text-relic-void text-[7px] font-mono rounded-full px-0.5">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-1 w-64 bg-relic-white dark:bg-relic-void border border-relic-mist dark:border-relic-slate/20 rounded shadow-lg z-50">
          {/* Header */}
          <div className="flex items-center justify-between px-2 py-1.5 border-b border-relic-mist dark:border-relic-slate/20">
            <span className="font-mono text-[9px] uppercase tracking-wider text-relic-slate">
              notifications
            </span>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="font-mono text-[7px] text-relic-silver hover:text-relic-slate"
                >
                  mark all read
                </button>
              )}
              {notifications.length > 0 && (
                <>
                  <span className="text-relic-silver">|</span>
                  <button
                    onClick={clearAll}
                    className="font-mono text-[7px] text-relic-silver hover:text-relic-slate"
                  >
                    clear
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Notification List */}
          <div className="max-h-64 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-2 py-4 text-center">
                <span className="font-mono text-[9px] text-relic-silver">
                  no notifications
                </span>
              </div>
            ) : (
              notifications.slice(0, 10).map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onMarkRead={() => markAsRead(notification.id)}
                  onRemove={() => removeNotification(notification.id)}
                />
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 10 && (
            <div className="px-2 py-1 border-t border-relic-mist dark:border-relic-slate/20">
              <span className="font-mono text-[7px] text-relic-silver">
                +{notifications.length - 10} more
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
