# AkhAI Web Interface - Code Audit & Fix Plan

Date: 2025-12-14 17:58
Status: Phase 2 Complete - Identifying Runtime Issues

## Current State Analysis

### What's Working ✅
1. **Build System**: Application builds successfully without TypeScript errors
2. **Dev Server**: Runs on localhost:3002 (or 3003 if 3000 is occupied)
3. **Pages Render**: All pages (Homepage, Dashboard, Settings) load and display correctly
4. **White Theme**: Successfully migrated from dark to clean white/grey theme
5. **Database**: SQLite database initializes correctly at `data/akhai.db`
6. **API Endpoints**:
   - `/api/stats` - Returns dashboard statistics ✅
   - `/api/query` - Accepts query submissions ✅
   - `/api/settings` - Handles settings CRUD ✅

###What's NOT Working ❌

#### 1. **Token Usage Not Visible (PRIMARY ISSUE)**
**Problem**: Dashboard shows "Total Tokens: 0" because no queries have completed with token tracking

**Root Causes**:
- Queries fail silently without displaying token usage
- Token tracking from `@akhai/core` CostTracker may not be propagating properly
- Usage table in database has 0 records

**Files Involved**:
- `app/api/query/route.ts:81-92` - Token tracking implementation
- `lib/database.ts:134-145` - trackUsage function
- `lib/akhai-executor.ts:119-124` - Cost report generation
- `app/dashboard/page.tsx:70-74` - Token display

#### 2. **API Keys Not Configured**
**Problem**: All providers show "Inactive" status

**Root Cause**:
- No `.env.local` file with API keys configured
- `app/api/stats/route.ts:15-18` checks for env variables

**Solution Needed**:
- User must add API keys to `.env.local`
- Or configure via Settings page

#### 3. **Query Execution May Be Failing**
**Problem**: Queries submitted but no real execution happening

**Evidence**:
- Query page shows eternal loading spinner
- No events emitted to SSE stream
- No error messages displayed

**Possible Causes**:
- API keys missing (most likely)
- @akhai/core execution failing silently
- Event emitter not working properly
- Query route error handling hiding errors

**Files to Investigate**:
- `app/api/query/route.ts` - Main query handler
- `lib/akhai-executor.ts` - Execution wrapper
- `app/api/stream/[id]/route.ts` - SSE endpoint
- `components/VerificationWindow.tsx` - Client-side event handling

#### 4. **No Error Feedback to User**
**Problem**: When queries fail, user sees loading spinner forever

**Current Behavior**:
- Homepage: Submits query, redirects to results page
- Results page: Shows loading spinner indefinitely
- No timeout mechanism
- No error display

**Solution Needed**:
- Add timeout to VerificationWindow (e.g., 60 seconds)
- Display error messages from API
- Add "query failed" state
- Show helpful error messages (e.g., "Please configure API keys in Settings")

## Problems List (Priority Order)

### P0 - Critical (Blocks Core Functionality)
1. **API Keys Not Configured** → Users cannot execute queries without API keys
2. **No Error Feedback** → Users don't know why queries aren't working

### P1 - High (Core Features Broken)
3. **Token Usage Not Tracking** → Dashboard shows 0 tokens even after queries
4. **Query Execution Silent Failures** → Queries fail without user notification

### P2 - Medium (User Experience)
5. **Loading State Has No Timeout** → Infinite loading spinner
6. **Provider Status Always Inactive** → Confusing when API keys are configured

### P3 - Low (Polish)
7. **No Loading State on Homepage** → Submit button should show loading
8. **No Success Confirmation** → User doesn't know when query completes

## Detailed Investigation Plan

### Phase 1: Verify Core Execution (30 min)
**Objective**: Determine if @akhai/core is working at all

1. ✅ Check if dev server is running
2. ✅ Verify database exists and has schema
3. ✅ Test query submission API endpoint
4. ⏳ Check query execution in background
5. ⏳ Verify SSE stream is emitting events
6. ⏳ Check for errors in server logs

**Actions**:
```bash
# 1. Check running queries in database
sqlite3 data/akhai.db "SELECT * FROM queries ORDER BY created_at DESC LIMIT 5;"

# 2. Check events emitted
sqlite3 data/akhai.db "SELECT * FROM events WHERE query_id = '2AeKvlOLOS';"

# 3. Check usage tracking
sqlite3 data/akhai.db "SELECT * FROM usage ORDER BY timestamp DESC LIMIT 10;"

# 4. Monitor SSE stream
curl -N http://localhost:3002/api/stream/2AeKvlOLOS

# 5. Check server logs for errors
tail -f .next/trace (or console output)
```

