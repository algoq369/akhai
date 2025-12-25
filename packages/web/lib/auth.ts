/**
 * Authentication Service
 * 
 * Handles GitHub OAuth and Wallet authentication
 */

import { createOrGetUser, createSession, validateSession, destroySession, User } from './database';
import { randomBytes } from 'crypto';

const SESSION_DURATION_SECONDS = 30 * 24 * 60 * 60; // 30 days

/**
 * Admin/Founder Configuration
 * Only the founder can see provider status and costs
 */
const ADMIN_GITHUB_USERNAME = process.env.ADMIN_GITHUB_USERNAME || 'algoq369';

/**
 * Check if a user is the admin/founder
 */
export function isAdmin(user: User | null): boolean {
  if (!user) return false;
  // Admin is identified by GitHub username
  return user.auth_provider === 'github' && user.username === ADMIN_GITHUB_USERNAME;
}

/**
 * GitHub OAuth Configuration
 */
const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID || '';
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET || '';
// Use NEXT_PUBLIC_VERCEL_URL or default to localhost:3002 (common Next.js dev port)
const baseUrl = process.env.NEXT_PUBLIC_VERCEL_URL 
  ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
  : process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3002';
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
  const user = validateSession(token);
  return user;
}

/**
 * Logout (destroy session)
 */
export function logout(token: string): void {
  destroySession(token);
}

