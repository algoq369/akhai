/**
 * SESSION MANAGER
 *
 * Manages session IDs for Ascent Tracker persistence
 *
 * Ensures each user has a persistent session ID that tracks their
 * journey through the Tree of Life across multiple queries and sessions.
 */

'use client'

import { useState, useEffect } from 'react'
import type { AscentState } from './layer-registry'

/**
 * getSessionId
 *
 * Gets or creates a session ID for the current user.
 * Stored in localStorage for persistence.
 *
 * @returns Session ID (UUID)
 */
export function getSessionId(): string {
  // Server-side rendering: return placeholder
  if (typeof window === 'undefined') return 'server'

  let sessionId = localStorage.getItem('akhai_session_id')

  if (!sessionId) {
    // Generate new UUID
    sessionId = crypto.randomUUID()
    localStorage.setItem('akhai_session_id', sessionId)

    // Also set as cookie for API access
    document.cookie = `akhai_session_id=${sessionId}; path=/; max-age=31536000; SameSite=Lax`
  }

  return sessionId
}

/**
 * useSession
 *
 * React hook for session management.
 *
 * @returns Session ID and utilities
 */
export function useSession() {
  const [sessionId, setSessionId] = useState<string>('')
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
    setSessionId(getSessionId())
  }, [])

  const resetSession = () => {
    if (typeof window === 'undefined') return

    const newSessionId = crypto.randomUUID()
    localStorage.setItem('akhai_session_id', newSessionId)
    document.cookie = `akhai_session_id=${newSessionId}; path=/; max-age=31536000; SameSite=Lax`
    setSessionId(newSessionId)

    // Clear ascent state
    clearAscentState(sessionId)
  }

  return {
    sessionId,
    isClient,
    resetSession,
  }
}

/**
 * saveAscentState
 *
 * Saves ascent state to localStorage.
 * Allows persistence across page reloads.
 *
 * @param sessionId - Session ID
 * @param state - Ascent state to save
 */
export function saveAscentState(sessionId: string, state: AscentState): void {
  if (typeof window === 'undefined') return

  try {
    const key = `akhai_ascent_${sessionId}`
    localStorage.setItem(key, JSON.stringify(state))
  } catch (error) {
    console.warn('Failed to save ascent state:', error)
  }
}

/**
 * loadAscentState
 *
 * Loads ascent state from localStorage.
 *
 * @param sessionId - Session ID
 * @returns Ascent state or null if not found
 */
export function loadAscentState(sessionId: string): AscentState | null {
  if (typeof window === 'undefined') return null

  try {
    const key = `akhai_ascent_${sessionId}`
    const stored = localStorage.getItem(key)

    if (!stored) return null

    const parsed = JSON.parse(stored)

    // Reconstruct Date objects
    if (parsed.queryEvolution) {
      parsed.queryEvolution = parsed.queryEvolution.map((q: any) => ({
        ...q,
        timestamp: new Date(q.timestamp),
      }))
    }

    return parsed
  } catch (error) {
    console.warn('Failed to load ascent state:', error)
    return null
  }
}

/**
 * clearAscentState
 *
 * Clears ascent state from localStorage.
 * Used when user wants to reset their journey.
 *
 * @param sessionId - Session ID
 */
export function clearAscentState(sessionId: string): void {
  if (typeof window === 'undefined') return

  try {
    const key = `akhai_ascent_${sessionId}`
    localStorage.removeItem(key)
  } catch (error) {
    console.warn('Failed to clear ascent state:', error)
  }
}

/**
 * getAscentHistory
 *
 * Gets the full ascent history for a session.
 *
 * @param sessionId - Session ID
 * @returns Array of query evolution entries
 */
export function getAscentHistory(sessionId: string): any[] {
  const state = loadAscentState(sessionId)
  return state?.queryEvolution || []
}

/**
 * getAscentStats
 *
 * Gets statistics about the user's ascent journey.
 *
 * @param sessionId - Session ID
 * @returns Ascent statistics
 */
export function getAscentStats(sessionId: string) {
  const state = loadAscentState(sessionId)

  if (!state) {
    return {
      totalQueries: 0,
      currentLevel: 1,
      peakLevel: 1,
      velocity: 0,
      insightsGained: 0,
    }
  }

  return {
    totalQueries: state.totalQueries,
    currentLevel: state.currentLevel,
    peakLevel: state.peakLevel,
    velocity: state.ascentVelocity,
    insightsGained: state.insightsGained.length,
  }
}
