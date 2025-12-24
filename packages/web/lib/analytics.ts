/**
 * Analytics tracking for AkhAI
 * Tracks query usage for future fine-tuning and product insights
 */

export interface QueryEvent {
  query: string
  methodology: string
  methodologySelected: string // What user selected
  methodologyUsed: string // What was actually used (after auto-routing)
  responseTime: number
  tokens: number
  cost: number
  groundingGuardTriggered: boolean
  timestamp: Date
  success: boolean
  errorMessage?: string
}

export interface AnalyticsSummary {
  totalQueries: number
  methodologyDistribution: Record<string, number>
  averageResponseTime: number
  totalTokens: number
  totalCost: number
  successRate: number
  guardTriggers: number
}

const STORAGE_KEY = 'akhai_analytics_events'
const MAX_EVENTS = 1000

/**
 * Track a query event
 */
export function trackQuery(event: Omit<QueryEvent, 'timestamp'>): void {
  try {
    if (typeof window === 'undefined') return

    const events = getEvents()
    events.push({
      ...event,
      timestamp: new Date(),
    })

    // Keep only the last MAX_EVENTS
    if (events.length > MAX_EVENTS) {
      events.splice(0, events.length - MAX_EVENTS)
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(events))
  } catch (error) {
    console.error('Analytics tracking error:', error)
  }
}

/**
 * Get all tracked events
 */
export function getEvents(): QueryEvent[] {
  try {
    if (typeof window === 'undefined') return []

    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return []

    const parsed = JSON.parse(stored)
    // Convert timestamp strings back to Date objects
    return parsed.map((event: any) => ({
      ...event,
      timestamp: new Date(event.timestamp),
    }))
  } catch (error) {
    console.error('Analytics retrieval error:', error)
    return []
  }
}

/**
 * Get analytics summary
 */
export function getAnalyticsSummary(): AnalyticsSummary {
  const events = getEvents()

  if (events.length === 0) {
    return {
      totalQueries: 0,
      methodologyDistribution: {},
      averageResponseTime: 0,
      totalTokens: 0,
      totalCost: 0,
      successRate: 0,
      guardTriggers: 0,
    }
  }

  const methodologyDistribution: Record<string, number> = {}
  let totalResponseTime = 0
  let totalTokens = 0
  let totalCost = 0
  let successCount = 0
  let guardTriggers = 0

  events.forEach((event) => {
    // Methodology distribution
    const methodology = event.methodologyUsed || event.methodology
    methodologyDistribution[methodology] = (methodologyDistribution[methodology] || 0) + 1

    // Aggregates
    totalResponseTime += event.responseTime
    totalTokens += event.tokens
    totalCost += event.cost
    if (event.success) successCount++
    if (event.groundingGuardTriggered) guardTriggers++
  })

  return {
    totalQueries: events.length,
    methodologyDistribution,
    averageResponseTime: totalResponseTime / events.length,
    totalTokens,
    totalCost,
    successRate: (successCount / events.length) * 100,
    guardTriggers,
  }
}

/**
 * Export events as JSON for fine-tuning
 */
export function exportForFineTuning(): string {
  const events = getEvents()

  // Format for fine-tuning: { prompt, completion, metadata }
  const fineTuningData = events
    .filter((event) => event.success)
    .map((event) => ({
      prompt: event.query,
      methodology: event.methodologyUsed || event.methodology,
      metadata: {
        responseTime: event.responseTime,
        tokens: event.tokens,
        timestamp: event.timestamp.toISOString(),
      },
    }))

  return JSON.stringify(fineTuningData, null, 2)
}

/**
 * Clear all analytics data
 */
export function clearAnalytics(): void {
  try {
    if (typeof window === 'undefined') return
    localStorage.removeItem(STORAGE_KEY)
  } catch (error) {
    console.error('Analytics clear error:', error)
  }
}

/**
 * Get events from a specific time range
 */
export function getEventsByDateRange(startDate: Date, endDate: Date): QueryEvent[] {
  const events = getEvents()
  return events.filter(
    (event) => event.timestamp >= startDate && event.timestamp <= endDate
  )
}

/**
 * Get methodology performance comparison
 */
export function getMethodologyComparison(): Record<
  string,
  {
    count: number
    avgResponseTime: number
    avgTokens: number
    avgCost: number
    successRate: number
  }
> {
  const events = getEvents()
  const methodologyStats: Record<string, any> = {}

  events.forEach((event) => {
    const methodology = event.methodologyUsed || event.methodology

    if (!methodologyStats[methodology]) {
      methodologyStats[methodology] = {
        count: 0,
        totalResponseTime: 0,
        totalTokens: 0,
        totalCost: 0,
        successCount: 0,
      }
    }

    const stats = methodologyStats[methodology]
    stats.count++
    stats.totalResponseTime += event.responseTime
    stats.totalTokens += event.tokens
    stats.totalCost += event.cost
    if (event.success) stats.successCount++
  })

  // Calculate averages
  const comparison: Record<string, any> = {}
  Object.keys(methodologyStats).forEach((methodology) => {
    const stats = methodologyStats[methodology]
    comparison[methodology] = {
      count: stats.count,
      avgResponseTime: stats.totalResponseTime / stats.count,
      avgTokens: stats.totalTokens / stats.count,
      avgCost: stats.totalCost / stats.count,
      successRate: (stats.successCount / stats.count) * 100,
    }
  })

  return comparison
}
