# Quick Start: Stripe Setup

## 1. Create Products in Stripe Dashboard

Go to https://dashboard.stripe.com/test/products and create:

### Subscriptions
- **Pro**: $20/month → Copy Price ID
- **Legend**: $200/month → Copy Price ID
- **Team**: $40/month → Copy Price ID

### Token Credits (One-time)
- **Starter**: $5 → Copy Price ID
- **Builder**: $20 → Copy Price ID
- **Scale**: $100 → Copy Price ID
- **Bulk**: $500 → Copy Price ID

## 2. Add Price IDs to .env.local

```bash
NEXT_PUBLIC_STRIPE_PRO_PRICE_ID=price_xxxxx
NEXT_PUBLIC_STRIPE_LEGEND_PRICE_ID=price_xxxxx
NEXT_PUBLIC_STRIPE_TEAM_PRICE_ID=price_xxxxx
NEXT_PUBLIC_STRIPE_CREDITS_STARTER_ID=price_xxxxx
NEXT_PUBLIC_STRIPE_CREDITS_BUILDER_ID=price_xxxxx
NEXT_PUBLIC_STRIPE_CREDITS_SCALE_ID=price_xxxxx
NEXT_PUBLIC_STRIPE_CREDITS_BULK_ID=price_xxxxx
```

## 3. Set Up Local Webhooks

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Forward webhooks
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Copy the webhook secret (whsec_xxxxx) to .env.local
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
```

## 4. Test

1. Start dev server: `pnpm dev`
2. Start webhook forwarding: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`
3. Visit: http://localhost:3000/pricing
4. Click "Get Pro"
5. Use test card: `4242 4242 4242 4242`

✅ **Done!** See `STRIPE_SETUP.md` for full documentation.
