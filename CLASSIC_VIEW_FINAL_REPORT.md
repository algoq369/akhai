# CLASSIC VIEW — FINAL AUDIT REPORT
## Day 98/150 · 498 commits · Session: 13 commits on classic-view

---

## 🔬 DEEP ROOT-CAUSE ANALYSIS

### The Real Problem
Our Classic View enhancement is **reactive** — it detects structural markers (`##`, `[TAG]`, `**PATH**`, etc.) the AI produces. But the AI is only **instructed** to produce structured output for certain methodologies.

### System Prompts per Methodology

| Methodology | System Prompt Instructs Structure? | AI Output Format |
|-------------|-----------------------------------|------------------|
| `direct` | ❌ "Be straightforward, concise" | Prose paragraphs with inline `**bold**` |
| `auto` | ❌ Routes to direct when simple | Same as direct — prose |
| `sc` | ✅ "PATH 1/2/3, CONSENSUS" | Structured PATH format ✅ |
| `cod` | ✅ "DRAFT 1/2/3, FINAL" | Structured DRAFT format ✅ |
| `aot` | ✅ "DECOMPOSE/SOLVE/CONTRACT" | Structured atoms ✅ |
| `tot` | ⚠️ Produces Tier/Path variably | Mixed structured/prose |
| `react` | ⚠️ | Mixed |
| `pas` | ⚠️ | Mixed |

### Live Test Result (from screenshot query)
```
Query: "most impactful society-wide AI projects"
Methodology used: auto → direct
Structural markers detected:
  ✅ 1 main # header ("AI Projects Reshaping Society")
  ❌ 0 ## sub-headers
  ❌ 0 bold headers on own line (**Healthcare** is INLINE, not standalone)
  ❌ 0 PATH/TIER/STEP patterns
Result: User sees ONE colored title, rest is plain prose
```

---

## 📊 ISSUES LIST

| # | Issue | Root Cause | Fix |
|---|-------|------------|-----|
| 1 | Direct mode produces prose, no sub-sections | System prompt doesn't instruct structure | Update direct mode prompt |
| 2 | Inline `**bold**` labels not detected as sections | Our regex requires bold on own line | Expand regex OR prompt AI to put bold on own line |
| 3 | Depth sigils appear on fewer terms than expected | Pattern matching in detectAnnotations too narrow | Expand trigger patterns |
| 4 | Plain `PATH N (label):` not detected | Missing regex alternative | Add to sectionRegex |
| 5 | Methodology coverage uneven | Only SC/COD/AOT have structured prompts | Standardize ALL methodology prompts |

---

## 🎯 STRATEGIC DECISION

### Apply to ALL methodologies universally (recommended) ✅
**Method:** Add a UNIVERSAL output formatting instruction to every methodology's system prompt.
**Benefit:** One change affects all methodologies. Future-proof.
**Risk:** Very low — instructs AI to produce slightly more structure.

### Per-methodology step-by-step (not recommended)
**Method:** Test each methodology, tune each prompt separately.
**Benefit:** Fine-grained control.
**Risk:** High maintenance, inconsistent output.

---

## 🏗️ UNIVERSAL STRUCTURING PATCH

### What to add to every system prompt
```
STRUCTURE YOUR RESPONSE:
- Use ## headers for 2+ major sections when response has distinct topics
- When listing items (projects, tiers, phases), format each as:
  **Label — description**
  Followed by a paragraph on a new line.
- When producing comparison data, use markdown tables.
- Avoid inline bold for section labels; put section labels on their own line.
```

### Apply to:
1. `lib/query-handler.ts:174` — direct mode prompt
2. `lib/query-handler.ts:METHODOLOGY_INSTRUCTIONS` — all methodology instructions
3. Any other system prompt in the codebase

---

## 🎨 DEPTH ANNOTATIONS STATUS

Working but limited. Current patterns in `lib/layer-colors.ts:getLayerColorForAnnotation`:
- `$[\d,]+[KMB]|\d+%|\d+x` → Discriminator (red)
- `paradigm|revolutionary|fundamental` → Meta-Core (purple)
- `first|leader|pioneer|dominant` → Reasoning (blue)
- `breakthrough|novel|innovative` → Generative (green)
- `similar|compared|pattern|trend` → Encoder (indigo)
- `combin|integrat|merg|synthesis` → Attention (yellow)

Missing patterns:
- Brand names (OpenAI, Anthropic, etc.) — no color mapping
- Technical terms (protein folding, ARR, etc.)
- Country/location names (India, Singapore, China)
- Product names (GPT-4, Claude 4, Aadhaar)

### Current sigils in screenshot
The user sees `welfare◊ distribution`, `Brain◊ (Hangzhou)`, `publicly.◊`, `rights.◊` — these ARE depth annotations firing. The ◊ symbol is the default Meta-Core sigil when no pattern matches the content.

---

## ✅ RECOMMENDATION

Apply the universal structuring patch to get consistent colored sections across ALL methodologies.
Then optionally enhance depth annotation patterns to recognize brand names and technical terms.
