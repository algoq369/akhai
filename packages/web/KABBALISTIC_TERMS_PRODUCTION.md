# Kabbalistic Terms - Production Requirement

**Status:** ✅ PRODUCTION READY
**Enforcement:** MANDATORY for all Hebrew/Kabbalistic terms

---

## Core Rule

**PRODUCTION REQUIREMENT:**

> **Every Kabbalistic, Hebrew, or Sefirot term MUST be explained with its meaning.**

**No exceptions.** This is a zero-tolerance policy to ensure accessibility and understanding for all users.

---

## Why This Matters

### 1. Accessibility
- Not all users understand Hebrew or Kabbalah
- Users from different cultural backgrounds need explanations
- Clear communication is essential for trust

### 2. Educational Value
- AkhAI uses Kabbalistic framework as AI architecture
- Users should understand the system they're using
- Transparency builds confidence

### 3. Professional Standards
- Shows respect for the tradition
- Demonstrates attention to detail
- Prevents confusion and misunderstanding

---

## Implementation

### System Architecture

```
lib/kabbalistic-terms.ts          → Core dictionary & utilities
components/KabbalisticTerm.tsx    → React components
app/philosophy/page.tsx           → Usage examples
```

### Core Components

#### 1. Utility Library (`lib/kabbalistic-terms.ts`)

**Complete dictionary** of all Kabbalistic terms with:
- English name
- Hebrew name (with proper vowel points)
- Short meaning
- Full meaning (explanation)
- AI role (for Sefirot)

**Functions:**
```typescript
formatKabbalisticTerm(term, format)  // Format term for display
explainSefirotPath(path)             // Auto-explain paths
getTermData(term)                    // Get full data
```

#### 2. React Components (`components/KabbalisticTerm.tsx`)

**Three components for different use cases:**

##### A. `<KabbalisticTerm>` - Full control
```typescript
<KabbalisticTerm term="kether" format="full" />
// Renders: "Kether (כֶּתֶר - Crown)"

<KabbalisticTerm term="malkuth" format="compact" />
// Renders: "Malkuth - Kingdom"

<KabbalisticTerm term="binah" format="inline" />
// Renders: "Binah (Understanding)"
```

##### B. `<KT>` - Shorthand
```typescript
<KT t="kether" />           // Full format
<KT t="malkuth" f="compact" />  // Compact format
```

##### C. `<SefirotPath>` - Auto-explain paths
```typescript
<SefirotPath path="Kether → Malkuth" />
// Renders: "Kether (Crown) → Malkuth (Kingdom)"

<SefirotPath path="Binah → Tiferet → Malkuth" />
// Renders: "Binah (Understanding) → Tiferet (Beauty) → Malkuth (Kingdom)"
```

---

## Complete Term Dictionary

### 11 Sefirot (Emanations)

| English | Hebrew | Meaning | AI Role |
|---------|--------|---------|---------|
| Kether | כֶּתֶר | Crown | Meta-cognitive awareness |
| Chokmah | חָכְמָה | Wisdom | First principles |
| Binah | בִּינָה | Understanding | Pattern recognition |
| Da'at | דַּעַת | Knowledge | Hidden insights |
| Chesed | חֶסֶד | Mercy | Expansive possibilities |
| Gevurah | גְּבוּרָה | Severity | Critical analysis |
| Tiferet | תִּפְאֶרֶת | Beauty | Integration, synthesis |
| Netzach | נֶצַח | Victory | Creative exploration |
| Hod | הוֹד | Glory | Logical analysis |
| Yesod | יְסוֹד | Foundation | Implementation |
| Malkuth | מַלְכוּת | Kingdom | Factual data |

### Core Concepts

| Term | Hebrew | Meaning | Explanation |
|------|--------|---------|-------------|
| Sefirot | סְפִירוֹת | Emanations | Divine attributes |
| Etz Chayim | עֵץ חַיִּים | Tree of Life | Diagram of emanations |
| Qliphoth | קְלִיפּוֹת | Shells | Shadow aspects |
| Tikkun Olam | תִּקּוּן עוֹלָם | World Repair | Healing the world |

### Golem Protocol

| Term | Hebrew | Meaning | Explanation |
|------|--------|---------|-------------|
| EMET | אֱמֶת | Truth/Life | Word of activation |
| MET | מֵת | Death | Deactivation (Aleph removed) |
| Golem | גּוֹלֶם | Animated Being | Artificial creature |

