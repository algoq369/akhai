/**
 * Comprehensive logging system for AkhAI debugging
 * Provides real-time visibility into all backend operations
 */

type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'SUCCESS'

export interface LogEntry {
  timestamp: string
  level: LogLevel
  component: string
  message: string
  data?: any
}

// In-memory log storage (last 500 entries)
const logs: LogEntry[] = []
const MAX_LOGS = 500

// Color codes for terminal
const colors = {
  DEBUG: '\x1b[36m',   // Cyan
  INFO: '\x1b[37m',    // White
  WARN: '\x1b[33m',    // Yellow
  ERROR: '\x1b[31m',   // Red
  SUCCESS: '\x1b[32m', // Green
  RESET: '\x1b[0m'
}

// Emoji icons
const icons = {
  DEBUG: '🔍',
  INFO: 'ℹ️',
  WARN: '⚠️',
  ERROR: '❌',
  SUCCESS: '✅'
}

export function log(level: LogLevel, component: string, message: string, data?: any): LogEntry {
  const timestamp = new Date().toISOString()
  const entry: LogEntry = { timestamp, level, component, message, data }

  // Add to in-memory storage
  logs.push(entry)
  if (logs.length > MAX_LOGS) logs.shift()

  // Console output with formatting
  const timeStr = timestamp.split('T')[1].split('.')[0]
  const color = colors[level]
  const icon = icons[level]

  console.log(
    `${color}${icon} [${timeStr}] [${component}]${colors.RESET} ${message}`,
    data ? '\n' + JSON.stringify(data, null, 2) : ''
  )

  return entry
}

// Component-specific loggers
export const logger = {
  // Query processing
  query: {
    start: (query: string, method: string) =>
      log('INFO', 'QUERY', `Starting: "${query.slice(0, 50)}..." | Method: ${method}`),

    methodSelected: (original: string, selected: string, reason: string) =>
      log('INFO', 'METHODOLOGY', `${original} → ${selected} | Reason: ${reason}`),

    apiCall: (provider: string, model: string) =>
      log('DEBUG', 'API', `Calling ${provider} (${model})`),

    apiResponse: (provider: string, tokens: number, latency: number) =>
      log('SUCCESS', 'API', `${provider} responded`, { tokens, latency: `${latency}ms` }),

    apiError: (provider: string, error: string) =>
      log('ERROR', 'API', `${provider} failed: ${error}`),

    complete: (queryId: string, latency: number, cost: number) =>
      log('SUCCESS', 'QUERY', `Complete: ${queryId}`, { latency: `${latency}ms`, cost: `$${cost.toFixed(4)}` }),
  },

  // Grounding Guard
  guard: {
    start: (trigger: string) =>
      log('INFO', 'GUARD', `Grounding Guard triggered by: ${trigger}`),

    hypeCheck: (score: number, triggered: boolean) =>
      log(triggered ? 'WARN' : 'DEBUG', 'GUARD:HYPE',
        triggered ? `⚠️ HYPE DETECTED (score: ${score})` : `Clean (score: ${score})`),

    echoCheck: (score: number, triggered: boolean) =>
      log(triggered ? 'WARN' : 'DEBUG', 'GUARD:ECHO',
        triggered ? `⚠️ ECHO DETECTED (score: ${score})` : `Clean (score: ${score})`),

    driftCheck: (score: number, triggered: boolean) =>
      log(triggered ? 'WARN' : 'DEBUG', 'GUARD:DRIFT',
        triggered ? `⚠️ DRIFT DETECTED (score: ${score})` : `Clean (score: ${score})`),

    factCheck: (score: number, triggered: boolean) =>
      log(triggered ? 'WARN' : 'DEBUG', 'GUARD:FACT',
        triggered ? `⚠️ FACTUALITY ISSUE (score: ${score})` : `Clean (score: ${score})`),

    sanityCheck: (violations: string[], triggered: boolean) =>
      log(triggered ? 'ERROR' : 'DEBUG', 'GUARD:SANITY',
        triggered ? `🚨 REALITY CHECK FAILED: ${violations.join(', ')}` : `Clean (reality-based)`),

    complete: (issues: string[], passed: boolean) =>
      log(passed ? 'SUCCESS' : 'WARN', 'GUARD',
        passed ? '✅ All checks passed' : `⚠️ Issues found: ${issues.join(', ')}`),
  },

  // Methodology execution
  methodology: {
    direct: (tokens: number) =>
      log('DEBUG', 'METHOD:DIRECT', `Direct response`, { tokens }),

    cod: (drafts: number, finalTokens: number, savings: string) =>
      log('DEBUG', 'METHOD:COD', `Chain of Draft`, { drafts, finalTokens, savings }),

    bot: (templates: number) =>
      log('DEBUG', 'METHOD:BOT', `Buffer of Thoughts`, { templates }),

    react: (steps: number, tools: string[]) =>
      log('DEBUG', 'METHOD:REACT', `ReAct reasoning`, { steps, tools }),

    pot: (codeGenerated: boolean, executed: boolean) =>
      log('DEBUG', 'METHOD:POT', `Program of Thought`, { codeGenerated, executed }),

    gtp: (providers: string[], consensusReached: boolean) =>
      log('DEBUG', 'METHOD:GTP', `GTP Consensus`, { providers, consensusReached }),
  },

  // Real-time data
  realtime: {
    fetch: (source: string, symbol: string) =>
      log('DEBUG', 'REALTIME', `Fetching ${symbol} from ${source}`),

    success: (source: string, symbol: string, price: number) =>
      log('SUCCESS', 'REALTIME', `${symbol}: $${price.toLocaleString()}`, { source }),

    error: (source: string, error: string) =>
      log('ERROR', 'REALTIME', `${source} failed: ${error}`),
  },

  // System
  system: {
    startup: () =>
      log('INFO', 'SYSTEM', '🚀 AkhAI Engine Starting...'),

    ready: () =>
      log('SUCCESS', 'SYSTEM', '✅ AkhAI Engine Ready'),

    error: (error: string) =>
      log('ERROR', 'SYSTEM', `System error: ${error}`),
  }
}

// Get recent logs
export function getLogs(count: number = 100, level?: LogLevel, component?: string): LogEntry[] {
  let filtered = [...logs]
  if (level) filtered = filtered.filter(l => l.level === level)
  if (component) filtered = filtered.filter(l => l.component.includes(component))
  return filtered.slice(-count)
}

// Clear logs
export function clearLogs() {
  logs.length = 0
  log('INFO', 'SYSTEM', 'Logs cleared')
}

// Export for API
export function getLogsForAPI() {
  return {
    total: logs.length,
    logs: logs.slice(-100).reverse(),
    summary: {
      errors: logs.filter(l => l.level === 'ERROR').length,
      warnings: logs.filter(l => l.level === 'WARN').length,
      guardTriggers: logs.filter(l => l.component.includes('GUARD') && l.level === 'WARN').length,
    }
  }
}
