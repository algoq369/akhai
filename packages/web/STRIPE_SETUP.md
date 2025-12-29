# Stripe Setup Guide for AkhAI

This guide walks you through setting up Stripe payments for AkhAI, including creating products, configuring webhooks, and testing locally.

---

## Prerequisites

- Stripe account (test mode)
- Stripe CLI installed: https://docs.stripe.com/stripe-cli
- API keys added to `.env.local` (already done ✅)

---

## Step 1: Create Products and Prices in Stripe Dashboard

### Option A: Manual Creation (Recommended for First Setup)

1. Go to https://dashboard.stripe.com/test/products
2. Create the following products:

#### Subscription Products

**Pro Subscription**
- Name: `AkhAI Pro`
- Description: `Unlimited queries with Claude Opus 4.5`
- Pricing: `$20.00 USD / month`
- Recurring: `Monthly`
- After creation, copy the **Price ID** (starts with `price_`)

**Legend Subscription**
- Name: `AkhAI Legend 👑`
- Description: `Premium R&D tier with enhanced features`
- Pricing: `$200.00 USD / month`
- Recurring: `Monthly`
- Copy the **Price ID**

**Team Subscription**
- Name: `AkhAI Team`
- Description: `Unlimited queries per user with team workspace`
- Pricing: `$40.00 USD / month`
- Recurring: `Monthly`
- Copy the **Price ID**

#### One-Time Payment Products (Token Credits)

**Starter Credits**
- Name: `Token Credits - Starter`
- Description: `100K tokens for Claude Opus 4.5`
- Pricing: `$5.00 USD`
- Type: `One-time`
- Copy the **Price ID**

**Builder Credits**
- Name: `Token Credits - Builder`
- Description: `500K tokens for Claude Opus 4.5`
- Pricing: `$20.00 USD`
- Type: `One-time`
- Copy the **Price ID**

**Scale Credits**
- Name: `Token Credits - Scale`
- Description: `3M tokens for Claude Opus 4.5`
- Pricing: `$100.00 USD`
- Type: `One-time`
- Copy the **Price ID**

**Bulk Credits**
- Name: `Token Credits - Bulk`
- Description: `20M tokens for Claude Opus 4.5`
- Pricing: `$500.00 USD`
- Type: `One-time`
- Copy the **Price ID**

### Option B: Automated Creation via Stripe API

If you have a valid Stripe secret key, run:

```bash
pnpm exec tsx scripts/setup-stripe.ts
```

This will create all products and prices automatically and output the Price IDs.

---

## Step 2: Update Environment Variables

Add the Price IDs to your `.env.local` file:

```bash
# Stripe Price IDs (Subscriptions)
NEXT_PUBLIC_STRIPE_PRO_PRICE_ID=price_xxxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_STRIPE_LEGEND_PRICE_ID=price_xxxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_STRIPE_TEAM_PRICE_ID=price_xxxxxxxxxxxxxxxxxxxxx

# Stripe Price IDs (Token Credits - One-time payments)
NEXT_PUBLIC_STRIPE_CREDITS_STARTER_ID=price_xxxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_STRIPE_CREDITS_BUILDER_ID=price_xxxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_STRIPE_CREDITS_SCALE_ID=price_xxxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_STRIPE_CREDITS_BULK_ID=price_xxxxxxxxxxxxxxxxxxxxx
```

---

## Step 3: Set Up Webhook Endpoint

### Local Development (Stripe CLI)

1. **Install Stripe CLI** (if not already installed):
   ```bash
   brew install stripe/stripe-cli/stripe
   ```

2. **Login to Stripe**:
   ```bash
   stripe login
   ```

3. **Forward webhooks to your local server**:
   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```

4. **Copy the webhook signing secret** from the CLI output (starts with `whsec_`)

5. **Update `.env.local`**:
   ```bash
   STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```

6. **Keep the CLI running** while testing locally

### Production Deployment

1. Go to https://dashboard.stripe.com/test/webhooks
2. Click **Add endpoint**
3. Enter your endpoint URL: `https://your-domain.com/api/webhooks/stripe`
4. Select events to listen to:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Copy the **Signing secret** and add to your production environment variables