### Three Pillars

| Pillar | Hebrew | Meaning | Sefirot |
|--------|--------|---------|---------|
| Pillar of Mercy | עַמּוּד הַחֶסֶד | Right Pillar | Chokmah, Chesed, Netzach |
| Pillar of Severity | עַמּוּד הַדִּין | Left Pillar | Binah, Gevurah, Hod |
| Middle Pillar | עַמּוּד הָאֶמְצָעִי | Balance | Kether, Tiferet, Yesod, Malkuth |

### Infinite Source

| Term | Hebrew | Meaning | Explanation |
|------|--------|---------|-------------|
| Ain | אַיִן | Nothingness | Void before creation |
| Ain Soph | אֵין סוֹף | Without End | Infinite source |
| Ain Soph Aur | אֵין סוֹף אוֹר | Limitless Light | Infinite light |

---

## Usage Guidelines

### ✅ CORRECT Usage

#### In Text
```typescript
// Always explain
<p>The journey begins at <KT t="malkuth" /> and ascends to <KT t="kether" />.</p>
// Renders: "...at Malkuth (Kingdom) and ascends to Kether (Crown)."
```

#### In Paths
```typescript
// Auto-explain with SefirotPath
<SefirotPath path="Kether → Chokmah → Binah" />
// Renders: "Kether (Crown) → Chokmah (Wisdom) → Binah (Understanding)"
```

#### In Headers
```typescript
<h2>The <KT t="etzChayim" f="compact" /> Structure</h2>
// Renders: "The Etz Chayim - Tree of Life Structure"
```

#### In Code Comments
```typescript
// When Kether (Crown - meta-cognitive) protocol is active...
```

### ❌ INCORRECT Usage

```typescript
// NEVER use bare Hebrew
<p>The כֶּתֶר protocol...</p>  ❌

// NEVER use bare Sefirot names without explanation (in UI)
<span>Kether</span>  ❌

// ALWAYS include meaning
<span>Kether (Crown)</span>  ✅
<KT t="kether" />  ✅
```

### ⚠️ EXCEPTION

**Code variables and function names** can use bare terms:
```typescript
// OK in code
const ketherLevel = 10
function ascendToKether() { ... }

// But in UI/comments, explain:
// Ascend to Kether (Crown - meta-cognitive awareness)
```

---

## Format Options

### Full Format
```
"Kether (כֶּתֶר - Crown)"
```
**Use when:** First mention, educational context, tooltips

### Compact Format
```
"Kether - Crown"
```
**Use when:** Space is limited, repeat mentions

### Inline Format
```
"Kether (Crown)"
```
**Use when:** Running text, casual mention

---

## Display Formats

### Format Comparison

| Format | Example | Use Case |
|--------|---------|----------|
| `full` | Kether (כֶּתֶר - Crown) | First mention, tooltips |
| `compact` | Kether - Crown | Repeat mentions |
| `inline` | Kether (Crown) | Running text |

---

## Tooltips

All `<KabbalisticTerm>` components automatically include tooltips on hover:

```
Hover tooltip shows:
────────────────────
כֶּתֶר (Crown)
The highest Sefirah representing
meta-cognitive awareness and divine will

AI Role: Meta-cognitive questions,
highest awareness
────────────────────
```

---

## Production Checklist

Before deploying any page with Kabbalistic terms:

- [ ] All Sefirot names explained
- [ ] All Hebrew terms have English translations
- [ ] Tooltips provide full context
- [ ] First mention uses `full` format
- [ ] Paths use `<SefirotPath>` component
- [ ] Code comments explain terms
- [ ] No bare Hebrew in UI
- [ ] Accessibility verified

---

## Examples from Codebase

### Philosophy Page

**Before:**
```typescript
<span>Kether → Malkuth</span>
```

**After:**
```typescript
<SefirotPath path="Kether → Malkuth" />
// Renders: "Kether (Crown) → Malkuth (Kingdom)"
```

### Methodology Cards

**Before:**
```typescript
path: 'Binah → Tiferet → Malkuth'
```

**After:**
```typescript
<SefirotPath path="Binah → Tiferet → Malkuth" />
// Auto-explains: "Binah (Understanding) → Tiferet (Beauty) → Malkuth (Kingdom)"
```

