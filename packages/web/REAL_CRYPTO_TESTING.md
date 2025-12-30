# Real Crypto Payment Testing Guide

## Quick Start (5 Minutes)

### Step 1: Start Cloudflare Tunnel

Open a **new terminal window** and run:

```bash
cd /Users/sheirraza/akhai/packages/web
cloudflared tunnel --url http://localhost:3001
```

You'll see output like:
```
2025-12-30 13:30:00 | Your quick Tunnel has been created! Visit it at:
https://abc-def-123.trycloudflare.com
```

**COPY THAT URL!** (e.g., `https://abc-def-123.trycloudflare.com`)

### Step 2: Update Environment Variables

Edit `packages/web/.env.local` and update this line:

```bash
NEXT_PUBLIC_APP_URL=https://abc-def-123.trycloudflare.com
```

(Replace with YOUR tunnel URL from Step 1)

### Step 3: Restart Dev Server

The dev server should auto-reload, but if not:

```bash
cd /Users/sheirraza/akhai/packages/web
pnpm dev
```

### Step 4: Test Payment

1. Visit your tunnel URL: `https://abc-def-123.trycloudflare.com/pricing`
2. Click "Or pay with crypto" on any plan
3. Select **Convenient Mode** → Choose **USDT** (Tether - minimum $10)
4. You'll get a payment address and QR code
5. Send **real crypto** to that address (recommend $10-15 USDT for testing)
6. Watch the modal - status will update in real-time

### Step 5: Verify Webhooks

Check your terminal logs - you should see:
```
POST /api/webhooks/crypto 200 in XXXms
```

This confirms NOWPayments sent a webhook to your app!

---

## Recommended Test Amounts

| Currency | Minimum | Recommended Test |
|----------|---------|------------------|
| USDT     | $10     | $15 (stable value) |
| USDC     | $10     | $15 (stable value) |
| SOL      | $5      | $10 |
| BTC      | $25     | $30 (higher minimum) |
| ETH      | $20     | $25 |
| XMR      | $15     | $20 |

**Best for testing**: USDT or USDC (stablecoins - no price volatility)

---

## Long-Term Domain Options

For production deployment (not just testing), you have these options:

### Option 1: Buy Domain + Cloudflare Tunnel (Recommended)
- **Cost**: ~$9/year for domain
- **Setup**: 10 minutes
- **Benefits**: Professional domain, free tunnel, zero hosting costs

**Steps**:
1. Buy domain from [Cloudflare Registrar](https://www.cloudflare.com/products/registrar/) ($9/year) or [Namecheap](https://www.namecheap.com) ($8/year)
2. Create named Cloudflare Tunnel: `cloudflared tunnel create akhai`
3. Point domain to tunnel
4. Done! Free hosting forever

### Option 2: Railway.app (Free Tier)
- **Cost**: $0 (free tier) - $5/month (hobby)
- **Setup**: 5 minutes
- **Benefits**: Auto-deployment from GitHub, free domain

**Steps**:
1. Visit [railway.app](https://railway.app)
2. Connect GitHub repo
3. Deploy
4. Get free `.railway.app` domain

### Option 3: Render.com (Free Tier)
- **Cost**: $0 (free tier)
- **Setup**: 5 minutes
- **Benefits**: Auto-deployment, free SSL

**Steps**:
1. Visit [render.com](https://render.com)
2. Connect repo
3. Deploy
4. Get free `.onrender.com` domain

### Option 4: Fly.io (Free Tier)
- **Cost**: $0 (free tier)
- **Setup**: 10 minutes
- **Benefits**: Global deployment, fast

**Steps**:
```bash
brew install flyctl
flyctl launch
flyctl deploy
```

---

## My Recommendation

**For Testing NOW**: Use Cloudflare Tunnel (already installed, free, instant)

**For Production**: Buy domain ($9/year) + use Railway.app (free tier)
- Professional domain: `akhai.com` or `akhai.ai`
- Auto-deployments from GitHub
- Zero hosting costs
- SSL included

---

## Troubleshooting

### Webhooks not working?
- Check tunnel is running: `ps aux | grep cloudflared`
- Verify `NEXT_PUBLIC_APP_URL` matches tunnel URL
- Check dev server logs for `/api/webhooks/crypto` calls

### Payment not showing up?
- Wait 10 seconds (polling interval)
- Check blockchain explorer for transaction confirmation
- Verify you sent the EXACT amount shown

### Tunnel URL changed?
- Cloudflare Tunnel URLs change each restart
- Update `NEXT_PUBLIC_APP_URL` each time
- OR create a **named tunnel** for permanent URL

### How to create permanent tunnel?
```bash
cloudflared tunnel login
cloudflared tunnel create akhai
cloudflared tunnel route dns akhai akhai.yourdomain.com
```

---

## Security Notes

- Never commit `.env.local` to git
- Store API keys in environment variables
- Use production mode only (`NOWPAYMENTS_SANDBOX=false`)
- Monitor payments in NOWPayments dashboard
- Validate all webhook signatures

---

**Ready to test?** Run the tunnel command above and start testing with real crypto!
