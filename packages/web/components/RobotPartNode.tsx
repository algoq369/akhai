'use client';

import React from 'react';
import { RobotPart, statusColors, categoryColors } from './RobotIntelligenceTypes';

// ============================================
// COMPONENT: Robot Part Node
// ============================================

interface RobotPartNodeProps {
  part: RobotPart;
  isSelected: boolean;
  isHovered: boolean;
  onSelect: (part: RobotPart) => void;
  onHover: (partId: string | null) => void;
  scale: 'human' | 'handball';
}

export function RobotPartNode({
  part,
  isSelected,
  isHovered,
  onSelect,
  onHover,
  scale,
}: RobotPartNodeProps) {
  const Icon = part.icon;
  const status = statusColors[part.status];
  const category = categoryColors[part.category];

  const sizeClasses = {
    lg: scale === 'human' ? 'w-28 h-28' : 'w-20 h-20',
    md: scale === 'human' ? 'w-22 h-22' : 'w-16 h-16',
    sm: scale === 'human' ? 'w-18 h-18' : 'w-12 h-12',
  };

  const iconSizes = {
    lg: scale === 'human' ? 'w-10 h-10' : 'w-7 h-7',
    md: scale === 'human' ? 'w-8 h-8' : 'w-5 h-5',
    sm: scale === 'human' ? 'w-6 h-6' : 'w-4 h-4',
  };

  return (
    <div
      className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-300"
      style={{
        left: `${part.position.x}%`,
        top: `${part.position.y}%`,
        zIndex: isSelected ? 50 : isHovered ? 40 : 10,
      }}
      onClick={() => onSelect(part)}
      onMouseEnter={() => onHover(part.id)}
      onMouseLeave={() => onHover(null)}
    >
      {/* Pulse ring for active parts */}
      {part.status === 'active' && (
        <div
          className={`absolute inset-0 ${sizeClasses[part.position.size]} rounded-full ${status.bg} opacity-20 animate-ping`}
          style={{ animationDuration: '2s' }}
        />
      )}

      {/* Main node */}
      <div
        className={`
        relative ${sizeClasses[part.position.size]} rounded-full
        bg-gradient-to-br ${category}
        flex items-center justify-center
        shadow-lg ${isSelected ? 'shadow-2xl scale-110' : ''} ${status.glow}
        border-2 ${isSelected ? 'border-white' : status.border}
        transition-all duration-300
        ${isHovered && !isSelected ? 'scale-105' : ''}
      `}
      >
        <Icon className={`${iconSizes[part.position.size]} text-white`} />

        {/* Status indicator */}
        <div
          className={`absolute -bottom-1 -right-1 w-4 h-4 ${status.bg} rounded-full border-2 border-white`}
        />

        {/* Energy consumption indicator (small arc) */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="46"
            fill="none"
            stroke="rgba(255,255,255,0.2)"
            strokeWidth="4"
          />
          <circle
            cx="50"
            cy="50"
            r="46"
            fill="none"
            stroke="rgba(255,255,255,0.8)"
            strokeWidth="4"
            strokeDasharray={`${part.metrics.efficiency * 2.9} 290`}
            strokeLinecap="round"
            transform="rotate(-90 50 50)"
          />
        </svg>
      </div>

      {/* Hover tooltip */}
      {(isHovered || isSelected) && (
        <div
          className={`
          absolute top-full mt-2 left-1/2 transform -translate-x-1/2
          bg-slate-900/95 backdrop-blur-sm text-white
          px-3 py-2 rounded-lg shadow-xl
          text-xs whitespace-nowrap z-50
          border border-slate-700
          ${scale === 'handball' ? 'text-[10px] px-2 py-1' : ''}
        `}
        >
          <div className="font-semibold">{part.name}</div>
          <div className={`${status.text} text-[10px] capitalize`}>{part.status}</div>
          <div className="flex items-center gap-2 mt-1 text-slate-400">
            <span>⚡ {part.metrics.energyConsumption}%</span>
            <span>📊 {part.metrics.efficiency}%</span>
          </div>
        </div>
      )}
    </div>
  );
}
