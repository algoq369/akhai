# Stripe Setup - Next Steps

## ✅ Completed

- Pricing page UI created and working: http://localhost:3000/pricing
- Stripe checkout endpoint: `/api/checkout`
- Stripe webhook endpoint: `/api/webhooks/stripe`
- Environment variables configured
- Documentation created (see STRIPE_SETUP.md, QUICKSTART_STRIPE.md)

## ⚠️ Action Required

### 1. Fix Stripe API Key

The current API key in `.env.local` is invalid. You need to:

1. Go to https://dashboard.stripe.com/test/apikeys
2. Reveal or regenerate your **Secret key** (starts with `sk_test_`)
3. Update `.env.local`:
   ```bash
   STRIPE_SECRET_KEY=sk_test_NEW_KEY_HERE
   ```

### 2. Create Stripe Products

Once you have a valid API key, you can either:

**Option A: Automated (Recommended)**
```bash
pnpm exec tsx scripts/setup-stripe.ts
```
This will:
- Create all 7 products (3 subscriptions + 4 token credits)
- Generate price IDs
- Display environment variables to copy

**Option B: Manual (Stripe Dashboard)**

Go to https://dashboard.stripe.com/test/products and create:

#### Subscriptions (Recurring)

1. **AkhAI Pro**
   - Price: $20/month
   - Copy the Price ID (price_xxxxx)

2. **AkhAI Legend**
   - Price: $200/month
   - Copy the Price ID (price_xxxxx)

3. **AkhAI Team**
   - Price: $40/month
   - Copy the Price ID (price_xxxxx)

#### Token Credits (One-time)

4. **Starter**
   - Price: $5 (one-time)
   - Copy the Price ID (price_xxxxx)

5. **Builder**
   - Price: $20 (one-time)
   - Copy the Price ID (price_xxxxx)

6. **Scale**
   - Price: $100 (one-time)
   - Copy the Price ID (price_xxxxx)

7. **Bulk**
   - Price: $500 (one-time)
   - Copy the Price ID (price_xxxxx)

### 3. Update Environment Variables

Add the price IDs to `.env.local`:

```bash
# Stripe Price IDs (from dashboard)
NEXT_PUBLIC_STRIPE_PRO_PRICE_ID=price_xxxxx
NEXT_PUBLIC_STRIPE_LEGEND_PRICE_ID=price_xxxxx
NEXT_PUBLIC_STRIPE_TEAM_PRICE_ID=price_xxxxx
NEXT_PUBLIC_STRIPE_CREDITS_STARTER_ID=price_xxxxx
NEXT_PUBLIC_STRIPE_CREDITS_BUILDER_ID=price_xxxxx
NEXT_PUBLIC_STRIPE_CREDITS_SCALE_ID=price_xxxxx
NEXT_PUBLIC_STRIPE_CREDITS_BULK_ID=price_xxxxx
```

### 4. Set Up Webhook Testing

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login to Stripe
stripe login

# Forward webhooks to local server
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

Copy the webhook signing secret (whsec_xxxxx) and update `.env.local`:
```bash
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
```

### 5. Test Complete Flow

1. Restart dev server: `pnpm dev`
2. Visit: http://localhost:3000/pricing
3. Click "Get Pro"
4. Use test card: `4242 4242 4242 4242`
5. Check webhook received: Look for `checkout.session.completed` in Stripe CLI output
6. Verify PostHog event: Check for `checkout_started` and `subscription_created`

## 📊 Expected Behavior

### Subscriptions
- Clicking "Get Pro/Legend/Team" → Redirects to Stripe Checkout
- Payment succeeds → User redirected to `/pricing/success`
- Webhook fires → `subscription_created` event tracked in PostHog
- User subscription stored in database

### Token Credits
- Clicking "Get Starter/Builder/Scale/Bulk" → Redirects to Stripe Checkout
- Payment succeeds → User redirected to `/pricing/success`
- Webhook fires → `credits_purchased` event tracked in PostHog
- Credits added to user account

## 🔍 Debugging

### Check Stripe Dashboard
- https://dashboard.stripe.com/test/payments - See test payments
- https://dashboard.stripe.com/test/subscriptions - See subscriptions
- https://dashboard.stripe.com/test/logs - See webhook delivery logs

### Check Webhook Logs
```bash
# In Stripe CLI terminal
stripe listen --forward-to localhost:3000/api/webhooks/stripe --print-json
```

### Check PostHog
- https://eu.posthog.com - See tracked events
- Look for: `checkout_started`, `subscription_created`, `credits_purchased`

## 📚 Full Documentation

- **Quick Start**: `QUICKSTART_STRIPE.md` - Essential steps
- **Complete Guide**: `STRIPE_SETUP.md` - Detailed documentation
- **Stripe Docs**: https://stripe.com/docs/payments/checkout

## 🎯 Current Status

- ✅ Pricing page loads at /pricing
- ✅ UI displays all 7 pricing tiers (4 subscriptions + 4 token credits)
- ✅ Checkout endpoint ready
- ✅ Webhook endpoint ready
- ⏳ Waiting for valid Stripe API key
- ⏳ Waiting for product creation
- ⏳ Waiting for webhook secret

Once you complete steps 1-4 above, the payment system will be fully functional!
