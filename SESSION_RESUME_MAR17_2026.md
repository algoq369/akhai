# AkhAI Session Resume — March 17, 2026
## Day 43/150 — WalletConnect Fix + VPS Deploy

---

## WHAT WAS FIXED TODAY

### 1. WalletConnect / Reown AppKit — Full Fix
**Root cause chain:**
- CSP (`next.config.js`) was blocking all WalletConnect/Reown domains
- `better-sqlite3` binary was compiled against wrong Node version (v137 vs v127)
- `wallet/route.ts` was importing `auth.ts` which loaded the DB at module init → 500 on every request
- `AuthModal.tsx` was using `window.ethereum` (Brave's wallet) instead of AppKit's provider → "Signing failed"
- Logout was not calling `disconnect()` → wallet stayed connected after logout

**Files changed:**
- `packages/web/next.config.js` — CSP rewritten with full WalletConnect/Reown allowlist
- `packages/web/components/Web3Provider.tsx` — added compact theme variables
- `packages/web/components/AuthModal.tsx` — full rewrite: compact UI + `useAppKitProvider('eip155')` + ethers `BrowserProvider`
- `packages/web/components/ProfileMenu.tsx` — added `useDisconnect()` on logout
- `packages/web/components/UserProfile.tsx` — added `useDisconnect()` on logout
- `packages/web/app/api/auth/wallet/route.ts` — decoupled from DB import (inlined pure fn)

### 2. better-sqlite3 Rebuild
```bash
cd /Users/sheirraza/akhai/node_modules/.pnpm/better-sqlite3@12.6.2/node_modules/better-sqlite3
rm -rf build
npx node-gyp rebuild
# Output: gyp info ok ✅
```

---

## CURRENT CSP (next.config.js lines 70-79)
Both dev and prod now include:
- `wss://*.walletconnect.com`, `wss://*.walletconnect.org`, `wss://*.reown.com`
- `https://*.walletconnect.com`, `https://*.walletconnect.org`, `https://*.reown.com`
- `https://*.web3modal.com`, `https://*.web3modal.org`
- `frame-src`: `verify.walletconnect.com`, `verify.walletconnect.org`, `*.reown.com`
- `img-src blob:`, `font-src blob:`

---

## VPS — FRESH, NOT YET DEPLOYED

**FlokiNET Iceland VPS I** (ordered March 16, 2026)
- IP: `82.221.101.3`
- Hostname: `akhai.sovereign`
- SSH user: `akhai` (NOT root — FlokiNET blocks root login)
- OS: Ubuntu 24.04

**Status: Fresh server, nothing installed yet.**

### Step 1 — First-time VPS setup (run ONCE):
```bash
ssh akhai@82.221.101.3

# Inside VPS:
touch ~/.hushlogin
mkdir -p ~/app/packages/web/data
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo bash -
sudo apt-get install -y nodejs git
sudo npm install -g pnpm pm2
node -v && pnpm -v && pm2 -v
exit
```

### Step 2 — Copy env to VPS:
```bash
scp /Users/sheirraza/akhai/packages/web/.env.local akhai@82.221.101.3:~/app/packages/web/.env.local
```

### Step 3 — Deploy:
```bash
cd /Users/sheirraza/akhai
./deploy/deploy.sh 82.221.101.3 akhai.app
```

### Step 4 — Verify:
```bash
ssh akhai@82.221.101.3 "pm2 status"
curl -s -o /dev/null -w "%{http_code}" http://82.221.101.3:3000
# Expected: 200
```

### Step 5 — Point DNS:
Add A record: `akhai.app` → `82.221.101.3`

---

## ENV VARS (packages/web/.env.local)
```
ANTHROPIC_API_KEY=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
OPENROUTER_API_KEY=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
NEXT_PUBLIC_POSTHOG_HOST=https://eu.i.posthog.com
NEXT_PUBLIC_POSTHOG_KEY=phc_1iY2IWgmVRG2mJ0UdfAg0MqeJTNWjSKcL1TrV3TNjsR
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=87e52e87cec98e1956c14088e16e232d
```

---

## LOCAL DEV COMMANDS

```bash
# Start dev server (standard)
lsof -ti:3000 | xargs kill -9 2>/dev/null; sleep 2 && cd /Users/sheirraza/akhai/packages/web && NODE_ENV=development npx next dev --turbopack -p 3000 2>&1 &

# Clear cache + restart (when CSP or config changes)
lsof -ti:3000 | xargs kill -9 2>/dev/null
rm -rf /Users/sheirraza/akhai/packages/web/.next
sleep 2 && cd /Users/sheirraza/akhai/packages/web && NODE_ENV=development npx next dev --turbopack -p 3000 2>&1 &

# Hard refresh browser after config changes
# Cmd+Shift+R in Brave

# Rebuild better-sqlite3 after Node update
cd /Users/sheirraza/akhai/node_modules/.pnpm/better-sqlite3@12.6.2/node_modules/better-sqlite3
rm -rf build && npx node-gyp rebuild
```

---

## WALLET CONNECT FLOW — WORKING STATE
1. Click "Connect Web3 Wallet" → AppKit modal opens ✅
2. Wallet list shows with icons (Trust, MetaMask, Zerion, etc.) ✅
3. QR code generates for WalletConnect ✅
4. Select wallet → connects → sign message screen ✅
5. Sign → `POST /api/auth/wallet/verify` → session created ✅
6. Logout → `disconnect()` called → wallet session cleared ✅

**Known: Brave Shields must be OFF for localhost for `pulse.walletconnect.org`**

---

## REOWN PROJECT
- Dashboard: `dashboard.reown.com`
- Project: `akhai` (team: akhai)
- Project ID: `87e52e87cec98e1956c14088e16e232d`
- Domain allowlisted: `https://akhai.app` ✅

---

## NEXT SESSION PRIORITIES
1. **VPS Setup + Deploy** (SSH as `akhai@82.221.101.3`, run setup steps above)
2. **DNS** — point `akhai.app` A record → `82.221.101.3`
3. **Test production** — `https://akhai.app` wallet flow end-to-end
4. **DDG search fix** (was pending before wallet work)
5. **Depth annotations UI** (was pending before wallet work)
