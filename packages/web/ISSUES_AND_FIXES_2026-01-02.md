# AkhAI - Issues & Fixes Plan

**Date**: January 2, 2026
**Analysis**: Local website inspection
**Status**: Ready for fixes

---

## 🔍 Identified Issues

### 🔴 CRITICAL (Blocking OAuth Flow)

#### 1. PKCE Store Lost on Server Restart
**Issue**: In-memory Map for PKCE verifiers gets cleared when dev server restarts
**Location**: `lib/auth.ts:162`
**Impact**: OAuth fails if server restarts between "connect" click and Twitter callback
**Current Code**:
```typescript
const pkceStore = new Map<string, { verifier: string; userId: string; timestamp: number }>();
```

**Problem Flow**:
1. User clicks "connect" → verifier stored in Map
2. Dev server restarts (auto-reload)
3. User authorizes on Twitter → callback fails (verifier not found)
4. Error: "Invalid or expired state parameter"

**Fix Options**:
- **Option A** (Quick): Store in database with TTL
- **Option B** (Better): Use Redis for production
- **Option C** (Dev-friendly): Store in file system with timestamps

**Recommended Fix**: Option A - Database with cleanup

---

#### 2. Missing Error Handling for Failed Token Exchange
**Issue**: No retry mechanism if Twitter API fails
**Location**: `lib/auth.ts:239-258`
**Impact**: Transient network errors cause complete OAuth failure
**Current Code**:
```typescript
const tokenResponse = await fetch('https://api.twitter.com/2/oauth2/token', { ... })
const tokenData = await tokenResponse.json()

if (!tokenData.access_token) {
  return { success: false, error: 'Failed to get access token from Twitter' }
}
```

**Missing**:
- HTTP status code checking
- Detailed error messages from Twitter
- Retry logic for 5xx errors
- Rate limit handling

**Recommended Fix**: Add error handling wrapper

---

#### 3. Tab Parameter Not Set on OAuth Redirect
**Issue**: After successful OAuth, user redirected to `/profile` but Settings tab not selected
**Location**: `app/api/auth/social/x/callback/route.ts:40-41`
**Impact**: User doesn't see their new connection immediately
**Current Code**:
```typescript
return NextResponse.redirect(
  new URL(`/profile?connected=x&username=${encodeURIComponent(result.username || '')}`, request.url)
)
```

**Fix**: Add `tab=settings` parameter
```typescript
return NextResponse.redirect(
  new URL(`/profile?tab=settings&connected=x&username=${encodeURIComponent(result.username || '')}`, request.url)
)
```

---

### 🟡 HIGH (User Experience Issues)

#### 4. No Loading State on Connect Button
**Issue**: Button doesn't show loading state while redirecting to Twitter
**Location**: `app/profile/page.tsx:802-809`
**Impact**: User doesn't know if click registered
**Current**: Immediate redirect, no feedback

**Fix**: Add loading spinner
```typescript
const [connecting, setConnecting] = useState(false)

const handleConnectSocial = async (platform) => {
  setConnecting(true)
  try {
    const response = await fetch('/api/auth/social/x/connect')
    const data = await response.json()
    window.location.href = data.authUrl
  } catch (error) {
    setConnecting(false)
    // show error
  }
}
```

---

#### 5. OAuth Success Message Auto-Dismisses Too Fast
**Issue**: Success notification disappears after 5 seconds
**Location**: `app/profile/page.tsx:75`
**Impact**: Users miss confirmation
**Current**: 5 second timeout

**Fix**: Increase to 10 seconds or add manual dismiss only

---

#### 6. No Confirmation Before Disconnect
**Issue**: Browser default confirm() dialog is ugly
**Location**: `app/profile/page.tsx:208`
**Impact**: Poor UX, not consistent with app design
**Current**:
```typescript
if (!confirm(`Are you sure you want to disconnect your ${platform.toUpperCase()} account?`)) {
  return
}
```

**Fix**: Create custom modal component with Code Relic styling

---

