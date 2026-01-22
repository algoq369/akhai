# Twitter OAuth & Thread Fetching Implementation

**Date**: January 2, 2026
**Status**: ✅ Complete - Ready for Testing
**Session**: Social Connectors - Phase 2

---

## 🎯 Overview

Complete Twitter OAuth 2.0 implementation with PKCE (Proof Key for Code Exchange) to enable AkhAI Intelligence to:
- Connect user's X/Twitter account
- Fetch and analyze Twitter threads
- Access tweet content and video metadata
- Provide contextual intelligence based on social content

---

## ✅ Implementation Summary

### Core Files Created

1. **OAuth Endpoints**:
   - `/api/auth/social/x/connect/route.ts` - Initiate OAuth flow
   - `/api/auth/social/x/callback/route.ts` - Handle OAuth callback
   - `/api/auth/social/disconnect/route.ts` - Disconnect social accounts

2. **Library Functions**:
   - `lib/auth.ts` - Twitter OAuth helpers (lines 154-300)
   - `lib/database.ts` - Social connection management (lines 689-806)
   - `lib/tools/x-thread-fetcher.ts` - Thread fetching utility

3. **UI Integration**:
   - `app/profile/page.tsx` - Connect/disconnect UI and handlers

4. **Database**:
   - `social_connections` table with indexes (already created in previous session)

---

## 🔧 Technical Implementation

### 1. OAuth 2.0 with PKCE Flow

**PKCE** (Proof Key for Code Exchange) is required for public clients to prevent authorization code interception attacks.

#### Flow Diagram:
```
User clicks "Connect"
    → Frontend calls /api/auth/social/x/connect
    → Backend generates code_verifier (random 32 bytes)
    → Backend generates code_challenge (SHA256 hash of verifier)
    → Backend stores verifier in memory (with state)
    → Backend returns Twitter OAuth URL
    → Frontend redirects to Twitter
    → User authorizes on Twitter
    → Twitter redirects to /api/auth/social/x/callback?code=XXX&state=YYY
    → Backend retrieves verifier from memory using state
    → Backend exchanges code + verifier for access_token
    → Backend fetches user info from Twitter API
    → Backend saves connection to database
    → Backend redirects to /profile with success message
```

#### Key Security Features:
- **State parameter**: Prevents CSRF attacks (16-byte random hex)
- **PKCE verifier**: Prevents code interception (32-byte random base64url)
- **Expiry tracking**: Verifiers auto-expire after 10 minutes
- **Single use**: Verifier deleted immediately after use

### 2. Database Schema

**Table**: `social_connections`

```sql
CREATE TABLE IF NOT EXISTS social_connections (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  platform TEXT NOT NULL CHECK(platform IN ('x', 'telegram', 'github', 'reddit', 'mastodon', 'youtube')),
  username TEXT NOT NULL,
  user_external_id TEXT,           -- Twitter user ID
  access_token TEXT,                -- Encrypted in production
  refresh_token TEXT,               -- For token renewal
  expires_at INTEGER,               -- Unix timestamp
  connected_at INTEGER DEFAULT (strftime('%s', 'now')),
  last_synced INTEGER,
  metadata TEXT DEFAULT '{}',       -- JSON for platform-specific data
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(user_id, platform)
);

CREATE INDEX IF NOT EXISTS idx_social_user_id ON social_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_social_platform ON social_connections(platform);
```

**Important**: Tokens should be encrypted at rest in production (not implemented yet).

### 3. Twitter API v2 Integration

**Endpoints Used**:
- `POST https://api.twitter.com/2/oauth2/token` - Exchange code for token
- `GET https://api.twitter.com/2/users/me` - Get authenticated user info
- `GET https://api.twitter.com/2/tweets/:id` - Fetch individual tweets
- `GET https://api.twitter.com/2/tweets/:id?expansions=referenced_tweets` - Fetch thread

**Scopes Requested**:
- `tweet.read` - Read tweets and threads
- `users.read` - Read user profile information
- `offline.access` - Get refresh tokens for long-lived access

**Rate Limits**:
- Free tier: 500K tweets/month
- Paid tier: 2M+ tweets/month
- Per-user rate limits apply

### 4. Thread Fetcher Utility

**File**: `lib/tools/x-thread-fetcher.ts`

**Functions**:

