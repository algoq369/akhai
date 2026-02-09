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

import { useState, useRef, ReactNode } from 'react'
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
  contentClassName?: string
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
  contentClassName = '',
  zIndex = 10,
  onFocus,
}: DraggablePanelProps) {
  const [position, setPosition] = useState(defaultPosition)
  const [size, setSize] = useState(defaultSize)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [localZIndex, setLocalZIndex] = useState(zIndex)
  const [isMaximized, setIsMaximized] = useState(false)
  const [preMaxSize, setPreMaxSize] = useState(defaultSize)
  const [preMaxPosition, setPreMaxPosition] = useState(defaultPosition)

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

  // Toggle maximize/restore
  const handleMaximize = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (isMaximized) {
      setSize(preMaxSize)
      setPosition(preMaxPosition)
      setIsMaximized(false)
    } else {
      setPreMaxSize(size)
      setPreMaxPosition(position)
      const vw = typeof window !== 'undefined' ? window.innerWidth : 1200
      const vh = typeof window !== 'undefined' ? window.innerHeight : 800
      setSize({ width: Math.min(maxWidth, vw - 40), height: Math.min(maxHeight, vh - 100) })
      setPosition({ x: 20, y: 60 })
      setIsMaximized(true)
    }
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
          flex flex-col h-full
          ${isDragging ? 'ring-2 ring-purple-400 shadow-xl' : ''}
          ${isResizing ? 'ring-2 ring-blue-400' : ''}
        `}
      >
        {/* Header - Drag Handle */}
        <div
          className={`
            flex items-center justify-between px-2 py-1.5
            bg-gradient-to-r from-relic-ghost to-white
            border-b border-relic-mist cursor-grab active:cursor-grabbing
            ${headerClassName}
          `}
          onPointerDown={(e) => dragControls.start(e)}
        >
          <div className="flex items-center gap-2">
            <span className="text-purple-500 text-xs">{icon}</span>
            <span className="text-[9px] font-medium uppercase tracking-wider text-relic-slate">
              {title}
            </span>
          </div>
          <div className="flex items-center gap-0.5">
            {collapsible && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setIsCollapsed(!isCollapsed)
                }}
                className="w-5 h-5 flex items-center justify-center text-relic-silver
                         hover:text-relic-slate hover:bg-relic-ghost rounded text-[10px]"
                title={isCollapsed ? 'Expand' : 'Collapse'}
              >
                {isCollapsed ? '▼' : '▲'}
              </button>
            )}
            {resizable && (
              <button
                onClick={handleMaximize}
                className="w-5 h-5 flex items-center justify-center text-relic-silver
                         hover:text-relic-slate hover:bg-relic-ghost rounded text-[10px]"
                title={isMaximized ? 'Restore' : 'Maximize'}
              >
                {isMaximized ? '⊡' : '⊞'}
              </button>
            )}
            <div className="w-2 h-2 rounded-full bg-green-400 opacity-60 ml-0.5" title="Active" />
          </div>
        </div>

        {/* Content */}
        {!isCollapsed && (
          <div className={`flex-1 p-1 ${contentClassName || 'overflow-auto'}`}>
            {children}
          </div>
        )}

        {/* Resize Handle */}
        {resizable && !isCollapsed && !isMaximized && (
          <div
            className="absolute bottom-0 right-0 w-6 h-6 cursor-se-resize
                       flex items-center justify-center text-relic-silver/50 hover:text-relic-slate"
            onMouseDown={handleResizeStart}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1">
              <line x1="4" y1="14" x2="14" y2="4" />
              <line x1="8" y1="14" x2="14" y2="8" />
              <line x1="12" y1="14" x2="14" y2="12" />
            </svg>
          </div>
        )}
      </div>
    </motion.div>
  )
}
