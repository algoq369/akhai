'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'

interface NavigationMenuProps {
  user: any
  onMindMapClick: () => void
  onHistoryClick?: () => void
}

export default function NavigationMenu({ user, onMindMapClick, onHistoryClick }: NavigationMenuProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [hoveredItem, setHoveredItem] = useState<string | null>(null)

  const menuItems = [
    { id: 'philosophy', label: 'philosophy', href: '/philosophy', isLink: true, accent: 'violet' },
    { id: 'intelligence-robot-training', label: 'intelligence & robot training', href: '/idea-factory?tab=customize', isLink: true },
    { id: 'mindmap', label: 'mindmap', onClick: onMindMapClick, isLink: false },
    { id: 'pricing', label: '₿', href: '/pricing', isLink: true, accent: 'bitcoin' },
    // Only show profile link if user is logged in (use button for client-side navigation)
    ...(user ? [{ id: 'profile', label: 'profile', onClick: () => router.push('/profile'), isLink: false }] : []),
  ]

  const isActive = (id: string) => {
    if (id === 'philosophy' && pathname === '/philosophy') return true
    if (id === 'history' && pathname === '/history') return true
    if (id === 'pricing' && pathname === '/pricing') return true
    if (id === 'profile' && pathname === '/profile') return true
    if (id === 'intelligence-robot-training' && pathname === '/idea-factory') return true
    return false
  }

  return (
    <nav className="flex items-center gap-4">
      {menuItems.map((item) => {
        const active = isActive(item.id)
        const hovered = hoveredItem === item.id

        if (item.isLink) {
          // Special styling for Bitcoin pricing button
          if (item.accent === 'bitcoin') {
            return (
              <a
                key={item.id}
                href={item.href}
                onMouseEnter={() => setHoveredItem(item.id)}
                onMouseLeave={() => setHoveredItem(null)}
                className={`
                  relative text-base font-mono transition-all duration-300
                  ${active
                    ? 'text-relic-void dark:text-white border-b border-relic-slate dark:border-relic-ghost'
                    : 'text-relic-silver dark:text-relic-ghost hover:text-relic-slate dark:hover:text-white'
                  }
                  ${hovered ? 'scale-110' : 'scale-100'}
                `}
              >
                {item.label}
              </a>
            )
          }

          return (
            <a
              key={item.id}
              href={item.href}
              onMouseEnter={() => setHoveredItem(item.id)}
              onMouseLeave={() => setHoveredItem(null)}
              className={`
                text-[10px] font-mono transition-all duration-200
                ${active
                  ? item.accent === 'violet'
                    ? 'text-violet-500 dark:text-violet-400 border-b border-violet-500 dark:border-violet-400'
                    : 'text-relic-slate dark:text-relic-ghost border-b border-relic-slate dark:border-relic-ghost'
                  : item.accent === 'violet'
                    ? 'text-violet-400/70 dark:text-violet-400/80 hover:text-violet-500 dark:hover:text-violet-300'
                    : 'text-relic-silver dark:text-relic-ghost hover:text-relic-slate dark:hover:text-white'
                }
                ${hovered ? 'scale-105' : ''}
              `}
            >
              {item.label}
            </a>
          )
        }

        return (
          <button
            key={item.id}
            type="button"
            onClick={item.onClick}
            onMouseEnter={() => setHoveredItem(item.id)}
            onMouseLeave={() => setHoveredItem(null)}
            className={`
              text-[10px] font-mono transition-all duration-200
              ${hovered ? 'text-relic-slate dark:text-white scale-105' : 'text-relic-silver dark:text-relic-ghost hover:text-relic-slate dark:hover:text-white'}
            `}
          >
            {item.label}
          </button>
        )
      })}
    </nav>
  )
}
