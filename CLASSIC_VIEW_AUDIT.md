# CLASSIC VIEW ENHANCEMENT — COMPLETE AUDIT
## Day 98/150 — Commit range: a81bb00 → 82ba013 (8 commits)

---

## ✅ ALL APPLIED ENHANCEMENTS (verified in code)

| # | Commit | Feature | Code Evidence |
|---|--------|---------|---------------|
| 1 | `a81bb00` | ResponseRenderer component | `ResponseRenderer.tsx` 362 lines, wired at `ChatMessages.tsx:266` |
| 2 | `a81bb00` | whitespace-pre-wrap removed | 0 occurrences in ChatMessages.tsx |
| 3 | `a81bb00` | Layer-colored section titles | `TITLE_LAYER_MAP` with 11 entries |
| 4 | `1c449da` | [PATH N]:, [CONVERGENCE] tags | `CYCLING_LAYERS` + sectionRegex |
| 5 | `1c449da` | Always-on annotations effect | `useHomePageEffects.ts` — no early return |
| 6 | `05076ae` | **[PATH 1: Label]** bracketed | Regex in parseIntoSections |
| 7 | `026661d` | Strip [RELATED], [NEXT] footers | `DENYLIST_TITLES` + preprocess |
| 8 | `2deb657` | Word-boundary sigils | `DepthAnnotation.tsx` lookbehind/ahead |
| 9 | `2deb657` | Entity sub-sections | `splitEntityParagraphs` function |
| 10 | `f4aa39c` | **PATH 1 (label):** bold-only | Regex capture group 4 |
| 11 | `f4aa39c` | Constellation link | `ChatMessages.tsx` `<Link href="/constellation">` |
| 12 | `f4aa39c` | Hyphen-safe boundaries | `(?<![\w\-'])` lookbehind |
| 13 | `f4aa39c` | Visible sigils | fontWeight 700 + textShadow glow |
| 14 | `17bc0a4` | config.enabled removed from hook | 0 occurrences in useDepthAnnotations.ts |
| 15 | `17bc0a4` | 60% entity threshold | `entityParas.length / paragraphs.length >= 0.6` |
| 16 | `17bc0a4` | Macro card always visible | EsotericInline relevance check removed |
| 17 | `82ba013` | Bold-wrapped label detection | `boldHeaderPattern` + virtualParagraphs |

**All 17 enhancements VERIFIED in code. Commits are real and persistent.**

---

## ❌ THE MISSING ENHANCEMENT (discovered from screenshot)

### Critical Gap: MARKDOWN TABLE HANDLING

**Evidence from user screenshot:**
AI produced a markdown table for "AI LLM companies revenue" query:
```
| Company | Est. Annual Revenue | Valuation | Key Model(s) | Revenue Trajectory |
|---|---|---|---|---|
| OpenAI | ~$13B (2025) | $300B | GPT-4o, o3, o4-mini | 4x YoY growth |
| Google DeepMind | ~$50B+ (Cloud AI segment) | Part of Alphabet | Gemini 2.5 Pro/Flash | ... |
| Anthropic | ~$2.5B ARR (2025) | $61.5B | Claude 3.5/4 Sonnet, Opus | 3x YoY growth |
| Meta AI | Indirect (ads uplift) | Part of Meta | Llama 4 Scout/Maverick | ... |
```

**Result in Classic View:**
- Entire table rendered as flat text wall
- Pipe characters `|` visible everywhere
- Depth sigils break table cells: `Model△(s)`, `Claude 3.5/4 Sonnet△`
- Impossible to read as a table

**Root cause:** `stripMarkdown` in ResponseRenderer.tsx has NO handling for markdown tables. We never added table detection or parsing.

---

## 🔧 FIX PLAN — Markdown Table Rendering

### Goal
Detect markdown tables in AI responses and render them as HTML `<table>` elements
with proper columns, headers, and row styling. Each row can optionally become a
sub-section with layer colors (for "Company comparison" type responses).

### Approach
1. Detect table blocks: 2+ consecutive lines matching `^\|.*\|\s*$` with a separator row `^\|[-\s|]+\|$`
2. Parse into `{headers: string[], rows: string[][]}`
3. Render as HTML table with Tailwind styling
4. Depth sigils should only annotate terms within cell content (not break cell boundaries)

### Files to modify
- `components/ResponseRenderer.tsx` — add `parseMarkdownTables` + table render component

---

## 📋 ADDITIONAL ISSUES from screenshot analysis

1. **Sigil placement in table cells** — Sigils appearing inside table syntax like `Model△(s)` because word-boundary regex doesn't know about table context
2. **Single `#` header renders as one section** — OK for this query (no sub-sections natural in tabular data)
3. **No "summary insight" below table** — Would be nice to extract key takeaways

---

## 🎯 PRIORITY

| Issue | Priority | Impact |
|-------|----------|--------|
| Markdown table rendering | 🔴 HIGH | Makes tabular responses unreadable |
| Sigil placement in tables | 🟡 MEDIUM | Visual polish |
| Summary extraction | 🟢 LOW | Nice-to-have |
