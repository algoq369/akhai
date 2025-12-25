'use client'

import { usePathname } from 'next/navigation'
import { useState } from 'react'

interface NavigationMenuProps {
  user: any
  onTopicsClick: () => void
  onMindMapClick: () => void
}

export default function NavigationMenu({ user, onTopicsClick, onMindMapClick }: NavigationMenuProps) {
  const pathname = usePathname()
  const [hoveredItem, setHoveredItem] = useState<string | null>(null)

  const menuItems = [
    { id: 'dashboard', label: 'dashboard', href: '/dashboard', isLink: true },
    { id: 'topics', label: 'topics', onClick: onTopicsClick, isLink: false },
    { id: 'mindmap', label: 'mindmap', onClick: onMindMapClick, isLink: false },
    { id: 'idea-factory', label: 'idea factory', href: '/idea-factory', isLink: true },
    { id: 'settings', label: 'settings', href: '/settings', isLink: true },
  ]

  const isActive = (id: string) => {
    if (id === 'dashboard' && pathname === '/dashboard') return true
    if (id === 'idea-factory' && pathname === '/idea-factory') return true
    if (id === 'settings' && pathname === '/settings') return true
    return false
  }

  return (
    <nav className="flex items-center gap-5">
      {menuItems.map((item) => {
        const active = isActive(item.id)
        const hovered = hoveredItem === item.id

        if (item.isLink) {
          return (
            <a
              key={item.id}
              href={item.href}
              onMouseEnter={() => setHoveredItem(item.id)}
              onMouseLeave={() => setHoveredItem(null)}
              className={`
                text-[10px] font-mono transition-all duration-200
                ${active
                  ? 'text-relic-slate border-b border-relic-slate'
                  : 'text-relic-silver hover:text-relic-slate'
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
              ${hovered ? 'text-relic-slate scale-105' : 'text-relic-silver hover:text-relic-slate'}
            `}
          >
            {item.label}
          </button>
        )
      })}
    </nav>
  )
}