```typescript
// Extract tweet ID from URL
extractTweetId(url: string): string | null

// Fetch complete thread
fetchXThread(tweetId: string, userId: string): Promise<Thread | null>

// Analyze thread content
analyzeThread(thread: Thread): { summary, key_points, engagement }

// Check if query contains Twitter links
containsTwitterLink(query: string): boolean

// Extract all Twitter links from query
extractTwitterLinks(query: string): string[]
```

**Usage Example**:
```typescript
import { fetchXThread, extractTweetId } from '@/lib/tools/x-thread-fetcher'

const url = "https://x.com/user/status/1234567890"
const tweetId = extractTweetId(url)

if (tweetId) {
  const thread = await fetchXThread(tweetId, userId)
  console.log(thread.tweets)
}
```

**Current Limitation**:
- Twitter API v2 doesn't have a direct "get full thread" endpoint
- Currently returns single tweet
- Full thread reconstruction requires recursive fetching of referenced_tweets
- Enhancement needed for complete thread traversal

---

## 🔐 Environment Variables

**Required for Twitter OAuth**:

```bash
# Twitter OAuth 2.0 Credentials
TWITTER_CLIENT_ID=<your-client-id>
TWITTER_CLIENT_SECRET=<your-client-secret>
TWITTER_REDIRECT_URI=http://localhost:3000/api/auth/social/x/callback

# For production deployment
# TWITTER_REDIRECT_URI=https://yourdomain.com/api/auth/social/x/callback
```

### How to Get Twitter OAuth Credentials:

1. Go to [Twitter Developer Portal](https://developer.twitter.com/en/portal/dashboard)
2. Create a new App (or use existing)
3. Navigate to "User authentication settings"
4. Enable OAuth 2.0
5. Set Type of App: Web App
6. Set Callback URL: `http://localhost:3000/api/auth/social/x/callback`
7. Set Website URL: `http://localhost:3000`
8. Copy Client ID and Client Secret
9. Add to `.env.local`

---

## 🎨 UI Integration

### Profile Page Updates

**Location**: `app/profile/page.tsx`

**Features Added**:

1. **OAuth Message Notification** (lines 291-310):
   - Success banner (green) for successful connections
   - Error banner (red) for failed connections
   - Auto-dismiss after 5-7 seconds
   - Manual dismiss button

2. **Connect Handler** (lines 168-202):
   - Calls `/api/auth/social/x/connect`
   - Redirects to Twitter OAuth
   - Shows error if OAuth not configured

3. **Disconnect Handler** (lines 207-249):
   - Confirmation dialog
   - Calls `/api/auth/social/disconnect?platform=x`
   - Updates UI state immediately
   - Shows success/error message

4. **Social Connectors Section** (lines 790-814):
   - Shows connection status
   - Displays @username if connected
   - Connect/Disconnect button

### User Experience Flow:

**Connecting**:
1. User clicks "● connect" next to X (Twitter)
2. Redirects to Twitter OAuth page
3. User authorizes AkhAI
4. Redirects back to profile with green success message
5. Shows "@username" and "○ disconnect" button

**Disconnecting**:
1. User clicks "○ disconnect"
2. Confirmation dialog: "Are you sure?"
3. Calls API to delete connection
4. Shows success message
5. Updates to "Not connected" and "● connect"

---

## 🧪 Testing Guide

### Prerequisites:
1. Twitter Developer Account
2. Twitter App created
3. OAuth 2.0 enabled
4. Environment variables configured

### Test Steps:

**1. Test OAuth Initiation**:
```bash
# Start dev server
cd packages/web
pnpm dev

# Navigate to profile settings
# http://localhost:3000/profile?tab=settings

# Click "● connect" next to X (Twitter)
# Should redirect to Twitter OAuth page
```

**2. Test OAuth Callback**:
```bash
# After authorizing on Twitter:
# Should redirect back to /profile?connected=x&username=yourname
# Should show green success banner
# Should display @yourname under X (Twitter)
```

**3. Test Disconnect**:
```bash
# Click "○ disconnect" next to X (Twitter)
# Confirm in dialog
# Should show success message
# Should update to "Not connected"
```

**4. Test Profile API**:
```bash
# Check that social connections are returned
curl http://localhost:3000/api/profile \
  -H "Cookie: session_token=YOUR_SESSION_TOKEN"

# Response should include:
{
  "user": {
    "id": "...",
    "social_connections": [
      {
        "platform": "x",
        "username": "yourname",
        "connected_at": 1234567890
      }
    ]
  }
}
```

**5. Test Thread Fetcher**:
```typescript
// In a test file or debug page
import { fetchXThread, extractTweetId } from '@/lib/tools/x-thread-fetcher'

const url = "https://x.com/elonmusk/status/1234567890"
const tweetId = extractTweetId(url)
const thread = await fetchXThread(tweetId, userId)

console.log(thread)
```

### Expected Behaviors:

✅ **Success Cases**:
- OAuth initiation returns auth URL
- OAuth callback saves connection to database
- Profile API returns social connections
- Disconnect removes connection from database
- Thread fetcher retrieves tweet data

❌ **Error Cases**:
- Missing TWITTER_CLIENT_ID → Shows error message
- Invalid state parameter → Shows "Invalid or expired state"
- Expired token → Shows "X connection expired"
- No connection → Thread fetcher throws "X account not connected"

---

## 🚧 Known Limitations

### 1. Thread Reconstruction
**Current**: Only fetches single tweet
**Needed**: Recursive fetching of referenced_tweets to build full thread
**Impact**: Can't analyze multi-tweet threads yet

### 2. Token Storage Security
**Current**: Tokens stored as plaintext in SQLite
**Needed**: Encryption at rest (AES-256)
**Impact**: Security risk if database is compromised

### 3. Token Refresh
**Current**: Expiry tracked, but no auto-refresh
**Needed**: Background job to refresh tokens before expiry
**Impact**: Users must reconnect when tokens expire

### 4. PKCE Store
**Current**: In-memory Map (lost on server restart)
**Needed**: Redis or database-backed store
**Impact**: OAuth fails if server restarts mid-flow

### 5. Video Analysis
**Current**: Not implemented
**Needed**: Twitter API media endpoints + video processing
**Impact**: Can't analyze videos mentioned in user request

### 6. Real-time Feed
**Current**: Not implemented
**Needed**: Twitter Streaming API integration
**Impact**: Can't monitor user's timeline in real-time

---

## 🚀 Future Enhancements

### Phase 3: Complete Thread Analysis

**Goal**: Full thread reconstruction and analysis

**Tasks**:
- [ ] Implement recursive referenced_tweets fetching
- [ ] Build conversation tree structure
- [ ] Extract author relationships (who replied to whom)
- [ ] Sentiment analysis across thread
- [ ] Key insights extraction using AI

### Phase 4: Video Analysis

**Goal**: Analyze videos embedded in tweets

**Tasks**:
- [ ] Fetch tweet media metadata
- [ ] Download or stream video
- [ ] Extract audio transcript (Whisper API)
- [ ] Analyze video frames (Vision API)
- [ ] Summarize video content

### Phase 5: Context Injection

**Goal**: Use Twitter content in AkhAI queries

**Tasks**:
- [ ] Detect Twitter links in user queries
- [ ] Auto-fetch thread when URL mentioned
- [ ] Inject thread content into prompt context
- [ ] Cite specific tweets in responses
- [ ] Enable "Analyze this thread" queries

### Phase 6: Real-time Monitoring

**Goal**: Monitor user's Twitter feed

**Tasks**:
- [ ] Twitter Streaming API integration
- [ ] Filter tweets from user's following list
- [ ] Identify trending topics from user's network
- [ ] Suggest relevant content to user
- [ ] Enable "What's happening on X?" queries

---

## 📊 Database Queries

### Get User's Social Connections
```sql
SELECT platform, username, connected_at, last_synced
FROM social_connections
WHERE user_id = ?
ORDER BY connected_at DESC;
```

### Check if Platform Connected
```sql
SELECT COUNT(*) as is_connected
FROM social_connections
WHERE user_id = ? AND platform = 'x';
```

### Get Twitter Access Token (for API calls)
```sql
SELECT access_token, refresh_token, expires_at
FROM social_connections
WHERE user_id = ? AND platform = 'x'
LIMIT 1;
```

### Delete Connection
```sql
DELETE FROM social_connections
WHERE user_id = ? AND platform = 'x';
```

---

## 🔍 Debugging Tips

### OAuth Flow Issues

**Problem**: "Invalid or expired state parameter"
**Cause**: State not found in PKCE store
**Solutions**:
- Check server didn't restart between connect and callback
- Verify state parameter matches between requests
- Check PKCE store expiry (10 minutes)

**Problem**: "Failed to get access token from Twitter"
**Cause**: Invalid code_verifier or expired code
**Solutions**:
- Verify code_challenge generated correctly (SHA256)
- Check code_verifier stored and retrieved properly
- Ensure redirect_uri matches exactly

**Problem**: "Twitter OAuth not configured"
**Cause**: Missing environment variables
**Solutions**:
- Verify TWITTER_CLIENT_ID exists in .env.local
- Verify TWITTER_CLIENT_SECRET exists in .env.local
- Restart dev server after adding variables

### Thread Fetcher Issues

**Problem**: "X account not connected"
**Cause**: User hasn't connected Twitter account
**Solutions**:
- Check social_connections table for user
- Verify platform = 'x' exists
- Test OAuth flow first

**Problem**: "X connection expired"
**Cause**: Access token expired
**Solutions**:
- Check expires_at timestamp
- Implement token refresh
- Ask user to reconnect

**Problem**: "Failed to fetch tweet"
**Cause**: Invalid tweet ID or API error
**Solutions**:
- Verify tweet ID is numeric
- Check Twitter API status
- Verify access token is valid
- Check rate limits

---

## 📝 API Reference

### POST /api/auth/social/x/connect
**Purpose**: Initiate Twitter OAuth flow
**Auth**: Required (session cookie)
**Returns**: `{ authUrl: string, state: string }`
**Errors**: 401 Unauthorized, 500 OAuth not configured

### GET /api/auth/social/x/callback
**Purpose**: Handle Twitter OAuth callback
**Params**: `code` (string), `state` (string)
**Returns**: Redirect to /profile with success/error message
**Errors**: Redirect with error parameter

### DELETE /api/auth/social/disconnect
**Purpose**: Disconnect social account
**Auth**: Required (session cookie)
**Params**: `platform` (query string: 'x' | 'telegram' | etc.)
**Returns**: `{ success: true }`
**Errors**: 401 Unauthorized, 400 Invalid platform

### GET /api/profile
**Purpose**: Get user profile with social connections
**Auth**: Required (session_token cookie)
**Returns**:
```json
{
  "user": {
    "id": "...",
    "github_username": "...",
    "social_connections": [
      {
        "platform": "x",
        "username": "yourname",
        "connected_at": 1234567890,
        "last_synced": null
      }
    ]
  }
}
```
**Errors**: 401 Unauthorized

---

## 🎯 Success Metrics

**OAuth Flow**:
- ✅ User can connect Twitter account
- ✅ Connection saved to database
- ✅ Username displayed in profile
- ✅ User can disconnect account
- ✅ Connection removed from database

**Thread Fetcher**:
- ✅ Can extract tweet ID from URL
- ✅ Can fetch single tweet
- ⏳ Can fetch full thread (needs enhancement)
- ⏳ Can analyze thread content (needs AI integration)

**Security**:
- ✅ PKCE prevents code interception
- ✅ State prevents CSRF
- ✅ Tokens not exposed to frontend
- ⏳ Tokens encrypted at rest (not implemented)

**User Experience**:
- ✅ Clear success/error messages
- ✅ One-click connect/disconnect
- ✅ Automatic redirect flow
- ✅ Connection status visible

---

## 🛠️ Maintenance

### Token Refresh Job (To Be Implemented)

**Frequency**: Every 6 hours
**Logic**:
```typescript
// Pseudo-code for token refresh job
async function refreshExpiredTokens() {
  const expiringTokens = db.prepare(`
    SELECT * FROM social_connections
    WHERE platform = 'x'
    AND expires_at < ?
    AND expires_at > 0
  `).all(Date.now() / 1000 + 3600) // Expiring in next hour

  for (const connection of expiringTokens) {
    const newToken = await refreshTwitterToken(connection.refresh_token)
    saveSocialConnection({
      ...connection,
      access_token: newToken.access_token,
      expires_at: Date.now() / 1000 + newToken.expires_in
    })
  }
}
```

### Cleanup Old PKCE Entries

**Current**: Runs every 5 minutes in `lib/auth.ts` (line 165)
**Expires**: Verifiers older than 10 minutes
**Impact**: Prevents memory leak

---

## 📖 References

- [Twitter OAuth 2.0 Documentation](https://developer.twitter.com/en/docs/authentication/oauth-2-0)
- [Twitter API v2 Reference](https://developer.twitter.com/en/docs/twitter-api)
- [PKCE RFC 7636](https://datatracker.ietf.org/doc/html/rfc7636)
- [OAuth 2.0 RFC 6749](https://datatracker.ietf.org/doc/html/rfc6749)

---

**Status**: ✅ Core Implementation Complete
**Next Steps**: Test with real Twitter account, implement thread reconstruction
**Built by Algoq • Sovereign AI • Social Intelligence Integration**
