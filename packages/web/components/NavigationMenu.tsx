'use client';

import { usePathname } from 'next/navigation';
import { useState } from 'react';
import Link from 'next/link';

interface NavigationMenuProps {
  user: any;
  onMindMapClick: () => void;
  onHistoryClick?: () => void;
}

export default function NavigationMenu({
  user,
  onMindMapClick,
  onHistoryClick,
}: NavigationMenuProps) {
  const pathname = usePathname();
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  const menuItems = [
    {
      id: 'philosophy',
      label: 'philosophy',
      mobileLabel: 'phil',
      href: '/philosophy',
      isLink: true,
      accent: 'violet',
    },
    {
      id: 'intelligence-robot-training',
      label: 'intelligence & robot',
      mobileLabel: 'robot',
      href: '/idea-factory?tab=customize',
      isLink: true,
    },
    {
      id: 'constellation',
      label: 'constellation',
      mobileLabel: 'const',
      href: '/constellation',
      isLink: true,
    },
    { id: 'mindmap', label: 'mindmap', mobileLabel: 'map', onClick: onMindMapClick, isLink: false },
    {
      id: 'pricing',
      label: '₿',
      mobileLabel: '₿',
      href: '/pricing',
      isLink: true,
      accent: 'bitcoin',
    },
  ];

  const isActive = (id: string) => {
    if (id === 'philosophy' && pathname === '/philosophy') return true;
    if (id === 'history' && pathname === '/history') return true;
    if (id === 'grimoire' && pathname?.startsWith('/grimoires')) return true;
    if (id === 'pricing' && pathname === '/pricing') return true;
    if (id === 'profile' && pathname === '/profile') return true;
    if (id === 'intelligence-robot-training' && pathname === '/idea-factory') return true;
    if (id === 'constellation' && pathname === '/constellation') return true;
    return false;
  };

  return (
    <nav className="flex items-center gap-2 overflow-hidden flex-shrink-0">
      {menuItems.map((item) => {
        const active = isActive(item.id);
        const hovered = hoveredItem === item.id;

        if (item.isLink) {
          // Special styling for Bitcoin pricing button
          if (item.accent === 'bitcoin') {
            return (
              <Link
                key={item.id}
                href={item.href!}
                onMouseEnter={() => setHoveredItem(item.id)}
                onMouseLeave={() => setHoveredItem(null)}
                className={`
                  relative text-base font-mono transition-all duration-300
                  ${
                    active
                      ? 'text-relic-void dark:text-white border-b border-relic-slate dark:border-relic-ghost'
                      : 'text-relic-silver dark:text-relic-ghost hover:text-relic-slate dark:hover:text-white'
                  }
                  ${hovered ? 'scale-110' : 'scale-100'}
                `}
              >
                {item.label}
              </Link>
            );
          }

          return (
            <Link
              key={item.id}
              href={item.href!}
              onMouseEnter={() => setHoveredItem(item.id)}
              onMouseLeave={() => setHoveredItem(null)}
              className={`
                text-[11px] font-mono transition-all duration-200
                ${
                  active
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
              <span className="hidden sm:inline">{item.label}</span>
              <span className="sm:hidden">{item.mobileLabel}</span>
            </Link>
          );
        }

        return (
          <button
            key={item.id}
            type="button"
            onClick={item.onClick}
            onMouseEnter={() => setHoveredItem(item.id)}
            onMouseLeave={() => setHoveredItem(null)}
            className={`
              text-[11px] font-mono transition-all duration-200
              ${hovered ? 'text-relic-slate dark:text-white scale-105' : 'text-relic-silver dark:text-relic-ghost hover:text-relic-slate dark:hover:text-white'}
            `}
          >
            <span className="hidden sm:inline">{item.label}</span>
            <span className="sm:hidden">{item.mobileLabel}</span>
          </button>
        );
      })}
    </nav>
  );
}
