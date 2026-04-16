# DEPTH ANNOTATION SYSTEM — DEEP AUDIT REPORT
## Day 98/150 · 504 commits · Target: fix semantic relevance of sigils

---

## 🔬 HOW THE CURRENT SYSTEM WORKS

### Pipeline
1. **Stream chunk arrives** → `processStreamingChunk()`
2. **Text processed** → `detectAnnotations()` runs regex patterns against buffer
3. **Each regex match** → `extractor()` builds `{term, content, position, ...}`
4. **Render** → `DepthText` finds term in text via word-boundary regex, places `<DepthSigil>` AFTER matched term
5. **Sigil color/shape** → `getLayerColorForAnnotation(ann.content)` picks from 10-layer map

### Files involved (1706 lines total)
- `lib/depth-annotations.ts` (310) — types, detectAnnotations, streaming orchestration
- `lib/depth/patterns.ts` (145) — DetectionPattern type + imports category bundles
- `lib/depth/patterns-general.ts` (369) — generic patterns + tag patterns
- `lib/depth/patterns-tech.ts` (444) — technology patterns
- `lib/depth/patterns-science.ts` (483) — science patterns
- `lib/depth/patterns-tags.ts` (265) — tag-specific patterns
- `lib/layer-colors.ts` (182) — layer color/shape map + `getLayerColorForAnnotation`
- `components/DepthAnnotation.tsx` (205) — DepthText rendering component
- `components/DepthSigil.tsx` (60) — the clickable sigil UI

---

## 🐛 ISSUES — LISTED FOR STEP-BY-STEP FIX

### Issue 1 · PATTERN OVER-MATCHING (most important)
**File:** `lib/depth/patterns-general.ts:66`
```js
/\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3})\b/g
```
**Problem:** Matches ANY 2-4 word capitalized phrase:
- "The World Economic Forum" ✅ (OK but generic insight)
- "The Forum" ❌ (meaningless — generates `Forum◦`)
- "Global Shapers Community" ✅ (OK)
- "Post Office" ❌ (would match anything capitalized)

**Impact:** Sigils appear next to random proper nouns without semantic value.

### Issue 2 · HARD-CODED 500-WORD ESSAYS
**File:** `lib/depth/patterns-general.ts:120-250+`
**Problem:** The extractor has ~20 `if (/specific-term/i.test(term))` branches each containing **500+ word hardcoded essays** (e.g., "demographic dividend", "AGI", "BCI", "DeFi"). Terms outside this dictionary fall through to a generic placeholder where `content: match[0]` — meaning the "insight" is literally the term itself.

**Impact:** Most annotations have zero added value. User clicks a sigil and sees the same word again.

### Issue 3 · THREE COMPETING SIGIL SYSTEMS
Different files use different layer maps:

| File | Map | Sigils | Count |
|------|-----|--------|-------|
| `components/ResponseRenderer.tsx` | TITLE_LAYER_MAP | ● ▽ □ ⊕ ☉ ◈ ○ △ → ◊ ✦ | **11 layers** |
| `lib/layer-colors.ts` | LAYER_COLOR_MAP | ◊ → △ ⊕ △ ○ → ○ ○ ○ | **10 layers** (duplicates) |
| `lib/depth/patterns-general.ts` | sigilMap in extractor | ◊ → △ ○ ⊕ ◇ ☿ | **inline hardcoded** |

**Impact:** A term detected as TECHNICAL in patterns gets `◊`, then `getLayerColorForAnnotation` looks up the content "`◊ TECHNICAL`" and finds no regex match → falls through to default Embedding `○` stone color. **The sigil the user sees depends on string parsing, not semantics.**

