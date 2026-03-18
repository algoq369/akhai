'use client'

import { useState, useEffect, useCallback } from 'react'

interface PriceItem {
  symbol: string
  price: number
  change: number
  category: string
  unit?: string
}

interface FinanceData {
  prices: PriceItem[]
  sentiment: { fng: number; label: string } | null
  updatedAt: number
}

const REFRESH_INTERVAL = 2 * 60 * 1000

function formatPrice(price: number, symbol: string): string {
  if (symbol === 'MCAP') return `$${price}T`
  if (symbol === 'DXY') return price.toFixed(2)
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

export default function FinanceBanner({ inline = false }: { inline?: boolean }) {
  const [data, setData] = useState<FinanceData | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const fetchData = useCallback(async () => {
    setRefreshing(true)
    try {
      const res = await fetch('/api/finance')
      const json = await res.json()
      setData(json)
    } catch {
      // keep stale
    }
    setTimeout(() => setRefreshing(false), 600)
  }, [])

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, REFRESH_INTERVAL)
    return () => clearInterval(interval)
  }, [fetchData])

  const prices = data?.prices || []

  return (
    <div
      className={inline ? '' : 'fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#0a0a0b]/95 backdrop-blur-sm border-t border-slate-200/30 dark:border-slate-800/30'}
      style={inline ? { fontFamily: "'JetBrains Mono', ui-monospace, monospace" } : { height: 24, fontFamily: "'JetBrains Mono', ui-monospace, monospace" }}
    >
      <div className={`${inline ? '' : 'h-full'} flex items-center justify-center gap-4 ${inline ? '' : 'px-4'}`}>
        {/* Refresh pulse */}
        {refreshing && (
          <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
        )}

        {/* Loading state */}
        {prices.length === 0 && !data?.sentiment && (
          <span className="text-[8px] text-slate-400 dark:text-slate-600">loading...</span>
        )}

        {/* Price items */}
        {prices.map((item, i) => {
          const isBtc = item.symbol === 'BTC'
          return (
          <span key={item.symbol} className="flex items-center gap-1 flex-shrink-0">
            {i > 0 && <span className="text-slate-300 dark:text-slate-600 text-[8px] mr-1">·</span>}
            <span
              className="text-[8px] font-semibold uppercase tracking-wider"
              style={isBtc ? { color: '#F7931A', textShadow: '0 0 6px rgba(247,147,26,0.5)' } : undefined}
            >
              {isBtc ? '₿' : item.symbol}
            </span>
            <span
              className={`text-[9px] font-medium ${isBtc ? '' : 'text-slate-700 dark:text-slate-200'}`}
              style={isBtc ? { color: '#F7931A', textShadow: '0 0 8px rgba(247,147,26,0.4)' } : undefined}
            >
              {formatPrice(item.price, item.symbol)}
            </span>
            {item.change !== 0 && (
              <span className={`text-[8px] font-semibold ${item.change > 0 ? 'text-emerald-500' : 'text-rose-400'}`}>
                {item.change > 0 ? '▲' : '▼'}{Math.abs(item.change).toFixed(1)}%
              </span>
            )}
          </span>
        )})}

        {/* Fear & Greed */}
        {data?.sentiment && (
          <span className="flex items-center gap-1 flex-shrink-0">
            <span className="text-slate-300 dark:text-slate-600 text-[8px] mr-1">·</span>
            <span className="text-[8px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              F&G
            </span>
            <span className="text-[9px] font-bold" style={{ color: fngColor(data.sentiment.fng) }}>
              {data.sentiment.fng}
            </span>
            <span className="text-[7px] font-medium uppercase" style={{ color: fngColor(data.sentiment.fng) }}>
              {data.sentiment.label}
            </span>
          </span>
        )}
      </div>
    </div>
  )
}
