# ✅ SANITY CHECK Implementation Complete

## Problem Identified
Query: **"i havea project i think i can make 3 trillion dollar in 1 year"**

**Previous Behavior**: All guards passed ✅ (WRONG!)
**Expected Behavior**: Should trigger SANITY CHECK alert 🚨

## Solution Implemented

### New Guard Layer: **SANITY CHECK** (Layer 5)
Added comprehensive reality/plausibility validation to catch impossible/implausible claims.

### Detection Categories

#### 1. Extreme Monetary Claims
- **Trillion dollar claims**: Any claim ≥ $1 trillion
- **Example**: "3 trillion dollars" → Triggers: `Implausible: $3 trillion claim`

#### 2. Extreme Timeframe Compression
- **Trillion in < 3 years**: Pattern detects billion/trillion with short timeframes
- **Billion in days/weeks**: Detects implausible wealth creation speed
- **Example**: "3 trillion in 1 year" → Triggers: `Implausible: Trillion in < 3 years`

#### 3. Overnight/Instant Wealth
- Detects "overnight" or "instant" + "million/billion"
- **Example**: "make 10 trillion overnight" → Triggers: `Implausible: Overnight wealth claim`

#### 4. Physical Impossibilities
- Faster than light travel
- Perpetual motion / free energy
- 100% guarantees / absolute certainty
- **Example**: "100% guaranteed never fail" → Triggers: `Impossible: Absolute certainty`

#### 5. Mathematical Contradictions
- **Example**: Query "2+2" with response "5" → Triggers: `Math error: 2+2=5`

## Implementation Details

### Files Modified

#### 1. `packages/web/lib/logger.ts`
Added sanity check logger (line 104-106):
```typescript
sanityCheck: (violations: string[], triggered: boolean) =>
  log(triggered ? 'ERROR' : 'DEBUG', 'GUARD:SANITY',
    triggered ? `🚨 REALITY CHECK FAILED: ${violations.join(', ')}` : `Clean (reality-based)`),
```

#### 2. `packages/web/app/api/simple-query/route.ts`
Added comprehensive sanity checking logic (lines 319-400):
- Regex-based detection for monetary claims
- Pattern matching for timeframe compression
- Keyword detection for impossibilities
- Violation tracking with descriptive messages

### Guard Result Updated
Added `sanityViolations` array to guardResult (line 399):
```typescript
return {
  passed: issues.length === 0,
  issues,
  scores: {
    hype: hypeCount,
    echo: echoScore,
    drift: driftScore,
    fact: factScore,
  },
  sanityViolations,  // NEW!
}
```

## Unit Test Verification

**Test Query**: "i havea project i think i can make 3 trillion dollar in 1 year"

**Unit Test Result**:
```
✅ TRIGGERED: Trillion claim detected
✅ TRIGGERED: Trillion in < 3 years

Final violations: [
  'Implausible: $3 trillion claim',
  'Implausible: Trillion in < 3 years'
]
Triggered: true
```

## Server Logs Format

When triggered, logs will show:
```
❌ [GUARD:SANITY] 🚨 REALITY CHECK FAILED: Implausible: $3 trillion claim, Implausible: Trillion in < 3 years
⚠️  [GUARD] ⚠️ Issues found: sanity
```

When passing:
```
🔍 [GUARD:SANITY] Clean (reality-based)
```

## Test Cases

### Should Trigger ✅

| Query | Violations |
|-------|-----------|
| "3 trillion dollar in 1 year" | Trillion claim, Timeframe compression |
| "make 10 trillion overnight" | Trillion claim, Overnight wealth, Timeframe |
| "100% guaranteed never fail" | Absolute certainty |
| "faster than light travel" | FTL travel |
| "perpetual motion machine" | Physics violation |

### Should Pass ✅

| Query | Reason |
|-------|--------|
| "what are btc projections for 2030" | Asking for analysis, not claiming |
| "company valued at 1 billion" | Plausible for companies |
| "95% success rate" | Not absolute claim |

## Status: ✅ COMPLETE

- [x] Sanity check logic implemented
- [x] Logger integration complete
- [x] Unit test passing
- [x] Documentation complete
- [x] Code recompiled (Fast Refresh triggered)
- [x] Ready for production testing

## Next Steps

1. Test in production with actual queries
2. Monitor debug dashboard for GUARD:SANITY logs
3. Adjust detection thresholds based on real-world data
4. Consider adding more violation patterns as needed

---

**Implementation Date**: 2025-12-23
**Status**: Production Ready ✅
