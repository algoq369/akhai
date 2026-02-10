#!/usr/bin/env npx tsx

/**
 * Layer Comparison Test
 * Sends the SAME query with 3 different layer configs
 * Compares outputs to verify calibration works
 *
 * Usage: npx tsx scripts/test-layer-comparison.ts
 * Requires: dev server running on localhost:3000
 */

const QUERY = "What are 3 strategies for building a successful startup?"

const CONFIGS = [
  {
    name: "CREATIVE (articulation:95%, expansion:90%, knowledge:20%, analysis:10%)",
    weights: {
      4: 0.95,   // articulation HIGH
      7: 0.90,   // expansion HIGH
      8: 0.20,   // knowledge LOW
      6: 0.10,   // analysis LOW
      5: 0.85,   // synthesis HIGH
    }
  },
  {
    name: "ANALYTICAL (knowledge:95%, reasoning:90%, analysis:85%, articulation:10%)",
    weights: {
      8: 0.95,   // knowledge HIGH
      9: 0.90,   // reasoning HIGH
      6: 0.85,   // analysis HIGH
      4: 0.10,   // articulation LOW
      7: 0.15,   // expansion LOW
    }
  },
  {
    name: "BALANCED (all 50%)",
    weights: {
      1: 0.5, 2: 0.5, 3: 0.5, 4: 0.5, 5: 0.5,
      6: 0.5, 7: 0.5, 8: 0.5, 9: 0.5, 10: 0.5, 11: 0.5
    }
  }
]

async function runTest() {
  console.log('='.repeat(60))
  console.log('LAYER COMPARISON TEST')
  console.log(`Query: "${QUERY}"`)
  console.log('='.repeat(60) + '\n')

  try {
    const res = await fetch('http://localhost:3000/api/layer-test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: QUERY, configs: CONFIGS }),
    })

    if (!res.ok) {
      const text = await res.text()
      console.error(`HTTP ${res.status}: ${text}`)
      process.exit(1)
    }

    const data = await res.json()

    for (const result of data.results) {
      console.log('\n' + '-'.repeat(60))
      console.log(`CONFIG: ${result.configName}`)
      console.log(`Methodology: ${result.methodology} (${result.confidence}% confidence)`)
      console.log(`Tokens: ${result.tokens}`)
      console.log('-'.repeat(60))
      console.log('\nENHANCEMENT PROMPT (first 600 chars):')
      console.log(result.enhancement.substring(0, 600) + '...')
      console.log('\nRESPONSE (first 800 chars):')
      console.log(result.response.substring(0, 800))
      console.log('\n')
    }

    console.log('='.repeat(60))
    console.log('TEST COMPLETE — Compare the 3 responses above.')
    console.log('Creative should use metaphors/analogies, vivid language.')
    console.log('Analytical should use data/facts/logic, terse style.')
    console.log('Balanced should be standard/neutral.')
    console.log('='.repeat(60))
  } catch (error) {
    console.error('Failed to connect to dev server:', error)
    console.error('Make sure the dev server is running: cd packages/web && pnpm dev')
    process.exit(1)
  }
}

runTest().catch(console.error)