### Issue 4 · LAYER ASSIGNMENT BY SURFACE REGEX
**File:** `lib/layer-colors.ts:86-180`
`getLayerColorForAnnotation(content)` runs 12 regex tests against the CONTENT STRING (not the original term or the surrounding context) to pick a layer. Order-dependent cascade means:
- Any content with "leader" → Reasoning blue (even if it's about a technical leader)
- Any content with "$" → Discriminator red
- Default fallthrough → Embedding stone gray

**Impact:** Semantic meaning is ignored. The layer is picked from whatever keyword happens to appear in the post-extraction content string.

### Issue 5 · NO RELEVANCE FILTER
`detectAnnotations()` returns EVERY regex match (deduped by 20-char proximity + capped by density). No scoring of:
- Does this annotation add information beyond the term itself?
- Is the content substantive or just a label?
- Is the surrounding paragraph already explaining this concept?

**Impact:** Density is artificially controlled by slicing to N matches, not by keeping only the N most valuable.

### Issue 6 · POSITION FINDING IS INDEX-BASED, NOT TERM-BASED
**File:** `components/DepthAnnotation.tsx:116-120`
The component finds each term by `text.indexOf(ann.term)` — always the FIRST occurrence. If "Forum" appears 5 times in the text, 5 annotations all collapse onto the first occurrence, and later occurrences get no sigils.

### Issue 7 · TAG REGEX MATCHES CONTENT WITHIN STRIPPED HEADERS
**File:** `lib/depth/patterns-general.ts:17-18`
```js
/\[(?:TECHNICAL|STRATEGIC|CRITICAL|...)\](?::?\s*)/gi
```
These tag patterns were designed for free-tier `[TECHNICAL]:` markers. But ResponseRenderer now STRIPS those tags during parsing (commit 026661d). Result: the regex runs on text where the tags have already been removed. Dead code.

### Issue 8 · HEBREW TERMS STILL DETECTED
**File:** `lib/depth-annotations.ts:95-97`
```js
if (config.annotationTypes.includes('detail')) {
  annotations.push(...detectHebrewTerms(text));
}
```
User removed Hebrew display from UI (commit 0dbd709) but the detection still runs, polluting annotations with Kabbalistic terms that never render cleanly.

---

## 🎯 WHAT GOOD DEPTH ANNOTATIONS LOOK LIKE

A **relevant** annotation:
1. Attaches to a term that SPECIFICALLY needs context (not every capitalized phrase)
2. Its INSIGHT provides non-obvious info not already in surrounding prose
3. Its SIGIL reflects the semantic role (metric → red △, pattern → indigo △, etc.) using the 11-layer system
4. It clicks through to an expand query that actually explores that term

A **bad** annotation (current system):
- "Forum◦" — no information, wrong layer sigil (Embedding fallback)
- "World Economic Forum◊" — insight is just "World Economic Forum" again
- "The Network◊" — matches capitalized pattern but is a section title, not a term

---

## 🛠 PROPOSED FIX STRATEGY (4 PHASES)

### Phase 1 · SEVER THE OVER-MATCHING PATTERNS
Remove PRIORITY 1 (generic capitalized multi-word) and PRIORITY 2 (generic compound adjectives) from `patterns-general.ts`. Keep only PRIORITY 4 specific named concepts (AGI, BCI, DeFi, etc.) plus tech/science category bundles.

### Phase 2 · ALIGN SIGIL SYSTEMS
Collapse 3 layer systems to 1. Export `TITLE_LAYER_MAP` from ResponseRenderer. Rewrite `getLayerColorForAnnotation` to use this map. Remove duplicate LAYER_COLOR_MAP.

### Phase 3 · ADD RELEVANCE GATE
After extracting annotations, run each through `isValuableAnnotation(ann)`:
- reject if content === term (no added info)
- reject if content length < 30 chars
- reject if term appears in section TITLE (already emphasized)
- reject if surrounding sentence already defines the term

### Phase 4 · REMOVE DEAD CODE
- Remove tag detection (ResponseRenderer strips tags before render)
- Remove Hebrew term detection (Hebrew UI gone)
- Remove hardcoded 500-word essays → replaced by compact structured hints

---

## 📊 EXPECTED OUTCOME AFTER FIX

Before (current):
```
The World Economic Forum⊙ operates not as a government but as 
a coordination layer◊ — a meta-institution that aligns policy 
across sovereign boundaries without formal authority. 
The Forum⊙ includes Governments⊙, Corporations○, academia⊕.
```
(5 sigils, ~2 meaningful, 3 noise)

After (target):
```
The World Economic Forum△ operates not as a government but as 
a coordination layer — a meta-institution that aligns policy 
across sovereign boundaries without formal authority. 
The Forum includes ~120 governments◈, 1000 corporations◈, academia.
```
(3 sigils, all meaningful: WEF = pattern layer △; numbers = critical metric ◈)
