# Hype Detection Fix

## Problem Identified

**Query**: "i can make 4 trillion in 4 days"  
**Expected**: Should trigger hype detection  
**Actual**: Hype score was 0 (not detected)

## Root Cause

The hype detection was only checking the **response** text for hype words like "revolutionary", "amazing", etc. It was NOT checking the **query** for extreme monetary claims.

## Fix Applied

Enhanced hype detection to check both query and response:

1. **Query Analysis**: 
   - Detects extreme monetary patterns: `\d+ trillion/billion in X days/weeks/months`
   - Patterns like "make 4 trillion in 4 days" are now detected
   - Adds +3 to hype score for extreme claims in query

2. **Response Analysis**:
   - Still checks for hype words (revolutionary, amazing, etc.)
   - Also checks for extreme monetary claims in response
   - Adds +2 to hype score for extreme claims in response

3. **Scoring**:
   - Response hype words: +1 each (max ~10)
   - Query extreme claims: +3
   - Response extreme claims: +2
   - Threshold: >= 2 triggers hype detection

## Code Changes

**File**: `packages/web/app/api/simple-query/route.ts` (lines 443-489)

```typescript
// Enhanced hype detection
const extremeMonetaryPatterns = [
  /\d+\s*(trillion|billion).*?(day|days|week|weeks|month|months)/i,
  /(trillion|billion).*?\d+\s*(day|days|week|weeks|month|months)/i,
  /make.*?\d+\s*(trillion|billion)/i,
  /earn.*?\d+\s*(trillion|billion)/i,
]

const queryHasExtremeClaims = extremeMonetaryPatterns.some(pattern => pattern.test(query))
const responseHasExtremeClaims = extremeMonetaryPatterns.some(pattern => pattern.test(responseLower))

let hypeCount = responseHypeCount
if (queryHasExtremeClaims) hypeCount += 3
if (responseHasExtremeClaims) hypeCount += 2
```

## Test Cases

### Should Trigger Hype:
- ✅ "i can make 4 trillion in 4 days" → Query extreme claim (+3)
- ✅ "I will earn 1 billion in 1 week" → Query extreme claim (+3)
- ✅ "revolutionary amazing product" → Response hype words (+2)
- ✅ "make 2 trillion dollars" → Query extreme claim (+3)

### Should NOT Trigger:
- ❌ "What is Bitcoin?" → No hype words, no extreme claims
- ❌ "Calculate 2+2" → No hype words, no extreme claims
- ❌ "Explain AI" → No hype words, no extreme claims

## Verification

After fix, query "i can make 4 trillion in 4 days" should show:
- **Hype Score**: >= 3 (detected)
- **Hype Triggered**: true
- **Issues**: ["hype", "sanity"]

## Instrumentation Added

Added debug logging to track:
- Query text
- Response hype word count
- Query extreme claims detection
- Response extreme claims detection
- Final hype count

Log location: `/Users/sheirraza/akhai/.cursor/debug.log`

