/**
 * Authentication Service
 * 
 * Handles GitHub OAuth and Wallet authentication
 */

import { createOrGetUser, createSession, validateSession, destroySession, User, savePKCEVerifier, getPKCEVerifier, deletePKCEVerifier, cleanupExpiredPKCEVerifiers } from './database';
import { randomBytes } from 'crypto';

const SESSION_DURATION_SECONDS = 30 * 24 * 60 * 60; // 30 days

/**
 * GitHub OAuth Configuration
 */
const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID || '';
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET || '';
// Use NEXT_PUBLIC_VERCEL_URL or default to localhost:3000 (standard Next.js dev port)
const baseUrl = process.env.NEXT_PUBLIC_VERCEL_URL
  ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
  : process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
const GITHUB_REDIRECT_URI = process.env.GITHUB_REDIRECT_URI || `${baseUrl}/api/auth/github/callback`;

/**
 * Generate GitHub OAuth authorization URL
 */
export function getGitHubAuthUrl(): string {
  if (!GITHUB_CLIENT_ID) {
    throw new Error('GITHUB_CLIENT_ID is not configured. Please add it to .env.local');
  }
  
  const state = randomBytes(16).toString('hex');
  const params = new URLSearchParams({
    client_id: GITHUB_CLIENT_ID,
    redirect_uri: GITHUB_REDIRECT_URI,
    scope: 'read:user user:email',
    state,
  });
  return `https://github.com/login/oauth/authorize?${params.toString()}`;
}

/**
 * Handle GitHub OAuth callback
 */
export async function handleGitHubCallback(code: string): Promise<{ user: User; session: { token: string } }> {
  // Exchange code for access token
  const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      client_id: GITHUB_CLIENT_ID,
      client_secret: GITHUB_CLIENT_SECRET,
      code,
    }),
  });

  const tokenData = await tokenResponse.json();
  
  if (!tokenData.access_token) {
    throw new Error('Failed to get access token from GitHub');
  }

  // Get user info from GitHub
  const userResponse = await fetch('https://api.github.com/user', {
    headers: {
      Authorization: `Bearer ${tokenData.access_token}`,
      Accept: 'application/vnd.github.v3+json',
    },
  });

  const githubUser = await userResponse.json();

  // Create or update user
  const user = createOrGetUser('github', githubUser.id.toString(), {
    username: githubUser.login,
    email: githubUser.email || null,
    avatar_url: githubUser.avatar_url || null,
  });

  // Create session
  const session = createSession(user.id, SESSION_DURATION_SECONDS);

  return {
    user,
    session: { token: session.token },
  };
}

/**
 * Wallet Authentication
 */

/**
 * Generate message for wallet signature
 */
export function generateWalletMessage(address: string): string {
  const timestamp = Date.now();
  return `Sign this message to authenticate with AkhAI.\n\nAddress: ${address}\nTimestamp: ${timestamp}`;
}

/**
 * Verify wallet signature (simplified - in production, use proper EIP-191 verification)
 */
export function verifyWalletSignature(address: string, signature: string, message: string): boolean {
  // In production, use ethers.js or web3.js to properly verify EIP-191 signatures
  // For now, this is a placeholder that accepts any signature
  // TODO: Implement proper signature verification
  return true;
}

/**
 * Authenticate with wallet
 */
export function authenticateWallet(address: string, signature: string, message: string): { user: User; session: { token: string } } {
  // Verify signature
  if (!verifyWalletSignature(address, signature, message)) {
    throw new Error('Invalid wallet signature');
  }

  // Create or get user
  const user = createOrGetUser('wallet', address.toLowerCase(), {
    username: `${address.slice(0, 6)}...${address.slice(-4)}`,
  });

  // Create session
  const session = createSession(user.id, SESSION_DURATION_SECONDS);

  return {
    user,
    session: { token: session.token },
  };
}

/**
 * Session Management
 */

/**
 * Get user from session token
 */
export function getUserFromSession(token: string): User | null {
  return validateSession(token);
}

/**
 * Logout (destroy session)
 */
export function logout(token: string): void {
  destroySession(token);
}

