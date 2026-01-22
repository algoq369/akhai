# Query Submission Fix - December 31, 2025

**Date:** December 31, 2025 21:10
**Status:** ✅ Complete - Ready for Testing
**Issue:** Couldn't send queries from Mini Chat input

---

## 🐛 Issues Fixed

### Issue 1: React useEffect Dependency Warning
**Problem:** `generateInsights` function was not in the dependency array of useEffect, causing React warnings and potential stale closure issues.

**Solution:** Moved the insight generation logic inside the useEffect to avoid dependency issues.

**File:** `components/SideMiniChat.tsx`
- Lines 118-187: Moved `generateInsights` logic into useEffect as `generateInsightsForNewMessage`
- Removed redundant standalone `generateInsights` function

### Issue 2: Mini Chat Query Submission Not Working
**Problem:** Using `document.querySelector('form').requestSubmit()` was unreliable and didn't properly pass event object to `handleSubmit`.

**Solution:** Duplicated the full submit logic directly in the `onSendQuery` callback to handle Mini Chat submissions independently.

**File:** `app/page.tsx`
- Lines 2087-2201: Complete rewrite of `onSendQuery` handler
- Now handles the entire API call flow internally
- No longer depends on form.requestSubmit() or synthetic events

---

## ✅ What Changed

### 1. SideMiniChat Component (`components/SideMiniChat.tsx`)

**Before:**
```typescript
useEffect(() => {
  if (messages.length > lastAnalyzedLength.current && messages.length > 0) {
    generateInsights()  // ❌ Function not in dependency array
    lastAnalyzedLength.current = messages.length
  }
}, [messages])

const generateInsights = () => {
  // ... logic here
}
```

**After:**
```typescript
useEffect(() => {
  const generateInsightsForNewMessage = () => {
    // ✅ Logic moved inside useEffect
    const newInsights: Insight[] = []
    const lastAiMessage = messages.filter(m => m.role === 'assistant').pop()
    const lastUserMessage = messages.filter(m => m.role === 'user').pop()

    if (!lastAiMessage || !lastUserMessage) return

    const userQuery = lastUserMessage.content
    const aiResponse = lastAiMessage.content

    // Generate detailed, context-aware suggestion
    const suggestionText = generateDetailedSuggestion(userQuery, aiResponse)

    // Generate pertinent links
    const pertinentLinks = generatePertinentLinks(userQuery, aiResponse, 3)

    // ... rest of logic
    setInsights(newInsights.slice(0, 4))
  }

  if (messages.length > lastAnalyzedLength.current && messages.length > 0) {
    generateInsightsForNewMessage()
    lastAnalyzedLength.current = messages.length
  }
}, [messages])  // ✅ No dependency warnings
```

### 2. Mini Chat Integration (`app/page.tsx`)

**Before:**
```typescript
<SideMiniChat
  onSendQuery={(queryText) => {
    setQuery(queryText)
    setTimeout(() => {
      const form = document.querySelector('form') as HTMLFormElement
      if (form) {
        form.requestSubmit()  // ❌ Unreliable, doesn't work consistently
      }
    }, 50)
  }}
/>
```

**After:**
```typescript
<SideMiniChat
  onSendQuery={async (queryText) => {
    // ✅ Handle entire submission flow directly
    if (isLoading || !queryText.trim()) return

    setQuery(queryText)
    await new Promise(resolve => setTimeout(resolve, 50))

    // Start transition animation
    setIsTransitioning(true)
    await new Promise(resolve => setTimeout(resolve, 800))

    const userMessage: Message = {
      id: generateId(),
      role: 'user',
      content: queryText.trim(),
      timestamp: new Date()
    }

    // Add user message
    setMessages(prev => [...prev, userMessage])
    setIsExpanded(true)
    setQuery('')
    setIsLoading(true)
    setIsTransitioning(false)

    // Make API call directly
    try {
      const res = await fetch('/api/simple-query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-session-id': sessionId,
        },
        body: JSON.stringify({
          query: userMessage.content,
          methodology,
          conversationHistory: messages.map(m => ({
            role: m.role,
            content: m.content
          })),
          legendMode,
          chatId: activeChatId || 'main',
          pageContext: getPageContext()
        })
      })

      const data = await res.json()

      // Add AI response
      const aiMessage: Message = {
        id: generateId(),
        role: 'assistant',
        content: data.response,
        timestamp: new Date(),
        methodology: data.methodologyUsed,
        metadata: data.metadata,
        topics: data.topics,
        gnostic: data.gnostic
      }

      setMessages(prev => [...prev, aiMessage])

      // Update analytics
      if (typeof window !== 'undefined' && (window as any).posthog) {
        (window as any).posthog.capture('query_completed', {
          methodology: data.methodologyUsed,
          latency: Date.now() - startTime,
          tokens: data.metrics?.tokens,
          cost: data.metrics?.cost,
          guardPassed: data.guardResult?.passed,
          legendMode
        })
      }

    } catch (error) {
      console.error('Query error:', error)
      // Add error message
      const errorMessage: Message = {
        id: generateId(),
        role: 'assistant',
        content: 'An error occurred while processing your query. Please try again.',
        timestamp: new Date(),
        metadata: {
          error: true,
          errorMessage: error instanceof Error ? error.message : 'Unknown error'
        }
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }}
/>
```

