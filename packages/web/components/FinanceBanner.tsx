'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

interface PriceItem {
  symbol: string
  price: number
  change: number
  category: string
  unit?: string
  name?: string
}

interface FinanceData {
  prices: PriceItem[]
  sentiment: { fng: number; label: string } | null
  etf: { flow: string; source: string } | null
  updatedAt: number
}

const REFRESH_INTERVAL = 2 * 60 * 1000 // 2 min
const GREEN = '#22c55e'
const RED = '#ef4444'
const GRAY = '#94a3b8'
const DIM = '#64748b'
const BRIGHT = '#e2e8f0'
const SEP = '#334155'

function formatPrice(price: number, symbol: string): string {
  if (symbol === 'MCAP') return `$${price}T`
  if (symbol === 'BTC.D') return `${price}%`
  if (symbol === '10Y') return `${price}%`
  if (symbol === 'EUR' || symbol === 'DXY') return price.toFixed(3).replace(/0$/, '')
  if (symbol === 'XRP' || symbol === 'GAS') return `$${price.toFixed(3)}`
  if (price >= 1000) return `$${price.toLocaleString('en-US', { maximumFractionDigits: 0 })}`
  if (price >= 100) return `$${price.toFixed(1)}`
  return `$${price.toFixed(2)}`
}

function fngColor(value: number): string {
  if (value <= 25) return '#ef4444'
  if (value <= 40) return '#f97316'
  if (value <= 60) return '#eab308'
  if (value <= 75) return '#84cc16'
  return '#22c55e'
}

// Sorted display order
const CATEGORY_ORDER = ['crypto', 'commodity', 'index', 'bond', 'forex', 'sentiment']

