# CLI PROMPT: Layer Comparison Test + Kabbalistic Terms Cleanup
# Execute all tasks step by step

## CONTEXT
AkhAI project: `/Users/sheirraza/akhai/packages/web`
Layer calibration feature just shipped (commit 6d1203d).
Two issues to fix + comparison test to build.

---

## ALL ISSUES FOUND (Priority Order)

### ISSUE 1: [P0] Debug logs use Kabbalistic names instead of AI names
**Where:** `app/api/simple-query/route.ts` ~line 460
**Current log:** `Layer config: Malkuth:70%, Yesod:90%, Hod:40%`
**Should be:** `Layer config: reception:70%, comprehension:90%, context:40%`

**Root cause:** The log line does:
```typescript
const name = LAYER_METADATA[Number(k) as Layer]?.name || k
```
And `LAYER_METADATA` in `lib/layer-registry.ts` has `name: 'Malkuth'` etc.

**Fix:** Create an `AI_LAYER_NAMES` map in route.ts that maps layer numbers to the correct UI names:
```typescript
const AI_LAYER_NAMES: Record<number, string> = {
  1: 'reception',
  2: 'comprehension', 
  3: 'context',
  4: 'articulation',
  5: 'synthesis',
  6: 'analysis',
  7: 'expansion',
  8: 'knowledge',
  9: 'reasoning',
  10: 'output',
  11: 'verification',
}
```
Then change the log line to:
```typescript
const name = AI_LAYER_NAMES[Number(k)] || k
```

### ISSUE 2: [P0] AI system prompt shows Kabbalistic dominant layer names
**Where:** `lib/intelligence-fusion.ts` → `generateEnhancedSystemPrompt()` 
**Current:** When fusionResult has dominant layers, it outputs:
```
PRIMARY FOCUS: Binah (90%), Hod (75%), Netzach (70%)
```
**Should be:**
```
PRIMARY FOCUS: knowledge (90%), context (75%), expansion (70%)
```

**Root cause:** The `fusionResult.layerActivations[].name` comes from `LAYER_METADATA[].name` which is still 'Binah', 'Hod', etc.

**Fix:** In `generateEnhancedSystemPrompt()`, replace the dominant layers section to use `LAYER_BEHAVIORS` names:
```typescript
if (fusionResult.dominantLayers.length > 0) {
  const dominantNames = fusionResult.layerActivations
    .filter(s => fusionResult.dominantLayers.includes(s.layerNode))
    .map(s => {
      const aiName = LAYER_BEHAVIORS[s.layerNode]?.name || s.name
      return `${aiName} (${Math.round(s.effectiveWeight * 100)}%)`
    })
  lines.push(`PRIMARY FOCUS: ${dominantNames.join(', ')}`)
  lines.push('')
}
```

### ISSUE 3: [P1] LAYER_METADATA.name in layer-registry.ts still Kabbalistic
**Where:** `lib/layer-registry.ts` lines 80-300+
**What:** Every `LAYER_METADATA[Layer.X].name` = Kabbalistic name ('Malkuth', 'Yesod', etc.)
**Impact:** Any code that reads `LAYER_METADATA[x].name` gets Kabbalistic terms

**Fix:** Add `aiName` field to each LAYER_METADATA entry:
```typescript
[Layer.EMBEDDING]: {
  name: 'Malkuth',        // Keep for origin/philosophy display
  aiName: 'reception',    // NEW — for logs, prompts, and user-facing
  hebrewName: 'מלכות',
  ...
},
[Layer.EXECUTOR]: {
  name: 'Yesod',
  aiName: 'comprehension',
  ...
},
[Layer.CLASSIFIER]: {
  name: 'Hod',
  aiName: 'context',
  ...
},
[Layer.GENERATIVE]: {
  name: 'Netzach',
  aiName: 'articulation',
  ...
},
[Layer.ATTENTION]: {
  name: 'Tiferet',
  aiName: 'synthesis',
  ...
},
[Layer.DISCRIMINATOR]: {
  name: 'Gevurah',
  aiName: 'analysis',
  ...
},
[Layer.EXPANSION]: {
  name: 'Chesed',
  aiName: 'expansion',
  ...
},
[Layer.ENCODER]: {
  name: 'Binah',
  aiName: 'knowledge',
  ...
},
[Layer.REASONING]: {
  name: 'Chokmah',
  aiName: 'reasoning',
  ...
},
[Layer.META_CORE]: {
  name: 'Kether',
  aiName: 'output',
  ...
},
[Layer.SYNTHESIS]: {
  name: "Da'at",
  aiName: 'verification',
  ...
},
```

