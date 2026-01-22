# AkhAI Intelligence Layer Enhancement Summary

**Date:** January 15, 2026
**Status:** Complete

---

## Executive Summary

Comprehensive audit and enhancement of AkhAI's 5 intelligence systems:

| System | Status | Enhancement |
|--------|--------|-------------|
| Guard System | Audited | 3-level triggers, 4 detectors documented |
| Sefirot AI Tree | Enhanced | New intelligence-fusion.ts created |
| Methodology Selector | Enhanced | Sefirot-aware routing implemented |
| Side Canal | Enhanced | TF-IDF keyword extraction, bigram detection |
| Instinct Mode | Enhanced | 7 lenses mapped to Sefirot |

---

## 1. Guard System (Audited)

### Current Implementation
- **3-Level Trigger System:**
  - Level 1: Passive Scan (~2ms) - Pattern detection on every response
  - Level 2: Pattern Accumulation - Tracks concerning trends
  - Level 3: Periodic Checks - Every 10 turns / 8K tokens / 15 min

### 4 Core Detectors
| Detector | Method | Status | Gap |
|----------|--------|--------|-----|
| HypeDetector | Regex patterns + density | Working | Sentiment disabled |
| EchoDetector | Jaccard similarity | Working | Embeddings disabled |
| DriftDetector | TF-IDF keyword overlap | Working | Only first/last messages |
| FactualityDetector | TinyLettuce API | Disabled | Requires sidecar |

### Anti-Qliphoth Shield
- 5 hollow knowledge patterns detected
- Opus 4.5 semantic detection available
- Response purification working

### Recommendations
1. Enable embeddings for semantic similarity
2. Implement TinyLettuce fallback
3. Add dynamic thresholds based on query risk

---

## 2. Intelligence Fusion Layer (NEW)

**File:** `packages/web/lib/intelligence-fusion.ts` (~450 lines)

### Key Functions

```typescript
// Main fusion function
fuseIntelligence(query, sefirotWeights, instinctConfig, sideCanal)
  → IntelligenceFusionResult

// Query analysis
analyzeQuery(query) → QueryAnalysis
  - complexity: 0-1 scale
  - queryType: 8 types (factual, comparative, procedural, etc.)
  - keywords extracted
  - flags: requiresTools, isMathematical, isCreative, etc.

// Sefirot activation
calculateSefirotActivations(query, weights) → SefirotActivation[]
  - 11 Sephiroth with keyword-based activation
  - effectiveWeight = activation * userWeight

// Methodology selection
selectMethodology(analysis, sefirotActivations)
  - Scores all 7 methodologies
  - Considers Sefirot dominance
  - Returns confidence score

// Guard assessment
assessGuardStatus(query, analysis)
  - High-stakes content detection
  - Hype/certainty language flags
  - Returns: proceed | warn | block

// Extended thinking budget
calculateThinkingBudget(analysis, sefirotActivations)
  - Base: 3K tokens
  - Complexity boost: up to +6K
  - Sefirot boost (Kether/Chokmah/Binah): up to +6K
  - Cap: 12K tokens
```

### Sefirot Keyword Mappings
```typescript
MALKUTH:  data, fact, evidence, concrete, physical
YESOD:    implement, execute, process, step, build
HOD:      analyze, classify, logic, compare, evaluate
NETZACH:  create, innovate, design, artistic, vision
TIFERET:  integrate, synthesize, balance, harmony
GEVURAH:  limit, constraint, critique, risk, boundary
CHESED:   expand, elaborate, comprehensive, growth
BINAH:    pattern, structure, framework, system
CHOKMAH:  principle, wisdom, fundamental, truth
KETHER:   meta, reflect, holistic, transcend, unity
DAAT:     emerge, insight, breakthrough, revelation
```

### Path Activations
- 12 Tree of Life paths tracked
- Middle Pillar: Kether → Tiferet → Yesod → Malkuth
- Cross paths for balance detection
- Da'at connections for emergence

---

## 3. Instinct Mode Enhancement

**File:** `packages/web/lib/instinct-mode.ts` (~375 lines)

### 7 Hermetic Lenses → Sefirot Mapping

| Lens | Symbol | Sefirah | Color | Keywords |
|------|--------|---------|-------|----------|
| Exoteric | ◯ | Malkuth | amber | literal, explicit, surface |
| Esoteric | ◉ | Yesod | purple | hidden, symbol, subtle |
| Gnostic | ⊙ | Da'at | cyan | intuition, insight, gnosis |
| Hermetic | ☿ | Hod | orange | correspondence, pattern, scale |
| Kabbalistic | ✡ | Tiferet | yellow | tree, sefirot, emanation |
| Alchemical | ⚗ | Gevurah | red | transform, dissolve, refine |
| Prophetic | ◈ | Chesed | blue | future, trajectory, destiny |

### New Functions

```typescript
// Auto-detect lenses from query
autoDetectLenses(query) → string[]
  - Matches lens keywords
  - Returns active lens IDs

// Bidirectional Sefirot integration
getLensSefirotWeights(activeLenses) → Record<number, number>
calculateLensActivations(sefirotWeights) → Array<{lens, activation}>

// Lens-specific prompts
generateLensPrompt(lens, query) → string

// Holistic analysis
createHolisticAnalysis(query, lensInsights, sefirotActivations)
  → InstinctAnalysis

// Auto-config with Sefirot awareness
createAutoInstinctConfig(query, complexity, sefirotWeights)
  → InstinctConfig
```

