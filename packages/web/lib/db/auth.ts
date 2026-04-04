import { db } from '@/lib/database';
import { randomBytes, randomUUID } from 'crypto';

/**
 * User Management Functions
 */

export interface User {
  id: string;
  username: string | null;
  email: string | null;
  avatar_url: string | null;
  auth_provider: 'github' | 'wallet';
  auth_id: string;
  created_at: number;
  updated_at: number;
}

/**
 * Create or get user by auth provider and ID
 */
export function createOrGetUser(
  authProvider: 'github' | 'wallet',
  authId: string,
  userData?: {
    username?: string;
    email?: string;
    avatar_url?: string;
  }
): User {
  // Check linked accounts first (wallet → github user mapping)
  const linked = db
    .prepare('SELECT user_id FROM linked_accounts WHERE auth_provider = ? AND auth_id = ?')
    .get(authProvider, authId) as { user_id: string } | undefined;
  if (linked) {
    const linkedUser = db.prepare('SELECT * FROM users WHERE id = ?').get(linked.user_id) as
      | User
      | undefined;
    if (linkedUser) return linkedUser;
  }

  // Check if user exists
  const existing = db
    .prepare('SELECT * FROM users WHERE auth_provider = ? AND auth_id = ?')
    .get(authProvider, authId) as User | undefined;

  if (existing) {
    // Update if new data provided
    if (userData && (userData.username || userData.email || userData.avatar_url)) {
      const updates: string[] = [];
      const values: any[] = [];

      if (userData.username !== undefined) {
        updates.push('username = ?');
        values.push(userData.username);
      }
      if (userData.email !== undefined) {
        updates.push('email = ?');
        values.push(userData.email);
      }
      if (userData.avatar_url !== undefined) {
        updates.push('avatar_url = ?');
        values.push(userData.avatar_url);
      }

      if (updates.length > 0) {
        updates.push("updated_at = strftime('%s', 'now')");
        values.push(existing.id);
        db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).run(...values);
        return db.prepare('SELECT * FROM users WHERE id = ?').get(existing.id) as User;
      }
    }
    return existing;
  }

  // Create new user
  const userId = randomUUID();
  db.prepare(
    `
    INSERT INTO users (id, username, email, avatar_url, auth_provider, auth_id)
    VALUES (?, ?, ?, ?, ?, ?)
  `
  ).run(
    userId,
    userData?.username || null,
    userData?.email || null,
    userData?.avatar_url || null,
    authProvider,
    authId
  );

  return db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as User;
}

/**
 * Get user by ID
 */
export function getUser(userId: string): User | undefined {
  return db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as User | undefined;
}

/**
 * Get anonymous user (for migration)
 */
export function getOrCreateAnonymousUser(): User {
  const anonymous = db
    .prepare('SELECT * FROM users WHERE auth_provider = ? AND auth_id = ?')
    .get('wallet', 'anonymous') as User | undefined;

  if (anonymous) {
    return anonymous;
  }

  return createOrGetUser('wallet', 'anonymous', {
    username: 'Anonymous',
  });
}

/**
 * Session Management Functions
 */

export interface Session {
  id: string;
  user_id: string;
  token: string;
  expires_at: number;
  created_at: number;
}

/**
 * Create a new session
 */
export function createSession(
  userId: string,
  expiresInSeconds: number = 30 * 24 * 60 * 60
): Session {
  const sessionId = randomUUID();
  const token = randomBytes(32).toString('hex');
  const expiresAt = Math.floor(Date.now() / 1000) + expiresInSeconds;

  db.prepare(
    `
    INSERT INTO sessions (id, user_id, token, expires_at)
    VALUES (?, ?, ?, ?)
  `
  ).run(sessionId, userId, token, expiresAt);

  return db.prepare('SELECT * FROM sessions WHERE id = ?').get(sessionId) as Session;
}

/**
 * Validate session token and return user
 */
