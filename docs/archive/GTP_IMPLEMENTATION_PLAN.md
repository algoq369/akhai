# AkhAI GTP (Generative Thoughts Process) Implementation Plan

## Overview
Bio-inspired parallel Flash architecture based on DARPA's Generative Optogenetics concept.
Instead of sequential advisor calls, we "flash" context to ALL advisors simultaneously.

## Key Concept
```
Traditional (Sequential):   Flash (Parallel):
Query → A1 → A2 → A3        Query → [A1, A2, A3] (simultaneous)
       ↓    ↓    ↓                      ↓
      30s + 30s + 30s = 90s            30s total
```

## Architecture
```
Mother Base creates Flash Context Frame
         │
         ▼ ═══════════════════════════
         │    SIMULTANEOUS FLASH      │
         ▼ ═══════════════════════════
    ┌────┼────┬───────────┐
    ▼    ▼    ▼           ▼
  Slot1 Slot2 Slot3    [Future]
    │    │     │          │
    └────┴─────┴──────────┘
         │
         ▼
   Living Database (real-time merge)
         │
         ▼
   Mother Base Synthesis
```

## File Structure to Create
```
packages/core/src/methodologies/
├── types.ts                    # Phase 1
├── selector.ts                 # Phase 7
├── executor.ts                 # Router
└── gtp/
    ├── index.ts                # Phase 6: Main GTP executor
    ├── FlashContextBuilder.ts  # Phase 2
    ├── FlashBroadcaster.ts     # Phase 3
    ├── LivingDatabase.ts       # Phase 4
    └── QuorumManager.ts        # Phase 5
```

---

## PHASE 1: Core Types (30 min)
**File:** `/packages/core/src/methodologies/types.ts`

Create interfaces:
- `MethodologyType`: 'direct' | 'cot' | 'aot' | 'gtp' | 'auto'
- `QueryAnalysis`: complexity, queryType, requiresMultiplePerspectives, etc.
- `FlashContextFrame`: version, query, projectState, advisorTasks, constraints
- `AdvisorTask`: slot, family, role, specificFocus, avoidTopics
- `LivingDatabaseState`: vectorClock, responses, mergedInsights, consensusState
- `AdvisorResponse`: slot, family, content, confidence, keyPoints, status
- `MergedInsight`: content, supportingSlots, confidence, category
- `QuorumConfig` & `QuorumResult`
- `GTPResult`: flashContext, livingDatabase, quorum, synthesis, metrics
- `GTPCallbacks`: onFlashPrepare, onFlashBroadcast, onAdvisorStart/Complete, etc.

**Validation:** `pnpm build` succeeds

---

## PHASE 2: Flash Context Builder (45 min)
**File:** `/packages/core/src/methodologies/gtp/FlashContextBuilder.ts`

Key methods:
- `build(query, queryAnalysis, advisorSlots)` → FlashContextFrame
- `buildProjectState()` - the "bigger picture"
- `assignAdvisorTasks()` - different roles per slot (technical, strategic, creative, critical)
- `buildConstraints()` - based on complexity
- `compressPriorKnowledge()` - token optimization
- `toPrompt(frame, slot)` - convert frame to advisor-specific prompt

Role assignments:
- Slot 1: Technical (implementation, feasibility)
- Slot 2: Strategic (market, competition)  
- Slot 3: Creative (unconventional, edge cases)
- Slot 4: Critical (risks, weaknesses)

**Validation:** Can create context frames, different roles assigned

---

## PHASE 3: Flash Broadcaster (45 min)
**File:** `/packages/core/src/methodologies/gtp/FlashBroadcaster.ts`

Key methods:
- `broadcast(frame, advisorProviders, callbacks)` → BroadcastResult
- Uses `Promise.allSettled()` for TRUE parallel execution
- `callAdvisorWithTimeout()` - per-advisor timeout protection
- Progress tracking via callbacks

**Critical:** Must use Promise.allSettled, NOT sequential awaits!

```typescript
const results = await Promise.allSettled(
  advisorPromises.map(({ slot, promise }) => 
    promise.then(response => ({ slot, response }))
  )
);
```

**Validation:** All advisors called simultaneously, failed ones don't block others

---

## PHASE 4: Living Database (45 min)
**File:** `/packages/core/src/methodologies/gtp/LivingDatabase.ts`

Key methods:
- `merge(response)` - merge advisor response into state
- `extractInsights(response)` - pull key points
- `findSimilarInsight()` - dedup using Jaccard similarity
- `detectConflicts()` - find opposing positions
- `updateAgreementLevel()` - consensus tracking
- `generateSummary()` - for Mother Base synthesis

Vector clock for causal ordering:
```typescript
vectorClock: Record<number, number>  // slot -> logical time
```

**Validation:** Responses merge, conflicts detected, agreement calculated

---

## PHASE 5: Quorum Manager (30 min)
**File:** `/packages/core/src/methodologies/gtp/QuorumManager.ts`

Key methods:
- `start()` - begin timing
- `check(state)` → QuorumResult
- `waitForQuorum(getState, pollInterval)` - async wait

Quorum triggers:
1. Minimum responses received (default: 2)
2. Early exit on high agreement (85%+)
3. Timeout (default: 60s)
4. All advisors complete

**Validation:** Quorum detection works, early exit works

---

## PHASE 6: GTP Executor (45 min)
**File:** `/packages/core/src/methodologies/gtp/index.ts`

