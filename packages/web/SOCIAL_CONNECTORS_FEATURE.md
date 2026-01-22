# Social Connectors Feature - AkhAI Intelligence

**Date**: January 2, 2026
**Status**: ✅ Phase 2 Complete (Twitter OAuth + Thread Fetching)
**Implementation Details**: See `TWITTER_OAUTH_IMPLEMENTATION.md`

---

## 🎯 Feature Overview

Social Connectors allow users to connect their social media accounts (X/Twitter, Telegram, GitHub, Reddit, Mastodon, YouTube) to enable AkhAI Intelligence to:

1. **Analyze X/Twitter threads** - Read full thread context, extract key insights
2. **Watch embedded videos** - Analyze video content within tweets/posts
3. **Access user's social graph** - Understand connections and influences
4. **Pull in real-time content** - Latest posts, trending topics from user's feed
5. **Contextual intelligence** - Use social connections to enhance query responses

---

## ✅ Phase 1: UI Implementation (COMPLETE)

### Location
`packages/web/app/profile/page.tsx` - Settings Tab

### UI Features Added

**New Section**: "▸ SOCIAL CONNECTORS"

**Platforms Supported**:
1. **X (Twitter)** - Thread & video analysis, real-time feed
2. **Telegram** - Channel monitoring, bot integration
3. **GitHub** - Repository analysis, code intelligence (already connected via OAuth)
4. **Reddit** - Subreddit tracking, comment threads
5. **Mastodon** - Federated social network, decentralized content
6. **YouTube** - Video transcripts, channel monitoring

**UI Pattern** (per platform):
```tsx
<div className="flex items-center justify-between py-2 border-b border-relic-mist">
  <div className="flex items-center gap-3">
    <span className="text-relic-slate text-[10px] font-medium">X (Twitter)</span>
    <span className="text-relic-silver text-[9px]">
      {connected ? `@${username}` : 'Not connected'}
    </span>
  </div>
  <button onClick={handleConnect}>
    {connected ? '○ disconnect' : '● connect'}
  </button>
</div>
```

### TypeScript Interfaces

```typescript
interface SocialConnection {
  platform: 'x' | 'telegram' | 'github' | 'reddit' | 'mastodon' | 'youtube'
  user_id: string
  username: string
  access_token?: string
  refresh_token?: string
  expires_at?: number
  connected_at: number
}

interface UserProfile {
  id: string
  github_username?: string
  github_email?: string
  wallet_address?: string
  created_at: number
  last_login: number
  social_connections?: SocialConnection[]
}
```

---

## 🚧 Phase 2: Backend Implementation (PENDING)

### Database Schema

**New Table**: `social_connections`

```sql
CREATE TABLE social_connections (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  platform TEXT NOT NULL CHECK(platform IN ('x', 'telegram', 'github', 'reddit', 'mastodon', 'youtube')),
  username TEXT NOT NULL,
  user_external_id TEXT, -- Platform-specific user ID
  access_token TEXT,
  refresh_token TEXT,
  expires_at INTEGER,
  connected_at INTEGER NOT NULL,
  last_synced INTEGER,
  metadata TEXT, -- JSON for platform-specific data
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(user_id, platform)
);

CREATE INDEX idx_social_connections_user ON social_connections(user_id);
CREATE INDEX idx_social_connections_platform ON social_connections(platform);
```

---

### API Endpoints

#### 1. OAuth Initiation
**Endpoint**: `/api/auth/social/{platform}/connect`
**Method**: GET
**Purpose**: Redirect to OAuth provider

**Platforms**:
- **X**: OAuth 2.0 with PKCE
- **GitHub**: Already implemented (`/api/auth/github`)
- **Reddit**: OAuth 2.0
- **YouTube**: Google OAuth 2.0
- **Mastodon**: Instance-specific OAuth
- **Telegram**: Bot authentication flow

#### 2. OAuth Callback
**Endpoint**: `/api/auth/social/{platform}/callback`
**Method**: GET
**Parameters**: `code`, `state`
**Action**: Exchange code for tokens, store in database

#### 3. Get Connections
**Endpoint**: `/api/profile/social-connections`
**Method**: GET
**Response**:
```json
{
  "connections": [
    {
      "platform": "x",
      "username": "username",
      "connected_at": 1704240000,
      "last_synced": 1704240000
    }
  ]
}
```

#### 4. Disconnect
**Endpoint**: `/api/profile/social-connections/{platform}`
**Method**: DELETE
**Action**: Revoke tokens, delete from database

---

### OAuth Configuration

**Environment Variables Needed**:

