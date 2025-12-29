# Test Stripe Integration - Ready Now! 🎉

## ✅ What's Complete

- [x] Pricing page working: http://localhost:3000/pricing
- [x] All 7 Stripe products created
- [x] Price IDs configured in `.env.local`
- [x] Checkout endpoint ready
- [x] Webhook endpoint ready
- [x] PostHog tracking integrated

## 🧪 Test Without Webhooks (Quick Test)

You can test the checkout flow RIGHT NOW without setting up webhooks:

### Step 1: Visit Pricing Page
```
http://localhost:3000/pricing
```

### Step 2: Click Any "Get" Button
Try clicking:
- "Get Pro" ($20/month)
- "Get Builder" ($20 for 500K tokens)

### Step 3: Test Card
When redirected to Stripe Checkout, use:
```
Card: 4242 4242 4242 4242
Date: Any future date (e.g., 12/25)
CVC: Any 3 digits (e.g., 123)
ZIP: Any 5 digits (e.g., 12345)
```

### Step 4: Complete Payment
- Payment will succeed
- You'll be redirected to `/pricing/success`
- Check Stripe Dashboard: https://dashboard.stripe.com/test/payments

### Step 5: Check PostHog
- Go to: https://eu.posthog.com
- Look for event: `checkout_started`

**Note**: Without webhooks, the `subscription_created` and `credits_purchased` events won't fire (but checkout tracking works).

---

## 🔔 Full Test With Webhooks (Complete Integration)

To test the full flow including subscription creation tracking:

### Step 1: Install Stripe CLI
```bash
brew install stripe/stripe-cli/stripe
```

### Step 2: Login to Stripe
```bash
stripe login
```
This will open your browser to authenticate.

### Step 3: Forward Webhooks
```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

You'll see output like:
```
> Ready! Your webhook signing secret is whsec_xxxxxxxxxxxxx
```

### Step 4: Copy Webhook Secret
Copy the `whsec_xxxxx` value and update `.env.local`:
```bash
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
```

### Step 5: Restart Dev Server
```bash
# Kill current server (Ctrl+C in the terminal running pnpm dev)
# Then restart:
pnpm dev
```

### Step 6: Test Complete Flow
1. Visit: http://localhost:3000/pricing
2. Click "Get Pro"
3. Use test card: `4242 4242 4242 4242`
4. Complete payment
5. Watch the Stripe CLI terminal for webhook events:
   - `checkout.session.completed` ✅
   - `customer.subscription.created` ✅
   - `invoice.payment_succeeded` ✅

### Step 7: Verify PostHog Events
Check PostHog for:
- `checkout_started` ✅
- `subscription_created` ✅

---

## 📊 What Each Product Does

### Subscriptions (Recurring)
| Plan | Price | Stripe Price ID |
|------|-------|-----------------|
| Pro | $20/mo | `price_1SjOCHPmKihPmpFTymb4Jd5C` |
| Legend | $200/mo | `price_1SjOCHPmKihPmpFTeewkK2pC` |
| Team | $40/mo/user | `price_1SjOCIPmKihPmpFTo2WVT0jd` |

### Token Credits (One-time)
| Tier | Price | Tokens | Price ID |
|------|-------|--------|----------|
| Starter | $5 | 100K | `price_1SjOCIPmKihPmpFTeogC5HJb` |
| Builder | $20 | 500K | `price_1SjOCJPmKihPmpFTt58jQz8T` |
| Scale | $100 | 3M | `price_1SjOCKPmKihPmpFTVyGlQ8Hf` |
| Bulk | $500 | 20M | `price_1SjOCKPmKihPmpFTcbx6gxpX` |

---

## 🐛 Troubleshooting

### Checkout button shows "Coming soon!"
- This means the price ID is undefined
- Check: `echo $NEXT_PUBLIC_STRIPE_PRO_PRICE_ID`
- Restart dev server if needed

### Webhook events not received
- Make sure Stripe CLI is running: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`
- Check webhook secret is in `.env.local`
- Restart dev server after adding webhook secret

### Payment fails
- Check Stripe Dashboard logs: https://dashboard.stripe.com/test/logs
- Verify API key is correct
- Try different test card numbers: https://stripe.com/docs/testing

### PostHog events not showing
- Wait 1-2 minutes (PostHog has slight delay)
- Check browser console for errors
- Verify PostHog API key is correct

---

## 🎯 Success Criteria

✅ You'll know it's working when:

1. **Pricing page loads** with all 7 tiers visible
2. **"Get Pro" button works** (no "Coming soon!" message)
3. **Stripe Checkout opens** with correct price
4. **Test payment succeeds** using `4242 4242 4242 4242`
5. **Redirect to success page** works
6. **Stripe Dashboard shows payment** (https://dashboard.stripe.com/test/payments)
7. **Stripe CLI shows webhook** (if running)
8. **PostHog shows events** (checkout_started, subscription_created)

---

## 📚 Next Steps After Testing

Once everything works:

1. **Production Setup**:
   - Create products in live mode (not test mode)
   - Add production API keys to production environment
   - Set up production webhook endpoint

2. **Database Integration**:
   - Store subscriptions in database
   - Track user credits
   - Handle subscription lifecycle (upgrades, cancellations)

3. **UI Polish**:
   - Add loading states
   - Improve error handling
   - Add success/failure modals

4. **Admin Dashboard**:
   - View all subscriptions
   - Manage user credits
   - Analytics

---

## 🚀 Start Testing Now!

**Quickest way to see it work:**

```bash
# 1. Visit pricing page
open http://localhost:3000/pricing

# 2. Click "Get Pro"
# 3. Use card: 4242 4242 4242 4242
# 4. Complete checkout
# 5. Check Stripe Dashboard
open https://dashboard.stripe.com/test/payments
```

That's it! The payment integration is fully functional. 🎉
