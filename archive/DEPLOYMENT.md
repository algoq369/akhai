# AkhAI Deployment Guide - Vercel

This guide walks you through deploying AkhAI to Vercel for Phase 1 (Weeks 2-8).

## Prerequisites

1. **Vercel Account**: Sign up at https://vercel.com
2. **API Keys**: You need all 4 provider API keys:
   - Anthropic (Claude)
   - DeepSeek
   - xAI (Grok)
   - Mistral AI

## Deployment Steps

### Option 1: Deploy via Vercel CLI (Recommended)

1. **Install Vercel CLI**:
   ```bash
   npm install -g vercel
   ```

2. **Navigate to the web package**:
   ```bash
   cd /Users/sheirraza/akhai/packages/web
   ```

3. **Login to Vercel**:
   ```bash
   vercel login
   ```

4. **Deploy**:
   ```bash
   vercel
   ```

5. **Set Environment Variables** (when prompted or via Vercel dashboard):
   ```
   ANTHROPIC_API_KEY=sk-ant-api03-...
   DEEPSEEK_API_KEY=sk-...
   XAI_API_KEY=xai-...
   MISTRAL_API_KEY=...
   ```

6. **Deploy to Production**:
   ```bash
   vercel --prod
   ```

### Option 2: Deploy via Vercel Dashboard

1. **Connect GitHub Repository**:
   - Go to https://vercel.com/new
   - Import your GitHub repository
   - Select the `packages/web` directory as the root

2. **Configure Build Settings**:
   - **Framework Preset**: Next.js
   - **Build Command**: `pnpm build` (or leave default)
   - **Output Directory**: `.next` (default)
   - **Install Command**: `pnpm install`

3. **Add Environment Variables**:
   In the Vercel dashboard, go to Settings → Environment Variables:
   ```
   ANTHROPIC_API_KEY=sk-ant-api03-...
   DEEPSEEK_API_KEY=sk-...
   XAI_API_KEY=xai-...
   MISTRAL_API_KEY=...
   ```

4. **Deploy**:
   Click "Deploy" and Vercel will build and deploy your app.

## Post-Deployment Checklist

- [ ] Verify the app loads at your Vercel URL (e.g., `akhai.vercel.app`)
- [ ] Test a simple query (e.g., "What is 2+2?") - should use direct methodology
- [ ] Test a crypto price query (e.g., "BTC price") - should return real-time data
- [ ] Test all 7 methodologies via the selector
- [ ] Check that conversation history works (ask a follow-up question)
- [ ] Verify analytics are tracking (check browser localStorage)
- [ ] Test on mobile devices

## Monitoring & Analytics

### Built-in Analytics
AkhAI tracks query usage locally in the browser via `localStorage`. To export data for fine-tuning:

```javascript
// In browser console
import { exportForFineTuning } from '@/lib/analytics'
console.log(exportForFineTuning())
```

### Recommended External Tools (Phase 1+)
- **Vercel Analytics**: Built-in, free tier available
- **PostHog**: Product analytics (free tier: 1M events/month)
- **Mixpanel**: User behavior tracking (free tier: 100K tracked users)

## Cost Estimation (Phase 1: Weeks 2-8)

### Vercel Hosting
- **Hobby Plan**: $0/month
  - 100GB bandwidth
  - Unlimited deployments
  - Serverless function execution: 100GB-hours

### AI API Costs (50-100 beta users)
Assuming ~500 queries/day across all users:

| Provider | Model | Est. Cost/Month |
|----------|-------|----------------|
| Anthropic | Claude Sonnet 4 | $30-60 |
| DeepSeek | deepseek-chat | $5-10 |
| xAI | Grok 3 | $10-20 |
| Mistral | Mistral Small | $5-10 |
| **Total** | | **$50-100/month** |

Real-time crypto data (CoinGecko) is free.

## Scaling Beyond Free Tier

When you exceed Vercel's free tier limits:
- **Pro Plan**: $20/month per member
  - 1TB bandwidth
  - Advanced analytics
  - Password protection
  - Increased serverless limits

## Troubleshooting

### Build Fails
1. Check that all dependencies are in `package.json`
2. Verify Node version is >=20.0.0
3. Check build logs in Vercel dashboard

### API Keys Not Working
1. Verify keys are set in Vercel environment variables
2. Redeploy after adding/updating keys
3. Check that key names match exactly (e.g., `ANTHROPIC_API_KEY`)

### 404 or Routes Not Found
1. Ensure `packages/web` is set as the root directory
2. Check that `next.config.js` is present
3. Verify all routes are in `app/` directory

## Next Steps (Phase 2: Pre-Seed)

Once deployed and users are active:
1. Set up proper analytics (PostHog/Mixpanel)
2. Add user authentication (Clerk/Auth0)
3. Create a landing page with waitlist
4. Track key metrics:
   - Daily Active Users (DAU)
   - Queries per user
   - Methodology distribution
   - Grounding Guard trigger rate
5. Collect testimonials for pitch deck

## Support

For deployment issues:
- Vercel Docs: https://vercel.com/docs
- AkhAI GitHub Issues: [Your repo URL]

---

**You're now ready to deploy AkhAI to the world! 🚀**
