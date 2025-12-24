'use client'

import { useEffect, useState } from 'react'

export function CustomCursor() {
  const [position, setPosition] = useState({ x: -100, y: -100 })
  const [isHovering, setIsHovering] = useState(false)
  const [isClicking, setIsClicking] = useState(false)

  useEffect(() => {
    const updatePosition = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY })
    }

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      const isInteractive =
        target.tagName === 'BUTTON' ||
        target.tagName === 'A' ||
        target.tagName === 'INPUT' ||
        target.closest('button') ||
        target.closest('a') ||
        target.closest('[role="button"]')
      setIsHovering(!!isInteractive)
    }

    const handleMouseDown = () => setIsClicking(true)
    const handleMouseUp = () => setIsClicking(false)

    window.addEventListener('mousemove', updatePosition)
    window.addEventListener('mouseover', handleMouseOver)
    window.addEventListener('mousedown', handleMouseDown)
    window.addEventListener('mouseup', handleMouseUp)

    return () => {
      window.removeEventListener('mousemove', updatePosition)
      window.removeEventListener('mouseover', handleMouseOver)
      window.removeEventListener('mousedown', handleMouseDown)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [])

  return (
    <>
      <div
        className={`custom-cursor ${isHovering ? 'hovering' : ''} ${isClicking ? 'clicking' : ''}`}
        style={{ left: position.x, top: position.y }}
      />
      <div
        className={`custom-cursor-ring ${isHovering ? 'hovering' : ''}`}
        style={{ left: position.x, top: position.y }}
      />
    </>
  )
}