export default function FinanceBanner() {
  const [data, setData] = useState<FinanceData | null>(null)
  const [selected, setSelected] = useState<PriceItem | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)

  const fetchData = useCallback(async () => {
    setRefreshing(true)
    try {
      const res = await fetch('/api/finance')
      const json = await res.json()
      setData(json)
    } catch {
      // keep stale data
    }
    setTimeout(() => setRefreshing(false), 600)
  }, [])

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, REFRESH_INTERVAL)
    return () => clearInterval(interval)
  }, [fetchData])

  // Close detail panel on outside click
  useEffect(() => {
    if (!selected) return
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setSelected(null)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [selected])

  // Sort prices by category order
  const sortedPrices = data?.prices
    ? [...data.prices].sort((a, b) => {
        const ai = CATEGORY_ORDER.indexOf(a.category)
        const bi = CATEGORY_ORDER.indexOf(b.category)
        return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi)
      })
    : []

  // Group for separator rendering
  let lastCategory = ''

  return (
    <div ref={panelRef} className="fixed bottom-0 left-0 right-0 z-40" style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace" }}>
      {/* Detail panel — slides up above banner */}
      {selected && (
        <div
          style={{
            background: '#111113', borderTop: `1px solid ${SEP}`,
            padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 16,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: BRIGHT }}>{selected.symbol}</span>
            <span style={{ fontSize: 9, color: DIM }}>{selected.name || selected.symbol}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: BRIGHT }}>
              {formatPrice(selected.price, selected.symbol)}
            </span>
            <span style={{
              fontSize: 10, fontWeight: 600,
              color: selected.change > 0 ? GREEN : selected.change < 0 ? RED : GRAY,
            }}>
              {selected.change > 0 ? '▲' : selected.change < 0 ? '▼' : ''}
              {Math.abs(selected.change).toFixed(2)}%
            </span>
          </div>
          {/* Mini sparkline placeholder */}
          <svg width="60" height="16" viewBox="0 0 60 16" style={{ flexShrink: 0 }}>
            <polyline
              fill="none"
              stroke={selected.change >= 0 ? GREEN : RED}
              strokeWidth="1.5"
              points={generateSparkline(selected.price, selected.change)}
              opacity="0.6"
            />
          </svg>
          <button
            onClick={() => {
              setSelected(null)
              // Navigate to chat with query
              const q = `What's happening with ${selected.name || selected.symbol}? Current price: ${formatPrice(selected.price, selected.symbol)}, 24h change: ${selected.change > 0 ? '+' : ''}${selected.change.toFixed(2)}%. Analyze the key drivers.`
              window.location.href = `/?q=${encodeURIComponent(q)}`
            }}
            style={{
              fontSize: 8, padding: '3px 8px', borderRadius: 3,
              background: '#1e293b', color: '#e2e8f0', border: 'none',
              cursor: 'pointer', fontWeight: 500, whiteSpace: 'nowrap', fontFamily: 'inherit',
            }}
          >
            analyse in chat →
          </button>
          <button
            onClick={() => setSelected(null)}
            style={{ fontSize: 11, border: 'none', background: 'none', cursor: 'pointer', color: DIM, padding: 0, lineHeight: 1 }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Main banner bar */}
      <div
        style={{
          height: 28, background: '#0a0a0b', borderTop: `1px solid ${SEP}40`,
          display: 'flex', alignItems: 'center', overflow: 'hidden',
          padding: '0 8px', gap: 0,
        }}
      >
        {/* Refresh indicator */}
        {refreshing && (
          <span style={{
            width: 4, height: 4, borderRadius: '50%', background: GREEN,
            animation: 'pulse-dot 0.6s ease-in-out', marginRight: 6, flexShrink: 0,
          }} />
        )}

        {/* Price items */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 0, overflow: 'hidden', flex: 1 }}>
          {sortedPrices.length === 0 && !data?.sentiment && (
            <span style={{ fontSize: 9, color: DIM }}>loading market data...</span>
          )}
          {sortedPrices.map((item, i) => {
            const showSep = lastCategory !== '' && item.category !== lastCategory
            lastCategory = item.category
            const changeColor = item.change > 0 ? GREEN : item.change < 0 ? RED : GRAY
            const arrow = item.change > 0 ? '▲' : item.change < 0 ? '▼' : ''
            const isSelected = selected?.symbol === item.symbol

            return (
              <button
                key={item.symbol}
                onClick={() => setSelected(isSelected ? null : item)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 3,
                  padding: '0 6px', height: 28, border: 'none',
                  background: isSelected ? '#1e293b' : 'transparent',
                  cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0,
                  borderLeft: showSep ? `1px solid ${SEP}` : 'none',
                  marginLeft: showSep ? 2 : 0,
                  paddingLeft: showSep ? 8 : 6,
                }}
              >
                <span style={{ fontSize: 8, color: DIM, fontWeight: 500 }}>{item.symbol}</span>
                <span style={{ fontSize: 9, color: BRIGHT, fontWeight: 600 }}>
                  {formatPrice(item.price, item.symbol)}
                </span>
                {item.change !== 0 && (
                  <span style={{ fontSize: 8, color: changeColor, fontWeight: 600 }}>
                    {arrow}{Math.abs(item.change).toFixed(1)}%
                  </span>
                )}
              </button>
            )
          })}

          {/* Fear & Greed */}
          {data?.sentiment && (
            <button
              onClick={() => {
                const fngItem: PriceItem = {
                  symbol: 'F&G', price: data.sentiment!.fng, change: 0,
                  category: 'sentiment', name: `Fear & Greed Index — ${data.sentiment!.label}`,
                }
                setSelected(selected?.symbol === 'F&G' ? null : fngItem)
              }}
              style={{
                display: 'flex', alignItems: 'center', gap: 3,
                padding: '0 6px', height: 28, border: 'none',
                background: selected?.symbol === 'F&G' ? '#1e293b' : 'transparent',
                cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0,
                borderLeft: `1px solid ${SEP}`, marginLeft: 2, paddingLeft: 8,
              }}
            >
              <span style={{ fontSize: 8, color: DIM, fontWeight: 500 }}>F&G</span>
              <span style={{ fontSize: 9, color: fngColor(data.sentiment.fng), fontWeight: 700 }}>
                {data.sentiment.fng}
              </span>
              <span style={{ fontSize: 7, color: fngColor(data.sentiment.fng), textTransform: 'uppercase', fontWeight: 500 }}>
                {data.sentiment.label}
              </span>
            </button>
          )}

          {/* ETF Flows */}
          {data?.etf && (
            <button
              onClick={() => {
                const etfItem: PriceItem = {
                  symbol: 'ETF', price: 0, change: 0,
                  category: 'flows', name: `BTC ETF Daily Flow: ${data.etf!.flow}`,
                }
                setSelected(selected?.symbol === 'ETF' ? null : etfItem)
              }}
              style={{
                display: 'flex', alignItems: 'center', gap: 3,
                padding: '0 6px', height: 28, border: 'none',
                background: selected?.symbol === 'ETF' ? '#1e293b' : 'transparent',
                cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0,
                borderLeft: `1px solid ${SEP}`, marginLeft: 2, paddingLeft: 8,
              }}
            >
              <span style={{ fontSize: 8, color: DIM, fontWeight: 500 }}>ETF</span>
              <span style={{
                fontSize: 9, fontWeight: 700,
                color: data.etf.flow.startsWith('+') ? GREEN : data.etf.flow.startsWith('-') ? RED : GRAY,
              }}>
                {data.etf.flow}
              </span>
            </button>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </div>
  )
}

// Generate a simple synthetic sparkline from price + change
function generateSparkline(price: number, change: number): string {
  const points: number[] = []
  const base = price / (1 + change / 100)
  const step = (price - base) / 6
  for (let i = 0; i < 7; i++) {
    const jitter = (Math.sin(i * 2.1) * 0.3 + Math.cos(i * 1.3) * 0.2) * Math.abs(step || price * 0.001)
    points.push(base + step * i + jitter)
  }
  const min = Math.min(...points)
  const max = Math.max(...points)
  const range = max - min || 1
  return points.map((p, i) => `${(i / 6) * 60},${16 - ((p - min) / range) * 14}`).join(' ')
}
