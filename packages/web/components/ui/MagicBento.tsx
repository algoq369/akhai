'use client';

import { ReactNode } from 'react';
import { motion } from 'framer-motion';

export interface BentoCard {
  id: string;
  title: string;
  description: string;
  icon: ReactNode;
  size: 'small' | 'medium' | 'large';
  gradient: string;
  onClick?: () => void;
  stats?: {
    label: string;
    value: string;
  }[];
  badge?: string;
  animation?: ReactNode;
}

interface MagicBentoProps {
  cards: BentoCard[];
  className?: string;
}

const sizeClasses = {
  small: 'col-span-1',
  medium: 'col-span-1 md:col-span-1',
  large: 'col-span-1 md:col-span-2',
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const cardVariants = {
  hidden: {
    opacity: 0,
    y: 20,
    scale: 0.95,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.5,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

export function MagicBento({ cards, className = '' }: MagicBentoProps) {
  return (
    <motion.div
      className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 ${className}`}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {cards.map((card, index) => (
        <motion.div
          key={card.id}
          variants={cardVariants}
          whileHover={{
            scale: 1.02,
            y: -4,
            transition: { duration: 0.2 },
          }}
          className={`${sizeClasses[card.size]} group relative`}
        >
          <button
            onClick={card.onClick}
            className={`
              w-full h-full min-h-[200px] p-6 rounded-2xl
              bg-gradient-to-br ${card.gradient}
              border border-white/20
              shadow-lg hover:shadow-2xl
              transition-all duration-300
              overflow-hidden
              relative
              cursor-pointer
              text-left
            `}
          >
            {/* Animated gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/0 via-white/5 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            {/* Glow effect */}
            <div className="absolute -inset-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 blur-sm transition-opacity duration-500 rounded-2xl" />

            {/* Content */}
            <div className="relative z-10 flex flex-col h-full justify-between">
              {/* Header */}
              <div>
                <div className="flex items-start justify-between mb-3">
                  <div className="text-4xl transform group-hover:scale-110 transition-transform duration-300">
                    {card.icon}
                  </div>
                  {card.badge && (
                    <span className="px-2 py-1 text-[9px] font-semibold rounded-full bg-white/20 backdrop-blur-sm text-white">
                      {card.badge}
                    </span>
                  )}
                </div>

                <h3 className="text-lg font-bold text-white mb-2 group-hover:text-white/90 transition-colors">
                  {card.title}
                </h3>

                <p className="text-sm text-white/80 leading-relaxed line-clamp-2 group-hover:text-white/70 transition-colors">
                  {card.description}
                </p>
              </div>

              {/* Animation area */}
              {card.animation && (
                <div className="my-4 flex items-center justify-center">
                  {card.animation}
                </div>
              )}

              {/* Stats */}
              {card.stats && card.stats.length > 0 && (
                <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-white/10">
                  {card.stats.map((stat, i) => (
                    <div key={i}>
                      <div className="text-xs text-white/60">{stat.label}</div>
                      <div className="text-lg font-bold text-white">{stat.value}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Floating animation */}
            <motion.div
              className="absolute inset-0 -z-10"
              animate={{
                y: [0, -4, 0],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          </button>
        </motion.div>
      ))}
    </motion.div>
  );
}

// Utility component for methodology animations
export function MethodologyAnimation({ type }: { type: 'flash' | 'direct' | 'cot' | 'aot' }) {
  if (type === 'flash') {
    return (
      <div className="flex items-center justify-center gap-2">
        {[0, 1, 2, 3].map((i) => (
          <motion.div
            key={i}
            className="w-3 h-3 rounded-full bg-white/40"
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.4, 1, 0.4],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              delay: i * 0.2,
            }}
          />
        ))}
      </div>
    );
  }

  if (type === 'direct') {
    return (
      <motion.div
        className="w-12 h-12 rounded-full bg-white/30 flex items-center justify-center"
        animate={{
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 1,
          repeat: Infinity,
        }}
      >
        <div className="text-2xl">⚡</div>
      </motion.div>
    );
  }

  if (type === 'cot') {
    return (
      <div className="flex items-center gap-1">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="flex items-center"
          >
            <motion.div
              className="w-2 h-2 rounded-full bg-white/40"
              animate={{
                scale: [1, 1.3, 1],
              }}
              transition={{
                duration: 1.2,
                repeat: Infinity,
                delay: i * 0.3,
              }}
            />
            {i < 2 && (
              <motion.div
                className="w-3 h-px bg-white/30"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{
                  duration: 0.3,
                  repeat: Infinity,
                  repeatDelay: 1.2,
                  delay: i * 0.3 + 0.2,
                }}
              />
            )}
          </motion.div>
        ))}
      </div>
    );
  }

  if (type === 'aot') {
    return (
      <div className="relative w-16 h-16">
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-white/30"
          animate={{
            scale: [1, 1.5, 1],
            opacity: [0.6, 0, 0.6],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
          }}
        />
        <motion.div
          className="absolute inset-4 rounded-full bg-white/20"
          animate={{
            rotate: 360,
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "linear",
          }}
        >
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-white" />
        </motion.div>
      </div>
    );
  }

  return null;
}
