# GitHub OAuth Redirect URI Setup

**Issue**: GitHub shows "redirect_uri is not associated with this application"

**Cause**: The redirect URI must be registered in BOTH places:
1. Your `.env.local` file
2. GitHub OAuth app settings on github.com

---

## Current Configuration

**GitHub OAuth App Settings** (on github.com):
- Registered callback: `http://localhost:3000/api/auth/github/callback`

**Your .env.local**:
- Now set to: `http://localhost:3000/api/auth/github/callback` ✅

**Result**: GitHub login works on localhost, not on tunnel

---

## How to Enable GitHub Login via Tunnel

### Step 1: Go to GitHub Developer Settings

Visit: https://github.com/settings/developers

### Step 2: Find Your OAuth App

Look for an app with:
- **Client ID**: `Ov23liKphqDS8Yz9F5Np`
- **Name**: (whatever you named it - probably "akhai" or similar)

### Step 3: Click the App to Edit Settings

### Step 4: Update Authorization Callback URL

**Current**: `http://localhost:3000/api/auth/github/callback`

**Add** (keep localhost AND add tunnel):
```
http://localhost:3000/api/auth/github/callback
https://movie-duncan-lots-victor.trycloudflare.com/api/auth/github/callback
```

**Note**: GitHub allows multiple callback URLs (one per line)

### Step 5: Save Changes

Click "Update application" button

### Step 6: Update .env.local Again

```bash
# Use tunnel URL for development
GITHUB_REDIRECT_URI=https://movie-duncan-lots-victor.trycloudflare.com/api/auth/github/callback
```

### Step 7: Restart Dev Server

The changes will take effect after restart.

---

## Alternative: Keep it Simple (Recommended)

**For development**, just use localhost:

1. **Keep** `GITHUB_REDIRECT_URI=http://localhost:3000/api/auth/github/callback`
2. **Test GitHub login** by visiting `http://localhost:3000` (not tunnel)
3. **Use tunnel** for everything else (history, chat, crypto payments)

**For production** (when deploying to Porkbun):

1. **Update GitHub OAuth app** with production domain:
   ```
   https://yourdomain.com/api/auth/github/callback
   ```
2. **Update .env** with production domain
3. **Deploy** - GitHub login will work

---

## Why This Happens

### Security Feature

GitHub validates redirect URIs to prevent OAuth hijacking:

```
User clicks "Login with GitHub"
         ↓
Redirects to GitHub with redirect_uri parameter
         ↓
GitHub checks: "Is this redirect_uri registered?"
         ↓
If NO → Shows error "redirect_uri is not associated"
If YES → Proceeds with OAuth flow
```

### The Fix

**Must register ALL redirect URIs** you plan to use:
- Development: `http://localhost:3000/api/auth/github/callback`
- Tunnel: `https://xxx.trycloudflare.com/api/auth/github/callback`
- Production: `https://yourdomain.com/api/auth/github/callback`

---

## Current Status

✅ **Localhost**: GitHub login works
❌ **Tunnel**: GitHub login disabled (redirect URI not registered)
✅ **All other features**: Work on both localhost and tunnel

---

## For Production Deployment

When you deploy to Porkbun domain:

### 1. Register Production URL in GitHub

```
https://akhai.com/api/auth/github/callback
```
(or whatever your domain is)

### 2. Update Environment Variables

```env
GITHUB_REDIRECT_URI=https://akhai.com/api/auth/github/callback
NEXT_PUBLIC_APP_URL=https://akhai.com
```

### 3. Deploy Application

All features including GitHub login will work.

---

## Summary

**Current Setup** (after fix):
- `.env.local` → `localhost:3000` ✅
- GitHub OAuth app → `localhost:3000` ✅
- **GitHub login works locally** ✅

**To enable tunnel login** (optional):
1. Add tunnel URL to GitHub OAuth app settings
2. Update `.env.local` to use tunnel URL
3. Restart dev server

**For production** (later):
1. Add production domain to GitHub OAuth app
2. Update `.env` with production domain
3. Deploy

---

**Recommendation**: Keep localhost for now, deploy to production domain when ready.
