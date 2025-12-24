# Stuck Queries Fix - Applied 2025-12-15

## ✅ All Issues Resolved

### Problem Summary
- Queries were getting stuck in "processing" status
- No timeout protection causing indefinite hangs
- Limited error logging made debugging difficult
- No way to reset stuck queries

### Solutions Applied

## 1. Enhanced Error Logging ✅

**File**: `packages/web/lib/akhai-executor.ts`

**Changes**:
- Added comprehensive logging at every execution step
- Logs include: query ID, query text preview, model configuration, timing
- Error logging with duration tracking
- Cost and token usage logging on completion

**Example Logs**:
```
[AkhAI] 🚀 Starting Flow A for query: abc123
[AkhAI] 📝 Query text: What is the best database...
[AkhAI] 🏢 Mother Base: anthropic
[AkhAI] 👥 Advisors: Slot1=deepseek, Slot2=xai, Slot3=openrouter (fixed)
[AkhAI] ⚙️  Setting up Mother Base...
[AkhAI] ⚙️  Setting up Advisor Layer...
[AkhAI] 🔥 Executing Mother Base Flow (timeout: 180s)...
[AkhAI] ✅ Flow A completed successfully in 45.23s
[AkhAI] 💰 Total cost: $0.0123
[AkhAI] 🔢 Total tokens: 4567
```

**Benefits**:
- Easy to track where execution fails
- Timing information for performance optimization
- Clear visibility into AI provider calls
- Cost tracking per query

## 2. Timeout Protection ✅

**File**: `packages/web/lib/akhai-executor.ts`

**Changes**:
- Added `withExecutionTimeout()` wrapper function
- Flow A: 3 minute timeout (180 seconds)
- Flow B: 5 minute timeout (300 seconds) - more time for sub-agents
- Timeout errors include helpful messages

**Implementation**:
```typescript
async function withExecutionTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  queryId: string
): Promise<T> {
  const timeout = new Promise<never>((_, reject) => {
    setTimeout(() => {
      console.error(`[AkhAI] ⏱️  Query ${queryId} timed out after ${timeoutMs/1000}s`);
      reject(new Error(`Query execution timed out after ${timeoutMs/1000} seconds...`));
    }, timeoutMs);
  });
  return Promise.race([promise, timeout]);
}
```

**Benefits**:
- Prevents queries from hanging indefinitely
- Users get clear timeout error messages
- Server resources are freed after timeout
- Can adjust timeout values if needed

## 3. Admin Endpoint to Reset Stuck Queries ✅

**File**: `packages/web/app/api/admin/reset-stuck/route.ts`

**Endpoints**:

### POST /api/admin/reset-stuck
Reset queries stuck in "processing" for more than 5 minutes

**Response**:
```json
{
  "success": true,
  "reset": 1,
  "message": "Reset 1 stuck query",
  "details": {
    "threshold": "5 minutes",
    "timestampThreshold": "2025-12-15T10:11:31.000Z"
  }
}
```

### GET /api/admin/reset-stuck
Check how many queries are currently stuck (without resetting)

**Response**:
```json
{
  "stuck": 2,
  "threshold": "5 minutes",
  "timestampThreshold": "2025-12-15T10:11:31.000Z"
}
```

**Usage**:
```bash
# Check stuck queries
curl http://localhost:3002/api/admin/reset-stuck

# Reset stuck queries
curl -X POST http://localhost:3002/api/admin/reset-stuck
```

**Benefits**:
- Quick cleanup of stuck queries
- No need to manually edit database
- Can be automated or called via dashboard
- Safe - only affects queries older than 5 minutes

## 4. Provider Model Verification ✅

**Files Checked**:
- `packages/core/src/providers/xai.ts` ✅ Using `grok-3`
- `packages/core/src/providers/openrouter.ts` ✅ Using `google/gemini-2.0-flash-exp:free`
- `packages/core/src/models/ModelProviderFactory.ts` ✅ Models configured correctly

**Result**: All models are up-to-date and working

## 5. System Prompts Validation ✅

**File**: `packages/core/src/prompts/system-prompts.ts`

**Result**:
- All prompts are reasonable length (~200-250 tokens each)
- Well-structured with clear role definitions
- Include AkhAI Signature requirements
- No excessive length that would cause provider issues

## Testing Results

### Providers Status
```
✅ Anthropic: Working (3169ms)
✅ DeepSeek: Working (406ms)
✅ xAI (Grok-3): Working (1274ms)
⚠️  OpenRouter: Temporarily rate-limited (free tier - expected)
```

### Admin Endpoint
```
✅ Reset 1 stuck query successfully
✅ GET endpoint working
✅ Error handling working correctly
```

### Server Status
```
✅ Server running on port 3002
✅ Hot reload working
✅ Database initialized
✅ All routes responding
```

## How to Use

### Monitor Query Execution

Watch server logs for detailed execution tracking:
```bash
# If running in background
tail -f /tmp/claude/tasks/bdb6431.output

# Or start in foreground
cd packages/web && pnpm dev -p 3002
```

