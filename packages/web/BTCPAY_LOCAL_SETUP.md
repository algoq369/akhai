# BTCPay Server Local Setup for AkhAI

## Quick Start (Docker)

### 1. Install BTCPay Server Locally

```bash
# Create directory
mkdir -p ~/btcpay-server
cd ~/btcpay-server

# Download docker-compose
curl -o docker-compose.yml https://raw.githubusercontent.com/btcpayserver/btcpayserver-docker/master/docker-compose-generator/docker-fragments/docker-compose.yml

# Start BTCPay Server
docker-compose up -d
```

### 2. Access BTCPay

Open: http://localhost:14142

**First-time setup:**
1. Create admin account
2. Create a store (name: "AkhAI")
3. Configure wallet (BTC, XMR, Lightning)

### 3. Expose with ngrok

```bash
# Install ngrok
brew install ngrok

# Authenticate (get free token from ngrok.com)
ngrok config add-authtoken YOUR_TOKEN

# Expose BTCPay Server
ngrok http 14142
```

Copy the HTTPS URL (e.g., `https://abc123.ngrok.io`)

### 4. Configure Webhooks

In BTCPay Server:
- Store Settings → Webhooks
- Add webhook: `https://your-app.ngrok.io/api/webhooks/btcpay`

### 5. Get API Keys

BTCPay Server → Account Settings → API Keys
- Create new API key
- Permissions: `btcpay.store.canmodifyinvoices`
- Copy the key

---

## Integration with AkhAI

### Environment Variables

Add to `.env.local`:
```bash
# BTCPay Server
BTCPAY_SERVER_URL=http://localhost:14142
BTCPAY_API_KEY=your_api_key_here
BTCPAY_STORE_ID=your_store_id_here
BTCPAY_WEBHOOK_SECRET=your_webhook_secret_here
```

### API Endpoint Structure

```typescript
// app/api/btcpay-checkout/route.ts
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { amount, currency } = await req.json()

  const invoice = await fetch(`${process.env.BTCPAY_SERVER_URL}/api/v1/stores/${process.env.BTCPAY_STORE_ID}/invoices`, {
    method: 'POST',
    headers: {
      'Authorization': `token ${process.env.BTCPAY_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      amount,
      currency,
      checkout: {
        redirectURL: `${process.env.NEXT_PUBLIC_APP_URL}/payment/success`
      }
    })
  })

  const data = await invoice.json()
  return NextResponse.json(data)
}
```

---

## Supported Cryptocurrencies

BTCPay Server supports:
- ✅ Bitcoin (BTC)
- ✅ Lightning Network
- ✅ Monero (XMR) - via integration
- ✅ Litecoin (LTC)
- ✅ Ethereum (ETH) - via integration

---

## Advantages Over NOWPayments

| Feature | BTCPay Server | NOWPayments |
|---------|--------------|-------------|
| Custody | Non-custodial ✅ | Custodial ❌ |
| Privacy | 100% private ✅ | 70% private |
| Fees | 0% (only mining fees) ✅ | 0.5% per transaction ❌ |
| Sovereignty | Full control ✅ | Third-party ❌ |
| Censorship | Impossible ✅ | Possible ❌ |
| KYC | None required ✅ | Required ❌ |
| Setup time | 30 mins ⚠️ | 5 mins ✅ |
| Crypto support | BTC, LTC, XMR ⚠️ | 300+ coins ✅ |

---

## Recommended Dual Setup

**Use BOTH systems:**

```typescript
// Payment provider selection
const paymentMethods = {
  sovereign: {
    provider: 'btcpay',
    currencies: ['btc', 'xmr', 'lightning'],
    badge: '🛡️ Sovereign',
    description: 'Direct to your wallet - no middleman'
  },
  convenient: {
    provider: 'nowpayments',
    currencies: ['eth', 'sol', 'usdt', 'doge'],
    badge: '⚡ Fast',
    description: '300+ cryptocurrencies supported'
  }
}
```

**UI Flow:**
1. User clicks "Pay with Crypto"
2. Modal shows TWO tabs:
   - "Sovereign Mode" (BTCPay) - BTC, XMR, Lightning
   - "Convenience" (NOWPayments) - ETH, SOL, USDT, etc.
3. User chooses based on preference

---

## Production Deployment

When you get a domain:

```bash
# Install on VPS (Ubuntu)
git clone https://github.com/btcpayserver/btcpayserver-docker
cd btcpayserver-docker

# Configure
export BTCPAY_HOST="btcpay.akhai.ai"
export BTCPAY_ADDITIONAL_HOSTS="akhai.ai"
export REVERSEPROXY_DEFAULT_HOST="$BTCPAY_HOST"

# Deploy
./btcpay-setup.sh -i
```

---

## Testing Locally

1. Start BTCPay Server: `docker-compose up -d`
2. Create invoice via API
3. Pay with testnet Bitcoin
4. Verify webhook received
5. Confirm payment processed

---

## Next Steps

1. ✅ Install Docker
2. ✅ Run BTCPay locally
3. ✅ Create test invoice
4. ✅ Integrate API endpoints
5. ✅ Add to payment modal
6. 📅 Deploy to VPS (when domain ready)

