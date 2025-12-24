/**
 * Debug API endpoint
 * Exposes system logs and health status
 */

import { NextResponse } from 'next/server'
import { getLogsForAPI, clearLogs } from '@/lib/logger'

export async function GET() {
  const logsData = getLogsForAPI()

  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    ...logsData,
    environment: {
      hasAnthropicKey: !!process.env.ANTHROPIC_API_KEY,
      hasDeepseekKey: !!process.env.DEEPSEEK_API_KEY,
      hasMistralKey: !!process.env.MISTRAL_API_KEY,
      hasXaiKey: !!process.env.XAI_API_KEY,
      nodeEnv: process.env.NODE_ENV || 'development',
    },
  })
}

export async function DELETE() {
  clearLogs()
  return NextResponse.json({
    status: 'cleared',
    timestamp: new Date().toISOString(),
  })
}