Main `execute()` flow:
1. Build Flash Context Frame
2. Initialize Living Database
3. Start Quorum Manager
4. Broadcast to all advisors (parallel)
5. Merge responses into Living Database
6. Check quorum
7. Mother Base synthesis
8. Return GTPResult

Export all components from index.ts

**Validation:** Full GTP execution works end-to-end

---

## PHASE 7: Methodology Selector (30 min)
**File:** `/packages/core/src/methodologies/selector.ts`

Key methods:
- `analyzeQuery(query)` → QueryAnalysis
- `selectMethodology(analysis)` → MethodologySelection

Selection logic:
- `direct`: complexity < 0.3, factual queries
- `cot`: sequential reasoning, procedural, debugging
- `aot`: high complexity, research, multi-step
- `gtp`: comparative, creative, multiple perspectives needed

Query type detection keywords:
- comparative: "vs", "compare", "difference between"
- research: "research", "investigate", "comprehensive"
- creative: "brainstorm", "ideas", "innovative"
- procedural: "how to", "step by step"

**Validation:** Correct methodology selected for each query type

---

## PHASE 8: Integration (45 min)

### 8.1 Update `/packages/web/app/api/query/route.ts`
- Accept `methodology` param in POST body
- Route to `executeGTPWithEvents()` for GTP
- Keep existing Flow A as fallback

### 8.2 Create `/packages/web/lib/gtp-executor.ts`
- Wrap GTP execution with SSE events
- Map GTP callbacks to `emitEvent()` calls
- New events: flash-prepare, flash-broadcast, advisor-progress, merge-update, quorum-progress, synthesis-start/complete

### 8.3 Update database schema (optional)
- Change `flow` column to `methodology` or add new column

**Validation:** API accepts methodology, SSE events stream correctly

---

## PHASE 9: UI Updates (45 min)

### 9.1 Update `/packages/web/app/page.tsx`
Replace Flow A/B radio buttons with 5-option methodology selector:
- Auto (🎯)
- Direct (⚡) 
- Chain of Thought (🔗)
- Atom of Thoughts (⚛️)
- Flash/GTP (🧬)

### 9.2 Create `/packages/web/components/FlashProgress.tsx`
New component showing:
- Parallel progress bars for each advisor
- Quorum status (X/Y required)
- Agreement level meter
- Key points preview as they come in

### 9.3 Update `/packages/web/components/VerificationWindow.tsx`
- Handle GTP-specific events
- Show Flash progress when methodology is GTP

**Validation:** UI renders, methodology selection works, parallel progress displays

---

## PHASE 10: Testing (60 min)

Test cases:
1. "What is the capital of France?" → Direct
2. "How to deploy Node.js step by step" → CoT  
3. "Compare React vs Vue vs Angular" → GTP
4. "Research quantum computing trends" → AoT or GTP
5. "Brainstorm startup ideas for AI" → GTP

Validation checklist:
- [ ] All phases build without errors
- [ ] Types exported from @akhai/core
- [ ] Flash Context Builder creates valid frames
- [ ] Broadcaster uses Promise.allSettled (truly parallel)
- [ ] Living Database merges and detects conflicts
- [ ] Quorum Manager triggers correctly
- [ ] Full GTP execution completes
- [ ] Selector routes correctly
- [ ] API integration works
- [ ] UI updates in real-time

---

## Reference: Existing Code Locations

- Core system: `/packages/core/src/AkhAISystem.ts`
- Types: `/packages/core/src/models/types.ts`
- Providers: `/packages/core/src/providers/`
- Web API: `/packages/web/app/api/query/route.ts`
- Executor: `/packages/web/lib/akhai-executor.ts`
- UI: `/packages/web/app/page.tsx`
- Progress: `/packages/web/components/VerificationWindow.tsx`
- Database: `/packages/web/lib/database.ts`

## Reference: Current Callback Interface
```typescript
interface ExecutionCallbacks {
  onAdvisorStart?: (slot, family, round) => void;
  onAdvisorComplete?: (slot, family, round, output) => void;
  onConsensusCheck?: (round, reached) => void;
  onRoundComplete?: (round, totalRounds) => void;
  onRedactorStart?: () => void;
  onRedactorComplete?: (synthesis, family) => void;
  onMotherBaseReview?: (exchange, approved, response) => void;
}
```

Extend with GTP callbacks - don't modify existing ones.

---

## Estimated Timeline
| Phase | Duration | Cumulative |
|-------|----------|------------|
| 1. Types | 30 min | 30 min |
| 2. FlashContextBuilder | 45 min | 1h 15m |
| 3. FlashBroadcaster | 45 min | 2h |
| 4. LivingDatabase | 45 min | 2h 45m |
| 5. QuorumManager | 30 min | 3h 15m |
| 6. GTPExecutor | 45 min | 4h |
| 7. Selector | 30 min | 4h 30m |
| 8. Integration | 45 min | 5h 15m |
| 9. UI | 45 min | 6h |
| 10. Testing | 60 min | 7h |

---

## Key Principles

1. **True Parallelism**: Use `Promise.allSettled()`, never sequential awaits
2. **Graceful Degradation**: Failed advisors don't block others
3. **Role Differentiation**: Each advisor has unique focus to prevent redundancy
4. **Living State**: Database updates in real-time as responses arrive
5. **Quorum-Based**: Don't wait for all - proceed when enough agree
6. **Backward Compatible**: Existing Flow A/B still works