/**
 * Twitter OAuth 2.0 with PKCE Configuration
 */
const TWITTER_CLIENT_ID = process.env.TWITTER_CLIENT_ID || '';
const TWITTER_CLIENT_SECRET = process.env.TWITTER_CLIENT_SECRET || '';
const TWITTER_REDIRECT_URI = process.env.TWITTER_REDIRECT_URI || `${baseUrl}/api/auth/social/x/callback`;

// Clean up expired PKCE entries from database (older than 10 minutes)
setInterval(() => {
  const deleted = cleanupExpiredPKCEVerifiers();
  if (deleted > 0) {
    console.log(`[PKCE Cleanup] Deleted ${deleted} expired verifier(s)`);
  }
}, 5 * 60 * 1000); // Run every 5 minutes

/**
 * Generate PKCE code verifier and challenge
 */
function generatePKCE(): { verifier: string; challenge: string } {
  const verifier = randomBytes(32).toString('base64url');
  const challenge = require('crypto')
    .createHash('sha256')
    .update(verifier)
    .digest('base64url');

  return { verifier, challenge };
}

/**
 * Generate Twitter OAuth authorization URL with PKCE
 */
export function getTwitterAuthUrl(userId: string): { authUrl: string; state: string } {
  if (!TWITTER_CLIENT_ID) {
    throw new Error('TWITTER_CLIENT_ID is not configured. Please add it to .env.local');
  }

  const state = randomBytes(16).toString('hex');
  const { verifier, challenge } = generatePKCE();

  // Store verifier in database for later use in callback
  savePKCEVerifier(state, verifier, userId);

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: TWITTER_CLIENT_ID,
    redirect_uri: TWITTER_REDIRECT_URI,
    scope: 'tweet.read users.read offline.access',
    state,
    code_challenge: challenge,
    code_challenge_method: 'S256',
  });

  const authUrl = `https://twitter.com/i/oauth2/authorize?${params.toString()}`;

  console.log('[Twitter OAuth] Generated auth URL with params:', {
    client_id: TWITTER_CLIENT_ID,
    redirect_uri: TWITTER_REDIRECT_URI,
    scope: 'tweet.read users.read offline.access',
    has_state: !!state,
    has_challenge: !!challenge
  });

  return {
    authUrl,
    state
  };
}

/**
 * Handle Twitter OAuth callback and store connection
 */
export async function handleTwitterCallback(
  code: string,
  state: string
): Promise<{ success: boolean; username?: string; error?: string }> {
  // Retrieve PKCE verifier from database
  const pkceData = getPKCEVerifier(state);
  if (!pkceData) {
    return { success: false, error: 'Invalid or expired state parameter' };
  }

  const { verifier, userId } = pkceData;
  deletePKCEVerifier(state); // Use once and delete

  try {
    // Exchange code for access token
    const tokenResponse = await fetch('https://api.twitter.com/2/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${TWITTER_CLIENT_ID}:${TWITTER_CLIENT_SECRET}`).toString('base64')}`,
      },
      body: new URLSearchParams({
        code,
        grant_type: 'authorization_code',
        client_id: TWITTER_CLIENT_ID,
        redirect_uri: TWITTER_REDIRECT_URI,
        code_verifier: verifier,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenData.access_token) {
      return { success: false, error: 'Failed to get access token from Twitter' };
    }

    // Get user info from Twitter
    const userResponse = await fetch('https://api.twitter.com/2/users/me', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
      },
    });

    const userData = await userResponse.json();

    if (!userData.data) {
      return { success: false, error: 'Failed to get user info from Twitter' };
    }

    const twitterUser = userData.data;

    // Store connection in database
    const { saveSocialConnection } = await import('./database');
    saveSocialConnection({
      user_id: userId,
      platform: 'x',
      username: twitterUser.username,
      user_external_id: twitterUser.id,
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token || null,
      expires_at: tokenData.expires_in
        ? Math.floor(Date.now() / 1000) + tokenData.expires_in
        : null,
    });

    return {
      success: true,
      username: twitterUser.username
    };
  } catch (error) {
    console.error('Twitter OAuth callback error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