export function validateSession(token: string): User | null {
  // console.log('[DEBUG] validateSession entry, token:', token.substring(0, 10));

  try {
    // console.log('[DEBUG] Before SQL query');

    // Check if tables exist
    const tablesCheck = db
      .prepare(
        `
      SELECT name FROM sqlite_master
      WHERE type='table' AND (name='users' OR name='sessions')
    `
      )
      .all() as Array<{ name: string }>;
    // console.log('[DEBUG] Tables check:', tablesCheck.map(t => t.name), 'hasUsers:', !!tablesCheck.find(t => t.name === 'users'), 'hasSessions:', !!tablesCheck.find(t => t.name === 'sessions'));

    // console.log('[DEBUG] Executing SQL query with token');
    let session;
    try {
      session = db
        .prepare(
          `
        SELECT s.id as session_id, s.user_id, s.token, s.expires_at, s.created_at as session_created_at,
               u.id, u.username, u.email, u.avatar_url, u.auth_provider, u.auth_id, u.created_at, u.updated_at
        FROM sessions s
        JOIN users u ON s.user_id = u.id
        WHERE s.token = ? AND s.expires_at > strftime('%s', 'now')
      `
        )
        .get(token) as
        | {
            session_id: string;
            user_id: string;
            token: string;
            expires_at: number;
            session_created_at: number;
            id: string;
            username: string | null;
            email: string | null;
            avatar_url: string | null;
            auth_provider: 'github' | 'wallet';
            auth_id: string;
            created_at: number;
            updated_at: number;
          }
        | undefined;
    } catch (sqlError) {
      console.error('[Session Validation] SQL error:', sqlError);
      throw sqlError;
    }

    // console.log('[DEBUG] After SQL query, hasSession:', !!session, 'userId:', session?.id || null);

    if (!session) {
      return null;
    }

    return {
      id: session.id,
      username: session.username,
      email: session.email,
      avatar_url: session.avatar_url,
      auth_provider: session.auth_provider,
      auth_id: session.auth_id,
      created_at: session.created_at,
      updated_at: session.updated_at,
    };
  } catch (error) {
    const errorInfo = {
      message: error instanceof Error ? error.message : String(error),
      name: error instanceof Error ? error.name : 'Unknown',
      code: (error as any)?.code || 'no code',
      stack: error instanceof Error ? error.stack?.substring(0, 300) : 'no stack',
    };
    console.error('[DEBUG] validateSession error:', errorInfo);
    // #region agent log
    try {
      fetch('http://127.0.0.1:7242/ingest/3a942698-b8f2-4482-824a-ac082ba88036', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location: 'lib/database.ts:540',
          message: 'validateSession error',
          data: errorInfo,
          timestamp: Date.now(),
          sessionId: 'debug-session',
          runId: 'run1',
          hypothesisId: 'C',
        }),
      }).catch(() => {});
    } catch (e) {}
    // #endregion
    throw error;
  }
}

/**
 * Destroy session (logout)
 */
export function destroySession(token: string): void {
  db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
}

/**
 * Clean expired sessions
 */
export function cleanExpiredSessions(): void {
  db.prepare("DELETE FROM sessions WHERE expires_at <= strftime('%s', 'now')").run();
}

/**
 * Social Connections Management
 */

export interface SocialConnection {
  id?: string;
  user_id: string;
  platform: 'x' | 'telegram' | 'github' | 'reddit' | 'mastodon' | 'youtube';
  username: string;
  user_external_id?: string | null;
  access_token?: string | null;
  refresh_token?: string | null;
  expires_at?: number | null;
  connected_at?: number;
  last_synced?: number | null;
  metadata?: string;
}

/**
 * Save or update a social connection
 */
