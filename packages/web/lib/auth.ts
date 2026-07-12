import 'server-only';

/**
 * Authentication Service
 *
 * Handles GitHub OAuth and Wallet authentication
 */

import {
  createOrGetUser,
  createSession,
  validateSession,
  destroySession,
  User,
  savePKCEVerifier,
  getPKCEVerifier,
  deletePKCEVerifier,
  cleanupExpiredPKCEVerifiers,
} from './database';
import { saveWalletNonce, consumeWalletNonce } from '@/lib/db/auth';
import { randomBytes } from 'crypto';
import { verifyMessage } from 'ethers';

// Wallet-login challenge lifetime — a nonce must be redeemed within this window (wallet-verify B1).
const WALLET_NONCE_TTL_SECONDS = 5 * 60;

const SESSION_DURATION_SECONDS = 30 * 24 * 60 * 60; // 30 days

/**
 * GitHub OAuth Configuration
 */
const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID || '';
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET || '';
// Use NEXT_PUBLIC_VERCEL_URL or default to localhost:3002 (common Next.js dev port)
const baseUrl = process.env.NEXT_PUBLIC_VERCEL_URL
  ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
  : process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3002';
const GITHUB_REDIRECT_URI =
  process.env.GITHUB_REDIRECT_URI || `${baseUrl}/api/auth/github/callback`;

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
export async function handleGitHubCallback(
  code: string
): Promise<{ user: User; session: { token: string } }> {
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

/** Exact challenge template — the signed message must equal this for the issued nonce. */
function walletChallengeMessage(address: string, nonce: string): string {
  return `Sign this message to authenticate with AkhAI.\n\nAddress: ${address}\nNonce: ${nonce}`;
}

/**
 * Issue a wallet-login challenge: mint a single-use server nonce, persist it bound to the
 * address, and return the message for the wallet to sign. The nonce (not a client timestamp)
 * is the anti-replay primitive — it is deleted on use and expires in 5 minutes.
 */
export function issueWalletChallenge(address: string): string {
  const nonce = randomBytes(16).toString('hex');
  saveWalletNonce(nonce, address);
  return walletChallengeMessage(address, nonce);
}

/**
 * Real EIP-191 verification: recover the signer from (message, signature) and confirm it
 * matches the claimed address. Case-insensitive (checksum vs lowercase). Returns false on any
 * malformed input rather than throwing. (Was a stub returning true — B1 full auth bypass.)
 */
export function verifyWalletSignature(
  address: string,
  signature: string,
  message: string
): boolean {
  try {
    const recovered = verifyMessage(message, signature);
    return recovered.toLowerCase() === address.toLowerCase();
  } catch {
    return false;
  }
}

/**
 * Authenticate with wallet: signature must recover to the claimed address AND the message must
 * carry a valid, unexpired, single-use nonce bound to that address. Throws on any failure —
 * the login route maps a throw to 401.
 */
export function authenticateWallet(
  address: string,
  signature: string,
  message: string
): { user: User; session: { token: string } } {
  // 1. EIP-191: the signature must actually be from this address.
  if (!verifyWalletSignature(address, signature, message)) {
    throw new Error('Invalid wallet signature');
  }

  // 2. Anti-replay: the message must contain a server nonce we issued, unused and unexpired,
  //    for this exact address — and the full message must match the challenge template so a
  //    valid signature over arbitrary content can't be repurposed.
  const nonce = message.match(/Nonce: ([a-f0-9]+)/)?.[1];
  if (!nonce) throw new Error('Invalid wallet signature');
  if (message !== walletChallengeMessage(address, nonce)) {
    throw new Error('Invalid wallet signature');
  }
  const record = consumeWalletNonce(nonce); // single-use: fetched and deleted atomically
  if (!record || record.address.toLowerCase() !== address.toLowerCase()) {
    throw new Error('Invalid wallet signature');
  }
  if (Math.floor(Date.now() / 1000) - record.createdAt > WALLET_NONCE_TTL_SECONDS) {
    throw new Error('Wallet challenge expired');
  }

  // 3. Mint the session.
  const user = createOrGetUser('wallet', address.toLowerCase(), {
    username: `${address.slice(0, 6)}...${address.slice(-4)}`,
  });
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
const TWITTER_REDIRECT_URI =
  process.env.TWITTER_REDIRECT_URI || `${baseUrl}/api/auth/social/x/callback`;

// Clean up expired PKCE entries from database (older than 10 minutes)
setInterval(
  () => {
    const deleted = cleanupExpiredPKCEVerifiers();
    if (deleted > 0) {
      console.log(`[PKCE Cleanup] Deleted ${deleted} expired verifier(s)`);
    }
  },
  5 * 60 * 1000
); // Run every 5 minutes

/**
 * Generate PKCE code verifier and challenge
 */
function generatePKCE(): { verifier: string; challenge: string } {
  const verifier = randomBytes(32).toString('base64url');
  const challenge = require('crypto').createHash('sha256').update(verifier).digest('base64url');

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
    has_challenge: !!challenge,
  });

  return {
    authUrl,
    state,
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
        Authorization: `Basic ${Buffer.from(`${TWITTER_CLIENT_ID}:${TWITTER_CLIENT_SECRET}`).toString('base64')}`,
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
        Authorization: `Bearer ${tokenData.access_token}`,
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
      username: twitterUser.username,
    };
  } catch (error) {
    console.error('Twitter OAuth callback error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
