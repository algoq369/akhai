'use client'

import { motion } from 'framer-motion'

interface SuperSaiyanIconProps {
  size?: number
  active?: boolean
  onClick?: () => void
}

export default function SuperSaiyanIcon({ size = 20, active = false, onClick }: SuperSaiyanIconProps) {
  return (
    <motion.div
      onClick={onClick}
      className="relative cursor-pointer"
      style={{ width: size, height: size }}
      whileHover={{ scale: 1.15 }}
      whileTap={{ scale: 0.95 }}
    >
      <svg
        viewBox="0 0 32 32"
        fill="none"
        className="w-full h-full"
      >
        {/* Aura glow when active */}
        {active && (
          <>
            <motion.ellipse
              cx="16"
              cy="18"
              rx="12"
              ry="10"
              fill="url(#auraGlow)"
              opacity="0.4"
              animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] }}
              transition={{ duration: 1.2, repeat: Infinity }}
            />
          </>
        )}

        {/* Spiky hair - Goku style */}
        <path
          d="M16 2L18 7L20 3L19 8L23 4L20 9L25 6L20 10H12L7 6L12 9L9 4L13 8L12 3L14 7L16 2Z"
          fill={active ? '#FCD34D' : '#9CA3AF'}
        />
        
        {/* Side spikes */}
        <path
          d="M9 9L5 5L10 8L7 3L11 7"
          fill={active ? '#F59E0B' : '#9CA3AF'}
        />
        <path
          d="M23 9L27 5L22 8L25 3L21 7"
          fill={active ? '#F59E0B' : '#9CA3AF'}
        />

        {/* Head */}
        <ellipse
          cx="16"
          cy="17"
          rx="5.5"
          ry="6"
          fill={active ? '#FEF3C7' : '#E5E7EB'}
        />
        
        {/* Eyes */}
        <ellipse cx="13.5" cy="15.5" rx="1" ry="1.2" fill={active ? '#10B981' : '#6B7280'} />
        <ellipse cx="18.5" cy="15.5" rx="1" ry="1.2" fill={active ? '#10B981' : '#6B7280'} />
        
        {/* Eyebrows */}
        <path d="M11 13.5L14 14.5" stroke={active ? '#92400E' : '#6B7280'} strokeWidth="0.6" strokeLinecap="round" />
        <path d="M21 13.5L18 14.5" stroke={active ? '#92400E' : '#6B7280'} strokeWidth="0.6" strokeLinecap="round" />
        
        {/* Mouth */}
        <path d="M14.5 20Q16 21 17.5 20" stroke={active ? '#92400E' : '#6B7280'} strokeWidth="0.5" strokeLinecap="round" fill="none" />

        <defs>
          <radialGradient id="auraGlow" cx="50%" cy="40%">
            <stop offset="0%" stopColor="#FCD34D" />
            <stop offset="100%" stopColor="#FCD34D" stopOpacity="0" />
          </radialGradient>
        </defs>
      </svg>

      {/* Energy particles when active */}
      {active && (
        <>
          <motion.div
            className="absolute w-0.5 h-0.5 rounded-full bg-yellow-400"
            style={{ left: '10%', bottom: '30%' }}
            animate={{ y: [-2, -10, -2], opacity: [0, 1, 0] }}
            transition={{ duration: 1.2, repeat: Infinity }}
          />
          <motion.div
            className="absolute w-0.5 h-0.5 rounded-full bg-yellow-300"
            style={{ right: '10%', bottom: '35%' }}
            animate={{ y: [-2, -8, -2], opacity: [0, 1, 0] }}
            transition={{ duration: 1, repeat: Infinity, delay: 0.3 }}
          />
        </>
      )}
    </motion.div>
  )
}