#### 7. Profile Page Doesn't Refetch After OAuth
**Issue**: After OAuth callback, social connections not immediately visible
**Location**: `app/profile/page.tsx:85-136`
**Impact**: User has to manually refresh to see connection
**Current**: Data loaded only on mount

**Fix**: Add effect to refetch when URL params change
```typescript
useEffect(() => {
  const params = new URLSearchParams(window.location.search)
  if (params.get('connected')) {
    // Refetch user data
    loadProfile()
  }
}, [])
```

---

### 🟢 MEDIUM (Code Quality Issues)

#### 8. Browser Extension Conflicts (Console Errors)
**Issue**: Trust Wallet and other wallet extensions causing console noise
**Evidence from screenshot**:
- "Failed to set window.ethereum"
- "Injection blocked for this domain"
- "message handler took" violations

**Impact**: Clutters console, makes debugging harder
**Fix**: Not fixable on our end (third-party extensions)
**Workaround**: Add CSP headers to prevent injection

---

#### 9. Hardcoded Localhost URLs
**Issue**: Localhost hardcoded in multiple places
**Locations**:
- `.env.local` (correct)
- Code has `baseUrl` logic (correct)
- Twitter app settings (user's responsibility)

**Impact**: Production deployment will require changes
**Fix**: Already handled via environment variables ✅

---

#### 10. No Token Encryption at Rest
**Issue**: Access tokens stored as plaintext in SQLite
**Location**: `lib/database.ts:710-744`
**Impact**: Security risk if database compromised
**Severity**: High for production, low for development

**Fix**: Encrypt tokens before storing
```typescript
import crypto from 'crypto'

const SECRET_KEY = process.env.TOKEN_ENCRYPTION_KEY!
const algorithm = 'aes-256-gcm'

function encryptToken(token: string): string {
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipheriv(algorithm, SECRET_KEY, iv)
  const encrypted = Buffer.concat([cipher.update(token, 'utf8'), cipher.final()])
  const authTag = cipher.getAuthTag()
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`
}
```

---

#### 11. No Token Refresh Mechanism
**Issue**: Tokens expire, no automatic renewal
**Location**: `lib/auth.ts:224-300`
**Impact**: Users forced to reconnect manually
**Current**: Only checks `expires_at`, doesn't refresh

**Fix**: Add background job
```typescript
// Refresh tokens expiring in next 24 hours
async function refreshExpiredTokens() {
  const expiringTokens = db.prepare(`
    SELECT * FROM social_connections
    WHERE platform = 'x'
    AND expires_at < ? AND expires_at > 0
  `).all(Date.now() / 1000 + 86400)

  for (const conn of expiringTokens) {
    const newToken = await refreshTwitterToken(conn.refresh_token)
    saveSocialConnection({
      ...conn,
      access_token: newToken.access_token,
      expires_at: Date.now() / 1000 + newToken.expires_in
    })
  }
}
```

---

#### 12. Missing Input Validation
**Issue**: No validation on OAuth callback parameters
**Location**: `app/api/auth/social/x/callback/route.ts:10-28`
**Impact**: Could crash on malformed input
**Current**: Basic null checks only

**Fix**: Add validation
```typescript
import { z } from 'zod'