---

## 🧪 Testing Instructions

### Test 1: Main Input Field
1. Navigate to http://localhost:3001
2. Type a query in the main input field
3. Press Enter or click submit button
4. ✅ Query should send successfully
5. ✅ AI response should appear

### Test 2: Mini Chat Input Field
1. After conversation started (interface expanded)
2. Scroll down Mini Chat sidebar on left
3. Find "QUICK QUERY" input at bottom
4. Type: "explain quantum computing"
5. Click "SEND" button
6. ✅ Query should send successfully
7. ✅ AI response should appear
8. ✅ Mini Chat should update with new links

### Test 3: Verify Links Are Pertinent
1. Submit query: "how to implement REST API"
2. Check Mini Chat sidebar shows:
   - ✅ Link to GitHub repositories
   - ✅ Link to documentation guides
   - ✅ Link to Stack Overflow
3. Links should include "REST API" in URLs

### Test 4: Verify No Console Errors
1. Open browser console (F12)
2. Submit queries from both inputs
3. ✅ No React warnings about dependencies
4. ✅ No errors about form.requestSubmit
5. ✅ Should see `[MiniChat] Generated pertinent insights...` logs

### Test 5: Sefirot View
1. Submit a query
2. Look for "Tree of Life Activation" footer in AI response
3. ✅ Should show Sefirot visualization
4. ✅ Should show gnostic metadata

---

## 🔍 Debug Checklist

If queries still don't send:

1. **Check browser console for errors**
   ```
   F12 → Console tab
   Look for red error messages
   ```

2. **Check network tab**
   ```
   F12 → Network tab
   Submit query
   Should see POST request to /api/simple-query
   Status should be 200
   ```

3. **Check server is running**
   ```
   Terminal should show:
   ✓ Compiled in XXXms
   POST /api/simple-query 200 in XXXXms
   ```

4. **Check for React warnings**
   ```
   Console should NOT show:
   "React Hook useEffect has a missing dependency"
   "Cannot call requestSubmit on undefined"
   ```

5. **Verify API key is set**
   ```
   Check .env.local has:
   ANTHROPIC_API_KEY=sk-ant-...
   ```

---

## 📊 Server Output Verification

After submitting a query, you should see in terminal:

```
[GUARD:HYPE] Clean (score: 0)
[GUARD:ECHO] Clean (score: 0)
[GUARD:DRIFT] Clean (score: 0)
[GUARD:SANITY] Clean (reality-based)
[GUARD:FACT] Clean (score: 0)
✅ [GUARD] ✅ All checks passed
[SEFIROT] Dominant: Hod (Logical analysis). Average level: 4.4/10
[GNOSTIC] ✓ All protocols completed successfully
✅ [QUERY] Complete: xxx
{
  "latency": "XXXXms",
  "cost": "$X.XX"
}
POST /api/simple-query 200 in XXXXms
```

---

## ✅ Success Criteria

All must pass:

- [ ] **Main input works** - Can submit queries from main form
- [ ] **Mini Chat input works** - Can submit queries from Mini Chat
- [ ] **No React warnings** - Console is clean
- [ ] **No form errors** - No requestSubmit errors
- [ ] **Links are pertinent** - Query-specific URLs
- [ ] **Sefirot view appears** - Tree of Life footer shows
- [ ] **Server responds** - POST requests return 200
- [ ] **Analytics track** - PostHog events fire (if enabled)

---

## 🚀 Performance

**Query Submission:**
- Main input: ~800ms transition + API call time
- Mini Chat input: ~800ms transition + API call time (same flow)

**Compilation:**
- No additional build time
- Server hot-reloads work correctly

---

## 📝 Files Modified

1. **`components/SideMiniChat.tsx`**
   - Lines 118-187: Fixed useEffect dependency issue
   - Removed standalone generateInsights function

2. **`app/page.tsx`**
   - Lines 2087-2201: Complete rewrite of onSendQuery handler
   - Now handles full API call flow independently

---

## 🔮 Next Steps (If Issues Persist)

If queries still don't work:

1. **Clear browser cache**
   ```
   Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)
   ```

2. **Restart dev server**
   ```bash
   # Kill current server
   pkill -f "next dev"

   # Restart
   pnpm dev
   ```

3. **Check for TypeScript errors**
   ```bash
   pnpm type-check
   ```

4. **Verify all dependencies installed**
   ```bash
   pnpm install
   ```

---

**Fix Complete!** 🎉

Both main input and Mini Chat input should now work correctly.

**Dev Server:** http://localhost:3001 ✅ Running
**Status:** Ready for testing
**Next:** Please test both input fields and confirm they work!

---

*Built for Reliable Query Submission • No Form Errors • Clean Console*
