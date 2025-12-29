'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface User {
  id: string
  username: string | null
  email: string | null
  avatar_url: string | null
  auth_provider: 'github' | 'wallet'
}

export default function UserProfile() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)

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

  if (!user) return null

  return (
    <button
      onClick={() => router.push('/profile')}
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
  )
}

