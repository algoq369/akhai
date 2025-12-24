import { NextRequest, NextResponse } from 'next/server';
import { generateWalletMessage, authenticateWallet } from '@/lib/auth';

/**
 * POST /api/auth/wallet
 * Initiate wallet authentication - returns message to sign
 */
export async function POST(request: NextRequest) {
  try {
    const { address } = await request.json();

    if (!address || typeof address !== 'string') {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      );
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

