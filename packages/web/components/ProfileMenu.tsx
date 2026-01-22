'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { User, Settings, Globe, History, HelpCircle, Crown, LogOut, Trophy } from 'lucide-react'
import DarkModeToggle from './DarkModeToggle'

interface ProfileMenuProps {
  userName?: string
  userEmail?: string
  avatarUrl?: string
  onLogout?: () => void
}

/**
 * ProfileMenu - Dropdown profile menu with 8 items
 * Day 8 Component - Relic minimalist design
 */
export default function ProfileMenu({ userName: userNameProp, userEmail: userEmailProp, avatarUrl: avatarUrlProp, onLogout }: ProfileMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [showLanguageSelector, setShowLanguageSelector] = useState(false)
  const [showTournamentTooltip, setShowTournamentTooltip] = useState(false)
  const [user, setUser] = useState<{ username: string | null; email: string | null; avatar_url: string | null } | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  // Fetch user session data
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch('/api/auth/session')
        const data = await response.json()
        if (data.user) {
          setUser(data.user)
        }
      } catch (error) {
        console.error('Failed to fetch user session:', error)
      }
    }
    fetchUser()
  }, [])

  // Use fetched user data or fallback to props
  const userName = user?.username || userNameProp || 'algoq369'
  const userEmail = user?.email || userEmailProp
  const avatarUrl = user?.avatar_url || avatarUrlProp

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const handleLogout = () => {
    setIsOpen(false)
    if (onLogout) {
      onLogout()
    }
  }

  const menuItems = [
    {
      icon: Settings,
      label: 'Settings',
      href: '/settings',
      action: null,
      disabled: false
    },
    {
      icon: Globe,
      label: 'Language',
      href: null,
      action: () => setShowLanguageSelector(true),
      disabled: false
    },
    {
      icon: User,
      label: 'Profile',
      href: '/profile',
      action: null,
      disabled: false
    },
    {
      icon: History,
      label: 'History',
      href: '/history',
      action: null,
      disabled: false
    },
    {
      icon: HelpCircle,
      label: 'Help',
      href: '/help',
      action: null,
      disabled: false
    },
    {
      icon: Crown,
      label: 'Upgrade',
      href: '/pricing',
      action: null,
      disabled: false
    },
    {
      icon: LogOut,
      label: 'Logout',
      href: null,
      action: handleLogout,
      disabled: false
    },
    {
      icon: Trophy,
      label: 'Tournament',
      href: null,
      action: null,
      disabled: true,
      tooltip: 'Coming Day 150'
    }
  ]

  return (
    <div className="relative" ref={menuRef}>
      {/* Dark Mode + Profile */}
      <div className="flex items-center gap-3">
        <DarkModeToggle />

        {/* Profile Button - Raw text, no background */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 text-sm font-mono text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition-colors"
          aria-label="Open profile menu"
        >
          <User className="w-4 h-4" />
          <span>algoq369</span>
        </button>
      </div>

      {/* Dropdown Menu - Raw text, no background */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 z-50" style={{ overflow: 'visible' }}>
          {/* User Info Header with GitHub Avatar */}
          <div className="px-4 py-3 border-b border-slate-200/30 dark:border-slate-700/30">
            <div className="flex items-center gap-3">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={userName}
                  className="w-10 h-10 rounded-full"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                  <User className="w-5 h-5 text-slate-500" />
                </div>
              )}
              <div>
                <div className="text-sm font-medium text-slate-900 dark:text-slate-100">{userName}</div>
                {userEmail && (
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{userEmail}</div>
                )}
              </div>
            </div>
          </div>

          {/* Menu Items - Raw text, no backgrounds */}
          <div className="py-2">
            {menuItems.map((item, index) => {
              const Icon = item.icon

              if (item.disabled) {
                return (
                  <div
                    key={index}
                    className="relative px-4 py-2 flex items-center justify-between text-slate-400 dark:text-slate-500 cursor-not-allowed"
                    onMouseEnter={() => setShowTournamentTooltip(true)}
                    onMouseLeave={() => setShowTournamentTooltip(false)}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-4 h-4" />
                      <span className="text-sm font-mono">{item.label}</span>
                    </div>

                    {/* Badge showing "Day 150" - always visible */}
                    <span className="text-[10px] px-2 py-0.5 text-slate-400 dark:text-slate-600 font-mono">
                      Day 150
                    </span>

                    {/* Tooltip on hover - positioned relative to viewport */}
                    {showTournamentTooltip && (
                      <div
                        className="fixed px-3 py-2 rounded-md bg-slate-800 dark:bg-slate-700 text-white text-xs font-medium whitespace-nowrap shadow-2xl pointer-events-none"
                        style={{
                          position: 'fixed',
                          top: '50%',
                          right: '280px',
                          transform: 'translateY(-50%)',
                          zIndex: 99999
                        }}
                      >
                        Coming Day 150
                      </div>
                    )}
                  </div>
                )
              }

              if (item.href) {
                return (
                  <Link
                    key={index}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className="px-4 py-2 flex items-center gap-3 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition-colors"
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-sm font-mono">{item.label}</span>
                  </Link>
                )
              }

              if (item.action) {
                return (
                  <button
                    key={index}
                    onClick={item.action}
                    className="w-full px-4 py-2 flex items-center gap-3 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition-colors text-left"
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-sm font-mono">{item.label}</span>
                  </button>
                )
              }

              return null
            })}
          </div>
        </div>
      )}

      {/* Language Selector Modal - Raw minimalist */}
      {showLanguageSelector && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50" onClick={() => setShowLanguageSelector(false)}>
          <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm p-6 max-w-sm" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-mono text-slate-900 dark:text-slate-100 mb-4">Select Language</h3>
            <div className="space-y-2">
              {['English', 'Français', 'Español', '中文', '日本語'].map((lang) => (
                <button
                  key={lang}
                  onClick={() => setShowLanguageSelector(false)}
                  className="w-full px-4 py-2 text-left text-sm font-mono text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition-colors"
                >
                  {lang}
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowLanguageSelector(false)}
              className="mt-4 w-full px-4 py-2 text-sm font-mono text-slate-500 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