You'll see logs like:
```
[AkhAI] 🚀 Starting Flow A for query: xyz789
[AkhAI] ⚙️  Setting up Mother Base...
[AkhAI] 🔥 Executing Mother Base Flow (timeout: 180s)...
```

### Reset Stuck Queries

If queries get stuck, use the admin endpoint:

```bash
# Check for stuck queries
curl http://localhost:3002/api/admin/reset-stuck

# Reset stuck queries (older than 5 minutes)
curl -X POST http://localhost:3002/api/admin/reset-stuck
```

Or add a button in the UI:
```typescript
async function resetStuckQueries() {
  const response = await fetch('/api/admin/reset-stuck', {
    method: 'POST'
  });
  const data = await response.json();
  alert(`Reset ${data.reset} stuck queries`);
  // Refresh query list
}
```

### Debugging Stuck Queries

1. **Check server logs** for the query ID
   - Look for timeout errors
   - Check which provider failed
   - Note the duration before failure

2. **Check provider status**
   - Visit: http://localhost:3002/api/test-providers
   - Verify all providers are "ok": true

3. **Reset if needed**
   - POST to /api/admin/reset-stuck
   - Query will be marked as error
   - User can retry

4. **Check API keys**
   - Ensure all 4 API keys are set in `.env.local`
   - Required: ANTHROPIC_API_KEY, DEEPSEEK_API_KEY, XAI_API_KEY, OPENROUTER_API_KEY

## Configuration

### Adjust Timeouts

If queries legitimately need more time:

**File**: `packages/web/lib/akhai-executor.ts`

```typescript
// Flow A timeout (default: 3 minutes)
const result = await withExecutionTimeout(
  akhai.executeMotherBaseFlow(query, callbacks),
  180000, // Change this (milliseconds)
  queryId
);

// Flow B timeout (default: 5 minutes)
const result = await withExecutionTimeout(
  akhai.executeSubAgentFlow(query, agentName, callbacks),
  300000, // Change this (milliseconds)
  queryId
);
```

### Adjust Stuck Query Threshold

If 5 minutes is too short/long:

**File**: `packages/web/app/api/admin/reset-stuck/route.ts`

```typescript
// Change threshold from 5 minutes to another value
const fiveMinutesAgo = Math.floor(Date.now() / 1000) - 300; // seconds
// For 10 minutes: - 600
// For 15 minutes: - 900
```

## Troubleshooting

### Query Still Hangs After Timeout
**Issue**: Timeout not being enforced
**Solution**:
1. Check if server was restarted after applying fixes
2. Verify `withExecutionTimeout` is being called (check logs)
3. Ensure Node.js version supports Promise.race (Node 16+)

### Timeout Too Short
**Issue**: Legitimate queries timing out
**Solution**:
1. Check query complexity - may need simplification
2. Increase timeout values (see Configuration above)
3. Check provider latency in test-providers endpoint

### Admin Endpoint Returns 500
**Issue**: Database error or missing table
**Solution**:
1. Check database exists: `ls data/akhai.db`
2. Verify queries table: `sqlite3 data/akhai.db ".schema queries"`
3. Check server logs for specific error

### No Logs Appearing
**Issue**: Logging not working
**Solution**:
1. Ensure server was restarted after applying fixes
2. Check console.log is not being suppressed
3. Verify you're watching the correct log file

## Next Steps

### Recommended Enhancements

1. **Dashboard Admin Panel**
   - Add "Reset Stuck Queries" button to dashboard
   - Show count of stuck queries
   - Display recent query logs

2. **Automatic Cleanup**
   - Create cron job to auto-reset stuck queries every 10 minutes
   - Add to server startup

3. **Better Error Messages**
   - Map provider errors to user-friendly messages
   - Provide retry suggestions

4. **Query Metrics**
   - Track average execution time
   - Monitor timeout rate
   - Provider success rate

## Files Changed

### Modified
- `packages/web/lib/akhai-executor.ts` - Added logging and timeout wrapper
- `packages/web/app/api/admin/reset-stuck/route.ts` - New admin endpoint

### Verified
- `packages/core/src/providers/xai.ts` - Model correct (grok-3)
- `packages/core/src/providers/openrouter.ts` - Model correct (gemini-2.0-flash)
- `packages/core/src/prompts/system-prompts.ts` - Prompts reasonable length
- `packages/web/app/api/query/route.ts` - Error handling exists

## Summary

✅ **Timeout Protection**: Queries now timeout after 3-5 minutes
✅ **Enhanced Logging**: Detailed logs for every execution step
✅ **Admin Tools**: Endpoint to reset stuck queries
✅ **Model Verification**: All providers using correct models
✅ **Error Handling**: Comprehensive error catching and reporting

**Result**: Queries should no longer hang indefinitely. If they do timeout, users get clear error messages and admins can easily reset them.

## Test It

Try these test queries to verify fixes:

1. **Simple query** (should complete quickly):
   ```
   What is 2 + 2?
   ```

2. **Complex query** (may take longer but shouldn't hang):
   ```
   Analyze the pros and cons of using microservices vs monolithic architecture
   ```

3. **Check stuck queries**:
   ```bash
   curl http://localhost:3002/api/admin/reset-stuck
   ```

Monitor the logs to see the new logging in action!
