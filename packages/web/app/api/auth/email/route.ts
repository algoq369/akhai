import { NextRequest, NextResponse } from 'next/server'
import { getDatabase } from '@/lib/database'
import { generateUUID } from '@/lib/uuid'

/**
 * POST /api/auth/email
 * Two actions: 'send' (generate code) and 'verify' (check code + create session)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, action, code } = body

    if (!email || !action) {
      return NextResponse.json({ error: 'Missing email or action' }, { status: 400 })
    }

    const db = getDatabase()

    // Ensure email_auth_codes table exists
    db.exec(`CREATE TABLE IF NOT EXISTS email_auth_codes (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL,
      code TEXT NOT NULL,
      expires_at INTEGER NOT NULL,
      used INTEGER DEFAULT 0,
      created_at TEXT
    )`)

    if (action === 'send') {
      // Generate 6-digit code
      const authCode = Math.floor(100000 + Math.random() * 900000).toString()
      const expiresAt = Date.now() + 10 * 60 * 1000 // 10 minutes

      // Invalidate old codes for this email
      db.prepare('UPDATE email_auth_codes SET used = 1 WHERE email = ? AND used = 0').run(email)

      // Store new code
      db.prepare('INSERT INTO email_auth_codes (id, email, code, expires_at) VALUES (?, ?, ?, ?)').run(
        generateUUID(), email, authCode, expiresAt
      )

      // Send email via Resend API
      const resendKey = process.env.RESEND_API_KEY
      if (resendKey) {
        try {
          const emailRes = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${resendKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              from: process.env.RESEND_FROM_EMAIL || 'AkhAI <noreply@akhai.app>',
              to: [email],
              subject: `AkhAI verification code: ${authCode}`,
              html: `<div style="font-family:monospace;max-width:400px;margin:0 auto;padding:32px">
                <h2 style="letter-spacing:0.3em;font-weight:300">A K H A I</h2>
                <p style="color:#666;font-size:13px">Your verification code:</p>
                <div style="font-size:32px;letter-spacing:0.5em;font-weight:500;padding:16px 0;border:1px solid #eee;text-align:center;border-radius:8px;margin:16px 0">${authCode}</div>
                <p style="color:#999;font-size:11px">This code expires in 10 minutes. If you didn't request this, ignore this email.</p>
                <p style="color:#ccc;font-size:10px;margin-top:32px">sovereign intelligence</p>
              </div>`,
            }),
          })
          if (!emailRes.ok) {
            console.error('[EMAIL AUTH] Resend error:', await emailRes.text())
          }
        } catch (emailErr) {
          console.error('[EMAIL AUTH] Failed to send:', emailErr)
        }
      } else {
        console.log(`[EMAIL AUTH] No RESEND_API_KEY — code for ${email}: ${authCode}`)
      }

      return NextResponse.json({
        success: true,
        message: 'Verification code sent to your email',
      })

    } else if (action === 'verify') {
      if (!code) {
        return NextResponse.json({ error: 'Missing code' }, { status: 400 })
      }

      // Find valid code
      const record = db.prepare(
        'SELECT * FROM email_auth_codes WHERE email = ? AND code = ? AND used = 0 AND expires_at > ?'
      ).get(email, code, Date.now()) as any

      if (!record) {
        return NextResponse.json({ error: 'Invalid or expired code' }, { status: 401 })
      }

      // Mark code as used
      db.prepare('UPDATE email_auth_codes SET used = 1 WHERE id = ?').run(record.id)

      // Ensure users table has email column
      try { db.exec('ALTER TABLE users ADD COLUMN email TEXT') } catch {}

      // Find or create user by email
      let user = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as any
      if (!user) {
        const userId = `email_${email.replace(/[^a-zA-Z0-9]/g, '_')}`
        const now = Math.floor(Date.now() / 1000)
        db.prepare('INSERT OR IGNORE INTO users (id, email, auth_provider, auth_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)').run(
          userId, email, 'email', email, now, now
        )
        user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId)
        if (!user) {
          // Fallback: maybe user exists with different id but same email
          user = db.prepare('SELECT * FROM users WHERE email = ?').get(email)
        }
      }

      // Create session
      const sessionToken = generateUUID()
      const sessionId = generateUUID()
      const expiresAt = Math.floor((Date.now() + 30 * 24 * 60 * 60 * 1000) / 1000) // 30 days, unix timestamp
      db.prepare('INSERT INTO sessions (id, token, user_id, expires_at) VALUES (?, ?, ?, ?)').run(sessionId, sessionToken, user.id, expiresAt)

      const response = NextResponse.json({ success: true, userId: user.id })
      response.cookies.set('session_token', sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60,
        path: '/',
      })
      return response
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Email auth error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