---

## Step 4: Test the Integration

### Test Checkout Flow

1. **Start your dev server**:
   ```bash
   pnpm dev
   ```

2. **Start Stripe CLI webhook forwarding** (in another terminal):
   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```

3. **Visit the pricing page**:
   ```
   http://localhost:3000/pricing
   ```

4. **Click "Get Pro"** (or any other plan)

5. **Use Stripe test card**:
   - Card number: `4242 4242 4242 4242`
   - Expiration: Any future date
   - CVC: Any 3 digits
   - ZIP: Any 5 digits

6. **Complete checkout** and verify:
   - Redirected to success page
   - Webhook events received in Stripe CLI
   - PostHog events tracked (check console)

### Test Cards

- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- **3D Secure**: `4000 0025 0000 3155`

Full list: https://docs.stripe.com/testing

---

## Step 5: Verify Webhook Handling

### Events Handled by `/api/webhooks/stripe`

1. **checkout.session.completed** - Subscription or one-time payment completed
2. **customer.subscription.updated** - Subscription plan changed
3. **customer.subscription.deleted** - Subscription cancelled
4. **invoice.payment_succeeded** - Recurring payment succeeded
5. **invoice.payment_failed** - Recurring payment failed

### Check Webhook Logs

In Stripe CLI output, you should see:
```
✓ 200 POST /api/webhooks/stripe [evt_xxxxx]
```

In your Next.js console, you should see:
```
[Webhook] Subscription created: sub_xxxxx
[Webhook] Payment succeeded: in_xxxxx
```

---

## Step 6: PostHog Analytics Tracking

The following events are automatically tracked:

### Client-Side (Browser)
- `checkout_started` - User clicks "Get Plan" button
- `pricing_page_viewed` - User visits /pricing

### Server-Side (API)
- `subscription_created` - Subscription successfully created
- `credits_purchased` - Token credits purchased
- `credits_checkout_started` - User starts credits checkout

View events in PostHog:
https://eu.posthog.com/project/YOUR_PROJECT_ID/events

---

## Troubleshooting

### "Invalid API Key" Error

- Verify your Stripe secret key in `.env.local`
- Make sure you're using the **test mode** key (starts with `sk_test_`)
- Check if the key has been restricted in Stripe Dashboard

### Webhook Signature Verification Failed

- Ensure `STRIPE_WEBHOOK_SECRET` matches the signing secret from Stripe CLI or Dashboard
- Check if the webhook endpoint is publicly accessible (for production)
- Verify the raw body is being passed to `stripe.webhooks.constructEvent()`

### Checkout Session Not Redirecting

- Check if `success_url` and `cancel_url` are correctly set in `/api/checkout/route.ts`
- Verify the Stripe publishable key is correct in `.env.local`

### No Events Showing in PostHog

- Verify PostHog keys are set in `.env.local`
- Check browser console for PostHog debug logs
- Ensure `/ingest` reverse proxy is working (check Network tab)

---

## Production Checklist

Before going live:

- [ ] Switch to **live mode** keys (starts with `pk_live_` and `sk_live_`)
- [ ] Create products in **live mode** Stripe Dashboard
- [ ] Update price IDs in production environment variables
- [ ] Set up production webhook endpoint
- [ ] Test with real payment method (small amount)
- [ ] Enable Stripe Radar for fraud prevention
- [ ] Set up email receipts in Stripe Dashboard
- [ ] Configure tax collection (if applicable)
- [ ] Review Stripe billing settings
- [ ] Test subscription cancellation flow

---

## Useful Commands

```bash
# Test webhook locally
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Trigger a test event
stripe trigger checkout.session.completed

# View recent events
stripe events list --limit 10

# View specific customer
stripe customers retrieve cus_xxxxxxxxxxxxx

# View subscriptions
stripe subscriptions list --limit 10
```

---

## Support

- Stripe Documentation: https://docs.stripe.com
- Stripe CLI: https://docs.stripe.com/stripe-cli
- Stripe Testing: https://docs.stripe.com/testing
- PostHog Docs: https://posthog.com/docs

---

**Status**: ✅ Stripe integration complete - ready for testing!
