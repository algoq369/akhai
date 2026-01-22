'use client'

import { useEffect, useState } from 'react'

interface DarkModeToggleProps {
  onToggle?: () => void
  darkMode?: boolean
}

export default function DarkModeToggle({ onToggle, darkMode: externalDarkMode }: DarkModeToggleProps = {}) {
  const [internalDarkMode, setInternalDarkMode] = useState(false)
  const [mounted, setMounted] = useState(false)

  // Use external dark mode if provided, otherwise use internal state
  const darkMode = externalDarkMode !== undefined ? externalDarkMode : internalDarkMode

  useEffect(() => {
    setMounted(true)
    // Only initialize internal state if not using external state
    if (externalDarkMode === undefined) {
      const savedDarkMode = localStorage.getItem('darkMode') === 'true'
      setInternalDarkMode(savedDarkMode)
      if (savedDarkMode) {
        document.documentElement.classList.add('dark')
      }

      // Listen for dark mode changes from other components
      const handleDarkModeChange = (e: CustomEvent) => {
        setInternalDarkMode(e.detail.darkMode)
      }

      window.addEventListener('darkModeChange' as any, handleDarkModeChange as any)

      return () => {
        window.removeEventListener('darkModeChange' as any, handleDarkModeChange as any)
      }
    }
  }, [externalDarkMode])

  const handleToggle = () => {
    if (onToggle) {
      // Use external toggle function if provided
      onToggle()
    } else {
      // Otherwise use internal toggle logic
      const newValue = !internalDarkMode
      setInternalDarkMode(newValue)
      localStorage.setItem('darkMode', String(newValue))
      if (newValue) {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }

      // Notify other components about dark mode change
      const event = new CustomEvent('darkModeChange', { detail: { darkMode: newValue } })
      window.dispatchEvent(event)
    }
  }

  if (!mounted) {
    return <div className="w-2 h-2" /> // Placeholder
  }

  return (
    <button
      onClick={handleToggle}
      className="flex items-center gap-1.5 text-relic-silver hover:text-relic-slate dark:text-relic-ghost dark:hover:text-white transition-colors group"
      aria-label="Toggle dark mode"
      title={darkMode ? 'Dark mode' : 'Light mode'}
    >
      {/* White lighting dot indicator */}
      <span className="w-1.5 h-1.5 rounded-full bg-white border border-relic-mist dark:border-relic-slate/30 shadow-sm"></span>

      {/* Power symbol */}
      <span className="text-[10px] leading-none">⏻</span>
    </button>
  )
}
