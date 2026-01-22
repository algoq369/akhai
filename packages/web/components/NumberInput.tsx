'use client'

import { useState, useRef, useEffect } from 'react'

interface NumberInputProps {
  label: string
  value: number
  min: number
  max: number
  step?: number
  suffix?: string
  onChange: (value: number) => void
  description?: string
  color?: string
  symbol?: string
  compact?: boolean
}

export default function NumberInput({
  label,
  value,
  min,
  max,
  step = 1,
  suffix = '',
  onChange,
  description,
  color,
  symbol,
  compact = false
}: NumberInputProps) {
  const [internalValue, setInternalValue] = useState(value.toString())
  const [isFocused, setIsFocused] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Sync internal value when prop changes
  useEffect(() => {
    setInternalValue(value.toString())
  }, [value])

  const clamp = (val: number): number => {
    return Math.min(Math.max(val, min), max)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value
    setInternalValue(raw)
  }

  const handleBlur = () => {
    setIsFocused(false)

    // Parse and validate
    const parsed = parseFloat(internalValue)
    if (isNaN(parsed)) {
      setInternalValue(value.toString())
      return
    }

    const clamped = clamp(parsed)
    setInternalValue(clamped.toString())

    if (clamped !== value) {
      onChange(clamped)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const currentVal = parseFloat(internalValue) || value

    if (e.key === 'ArrowUp') {
      e.preventDefault()
      const increment = e.shiftKey ? 10 : step
      const newVal = clamp(currentVal + increment)
      setInternalValue(newVal.toString())
      onChange(newVal)
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      const decrement = e.shiftKey ? 10 : step
      const newVal = clamp(currentVal - decrement)
      setInternalValue(newVal.toString())
      onChange(newVal)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      inputRef.current?.blur()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      setInternalValue(value.toString())
      inputRef.current?.blur()
    }
  }

  const isActive = value > 0

  return (
    <div className={compact ? 'space-y-0.5' : 'space-y-1'}>
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-1.5 text-[9px] text-slate-700 font-medium uppercase tracking-wider">
          {symbol && (
            <span
              className="text-[11px]"
              style={{ color: color || '#64748b' }}
            >
              {symbol}
            </span>
          )}
          <span>{label}</span>
        </label>

        <div className="flex items-center gap-1">
          <input
            ref={inputRef}
            type="text"
            inputMode="numeric"
            value={internalValue}
            onChange={handleChange}
            onBlur={handleBlur}
            onFocus={() => setIsFocused(true)}
            onKeyDown={handleKeyDown}
            className={`
              w-14 px-2 py-0.5 text-right text-[10px] font-mono
              border rounded transition-all duration-150
              ${isFocused
                ? 'border-slate-400 bg-white ring-1 ring-slate-200'
                : isActive
                  ? 'border-slate-300 bg-slate-50'
                  : 'border-slate-200 bg-white'
              }
              hover:border-slate-400
              focus:outline-none
            `}
            style={{
              borderColor: isFocused && color ? color : undefined
            }}
          />
          {suffix && (
            <span className="text-[9px] text-slate-500 font-medium w-3">
              {suffix}
            </span>
          )}
        </div>
      </div>

      {description && !compact && (
        <p className="text-[7px] text-slate-500 leading-tight">
          {description}
        </p>
      )}

      {/* Visual indicator for active state */}
      {isActive && !compact && (
        <div
          className="h-0.5 rounded-full transition-all duration-200"
          style={{
            width: `${(value / max) * 100}%`,
            backgroundColor: color || '#94a3b8'
          }}
        />
      )}
    </div>
  )
}