```bash
# X/Twitter
TWITTER_CLIENT_ID=<your-client-id>
TWITTER_CLIENT_SECRET=<your-client-secret>
TWITTER_REDIRECT_URI=http://localhost:3000/api/auth/social/x/callback

# Telegram
TELEGRAM_BOT_TOKEN=<your-bot-token>
TELEGRAM_BOT_USERNAME=<your-bot-username>

# Reddit
REDDIT_CLIENT_ID=<your-client-id>
REDDIT_CLIENT_SECRET=<your-client-secret>
REDDIT_REDIRECT_URI=http://localhost:3000/api/auth/social/reddit/callback

# YouTube (Google)
GOOGLE_CLIENT_ID=<your-client-id>
GOOGLE_CLIENT_SECRET=<your-client-secret>
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/social/youtube/callback

# Mastodon (instance-specific)
MASTODON_INSTANCE=mastodon.social
MASTODON_CLIENT_ID=<your-client-id>
MASTODON_CLIENT_SECRET=<your-client-secret>
```

---

### X/Twitter Integration (Primary Focus)

#### OAuth 2.0 Flow

1. **Initiate**: Redirect to `https://twitter.com/i/oauth2/authorize`
   ```typescript
   const authUrl = new URL('https://twitter.com/i/oauth2/authorize')
   authUrl.searchParams.set('response_type', 'code')
   authUrl.searchParams.set('client_id', process.env.TWITTER_CLIENT_ID!)
   authUrl.searchParams.set('redirect_uri', process.env.TWITTER_REDIRECT_URI!)
   authUrl.searchParams.set('scope', 'tweet.read users.read offline.access')
   authUrl.searchParams.set('state', generateState())
   authUrl.searchParams.set('code_challenge', codeChallenge)
   authUrl.searchParams.set('code_challenge_method', 'S256')
   ```

2. **Callback**: Exchange code for access token
   ```typescript
   const tokenResponse = await fetch('https://api.twitter.com/2/oauth2/token', {
     method: 'POST',
     headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
     body: new URLSearchParams({
       code,
       grant_type: 'authorization_code',
       client_id: process.env.TWITTER_CLIENT_ID!,
       redirect_uri: process.env.TWITTER_REDIRECT_URI!,
       code_verifier,
     })
   })
   ```

3. **Store Tokens**: Save access_token, refresh_token, expires_at

#### Twitter API v2 Capabilities

**Scopes Required**:
- `tweet.read` - Read tweets, threads
- `users.read` - Read user profile
- `offline.access` - Refresh tokens

**API Endpoints to Use**:
```typescript
// Get user's tweets
GET https://api.twitter.com/2/users/:id/tweets

// Get thread (conversation)
GET https://api.twitter.com/2/tweets/:id?expansions=referenced_tweets

// Get user timeline
GET https://api.twitter.com/2/users/:id/timelines/reverse_chronological

// Search tweets
GET https://api.twitter.com/2/tweets/search/recent?query={query}
```

---

## 🎯 Phase 3: Intelligence Tools (FUTURE)

### Tool: Fetch X Thread

**File**: `packages/web/lib/tools/x-thread-fetcher.ts`