export function saveSocialConnection(connection: SocialConnection): void {
  const id = connection.id || randomBytes(16).toString('hex');
  const connectedAt = connection.connected_at || Math.floor(Date.now() / 1000);
  const metadata = connection.metadata || '{}';

  const stmt = db.prepare(`
    INSERT INTO social_connections (
      id, user_id, platform, username, user_external_id,
      access_token, refresh_token, expires_at, connected_at,
      last_synced, metadata
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(user_id, platform) DO UPDATE SET
      username = excluded.username,
      user_external_id = excluded.user_external_id,
      access_token = excluded.access_token,
      refresh_token = excluded.refresh_token,
      expires_at = excluded.expires_at,
      last_synced = excluded.last_synced,
      metadata = excluded.metadata
  `);

  stmt.run(
    id,
    connection.user_id,
    connection.platform,
    connection.username,
    connection.user_external_id || null,
    connection.access_token || null,
    connection.refresh_token || null,
    connection.expires_at || null,
    connectedAt,
    connection.last_synced || null,
    metadata
  );
}

/**
 * Get all social connections for a user
 */
export function getUserSocialConnections(userId: string): SocialConnection[] {
  const stmt = db.prepare(`
    SELECT id, user_id, platform, username, user_external_id,
           access_token, refresh_token, expires_at, connected_at,
           last_synced, metadata
    FROM social_connections
    WHERE user_id = ?
    ORDER BY connected_at DESC
  `);

  return stmt.all(userId) as SocialConnection[];
}

/**
 * Get a specific social connection
 */
export function getSocialConnection(
  userId: string,
  platform: SocialConnection['platform']
): SocialConnection | null {
  const stmt = db.prepare(`
    SELECT id, user_id, platform, username, user_external_id,
           access_token, refresh_token, expires_at, connected_at,
           last_synced, metadata
    FROM social_connections
    WHERE user_id = ? AND platform = ?
  `);

  return (stmt.get(userId, platform) as SocialConnection) || null;
}

/**
 * Delete a social connection
 */
export function deleteSocialConnection(
  userId: string,
  platform: SocialConnection['platform']
): void {
  db.prepare('DELETE FROM social_connections WHERE user_id = ? AND platform = ?').run(
    userId,
    platform
  );
}

/**
 * Update social connection metadata
 */
export function updateSocialConnectionMetadata(
  userId: string,
  platform: SocialConnection['platform'],
  metadata: Record<string, any>
): void {
  const stmt = db.prepare(`
    UPDATE social_connections
    SET metadata = ?, last_synced = strftime('%s', 'now')
    WHERE user_id = ? AND platform = ?
  `);

  stmt.run(JSON.stringify(metadata), userId, platform);
}

/**
 * PKCE Verifier Management
 */

/**
 * Save PKCE verifier for OAuth 2.0 flow
 */
export function savePKCEVerifier(state: string, verifier: string, userId: string): void {
  const stmt = db.prepare(`
    INSERT INTO pkce_verifiers (state, verifier, user_id, created_at)
    VALUES (?, ?, ?, strftime('%s', 'now'))
  `);

  stmt.run(state, verifier, userId);
}

/**
 * Get PKCE verifier by state
 */
export function getPKCEVerifier(
  state: string
): { verifier: string; userId: string; timestamp: number } | null {
  const stmt = db.prepare(`
    SELECT verifier, user_id as userId, created_at as timestamp
    FROM pkce_verifiers
    WHERE state = ?
  `);

  const result = stmt.get(state) as
    | { verifier: string; userId: string; timestamp: number }
    | undefined;
  return result || null;
}

/**
 * Delete PKCE verifier (after successful use)
 */
export function deletePKCEVerifier(state: string): void {
  const stmt = db.prepare(`
    DELETE FROM pkce_verifiers WHERE state = ?
  `);

  stmt.run(state);
}

/**
 * Clean up expired PKCE verifiers (older than 10 minutes)
 */
export function cleanupExpiredPKCEVerifiers(): number {
  const tenMinutesAgo = Math.floor(Date.now() / 1000) - 10 * 60;

  const stmt = db.prepare(`
    DELETE FROM pkce_verifiers WHERE created_at < ?
  `);

  const result = stmt.run(tenMinutesAgo);
  return result.changes;
}