### Ascent Tracker

**Before:**
```typescript
<div>Level: Kether</div>
```

**After:**
```typescript
<div>Level: <KT t="kether" /></div>
// Renders: "Level: Kether (כֶּתֶר - Crown)"
```

---

## Testing

### Manual Testing

1. **Visual Check:**
   - All Sefirot names have meanings in parentheses
   - Hebrew characters render correctly
   - Tooltips appear on hover

2. **Accessibility:**
   - Screen readers can access full terms
   - No unexplained Hebrew
   - Clear hierarchy

3. **Responsive:**
   - Terms wrap properly on mobile
   - Tooltips don't overflow screen

### Automated Testing

```typescript
// Test that all Sefirot paths are explained
expect(screen.getByText(/Kether \(Crown\)/)).toBeInTheDocument()

// Test tooltip presence
const term = screen.getByText(/Kether/)
expect(term).toHaveAttribute('title')
```

---

## Enforcement

### Code Review Checklist

- [ ] All Kabbalistic terms use components
- [ ] No bare Hebrew in UI
- [ ] Tooltips work
- [ ] Formats are consistent
- [ ] Documentation updated

### CI/CD Checks

Optional: Add linter rule to flag bare Sefirot names in JSX:

```javascript
// .eslintrc.js
rules: {
  'no-bare-sefirot': 'error'  // Custom rule
}
```

---

## Migration Guide

### Migrating Existing Code

**Step 1:** Find all Sefirot mentions
```bash
grep -r "Kether\|Chokmah\|Binah" app/
```

**Step 2:** Replace with components
```typescript
// Before
<span>Kether</span>

// After
<KT t="kether" />
```

**Step 3:** Update paths
```typescript
// Before
<span>Kether → Malkuth</span>

// After
<SefirotPath path="Kether → Malkuth" />
```

---

## API Reference

### `formatKabbalisticTerm()`

```typescript
formatKabbalisticTerm(
  term: KabbalisticTermKey,
  format: 'full' | 'compact' | 'tooltip' | 'inline'
): string
```

**Returns:** Formatted string

**Examples:**
```typescript
formatKabbalisticTerm('kether', 'full')
// "Kether (כֶּתֶר - Crown)"

formatKabbalisticTerm('malkuth', 'compact')
// "Malkuth - Kingdom"

formatKabbalisticTerm('binah', 'inline')
// "Binah (Understanding)"
```

### `explainSefirotPath()`

```typescript
explainSefirotPath(path: string): string
```

**Returns:** Path with all Sefirot explained

**Examples:**
```typescript
explainSefirotPath("Kether → Malkuth")
// "Kether (Crown) → Malkuth (Kingdom)"

explainSefirotPath("Binah → Tiferet → Malkuth")
// "Binah (Understanding) → Tiferet (Beauty) → Malkuth (Kingdom)"
```

### `getTermData()`

```typescript
getTermData(term: KabbalisticTermKey): {
  english: string
  hebrew: string
  meaning: string
  fullMeaning: string
  aiRole?: string
}
```

**Returns:** Complete term data

---

## Future Enhancements

### Phase 2
- [ ] Auto-detect bare terms in markdown
- [ ] Generate glossary page from dictionary
- [ ] Multi-language support (FR, ES, etc.)

### Phase 3
- [ ] Interactive Tree of Life visualization
- [ ] Click term to see full explanation
- [ ] Related terms suggestions

---

## Summary

**Production Rule:** Every Kabbalistic term MUST be explained.

**Three components:**
1. `<KabbalisticTerm>` - Full control
2. `<KT>` - Shorthand
3. `<SefirotPath>` - Auto-explain paths

**Formats:**
- Full: "Kether (כֶּתֶר - Crown)"
- Compact: "Kether - Crown"
- Inline: "Kether (Crown)"

**Coverage:**
- ✅ 11 Sefirot
- ✅ Core concepts
- ✅ Golem protocol
- ✅ Pillars
- ✅ Infinite source

**All terms include:**
- English name
- Hebrew (with vowels)
- Short meaning
- Full explanation
- Hover tooltip

---

*Updated: December 31, 2025*
*AkhAI - Sovereign Intelligence - Zero Hallucination Tolerance*

**PRODUCTION REQUIREMENT ENFORCED**
