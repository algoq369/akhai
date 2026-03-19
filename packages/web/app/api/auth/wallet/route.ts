import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * POST /api/auth/wallet
 * Initiate wallet authentication - returns message to sign
 * NOTE: generateWalletMessage inlined here to avoid loading database.ts at module init
 */
function generateWalletMessage(address: string): string {
  const timestamp = Date.now();
  return `Sign this message to authenticate with AkhAI.\n\nAddress: ${address}\nTimestamp: ${timestamp}`;
}

export async function POST(request: NextRequest) {
  try {
    const { address } = await request.json();

    if (!address || typeof address !== 'string') {
      return NextResponse.json({ error: 'Wallet address is required' }, { status: 400 });
    }

    const message = generateWalletMessage(address);

    return NextResponse.json({
      message,
      address,
    });
  } catch (error) {
    console.error('Wallet auth initiation error:', error);
    return NextResponse.json(
      { error: 'Failed to initiate wallet authentication' },
      { status: 500 }
    );
  }
}
