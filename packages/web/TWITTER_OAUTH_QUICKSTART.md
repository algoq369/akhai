# Twitter OAuth Quick Start Guide

**5-Minute Setup & Test**

---

## 📋 Prerequisites

1. Twitter/X account
2. Twitter Developer Account ([Apply here](https://developer.twitter.com/en/portal/petition/essential/basic-info))
3. Node.js and pnpm installed
4. AkhAI running locally

---

## 🚀 Setup Steps

### 1. Create Twitter App (2 minutes)

1. Go to [Twitter Developer Portal](https://developer.twitter.com/en/portal/dashboard)
2. Click "Create Project" or use existing project
3. Create a new App
4. Navigate to App Settings → "User authentication settings"
5. Click "Set up"

**Configure OAuth 2.0**:
- App permissions: Read
- Type of App: Web App
- App info:
  - Callback URI: `http://localhost:3000/api/auth/social/x/callback`
  - Website URL: `http://localhost:3000`
  - Organization name: Your name
  - Privacy policy URL: (optional)
  - Terms of service: (optional)

6. Click "Save"
7. Copy **Client ID** and **Client Secret** (save these!)

### 2. Configure Environment (1 minute)

Add to `packages/web/.env.local`:

```bash
# Twitter OAuth 2.0
TWITTER_CLIENT_ID=<paste-your-client-id>
TWITTER_CLIENT_SECRET=<paste-your-client-secret>
TWITTER_REDIRECT_URI=http://localhost:3000/api/auth/social/x/callback
```

### 3. Start Dev Server (30 seconds)

```bash
cd packages/web
pnpm dev
```

Server should start at: http://localhost:3000

---

## ✅ Testing the OAuth Flow

### Test 1: Connect Twitter Account

1. **Navigate to Profile**:
   - Go to http://localhost:3000
   - Login (GitHub or Wallet)
   - Click profile icon or go to http://localhost:3000/profile

2. **Go to Settings Tab**:
   - Click "Settings" tab
   - Scroll to "▸ SOCIAL CONNECTORS" section

3. **Connect X/Twitter**:
   - Find "X (Twitter)" row
   - Should show "Not connected"
   - Click "● connect" button

4. **Authorize on Twitter**:
   - Redirects to Twitter OAuth page
   - Shows app name and permissions
   - Click "Authorize app"

5. **Verify Success**:
   - Redirects back to profile
   - Green success banner: "Successfully connected X account: @yourname"
   - X (Twitter) row now shows "@yourname"
   - Button changes to "○ disconnect"

### Test 2: Disconnect Twitter Account

1. **Click Disconnect**:
   - In Settings tab, find X (Twitter) row
   - Click "○ disconnect" button

2. **Confirm**:
   - Confirmation dialog: "Are you sure you want to disconnect your X account?"
   - Click "OK"

3. **Verify Success**:
   - Green success banner: "Successfully disconnected X account"
   - X (Twitter) row shows "Not connected"
   - Button changes to "● connect"

### Test 3: Verify Database

```bash
# Check social connections in database
sqlite3 packages/web/data/akhai.db "SELECT * FROM social_connections;"

# Should show your connection (if connected):
# id|user_id|platform|username|user_external_id|access_token|refresh_token|expires_at|connected_at|last_synced|metadata
```

### Test 4: Test Thread Fetcher (Advanced)

Create a test page: `packages/web/app/test-twitter/page.tsx`

```typescript
'use client'

import { useState } from 'react'
import { extractTweetId, fetchXThread } from '@/lib/tools/x-thread-fetcher'

export default function TestTwitterPage() {
  const [url, setUrl] = useState('')
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState('')

  const handleFetch = async () => {
    setError('')
    setResult(null)

    const tweetId = extractTweetId(url)
    if (!tweetId) {
      setError('Invalid Twitter URL')
      return
    }

    try {
      // Replace 'user-id-here' with actual user ID from session
      const thread = await fetchXThread(tweetId, 'user-id-here')
      setResult(thread)
    } catch (err: any) {
      setError(err.message)
    }
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl mb-4">Test Twitter Thread Fetcher</h1>

      <input
        type="text"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="https://x.com/user/status/123456789"
        className="border p-2 w-full mb-4"
      />

      <button
        onClick={handleFetch}
        className="px-4 py-2 bg-blue-500 text-white rounded"
      >
        Fetch Thread
      </button>

      {error && (
        <div className="mt-4 p-4 bg-red-100 text-red-700">
          Error: {error}
        </div>
      )}

      {result && (
        <pre className="mt-4 p-4 bg-gray-100 overflow-auto">
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </div>
  )
}
```

Visit: http://localhost:3000/test-twitter

---

## 🐛 Troubleshooting

### "Twitter OAuth not configured"

**Cause**: Missing environment variables
**Fix**:
1. Check `.env.local` has `TWITTER_CLIENT_ID` and `TWITTER_CLIENT_SECRET`
2. Restart dev server: `pnpm dev`
3. No quotes around values

### "Invalid or expired state parameter"

**Cause**: Server restarted between connect and callback
**Fix**:
- Keep server running during OAuth flow
- Don't restart server while testing
- Complete flow within 10 minutes

### "Failed to get access token from Twitter"

**Cause**: Incorrect credentials or callback URL mismatch
**Fix**:
1. Verify Client ID and Secret are correct
2. Check callback URL in Twitter app settings matches exactly:
   `http://localhost:3000/api/auth/social/x/callback`
3. No trailing slashes
4. Check for typos

### "X account not connected" (Thread Fetcher)

**Cause**: User hasn't connected Twitter account
**Fix**:
1. Complete Test 1 first (Connect Twitter Account)
2. Verify connection exists in database
3. Check user ID matches

### Callback redirects to wrong URL

**Cause**: Twitter app has wrong callback URL
**Fix**:
1. Go to Twitter Developer Portal
2. App Settings → User authentication settings → Edit
3. Update Callback URI to exact URL:
   `http://localhost:3000/api/auth/social/x/callback`
4. Save and try again

---

## 📊 Success Checklist

- [ ] Twitter Developer account created
- [ ] Twitter app created and configured
- [ ] OAuth 2.0 enabled with correct callback URL
- [ ] Client ID and Secret added to .env.local
- [ ] Dev server restarted
- [ ] Can click "● connect" button
- [ ] Redirects to Twitter OAuth page
- [ ] Can authorize app on Twitter
- [ ] Redirects back to profile
- [ ] Green success banner appears
- [ ] Username (@yourname) displays
- [ ] Button changes to "○ disconnect"
- [ ] Can disconnect successfully
- [ ] Connection removed from database

---

## 🎯 What's Next?

After successful OAuth flow:

1. **Thread Analysis**: Integrate thread fetcher into query system
2. **Video Analysis**: Add media endpoint support
3. **Context Injection**: Use Twitter content in AI responses
4. **Token Refresh**: Implement automatic token renewal
5. **Encryption**: Encrypt tokens at rest

See `TWITTER_OAUTH_IMPLEMENTATION.md` for full implementation details.

---

## 📞 Support

**Issues**:
- Check browser console for errors
- Check server console for OAuth logs
- Verify Twitter app settings
- Check database with SQLite commands

**Documentation**:
- `TWITTER_OAUTH_IMPLEMENTATION.md` - Full technical details
- `SOCIAL_CONNECTORS_FEATURE.md` - Feature overview
- `.env.example` - Environment variable reference

---

**Built by Algoq • Sovereign AI • Social Intelligence Integration**