---

## 4. Side Canal Enhancement

**File:** `packages/web/lib/side-canal.ts`

### Enhanced Keyword Extraction

**Before:** Simple frequency-based (10 words, length > 3)

**After:** TF-IDF-inspired scoring with:

1. **Stop Words:** 60+ common words filtered
2. **Domain Terms:** Technical vocabulary boosted 2x
3. **Named Entities:** Capitalized phrases detected, boosted 1.5x
4. **Compound Terms:** Bigrams detected (e.g., "machine learning")
5. **Sefirot Alignment:** Keywords matching Sefirot boosted 1.3x
6. **Word Length:** Longer words boosted 1.1x

### Scoring Formula
```typescript
finalScore = tfIdf
  * (isEntity ? 1.5 : 1)
  * (isDomain ? 2.0 : 1)
  * (sefirotMatch ? 1.3 : 1)
  * (word.length > 6 ? 1.1 : 1)
```

### New Function
```typescript
getKeywordSefirotContext(keywords) → Record<string, number>
  - Returns Sefirot scores based on keyword alignment
  - Enables context-aware suggestions
```

---

## 5. Methodology Selection (Enhanced)

### Sefirot-Aware Scoring

```typescript
// Direct: +0.2 if Malkuth dominant
// CoD: +0.3 if Chokmah+Kether dominant
// BoT: +0.3 if Binah dominant, +0.2 if Tiferet dominant
// ReAct: +0.2 if Gevurah dominant
// PoT: +0.3 if Yesod dominant
// GTP: +0.3 if Da'at dominant
```

### Query Type Detection
- 8 query types with keyword patterns
- Complexity scoring (0-1)
- Multi-part detection
- Tool requirement detection

### Extended Thinking Budget Allocation
```
Base:        3,000 tokens
Complexity:  +3,000 (0.5-0.7) or +6,000 (>0.7)
Kether:      +2,000 if effectiveWeight > 0.5
Chokmah:     +2,000 if effectiveWeight > 0.5
Binah:       +2,000 if effectiveWeight > 0.5
Maximum:     12,000 tokens
```

---

## Integration Architecture

```
User Query
    ↓
┌─────────────────────────────────────────────┐
│ INTELLIGENCE FUSION LAYER                   │
│ (intelligence-fusion.ts)                    │
├─────────────────────────────────────────────┤
│ 1. analyzeQuery()                           │
│    → complexity, queryType, keywords        │
│                                             │
│ 2. calculateSefirotActivations()            │
│    → 11 Sephiroth with effectiveWeight      │
│                                             │
│ 3. selectMethodology()                      │
│    → Sefirot-aware scoring                  │
│                                             │
│ 4. assessGuardStatus()                      │
│    → proceed/warn/block                     │
│                                             │
│ 5. calculateThinkingBudget()                │
│    → 3K-12K tokens                          │
│                                             │
│ 6. generateInstinctPrompt()                 │
│    → 7 Hermetic lenses                      │
└─────────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────────┐
│ OUTPUT: IntelligenceFusionResult            │
├─────────────────────────────────────────────┤
│ - analysis: QueryAnalysis                   │
│ - sefirotActivations: SefirotActivation[]   │
│ - selectedMethodology: CoreMethodology      │
│ - methodologyScores: MethodologyScore[]     │
│ - confidence: number                        │
│ - guardRecommendation: string               │
│ - instinctPrompt: string                    │
│ - extendedThinkingBudget: number            │
│ - processingMode: weighted|parallel|adaptive│
└─────────────────────────────────────────────┘
```

---

## Files Created/Modified

### Created
- `packages/web/lib/intelligence-fusion.ts` (~450 lines)

### Modified
- `packages/web/lib/instinct-mode.ts` (enhanced with Sefirot mapping)
- `packages/web/lib/side-canal.ts` (enhanced keyword extraction)

### Documented
- Guard system architecture
- Sefirot store structure
- Methodology selector logic

---

## Next Steps (Recommended)

1. **Wire intelligence-fusion.ts into /api/simple-query**
   - Call `fuseIntelligence()` before processing
   - Use `generateEnhancedSystemPrompt()` for prompt enhancement

2. **Enable embeddings for semantic detection**
   - Install `@xenova/transformers`
   - Enable in EchoDetector and DriftDetector

3. **Connect Side Canal context injection**
   - Wire `getContextForQuery()` into fusion layer
   - Display related topics in UI

4. **Add Instinct Mode toggle in main chat**
   - Use `createAutoInstinctConfig()` for auto-detection
   - Display active lenses in response metadata

5. **Implement Guard visual indicators**
   - Show confidence scores per response
   - Display Sefirot activation visualization

---

## Performance Expectations

| Operation | Time | Notes |
|-----------|------|-------|
| Query analysis | ~5ms | Regex + keyword extraction |
| Sefirot activation | ~10ms | Keyword matching |
| Methodology selection | ~5ms | Score calculation |
| Guard assessment | ~3ms | Pattern matching |
| Total fusion | ~25ms | Before API call |

---

**Generated by Claude Opus 4.5**
**Solo Founder: Algoq**
