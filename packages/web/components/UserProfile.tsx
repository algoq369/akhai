'use client'

import { useState, useEffect } from 'react'

interface User {
  id: string
  username: string | null
  email: string | null
  avatar_url: string | null
  auth_provider: 'github' | 'wallet'
}

export default function UserProfile() {
  const [user, setUser] = useState<User | null>(null)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    checkSession()
  }, [])

  const checkSession = async () => {
    try {
      const response = await fetch('/api/auth/session')
      const data = await response.json()
      setUser(data.user)
    } catch (error) {
      console.error('Session check error:', error)
    }
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/session', { method: 'POST' })
      setUser(null)
      setIsOpen(false)
      window.location.reload()
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  if (!user) return null

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 border-2 border-relic-slate/30 hover:border-relic-slate transition-all duration-200"
      >
        {user.avatar_url ? (
          <img
            src={user.avatar_url}
            alt={user.username || 'User'}
            className="w-6 h-6 rounded-full"
          />
        ) : (
          <div className="w-6 h-6 rounded-full bg-relic-mist flex items-center justify-center text-xs text-relic-slate">
            {user.username?.[0]?.toUpperCase() || 'U'}
          </div>
        )}
        <span className="text-xs text-relic-slate">{user.username || 'User'}</span>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-full mt-2 bg-relic-white border-2 border-relic-slate/30 p-4 min-w-[200px] z-50">
            <div className="mb-4">
              {user.avatar_url && (
                <img
                  src={user.avatar_url}
                  alt={user.username || 'User'}
                  className="w-12 h-12 rounded-full mb-2 mx-auto"
                />
              )}
              <p className="text-sm font-mono text-relic-slate text-center">
                {user.username || 'User'}
              </p>
              {user.email && (
                <p className="text-xs text-relic-silver text-center mt-1">
                  {user.email}
                </p>
              )}
              <p className="text-xs text-relic-silver text-center mt-2">
                {user.auth_provider === 'github' ? 'GitHub' : 'Wallet'}
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="w-full px-4 py-2 text-xs border-2 border-relic-slate/30 text-relic-slate hover:bg-relic-ghost/50 transition-all duration-200"
            >
              Logout
            </button>
          </div>
        </>
      )}
    </div>
  )
}

