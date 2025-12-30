# Cloudflare Tunnel Setup (Open-Source ngrok Alternative)

## Why Cloudflare Tunnel?

✅ **Free forever** - No paid plans needed
✅ **Open-source** - `cloudflared` is MIT licensed
✅ **Enterprise-grade** - Used by millions
✅ **Fast & Reliable** - Cloudflare's global network
✅ **HTTPS by default** - Automatic SSL certificates
✅ **No firewall config** - Works behind NAT/firewalls

**vs ngrok:**
- ❌ ngrok free tier has session limits
- ❌ ngrok changes URL on restart
- ✅ Cloudflare Tunnel keeps same URL forever

---

## Quick Start (5 minutes)

### 1. Install cloudflared

**macOS:**
```bash
brew install cloudflare/cloudflare/cloudflared
```

**Linux:**
```bash
wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
sudo dpkg -i cloudflared-linux-amd64.deb
```

**Docker:**
```bash
docker pull cloudflare/cloudflared:latest
```

---

### 2. Authenticate

```bash
cloudflared tunnel login
```

This opens browser → Login to Cloudflare (create free account if needed) → Select domain (or use Cloudflare's free subdomain)

---

### 3. Create Tunnel

```bash
# Create named tunnel
cloudflared tunnel create akhai-dev

# This generates:
# - Tunnel ID (save this!)
# - Credentials file: ~/.cloudflared/<uuid>.json
```

**Example output:**
```
Tunnel credentials written to /Users/you/.cloudflared/abc123-xyz789.json
Tunnel created with ID: abc123-xyz789-456def
Name: akhai-dev
```

---

### 4. Configure Tunnel

Create config file: `~/.cloudflared/config.yml`

```yaml
tunnel: akhai-dev  # Your tunnel name
credentials-file: /Users/sheirraza/.cloudflared/<uuid>.json

ingress:
  # Route 1: Next.js app (main site)
  - hostname: akhai.your-domain.com
    service: http://localhost:3001

  # Route 2: BTCPay Server
  - hostname: btcpay.your-domain.com
    service: http://localhost:14142

  # Catch-all (required)
  - service: http_status:404
```

**No domain yet? Use Cloudflare's free *.trycloudflare.com:**
```yaml
tunnel: akhai-dev
credentials-file: /Users/sheirraza/.cloudflared/<uuid>.json

ingress:
  - service: http://localhost:3001
```

---

### 5. Start Tunnel

**Permanent tunnel (with domain):**
```bash
# Route traffic
cloudflared tunnel route dns akhai-dev akhai.your-domain.com
cloudflared tunnel route dns akhai-dev btcpay.your-domain.com

# Start tunnel
cloudflared tunnel run akhai-dev
```

**Quick tunnel (no domain needed):**
```bash
cloudflared tunnel --url http://localhost:3001
```

**Output:**
```
Your quick Tunnel has been created! Visit it at:
https://abc-123-xyz.trycloudflare.com
```

Use this URL for webhooks!

---

## Full Setup for AkhAI + BTCPay

### Option A: Dual Tunnel (Separate URLs)

**Tunnel 1 - AkhAI App:**
```bash
# Terminal 1
cd /Users/sheirraza/akhai/packages/web
pnpm dev  # Starts on :3001

# Terminal 2
cloudflared tunnel --url http://localhost:3001
# URL: https://abc-123.trycloudflare.com
```

**Tunnel 2 - BTCPay Server:**
```bash
# Terminal 3
docker-compose -f docker-compose.btcpay.yml up -d

# Terminal 4
cloudflared tunnel --url http://localhost:14142
# URL: https://xyz-789.trycloudflare.com
```

**Environment Variables:**
```bash
# .env.local
NEXT_PUBLIC_APP_URL=https://abc-123.trycloudflare.com
BTCPAY_SERVER_URL=https://xyz-789.trycloudflare.com
```

---

### Option B: Single Tunnel (Path Routing)

**Config:** `~/.cloudflared/config.yml`
```yaml
tunnel: akhai-dev
credentials-file: /Users/sheirraza/.cloudflared/<uuid>.json

ingress:
  # BTCPay paths
  - hostname: your-url.trycloudflare.com
    path: ^/btcpay(/.*)?$
    service: http://localhost:14142

  # Main app (everything else)
  - hostname: your-url.trycloudflare.com
    service: http://localhost:3001

  - service: http_status:404
```

**Start:**
```bash
cloudflared tunnel run akhai-dev
```

---

## Production Setup (With Custom Domain)

**Prerequisites:**
- Domain managed by Cloudflare (free plan works)
- Domain: `akhai.ai` (example)

### 1. Add Domain to Cloudflare

1. Go to https://dash.cloudflare.com
2. Add Site → Enter `akhai.ai`
3. Follow DNS setup instructions
4. Wait for DNS propagation (~5 min)

### 2. Create Production Tunnel

```bash
cloudflared tunnel create akhai-prod
```

### 3. Configure Routes

**Config:** `~/.cloudflared/config.yml`
```yaml
tunnel: akhai-prod
credentials-file: /Users/sheirraza/.cloudflared/<uuid>.json

ingress:
  # Main site
  - hostname: akhai.ai
    service: http://localhost:3001

  # BTCPay Server
  - hostname: btcpay.akhai.ai
    service: http://localhost:14142

  # API only
  - hostname: api.akhai.ai
    service: http://localhost:3001

  - service: http_status:404
```

### 4. Create DNS Records

```bash
# Main site
cloudflared tunnel route dns akhai-prod akhai.ai

# BTCPay subdomain
cloudflared tunnel route dns akhai-prod btcpay.akhai.ai

# API subdomain
cloudflared tunnel route dns akhai-prod api.akhai.ai
```

### 5. Run as Service (Always On)

**macOS/Linux:**
```bash
# Install service
sudo cloudflared service install

# Start service
sudo systemctl start cloudflared

# Enable auto-start
sudo systemctl enable cloudflared

# Check status
sudo systemctl status cloudflared
```

**Docker (Production):**
```yaml
# docker-compose.tunnel.yml
version: "3"
services:
  cloudflared:
    image: cloudflare/cloudflared:latest
    container_name: cloudflared
    restart: unless-stopped
    command: tunnel --no-autoupdate run akhai-prod
    volumes:
      - ~/.cloudflared:/etc/cloudflared
    network_mode: host
```

---

## Webhook URLs

Once tunnel is running, use these for webhooks:

**NOWPayments IPN:**
```
https://your-url.trycloudflare.com/api/webhooks/crypto
```

**BTCPay Server Webhooks:**
```
https://your-url.trycloudflare.com/api/webhooks/btcpay
```

**Stripe Webhooks:**
```
https://your-url.trycloudflare.com/api/webhooks/stripe
```

---

## Other Open-Source Alternatives

### 1. localhost.run (Ultra Simple)

**No installation needed!**

```bash
# Terminal 1: Start app
pnpm dev

# Terminal 2: SSH tunnel
ssh -R 80:localhost:3001 nokey@localhost.run
```

**Output:**
```
https://abc123.localhost.run
```

**Pros:**
- ✅ Zero setup
- ✅ No account needed
- ✅ Works via SSH

**Cons:**
- ⚠️ URL changes on restart
- ⚠️ No custom domains
- ⚠️ Session limits

---

### 2. Tailscale Funnel (WireGuard-based)

```bash
# Install
brew install tailscale

# Setup
sudo tailscale up

# Expose service
tailscale funnel 3001
```

**Output:**
```
https://your-machine.tailnet.ts.net
```

**Pros:**
- ✅ P2P (peer-to-peer)
- ✅ Very secure
- ✅ Persistent URLs

**Cons:**
- ⚠️ Requires Tailscale account
- ⚠️ More complex

---

### 3. LocalTunnel (npm package)

```bash
npm install -g localtunnel

# Start tunnel
lt --port 3001 --subdomain akhai-dev
```

**Output:**
```
https://akhai-dev.loca.lt
```

**Pros:**
- ✅ Simple npm package
- ✅ Custom subdomains
- ✅ Open source

**Cons:**
- ⚠️ Less reliable than Cloudflare
- ⚠️ Rate limits

---

## Recommendation for AkhAI

**Development (NOW):**
```bash
# Ultra simple - no setup
ssh -R 80:localhost:3001 nokey@localhost.run
```

**Testing (THIS WEEK):**
```bash
# Cloudflare Tunnel - stable, free forever
cloudflared tunnel --url http://localhost:3001
```

**Production (LATER):**
```bash
# Cloudflare Tunnel with custom domain
cloudflared tunnel run akhai-prod  # With akhai.ai
```

---

## Troubleshooting

### Issue: "tunnel credentials not found"
```bash
# Check credentials path
ls ~/.cloudflared/

# Update config.yml with correct path
```

### Issue: "failed to connect to origin"
```bash
# Verify service is running
curl http://localhost:3001

# Check firewall
sudo ufw allow 3001  # Linux
```

### Issue: "DNS record already exists"
```bash
# Delete existing route
cloudflared tunnel route dns --delete akhai.ai

# Recreate
cloudflared tunnel route dns akhai-prod akhai.ai
```

---

## Security Notes

✅ **HTTPS Automatic** - Cloudflare provides SSL certificates
✅ **DDoS Protection** - Cloudflare's network protects your origin
✅ **No Port Forwarding** - No need to expose ports on router
✅ **Firewall Friendly** - Works behind corporate firewalls
✅ **Origin Protection** - Your real IP stays hidden

⚠️ **Important:** Rotate tunnel credentials regularly in production

---

## Summary

| Feature | localhost.run | LocalTunnel | Cloudflare Tunnel | ngrok |
|---------|--------------|-------------|-------------------|-------|
| Free | ✅ | ✅ | ✅ | ⚠️ Limited |
| Open Source | ✅ | ✅ | ✅ | ❌ |
| Custom Domain | ❌ | ⚠️ Subdomain | ✅ | 💰 Paid |
| Persistent URL | ❌ | ✅ | ✅ | 💰 Paid |
| Reliability | ⚠️ | ⚠️ | ✅✅✅ | ✅✅ |
| Setup Time | 0 min | 1 min | 5 min | 5 min |

**Winner:** Cloudflare Tunnel (free, reliable, open-source)

---

## Next Steps

1. **Install cloudflared**: `brew install cloudflare/cloudflare/cloudflared`
2. **Quick test**: `cloudflared tunnel --url http://localhost:3001`
3. **Copy URL** and add to `.env.local`
4. **Test webhooks** with NOWPayments sandbox
5. **Deploy production** when you get `akhai.ai`

**Estimated time:** 5 minutes ⚡

