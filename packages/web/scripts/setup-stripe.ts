/**
 * Stripe Setup Script
 * Creates all products and prices in Stripe
 * Run with: pnpm exec tsx scripts/setup-stripe.ts
 */

import Stripe from 'stripe'
import * as dotenv from 'dotenv'
import * as path from 'path'

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

if (!process.env.STRIPE_SECRET_KEY) {
  console.error('❌ STRIPE_SECRET_KEY not found in .env.local')
  process.exit(1)
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2026-01-28.clover',
})

async function setupStripe() {
  console.log('🚀 Setting up Stripe products and prices...\n')

  try {
    // ============================================
    // SUBSCRIPTION PRODUCTS
    // ============================================

    // Pro Subscription
    console.log('Creating Pro subscription...')
    const proProduct = await stripe.products.create({
      name: 'AkhAI Pro',
      description: 'Unlimited queries with Claude Opus 4.5',
      metadata: { plan: 'pro' },
    })

    const proPrice = await stripe.prices.create({
      product: proProduct.id,
      unit_amount: 2000, // $20.00
      currency: 'usd',
      recurring: { interval: 'month' },
      metadata: { plan: 'pro' },
    })

    console.log(`✅ Pro: ${proPrice.id}\n`)

    // Legend Subscription
    console.log('Creating Legend subscription...')
    const legendProduct = await stripe.products.create({
      name: 'AkhAI Legend 👑',
      description: 'Premium R&D tier with enhanced features',
      metadata: { plan: 'legend' },
    })

    const legendPrice = await stripe.prices.create({
      product: legendProduct.id,
      unit_amount: 20000, // $200.00
      currency: 'usd',
      recurring: { interval: 'month' },
      metadata: { plan: 'legend' },
    })

    console.log(`✅ Legend: ${legendPrice.id}\n`)

    // Team Subscription
    console.log('Creating Team subscription...')
    const teamProduct = await stripe.products.create({
      name: 'AkhAI Team',
      description: 'Unlimited queries per user with team workspace',
      metadata: { plan: 'team' },
    })

    const teamPrice = await stripe.prices.create({
      product: teamProduct.id,
      unit_amount: 4000, // $40.00 per user
      currency: 'usd',
      recurring: { interval: 'month' },
      metadata: { plan: 'team', per_user: 'true' },
    })

    console.log(`✅ Team: ${teamPrice.id}\n`)

    // ============================================
    // TOKEN CREDIT PRODUCTS (ONE-TIME)
    // ============================================

    // Starter Credits
    console.log('Creating Starter credits...')
    const starterProduct = await stripe.products.create({
      name: 'Token Credits - Starter',
      description: '100K tokens for Claude Opus 4.5',
      metadata: { credits: 'starter', tokens: '100000' },
    })

    const starterPrice = await stripe.prices.create({
      product: starterProduct.id,
      unit_amount: 500, // $5.00
      currency: 'usd',
      metadata: { credits: 'starter', tokens: '100000' },
    })

    console.log(`✅ Starter Credits: ${starterPrice.id}\n`)

    // Builder Credits
    console.log('Creating Builder credits...')
    const builderProduct = await stripe.products.create({
      name: 'Token Credits - Builder',
      description: '500K tokens for Claude Opus 4.5',
      metadata: { credits: 'builder', tokens: '500000' },
    })

    const builderPrice = await stripe.prices.create({
      product: builderProduct.id,
      unit_amount: 2000, // $20.00
      currency: 'usd',
      metadata: { credits: 'builder', tokens: '500000' },
    })

    console.log(`✅ Builder Credits: ${builderPrice.id}\n`)

    // Scale Credits
    console.log('Creating Scale credits...')
    const scaleProduct = await stripe.products.create({
      name: 'Token Credits - Scale',
      description: '3M tokens for Claude Opus 4.5',
      metadata: { credits: 'scale', tokens: '3000000' },
    })

    const scalePrice = await stripe.prices.create({
      product: scaleProduct.id,
      unit_amount: 10000, // $100.00
      currency: 'usd',
      metadata: { credits: 'scale', tokens: '3000000' },
    })

    console.log(`✅ Scale Credits: ${scalePrice.id}\n`)

    // Bulk Credits
    console.log('Creating Bulk credits...')
    const bulkProduct = await stripe.products.create({
      name: 'Token Credits - Bulk',
      description: '20M tokens for Claude Opus 4.5',
      metadata: { credits: 'bulk', tokens: '20000000' },
    })

    const bulkPrice = await stripe.prices.create({
      product: bulkProduct.id,
      unit_amount: 50000, // $500.00
      currency: 'usd',
      metadata: { credits: 'bulk', tokens: '20000000' },
    })

    console.log(`✅ Bulk Credits: ${bulkPrice.id}\n`)

    // ============================================
    // SUMMARY
    // ============================================

    console.log('=' .repeat(60))
    console.log('✅ Stripe setup complete!\n')
    console.log('Add these price IDs to your .env.local:\n')
    console.log(`NEXT_PUBLIC_STRIPE_PRO_PRICE_ID=${proPrice.id}`)
    console.log(`NEXT_PUBLIC_STRIPE_LEGEND_PRICE_ID=${legendPrice.id}`)
    console.log(`NEXT_PUBLIC_STRIPE_TEAM_PRICE_ID=${teamPrice.id}`)
    console.log(`NEXT_PUBLIC_STRIPE_CREDITS_STARTER_ID=${starterPrice.id}`)
    console.log(`NEXT_PUBLIC_STRIPE_CREDITS_BUILDER_ID=${builderPrice.id}`)
    console.log(`NEXT_PUBLIC_STRIPE_CREDITS_SCALE_ID=${scalePrice.id}`)
    console.log(`NEXT_PUBLIC_STRIPE_CREDITS_BULK_ID=${bulkPrice.id}`)
    console.log('\n' + '='.repeat(60))
  } catch (error: any) {
    console.error('❌ Error setting up Stripe:', error.message)
    process.exit(1)
  }
}

setupStripe()
