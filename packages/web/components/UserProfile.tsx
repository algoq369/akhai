'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import DarkModeToggle from './DarkModeToggle'
import { LanguageSelectorCompact } from './LanguageSelector'

interface User {
  id: string
  username: string | null
  email: string | null
  avatar_url: string | null
  auth_provider: 'github' | 'wallet'
}

interface UserProfileProps {
  onDarkModeToggle?: () => void
  darkMode?: boolean
}

export default function UserProfile({ onDarkModeToggle, darkMode }: UserProfileProps = {}) {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    checkSession()
  }, [])

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false)
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [])

  // Settings keyboard shortcut (⌘,)
  useEffect(() => {
    const handleKeyboard = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === ',') {
        e.preventDefault()
        router.push('/settings')
      }
    }
    document.addEventListener('keydown', handleKeyboard)
    return () => document.removeEventListener('keydown', handleKeyboard)
  }, [router])

  const checkSession = async () => {
    try {
      const response = await fetch('/api/auth/session')
      const data = await response.json()
      setUser(data.user)
    } catch (error) {
      console.error('Session check error:', error)
    }
  }

  const handleNavigation = (path: string) => {
    setIsOpen(false)
    router.push(path)
  }

  const handleLogout = async () => {
    setIsOpen(false)
    try {
      // Call logout API
      await fetch('/api/auth/logout', { method: 'POST' })

      // Clear local storage
      localStorage.clear()

      // Redirect home
      router.push('/')
      router.refresh()
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  if (!user) return null

  const menuItems = [
    // User info header
    {
      type: 'header',
      label: user.email || user.username || 'User',
    },

    // Main navigation section
    {
      label: 'settings',
      path: '/settings',
      shortcut: '⌘,'
    },
    {
      label: 'profile',
      path: '/profile'
    },

    // Support section
    { type: 'divider' },
    {
      label: 'get help',
      path: '/help'
    },
    {
      label: 'upgrade plan',
      path: '/pricing'
    },

    // Logout section
    { type: 'divider' },
    {
      label: 'log out',
      action: 'logout'
    },
  ]

  const handleItemClick = (item: any) => {
    if (item.action === 'logout') {
      handleLogout()
    } else if (item.path) {
      handleNavigation(item.path)
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Dark Mode + Profile */}
      <div className="flex flex-col items-end gap-2">
        <div className="flex items-center gap-3">
          <DarkModeToggle onToggle={onDarkModeToggle} darkMode={darkMode} />

          {/* Profile Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-2 px-3 py-1.5 border border-relic-mist dark:border-relic-slate/30 hover:border-relic-slate dark:hover:border-relic-ghost transition-all duration-200 bg-white dark:bg-relic-void"
            aria-label="Open profile menu"
          >
          {user.avatar_url ? (
            <img
              src={user.avatar_url}
              alt={user.username || 'User'}
              className="w-6 h-6 rounded-full"
            />
          ) : (
            <div className="w-6 h-6 rounded-full bg-relic-ghost dark:bg-relic-slate flex items-center justify-center text-xs text-relic-slate dark:text-white">
              {user.username?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U'}
            </div>
          )}
          <span className="text-xs font-mono text-relic-slate dark:text-relic-ghost">{user.username || user.email?.split('@')[0] || 'User'}</span>
          <svg
            className={`w-3 h-3 text-relic-silver transition-transform ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        </div>

        {/* Language Selector - Below Username */}
        <LanguageSelectorCompact />
      </div>

          {/* Dropdown Menu */}
          {isOpen && (
            <div className="absolute top-full right-0 mt-2 min-w-[180px] border border-relic-mist dark:border-relic-slate/30 bg-white dark:bg-relic-void shadow-lg z-50">
              {menuItems.map((item, index) => {
                // Header (username/email)
                if (item.type === 'header') {
                  return (
                    <div
                      key={index}
                      className="font-mono text-[10px] text-relic-silver dark:text-relic-ghost px-4 py-2 border-b border-relic-mist dark:border-relic-slate/30"
                    >
                      {item.label}
                    </div>
                  )
                }

                // Divider
                if (item.type === 'divider') {
                  return (
                    <div
                      key={index}
                      className="border-t border-relic-mist dark:border-relic-slate/30 my-1"
                    />
                  )
                }

                // Menu item
                return (
                  <button
                    key={index}
                    onClick={() => handleItemClick(item)}
                    className="w-full text-left px-4 py-2 font-mono text-xs text-relic-slate dark:text-relic-ghost hover:text-relic-void dark:hover:text-white hover:bg-relic-ghost dark:hover:bg-relic-slate/10 transition-colors flex items-center justify-between"
                  >
                    <span>{item.label}</span>
                    {item.shortcut && (
                      <span className="text-[9px] opacity-50 ml-4">{item.shortcut}</span>
                    )}
                  </button>
                )
              })}
            </div>
          )}
    </div>
  )
}
