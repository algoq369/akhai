'use client'

/**
 * DraggablePanel - Reusable wrapper for draggable panels on canvas
 * 
 * Features:
 * - Drag handle at top
 * - Resize handle at bottom-right (optional)
 * - Collapse/expand toggle
 * - Customizable styling
 */

import { useState, useRef, useEffect, ReactNode } from 'react'
import { motion, useDragControls, PanInfo } from 'framer-motion'

interface DraggablePanelProps {
  id: string
  title: string
  icon?: string
  children: ReactNode
  defaultPosition: { x: number; y: number }
  defaultSize?: { width: number; height: number }
  minWidth?: number
  minHeight?: number
  maxWidth?: number
  maxHeight?: number
  resizable?: boolean
  collapsible?: boolean
  onPositionChange?: (id: string, position: { x: number; y: number }) => void
  onSizeChange?: (id: string, size: { width: number; height: number }) => void
  className?: string
  headerClassName?: string
  zIndex?: number
  onFocus?: (id: string) => void
}

export default function DraggablePanel({
  id,
  title,
  icon = '◇',
  children,
  defaultPosition,
  defaultSize = { width: 320, height: 400 },
  minWidth = 200,
  minHeight = 150,
  maxWidth = 800,
  maxHeight = 800,
  resizable = true,
  collapsible = true,
  onPositionChange,
  onSizeChange,
  className = '',
  headerClassName = '',
  zIndex = 10,
  onFocus,
}: DraggablePanelProps) {
  const [position, setPosition] = useState(defaultPosition)
  const [size, setSize] = useState(defaultSize)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [localZIndex, setLocalZIndex] = useState(zIndex)
  
  const dragControls = useDragControls()
  const panelRef = useRef<HTMLDivElement>(null)
  const resizeStartRef = useRef({ x: 0, y: 0, width: 0, height: 0 })

  // Handle drag end
  const handleDragEnd = (_: any, info: PanInfo) => {
    const newPosition = {
      x: position.x + info.offset.x,
      y: position.y + info.offset.y,
    }
    setPosition(newPosition)
    setIsDragging(false)
    onPositionChange?.(id, newPosition)
  }

  // Handle resize
  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsResizing(true)
    resizeStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      width: size.width,
      height: size.height,
    }

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - resizeStartRef.current.x
      const deltaY = moveEvent.clientY - resizeStartRef.current.y
      
      const newWidth = Math.min(maxWidth, Math.max(minWidth, resizeStartRef.current.width + deltaX))
      const newHeight = Math.min(maxHeight, Math.max(minHeight, resizeStartRef.current.height + deltaY))
      
      setSize({ width: newWidth, height: newHeight })
    }

    const handleMouseUp = () => {
      setIsResizing(false)
      onSizeChange?.(id, size)
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  // Bring to front on click
  const handleFocus = () => {
    setLocalZIndex(100)
    onFocus?.(id)
    setTimeout(() => setLocalZIndex(zIndex), 100)
  }

  return (
    <motion.div
      ref={panelRef}
      className={`absolute select-none ${className}`}
      style={{
        x: position.x,
        y: position.y,
        width: size.width,
        height: isCollapsed ? 'auto' : size.height,
        zIndex: localZIndex,
      }}
      drag
      dragControls={dragControls}
      dragListener={false}
      dragMomentum={false}
      onDragStart={() => setIsDragging(true)}
      onDragEnd={handleDragEnd}
      onClick={handleFocus}
    >
      <div 
        className={`
          bg-white/95 backdrop-blur-sm border border-relic-mist rounded-lg shadow-lg
          overflow-hidden flex flex-col h-full
          ${isDragging ? 'ring-2 ring-purple-400 shadow-xl' : ''}
          ${isResizing ? 'ring-2 ring-blue-400' : ''}
        `}
      >
        {/* Header - Drag Handle */}
        <div
          className={`
            flex items-center justify-between px-3 py-2 
            bg-gradient-to-r from-relic-ghost to-white
            border-b border-relic-mist cursor-grab active:cursor-grabbing
            ${headerClassName}
          `}
          onPointerDown={(e) => dragControls.start(e)}
        >
          <div className="flex items-center gap-2">
            <span className="text-purple-500 text-xs">{icon}</span>
            <span className="text-[10px] font-medium uppercase tracking-wider text-relic-slate">
              {title}
            </span>
          </div>
          <div className="flex items-center gap-1">
            {collapsible && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setIsCollapsed(!isCollapsed)
                }}
                className="w-5 h-5 flex items-center justify-center text-relic-silver 
                         hover:text-relic-slate hover:bg-relic-ghost rounded text-xs"
              >
                {isCollapsed ? '▼' : '▲'}
              </button>
            )}
            <div className="w-2 h-2 rounded-full bg-green-400 opacity-60" title="Active" />
          </div>
        </div>

        {/* Content */}
        {!isCollapsed && (
          <div className="flex-1 overflow-auto p-2">
            {children}
          </div>
        )}

        {/* Resize Handle */}
        {resizable && !isCollapsed && (
          <div
            className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize
                       flex items-center justify-center text-relic-silver hover:text-relic-slate"
            onMouseDown={handleResizeStart}
          >
            <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
              <path d="M9 1v8H1" stroke="currentColor" strokeWidth="1.5" fill="none" />
            </svg>
          </div>
        )}
      </div>
    </motion.div>
  )
}