```typescript
export async function fetchXThread(tweetId: string, userId: string): Promise<Thread> {
  // 1. Get user's X connection from database
  const connection = await getSocialConnection(userId, 'x')
  if (!connection) throw new Error('X not connected')

  // 2. Fetch thread using Twitter API
  const response = await fetch(
    `https://api.twitter.com/2/tweets/${tweetId}?expansions=referenced_tweets&tweet.fields=text,created_at,author_id`,
    {
      headers: {
        'Authorization': `Bearer ${connection.access_token}`,
      }
    }
  )

  // 3. Parse thread structure
  const data = await response.json()
  const thread = buildThreadFromTweets(data)

  // 4. Return structured thread
  return {
    id: tweetId,
    author: thread.author,
    tweets: thread.tweets,
    created_at: thread.created_at,
  }
}
```

### Tool: Analyze X Video

**File**: `packages/web/lib/tools/x-video-analyzer.ts`

```typescript
export async function analyzeXVideo(tweetId: string, userId: string): Promise<VideoAnalysis> {
  // 1. Fetch tweet with video metadata
  const tweet = await fetchTweet(tweetId, userId)

  // 2. Extract video URL
  const videoUrl = tweet.entities.media?.find(m => m.type === 'video')?.url
  if (!videoUrl) throw new Error('No video found')

  // 3. Download video or get streaming URL
  const videoData = await fetchVideo(videoUrl)

  // 4. Extract audio transcript (if available)
  const transcript = await extractAudioTranscript(videoData)

  // 5. Analyze video frames (optional - for visual content)
  const visualAnalysis = await analyzeVideoFrames(videoData)

  return {
    tweetId,
    videoUrl,
    transcript,
    visualAnalysis,
    duration: videoData.duration,
  }
}
```

### Integration with Query System

**File**: `packages/web/app/api/simple-query/route.ts`

Add context from connected social accounts:

```typescript
// In query processing
if (user.social_connections?.find(c => c.platform === 'x')) {
  // Check if query mentions X/Twitter content
  if (query.includes('thread') || query.includes('tweet') || query.match(/twitter\.com|x\.com/)) {
    const tweetId = extractTweetId(query)
    if (tweetId) {
      const thread = await fetchXThread(tweetId, userId)
      additionalContext.xThread = thread
    }
  }
}
```

---

## 📊 Use Cases

### 1. Thread Analysis
**User Query**: "Analyze this thread: https://x.com/user/status/123456789"

**AkhAI Response**:
- Fetches full thread via Twitter API
- Reads all replies in chronological order
- Extracts key arguments, evidence, counterpoints
- Provides structured summary with insights

### 2. Video Understanding
**User Query**: "What's in this video? https://x.com/user/status/987654321"

**AkhAI Response**:
- Fetches tweet with video
- Extracts video transcript (if available)
- Analyzes visual frames (with vision model)
- Summarizes video content, key points, speakers

### 3. Contextual Social Intelligence
**User Query**: "What are people saying about AI safety?"

**AkhAI Response** (with X connected):
- Searches user's timeline/following for AI safety discussions
- Identifies trending threads, influential voices
- Summarizes diverse perspectives
- Highlights novel arguments or research

---

## 🔐 Security & Privacy

### Data Storage
- **Tokens encrypted** at rest in database
- **Refresh tokens** used to renew access (never re-prompt user)
- **Expiry tracking** - automatic token refresh before expiration

### User Control
- **Full visibility** - see all connected accounts in settings
- **One-click disconnect** - revoke tokens immediately
- **Data deletion** - removing connection deletes all stored tokens

### API Rate Limits
- **Twitter**: 500K tweets/month (free tier), 2M+ (paid)
- **Reddit**: 60 requests/minute per OAuth app
- **YouTube**: 10K quota units/day
- **GitHub**: 5K requests/hour (authenticated)

### Compliance
- **GDPR**: User data export/deletion on request
- **Platform ToS**: Respect each platform's API terms
- **Secure storage**: Encrypted tokens, HTTPS only

---

## 🚀 Implementation Roadmap

### Immediate (Phase 2 - Week 1) ✅ COMPLETE
- [x] UI for social connectors (DONE)
- [x] Database schema migration (DONE)
- [x] X/Twitter OAuth implementation (DONE)
- [x] Store/retrieve connection tokens (DONE)
- [x] Basic X thread fetcher (DONE)
- [x] Connect/disconnect UI handlers (DONE)
- [x] OAuth success/error notifications (DONE)

### Short-term (Phase 3 - Week 2-3)
- [ ] X video analysis tool
- [ ] Telegram bot authentication
- [ ] Reddit OAuth implementation
- [ ] Integrate social context into queries
- [ ] Test with real user accounts

### Medium-term (Phase 4 - Month 1-2)
- [ ] YouTube OAuth implementation
- [ ] Mastodon instance selector
- [ ] Advanced thread analysis (sentiment, key players)
- [ ] Video transcription service
- [ ] Social graph analysis

### Long-term (Phase 5 - Month 3+)
- [ ] Real-time social feed monitoring
- [ ] Automatic content ingestion
- [ ] Social intelligence dashboard
- [ ] Trend detection algorithms
- [ ] Influencer identification

---

## 📝 Testing Plan

### Manual Testing
1. Connect X account → verify OAuth flow
2. Disconnect X account → verify token revocation
3. Submit query with X thread link → verify thread fetching
4. Submit query with X video → verify video analysis
5. Test token refresh → verify automatic renewal

### Unit Tests
```typescript
// Test OAuth flow
test('X OAuth initiation redirects to Twitter', async () => {
  const response = await fetch('/api/auth/social/x/connect')
  expect(response.status).toBe(302)
  expect(response.headers.get('location')).toContain('twitter.com/i/oauth2/authorize')
})

// Test token storage
test('OAuth callback stores tokens', async () => {
  const response = await fetch('/api/auth/social/x/callback?code=testcode&state=teststate')
  const connection = await getSocialConnection(userId, 'x')
  expect(connection).toBeDefined()
  expect(connection.access_token).toBeTruthy()
})
```

---

## 🎯 Success Metrics

**Adoption**:
- % of users with ≥1 social connection
- Most popular platform (likely X/Twitter)
- Average connections per user

**Usage**:
- Queries with social context (thread links, etc.)
- API calls to social platforms per day
- Token refresh success rate

**Quality**:
- User satisfaction with thread analysis
- Accuracy of video transcriptions
- Relevance of social intelligence

---

**Status**: 🚧 UI Complete, Backend Pending

**Next Steps**: Implement X/Twitter OAuth flow + thread fetcher

**Built by Algoq • Sovereign AI • Social Intelligence Integration**