const CallbackSchema = z.object({
  code: z.string().min(1),
  state: z.string().length(32), // 16 bytes hex = 32 chars
})
```

---

### 🔵 LOW (Nice to Have)

#### 13. Console Warnings from Rewrites
**Issue**: "[Rewrites] Screen name not found in path"
**Impact**: Console noise only, no functional issue
**Fix**: Configure next.config.js rewrites properly

---

#### 14. No Rate Limiting on OAuth Endpoints
**Issue**: No protection against OAuth spam
**Location**: All `/api/auth/social/*` endpoints
**Impact**: Could be abused
**Fix**: Add rate limiting middleware

---

#### 15. Missing Analytics for OAuth Flow
**Issue**: No tracking of OAuth success/failure rates
**Impact**: Can't diagnose user issues
**Fix**: Add PostHog events
```typescript
posthog.capture('oauth_initiated', { platform: 'x' })
posthog.capture('oauth_completed', { platform: 'x', success: true })
```

---

## 🛠️ Fix Plan

### Phase 1: Critical Fixes (Now)

**Priority 1** - Fix PKCE Store Issue:
- [ ] Create `pkce_verifiers` table in database
- [ ] Add TTL cleanup (delete > 10 min old)
- [ ] Update `getTwitterAuthUrl()` to use database
- [ ] Update `handleTwitterCallback()` to read from database
- [ ] Test OAuth flow with server restart

**Priority 2** - Fix OAuth Redirect:
- [ ] Add `tab=settings` to callback redirect URL
- [ ] Add profile refetch on URL param change
- [ ] Test end-to-end flow

**Priority 3** - Better Error Handling:
- [ ] Add HTTP status checking in token exchange
- [ ] Add detailed error logging
- [ ] Improve error messages shown to user

**Estimated Time**: 30 minutes

---

### Phase 2: User Experience (Next)

**Priority 4** - Loading States:
- [ ] Add loading state to connect button
- [ ] Add loading spinner component
- [ ] Disable button while connecting

**Priority 5** - Better Notifications:
- [ ] Increase timeout to 10 seconds
- [ ] Add close button to notification
- [ ] Make notification sticky until dismissed

**Priority 6** - Custom Confirmation Modal:
- [ ] Create modal component
- [ ] Style with Code Relic theme
- [ ] Replace browser confirm()

**Estimated Time**: 45 minutes

---

### Phase 3: Security & Quality (Later)

**Priority 7** - Token Encryption:
- [ ] Generate encryption key
- [ ] Create encrypt/decrypt functions
- [ ] Update saveSocialConnection()
- [ ] Update getSocialConnection()
- [ ] Migrate existing tokens

**Priority 8** - Token Refresh:
- [ ] Create refreshTwitterToken() function
- [ ] Add background job (cron or interval)
- [ ] Test token refresh flow

**Priority 9** - Input Validation:
- [ ] Add Zod schema
- [ ] Validate callback params
- [ ] Validate disconnect params

**Estimated Time**: 1-2 hours

---

### Phase 4: Polish (Future)

**Priority 10** - Analytics:
- [ ] Add OAuth events to PostHog
- [ ] Track success/failure rates
- [ ] Track most common errors

**Priority 11** - Rate Limiting:
- [ ] Add rate limit middleware
- [ ] Configure per-IP limits
- [ ] Add rate limit headers

**Estimated Time**: 30 minutes

---

## 🎯 Immediate Action Items

### Fix Right Now (5 minutes):

1. **Add tab parameter to callback**:
```typescript
// In app/api/auth/social/x/callback/route.ts:40
return NextResponse.redirect(
  new URL(`/profile?tab=settings&connected=x&username=${encodeURIComponent(result.username || '')}`, request.url)
)
```

2. **Add profile refetch on OAuth return**:
```typescript
// In app/profile/page.tsx after line 84
useEffect(() => {
  const params = new URLSearchParams(window.location.search)
  if (params.get('connected')) {
    loadProfile() // Refetch to show new connection
  }
}, [])
```

---

## 📊 Success Metrics

After fixes:
- [ ] OAuth flow completes 100% success rate
- [ ] No console errors from our code
- [ ] User sees connection immediately after OAuth
- [ ] Loading states show progress
- [ ] Proper error messages if OAuth fails
- [ ] Server restart doesn't break OAuth

---

## 🧪 Testing Checklist

After implementing fixes:
- [ ] Click connect → see loading spinner
- [ ] Authorize on Twitter → redirect to settings tab
- [ ] See success notification with username
- [ ] See @username in connection list
- [ ] Click disconnect → see custom modal
- [ ] Confirm disconnect → connection removed
- [ ] **Restart server mid-OAuth** → should still work
- [ ] Trigger error (invalid credentials) → see helpful message
- [ ] Wait 10 seconds → notification still visible

---

**Total Estimated Fix Time**: 3-4 hours for all phases
**Immediate Fixes**: 5 minutes
**Core Stability**: 30 minutes

---

**Built by Algoq • Sovereign AI • Zero Error Tolerance**
