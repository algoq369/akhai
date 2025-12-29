# Error Fix - December 25, 2025

## ✅ Issue Fixed

### Problem
- **Internal Server Error** when calling `/api/simple-query`
- Error: `extractTopics` function signature mismatch - was being called with 4 parameters but only accepted 3

### Root Cause
The `extractTopics` function in `lib/side-canal.ts` was missing the `legendMode` parameter that was being passed from `app/api/simple-query/route.ts`.

### Fix Applied

1. **Updated `extractTopics` function signature** in `lib/side-canal.ts`:
```typescript
export async function extractTopics(
  query: string,
  response: string,
  userId: string | null,
  legendMode: boolean = false  // ✅ Added this parameter
): Promise<Topic[]>
```

2. **Verified function call** in `app/api/simple-query/route.ts`:
```typescript
const topics = await extractTopics(query, content, userId, legendMode)  // ✅ Now matches signature
```

3. **Cleared Next.js cache** to remove stale build artifacts

### Verification
- ✅ TypeScript compilation: 0 errors
- ✅ Linter: No errors
- ✅ Function signatures match

### Status
**FIXED** - The API should now work correctly. The server needs to rebuild after cache clear.

---

*Fixed: December 25, 2025*






