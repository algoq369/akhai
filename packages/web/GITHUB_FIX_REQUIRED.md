# 🔴 URGENT: GitHub OAuth Fix Required

**Status:** Waiting for your manual action on GitHub.com

---

## The Problem

You're seeing the "Connect Account" modal stuck on "Redirecting..." because:

1. ✅ `.env.local` is now set to tunnel URL
2. ❌ GitHub OAuth app settings on github.com still have localhost:3000 only

GitHub **rejects** the redirect because the tunnel URL is not registered as an authorized callback URL.

---

## The Fix (2 Steps)

### Step 1: ✅ DONE - Code Updated

I've updated `.env.local`:
```env
GITHUB_REDIRECT_URI=https://movie-duncan-lots-victor.trycloudflare.com/api/auth/github/callback
```

### Step 2: ⚠️ YOU MUST DO THIS - Update GitHub Settings

**Go to GitHub Developer Settings:**
1. Visit: https://github.com/settings/developers
2. Click "OAuth Apps" tab
3. Find your app with Client ID: `Ov23liKphqDS8Yz9F5Np`
4. Click on the app to edit it

**Update "Authorization callback URL":**

Current setting (on github.com):
```
http://localhost:3000/api/auth/github/callback
```

**CHANGE TO (both URLs, one per line):**
```
http://localhost:3000/api/auth/github/callback
https://movie-duncan-lots-victor.trycloudflare.com/api/auth/github/callback
```

**NOTE:** GitHub allows multiple callback URLs - add both so it works on localhost AND tunnel.

5. Click "Update application" button at bottom

---

## After You Update GitHub

1. Restart dev server (if not already running):
   ```bash
   cd /Users/sheirraza/akhai/packages/web
   pnpm dev
   ```

2. Visit tunnel URL:
   ```
   https://movie-duncan-lots-victor.trycloudflare.com
   ```

3. Click "create profile" → "Continue with GitHub"

4. Should now redirect to GitHub and back successfully ✅

---

## Why This Happens

GitHub OAuth requires **exact matching** of redirect URIs for security:

```
User's Browser Location          GitHub Redirect URI           Result
localhost:3000                 →  localhost:3000            →  ✅ Works
tunnel URL                     →  localhost:3000            →  ❌ Fails (current)
tunnel URL                     →  tunnel URL                →  ✅ Works (after fix)
```

---

## Visual Guide

**On GitHub OAuth App Settings Page:**

```
Application name: [your app name]
Homepage URL: http://localhost:3000
Authorization callback URL:
  ┌─────────────────────────────────────────────────────────┐
  │ http://localhost:3000/api/auth/github/callback          │ ← Keep this
  │ https://movie-duncan-lots-victor.trycloudflare.com/... │ ← Add this
  └─────────────────────────────────────────────────────────┘
```

---

## Troubleshooting

**If it still doesn't work:**

1. **Hard refresh browser** (Cmd+Shift+R on Mac)
2. **Clear browser cache**
3. **Check GitHub settings** saved correctly
4. **Restart dev server**
5. **Check tunnel is still running**: `ps aux | grep cloudflared`

**If tunnel URL changed (restarted tunnel):**
- Get new URL from tunnel logs
- Update `.env.local` with new URL
- Update GitHub OAuth app settings with new URL
- Restart dev server

---

## When to Use Localhost vs Tunnel

**Use localhost for GitHub login:**
- `.env.local`: `GITHUB_REDIRECT_URI=http://localhost:3000/api/auth/github/callback`
- Visit: `http://localhost:3000`
- Works immediately (already registered on GitHub)

**Use tunnel for GitHub login:**
- `.env.local`: `GITHUB_REDIRECT_URI=https://[tunnel].trycloudflare.com/api/auth/github/callback`
- Visit: `https://[tunnel].trycloudflare.com`
- **Requires manual GitHub settings update** (see Step 2 above)

---

## Current Status

✅ Code configured for tunnel URL
⏳ Waiting for you to update GitHub OAuth app settings
❌ GitHub login won't work until you complete Step 2

---

**Next Action:** Visit https://github.com/settings/developers and add the tunnel URL to your OAuth app.