Also update the `LayerMetadata` interface:
```typescript
interface LayerMetadata {
  name: string        // Kabbalistic origin name (for philosophy page)
  aiName: string      // AI computational name (for everything else)
  hebrewName: string
  level: number
  meaning: string
  aiRole: string
  queryCharacteristics: string[]
  examples: string[]
  color: string
  pillar: 'left' | 'middle' | 'right'
}
```

### ISSUE 4: [P1] SSE pipeline events use Kabbalistic layer names
**Where:** `app/api/simple-query/route.ts` — SSE events that emit layer data
**Impact:** Frontend reasoning panel shows "Binah (90%)" instead of "knowledge (90%)"

**Fix:** Wherever SSE events reference `LAYER_METADATA[x].name`, use `LAYER_METADATA[x].aiName` instead.
Search for all uses of `.name` on LAYER_METADATA in route.ts and replace with `.aiName`.

### ISSUE 5: [P2] The `intelligence-fusion.ts` layerActivations output uses Kabbalistic names
**Where:** Wherever `layerActivations` array is built
**Impact:** Any downstream consumer of `fusionResult.layerActivations[].name` gets Kabbalistic

**Fix:** After adding `aiName` to LAYER_METADATA, update the fusion code to use `aiName` when building activation results.

---

## TASK 1: Fix Issues 1-5 (All Kabbalistic Term Leaks)

Execute all 5 fixes above in order. The key principle:
- `name` = Kabbalistic (kept for origin/philosophy page only)
- `aiName` = AI computational name (used everywhere else: logs, prompts, SSE, reasoning panel)

---

## TASK 2: Build Comparison Test Page

Create a new file: `app/api/layer-test/route.ts`

This is a diagnostic endpoint that:
1. Accepts a query + 3 different layer configs
2. Sends the SAME query 3 times with different configs
3. Returns all 3 responses so we can compare

```typescript
import { NextResponse } from 'next/server'
import { generateEnhancedSystemPrompt, runIntelligenceFusion } from '@/lib/intelligence-fusion'
import { callProvider } from '@/lib/multi-provider'
import { getMethodologyPrompt } from '@/lib/methodology-prompts'

export async function POST(request: Request) {
  const { query, configs } = await request.json()
  
  // configs = array of 3 different weight sets
  // Example:
  // [
  //   { name: "Creative", weights: { 4: 0.95, 7: 0.9, 8: 0.2, 6: 0.1 } },
  //   { name: "Analytical", weights: { 8: 0.95, 9: 0.9, 6: 0.85, 4: 0.1 } },
  //   { name: "Balanced", weights: { 1:0.5, 2:0.5, 3:0.5, 4:0.5, 5:0.5, 6:0.5, 7:0.5, 8:0.5, 9:0.5, 10:0.5, 11:0.5 } }
  // ]
  
  const results = []
  
  for (const config of configs) {
    // Fill missing weights with 0.5
    const fullWeights: Record<number, number> = { 
      1: 0.5, 2: 0.5, 3: 0.5, 4: 0.5, 5: 0.5, 
      6: 0.5, 7: 0.5, 8: 0.5, 9: 0.5, 10: 0.5, 11: 0.5,
      ...config.weights 
    }
    
    // Run fusion with these weights
    const fusionResult = runIntelligenceFusion(query, 'auto', fullWeights)
    
    // Generate the enhanced system prompt
    const enhancement = generateEnhancedSystemPrompt(fusionResult, fullWeights)
    
    // Build full system prompt
    const basePrompt = getMethodologyPrompt(fusionResult.selectedMethodology, null, true)
    const systemPrompt = `${basePrompt}\n\n${enhancement}`
    
    // Call the AI
    try {
      const response = await callProvider('anthropic', {
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: query },
        ],
        model: 'claude-sonnet-4-20250514',  // Use Sonnet for speed (3 calls)
        maxTokens: 1000,
        temperature: 0.7,
      })
      
      results.push({
        configName: config.name,
        weights: fullWeights,
        enhancement: enhancement,
        response: response.text,
        tokens: response.usage?.outputTokens || 0,
      })
    } catch (error: any) {
      results.push({
        configName: config.name,
        weights: fullWeights,
        enhancement: enhancement,
        response: `ERROR: ${error.message}`,
        tokens: 0,
      })
    }
  }
  
  return NextResponse.json({ query, results })
}
```

