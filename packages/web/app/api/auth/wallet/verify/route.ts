import { NextRequest, NextResponse } from 'next/server';
import { authenticateWallet, generateWalletMessage } from '@/lib/auth';
import { AuthWalletVerifySchema } from '@/lib/route-schemas';

export const dynamic = 'force-dynamic';

/**
 * POST /api/auth/wallet/verify
 * Verify wallet signature and create session
 */
export async function POST(request: NextRequest) {
  try {
    const parsed = AuthWalletVerifySchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const { address, signature, message } = parsed.data;
    // Extract timestamp from received message to regenerate expected message
    const timestampMatch = message.match(/Timestamp: (\d+)/);
    const timestamp = timestampMatch ? parseInt(timestampMatch[1]) : Date.now();

    // Regenerate expected message with the same timestamp
    const expectedMessage = `Sign this message to authenticate with AkhAI.\n\nAddress: ${address}\nTimestamp: ${timestamp}`;
    if (message !== expectedMessage) {
      return NextResponse.json(
        { error: 'Invalid message format', details: 'Message does not match expected format' },
        { status: 400 }
      );
    }

    const { user, session } = authenticateWallet(address, signature, message);
    // Set session cookie
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        avatar_url: user.avatar_url,
        auth_provider: user.auth_provider,
      },
    });

    response.cookies.set('session_token', session.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: '/',
    });

    return response;
  } catch (error) {
    const errorInfo = {
      message: error instanceof Error ? error.message : String(error),
      name: error instanceof Error ? error.name : 'Unknown',
      stack: error instanceof Error ? error.stack?.substring(0, 200) : 'no stack',
    };
    console.error('[DEBUG] Wallet verification error:', errorInfo);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Wallet verification failed',
        details: errorInfo,
      },
      { status: 500 }
    );
  }
}
