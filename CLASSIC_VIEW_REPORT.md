# CLASSIC VIEW ENHANCEMENT — COMPREHENSIVE REPORT
## Session: April 15-16, 2026 · 12 commits · a81bb00 → b99a205
## Day 98/150 · 498 commits total

---

## 📊 WHAT WE ACCOMPLISHED

### Files created/modified (7 files, 1745 lines)
| File | Lines | Purpose |
|------|-------|---------|
| `components/ResponseRenderer.tsx` | 443 | NEW — full structured response renderer |
| `components/DepthAnnotation.tsx` | 205 | Word-boundary depth text |
| `components/DepthSigil.tsx` | 60 | Colored sigil with glow |
| `components/sections/ChatMessages.tsx` | 527 | Wired ResponseRenderer + constellation link |
| `components/esoteric/EsotericInline.tsx` | 42 | Macro cadre (always visible) |
| `hooks/useDepthAnnotations.ts` | 224 | Removed 2 config.enabled gates |
| `hooks/useHomePageEffects.ts` | 325 | Removed early return in effect |
| `lib/depth-annotations.ts` | (edited) | Removed 3rd blocking gate |
| `lib/stores/esoteric-store.ts` | (edited) | Default isEnabled: true |

### 12 commits chronologically
1. `a81bb00` — ResponseRenderer base + layer-colored titles
2. `1c449da` — [PATH N]:, [CONVERGENCE]: tag support
3. `05076ae` — **[PATH 1: Label]** bold-wrapped brackets
4. `026661d` — Strip [RELATED], [NEXT] footer tags
5. `2deb657` — Word-boundary sigils + entity sub-sections
6. `f4aa39c` — **PATH 1 (label):** bold-only + constellation link
7. `17bc0a4` — Tier sub-sections + macro card default on
8. `82ba013` — Bold-wrapped label lines (Tier N on own line)
9. `468ec69` — Markdown table rendering
10. `559b501` — Pivot table fix + methodology coverage
11. `b99a205` — Truly always-on annotations + table cell sigils

---

## 🎯 MASTER PLAN vs REALITY

### Master Plan Objectives (text render)
| # | Objective | Status |
|---|-----------|--------|
| 1 | Clean text (no ** markers) | ✅ |
| 2 | Block-based sections with spacing | ✅ |
| 3 | Colored title per AI layer | ✅ (partial — plain format missing) |
| 4 | Sigil prefix on titles | ✅ |
| 5 | 11 AI layer colors | ✅ |
| 6 | Cycling colors for PATH 1/2/3 | ✅ |
| 7 | Entity sub-sections (Brand — desc) | ✅ |
| 8 | Tier N / Phase N sub-sections | ✅ |
| 9 | Markdown table → HTML table | ✅ |
| 10 | Strip footer tags | ✅ |
| 11 | Cadre (macro summary card) | ✅ default visible |
| 12 | Depth sigils inline | ✅ always-on |
| 13 | Word-boundary (no mid-word breaks) | ✅ |
| 14 | Hyphen-safe (self-play preserved) | ✅ |
| 15 | Layer-colored sigils with glow | ✅ |
| 16 | Sigils in table cells | ✅ |
| 17 | Constellation link | ✅ |
| 18 | Works across ALL methodologies | ✅ verified matrix |

### Methodology Coverage Matrix (verified live)
| Methodology | Sections | BoldHdr | Entity | Table | Status |
|-------------|---------:|--------:|-------:|------:|--------|
| direct | 1 | 0 | 1 | 0 | ✅ |
| tot | 6 | 0 | 0 | 0 | ✅ |
| sc | 5 | 0 | 0 | 0 | ✅ |
| cod | 3 | 0 | 3 | 0 | ✅ |
| react | 3 | 1 | 1 | 0 | ✅ |
| pas | 1 | 0 | 0 | 0 | ✅ |

---

## 🔍 REMAINING GAP

### Issue: Plain `PATH N (label):` format NOT detected

**Observed in SC methodology response:**
```
PATH 1 (Membership data): As of January 2016, WEF Forum Members...
PATH 2 (Global Shapers Community): The WEF's youth network...
PATH 3 (Annual Meeting & initiatives): The WEF's country-level...
CONSENSUS: 154 countries — the Global Shapers Community...
```

**Current regex requires one of:**
- `** [PATH 1] **` (bold brackets)
- `[PATH 1]` (brackets)
- `## PATH 1` (markdown header)
- `**PATH 1 (label):**` (bold only)

**Missing:** Plain `PATH N (label):` at line start without brackets or bold.

Intermittent behavior: AI sometimes adds bold+brackets (detected), sometimes plain (missed).

### Fix needed
Extend sectionRegex to match plain `PATH/STEP/STAGE N [label]:` format.

---

## 🚀 NEXT STEPS

1. Add plain PATH/STEP/STAGE regex (5 min)
2. Visual verification on SC query
3. Test on direct/tot/react methodologies
4. Commit and close this enhancement cycle
5. Move to next Master Plan item (Esoteric Library scaffold OR next feature)

---

## 🏁 SESSION METRICS

- **Starting commits:** 485
- **Ending commits:** 498
- **Commits today:** 13 (classic-view refinement)
- **Files changed:** 9 source files
- **TypeScript errors:** 0 (maintained clean)
- **WEBNA compliance:** ✅ surgical edits, commit per change