### Phase 2: Add Proper Error Handling (1 hour)

**File**: `app/api/query/route.ts`
**Changes**:
1. Add try-catch around akhai execution
2. Return detailed error messages
3. Check for API keys before execution
4. Emit error events to SSE stream

**File**: `components/VerificationWindow.tsx`
**Changes**:
1. Add 60-second timeout
2. Display error messages prominently
3. Add "retry" button
4. Show helpful hints (check API keys, etc.)

**File**: `app/page.tsx`
**Changes**:
1. Add loading state to submit button
2. Show error alert if submission fails
3. Validate query input

### Phase 3: Fix Token Tracking (30 min)

**File**: `app/api/query/route.ts:81-92`
**Investigation**:
1. Verify costReport structure matches CostReport interface
2. Add logging to trackUsage calls
3. Verify providerUsage array has data
4. Check NULL constraint handling

**File**: `lib/database.ts:134-145`
**Verification**:
1. Ensure trackUsage is being called
2. Verify SQL INSERT is executing
3. Check for constraint violations

### Phase 4: Provider Status Logic (30 min)

**File**: `app/api/stats/route.ts:15-18`
**Current Logic**:
```typescript
const anthropicStatus: ProviderStatus = process.env.ANTHROPIC_API_KEY ? 'active' : 'inactive';
```

**Problem**: Only checks if key exists, not if it's valid or being used

**Better Logic**:
```typescript
const anthropicStatus: ProviderStatus =
  process.env.ANTHROPIC_API_KEY
    ? (providerStatsMap.get('anthropic')?.queries > 0 ? 'active' : 'inactive')
    : 'inactive';
```

### Phase 5: Add .env.example Template (5 min)

**File**: `.env.example`
**Content**:
```bash
# AkhAI API Keys
# Get your API keys from:
# - Anthropic: https://console.anthropic.com/
# - DeepSeek: https://platform.deepseek.com/
# - xAI (Grok): https://console.x.ai/
# - OpenRouter: https://openrouter.ai/keys

ANTHROPIC_API_KEY=sk-ant-...
DEEPSEEK_API_KEY=sk-...
XAI_API_KEY=xai-...
OPENROUTER_API_KEY=sk-or-...

# Optional: Web search (Brave)
BRAVE_SEARCH_API_KEY=
```

## Implementation Plan (Logical Order)

### Step 1: Investigation & Diagnosis (Now)
- [x] Audit current codebase
- [ ] Check database state
- [ ] Verify query execution
- [ ] Check SSE stream
- [ ] Identify exact failure point

### Step 2: Add Error Handling & Feedback (Priority 1)
- [ ] Add error handling to query route
- [ ] Add timeout to VerificationWindow
- [ ] Display errors to user
- [ ] Add API key validation
- [ ] Create .env.example template

### Step 3: Fix Token Tracking (Priority 2)
- [ ] Debug costReport flow
- [ ] Verify trackUsage calls
- [ ] Fix any data type mismatches
- [ ] Add logging for debugging

### Step 4: Fix Provider Status (Priority 3)
- [ ] Update status logic
- [ ] Test with real API keys
- [ ] Verify dashboard updates

### Step 5: Polish & Testing (Priority 4)
- [ ] Add loading states everywhere
- [ ] Add success confirmations
- [ ] Test complete flow end-to-end
- [ ] Verify token tracking works
- [ ] Update documentation

## Expected Timeline

- **Step 1**: 15 minutes
- **Step 2**: 1 hour
- **Step 3**: 30 minutes
- **Step 4**: 20 minutes
- **Step 5**: 30 minutes

**Total**: ~2.5 hours

## Success Criteria

✅ Query submission shows loading state
✅ Errors are displayed to user with helpful messages
✅ API key validation before execution
✅ Timeout after 60 seconds of no response
✅ Token usage correctly tracked in database
✅ Dashboard shows non-zero tokens after query
✅ Provider status shows "active" when keys configured
✅ Complete query flow works end-to-end
✅ User receives final answer from Mother Base

## Next Actions (In Order)

1. ✅ Create this audit document
2. ⏳ Check database state (queries, events, usage tables)
3. ⏳ Test SSE stream endpoint
4. ⏳ Add error handling to query route
5. ⏳ Add timeout + error display to VerificationWindow
6. ⏳ Create .env.example
7. ⏳ Test with real API key
8. ⏳ Verify token tracking
9. ⏳ Update provider status logic
10. ⏳ Final end-to-end testing
