import { NextRequest, NextResponse } from 'next/server'

/**
 * POST /api/auth/logout
 * Destroy session and clear cookie
 */
export async function POST(request: NextRequest) {
  try {
    const { logout } = await import('@/lib/auth')
    const token = request.cookies.get('session_token')?.value

    if (token) {
      logout(token)
    }

    const response = NextResponse.json({ success: true })
    response.cookies.delete('session_token')
    return response
  } catch (error) {
    console.error('Logout error:', error)
    const response = NextResponse.json({ success: true })
    response.cookies.delete('session_token')
    return response
  }
}