## TASK 3: Create Frontend Test Trigger

In the workbench page or as a script, add a way to trigger the comparison test.

Create file: `scripts/test-layer-comparison.ts`

```typescript
#!/usr/bin/env npx tsx

/**
 * Layer Comparison Test
 * Sends the SAME query with 3 different layer configs
 * Compares outputs to verify calibration works
 */

const QUERY = "What are 3 strategies for building a successful startup?"

const CONFIGS = [
  {
    name: "🎨 CREATIVE (articulation:95%, expansion:90%, knowledge:20%, analysis:10%)",
    weights: { 
      4: 0.95,   // articulation HIGH
      7: 0.90,   // expansion HIGH
      8: 0.20,   // knowledge LOW
      6: 0.10,   // analysis LOW
      5: 0.85,   // synthesis HIGH
    }
  },
  {
    name: "🔬 ANALYTICAL (knowledge:95%, reasoning:90%, analysis:85%, articulation:10%)",
    weights: { 
      8: 0.95,   // knowledge HIGH
      9: 0.90,   // reasoning HIGH
      6: 0.85,   // analysis HIGH
      4: 0.10,   // articulation LOW
      7: 0.15,   // expansion LOW
    }
  },
  {
    name: "⚖️ BALANCED (all 50%)",
    weights: { 
      1: 0.5, 2: 0.5, 3: 0.5, 4: 0.5, 5: 0.5, 
      6: 0.5, 7: 0.5, 8: 0.5, 9: 0.5, 10: 0.5, 11: 0.5 
    }
  }
]

async function runTest() {
  console.log('═══════════════════════════════════════════════════')
  console.log('LAYER COMPARISON TEST')
  console.log(`Query: "${QUERY}"`)
  console.log('═══════════════════════════════════════════════════\n')
  
  const res = await fetch('http://localhost:3000/api/layer-test', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: QUERY, configs: CONFIGS }),
  })
  
  const data = await res.json()
  
  for (const result of data.results) {
    console.log('\n' + '─'.repeat(60))
    console.log(`CONFIG: ${result.configName}`)
    console.log(`Tokens: ${result.tokens}`)
    console.log('─'.repeat(60))
    console.log('\nENHANCEMENT PROMPT SENT TO AI:')
    console.log(result.enhancement.substring(0, 500) + '...')
    console.log('\nRESPONSE (first 800 chars):')
    console.log(result.response.substring(0, 800))
    console.log('\n')
  }
  
  console.log('═══════════════════════════════════════════════════')
  console.log('TEST COMPLETE — Compare the 3 responses above.')
  console.log('Creative should use metaphors/analogies.')
  console.log('Analytical should use data/facts/logic.')
  console.log('Balanced should be standard/neutral.')
  console.log('═══════════════════════════════════════════════════')
}

runTest().catch(console.error)
```

## TASK 4: Verify Compilation + Run Test

```bash
cd /Users/sheirraza/akhai/packages/web

# Verify compilation
lsof -ti:3000 | xargs kill -9 2>/dev/null
rm -rf .next
npx next dev --turbopack &

# Wait for ready
sleep 10

# Run comparison test
npx tsx scripts/test-layer-comparison.ts
```

## TASK 5: Commit

```bash
cd /Users/sheirraza/akhai
git add -A
git commit -m "fix: Replace all Kabbalistic terms with AI layer names in logs/prompts/SSE

Issue 1: Debug logs now show reception:70% instead of Malkuth:70%
Issue 2: AI prompt dominant layers use AI names not Kabbalistic
Issue 3: Added aiName field to LAYER_METADATA for all 11 layers
Issue 4: SSE pipeline events use aiName
Issue 5: Fusion activations output uses aiName

Also: Added /api/layer-test comparison endpoint + test script
to verify same query with different configs produces different outputs"
git push origin main
```

## EXECUTION ORDER
1. Fix Issue 1 (debug log names) 
2. Fix Issue 2 (AI prompt dominant layers)
3. Fix Issue 3 (add aiName to LAYER_METADATA)
4. Fix Issue 4 (SSE events)
5. Fix Issue 5 (fusion activations)
6. Create /api/layer-test endpoint
7. Create test script
8. Verify compilation
9. Run comparison test
10. Commit + push
