import { NextRequest, NextResponse } from 'next/server'
import { getUserFromSession } from '@/lib/auth'
import { db } from '@/lib/database'

export async function GET(request: NextRequest) {
  const token = request.cookies.get('session_token')?.value

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const user = getUserFromSession(token)

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get all transactions for this user from both crypto and stripe tables
  // Check if tables exist first
  const tables = db.prepare(`
    SELECT name FROM sqlite_master
    WHERE type='table' AND (name='crypto_payments' OR name='btcpay_payments')
  `).all() as Array<{ name: string }>

  let cryptoPayments: any[] = []
  let btcpayPayments: any[] = []

  // Only query tables that exist
  if (tables.some(t => t.name === 'crypto_payments')) {
    try {
      cryptoPayments = db.prepare(`
        SELECT
          id,
          amount,
          currency,
          pay_currency,
          status,
          created_at,
          'crypto' as payment_type
        FROM crypto_payments
        WHERE user_id = ?
        ORDER BY created_at DESC
      `).all(user.id) as any[]
    } catch (e) {
      console.error('[Profile Transactions] Error fetching crypto payments:', e)
    }
  }

  if (tables.some(t => t.name === 'btcpay_payments')) {
    try {
      btcpayPayments = db.prepare(`
        SELECT
          id,
          amount,
          currency,
          NULL as pay_currency,
          status,
          created_at,
          'btcpay' as payment_type
        FROM btcpay_payments
        WHERE user_id = ?
        ORDER BY created_at DESC
      `).all(user.id) as any[]
    } catch (e) {
      console.error('[Profile Transactions] Error fetching btcpay payments:', e)
    }
  }

  // Combine and sort all transactions
  const allTransactions = [...cryptoPayments, ...btcpayPayments]
    .sort((a: any, b: any) => b.created_at - a.created_at)

  return NextResponse.json({ transactions: allTransactions })
}
