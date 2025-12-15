'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface MenuItem {
  label: string;
  href: string;
  icon?: string;
}

interface FlowingMenuProps {
  items: MenuItem[];
  className?: string;
}

export function FlowingMenu({ items, className = '' }: FlowingMenuProps) {
  const pathname = usePathname();
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <nav className={`flex items-center gap-1 ${className}`}>
      {items.map((item, index) => {
        const isActive = pathname === item.href;
        const isHovered = hoveredIndex === index;

        return (
          <Link
            key={item.href}
            href={item.href}
            onMouseEnter={() => setHoveredIndex(index)}
            onMouseLeave={() => setHoveredIndex(null)}
            className="relative px-4 py-2 text-sm transition-colors duration-200"
          >
            {/* Background pill */}
            <AnimatePresence>
              {(isActive || isHovered) && (
                <motion.div
                  layoutId="menu-background"
                  className={`absolute inset-0 rounded-full ${
                    isActive ? 'bg-white' : 'bg-gray-800'
                  }`}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{
                    type: 'spring',
                    stiffness: 500,
                    damping: 30,
                  }}
                />
              )}
            </AnimatePresence>

            {/* Text */}
            <span
              className={`relative z-10 font-medium transition-colors duration-200 ${
                isActive
                  ? 'text-black'
                  : isHovered
                  ? 'text-white'
                  : 'text-gray-400'
              }`}
            >
              {item.icon && <span className="mr-1.5">{item.icon}</span>}
              {item.label}
            </span>

            {/* Flowing underline */}
            {isActive && (
              <motion.div
                layoutId="menu-underline"
                className="absolute -bottom-px left-0 right-0 h-px bg-gradient-to-r from-transparent via-white to-transparent"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              />
            )}
          </Link>
        );
      })}

      {/* Flowing gradient effect on hover */}
      <AnimatePresence>
        {hoveredIndex !== null && (
          <motion.div
            className="absolute inset-0 -z-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-800/20 to-transparent blur-xl" />
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
