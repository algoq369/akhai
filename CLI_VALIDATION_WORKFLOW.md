# 🔧 CLI-BASED VALIDATION WORKFLOW

## How It Works

```
┌─────────────────────────────────────────────────────────────────┐
│                    CLI VALIDATION FLOW                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  CLAUDE CLI                          USER                       │
│  ──────────                          ────                       │
│                                                                 │
│  1. Completes implementation                                    │
│     ↓                                                           │
│  2. Outputs summary:                                            │
│     ┌────────────────────────────────┐                         │
│     │ ✅ IMPLEMENTATION COMPLETE     │                         │
│     │                                │                         │
│     │ Feature: [Name]                │                         │
│     │ Type: [function/fix/etc]       │                         │
│     │                                │                         │
│     │ Files Created:                 │                         │
│     │  - path/to/file1.ts            │                         │
│     │  - path/to/file2.tsx           │                         │
│     │                                │                         │
│     │ Files Modified:                │                         │
│     │  - path/to/existing.ts         │                         │
│     │                                │                         │
│     │ 📋 VALIDATION REQUIRED         │                         │
│     │ Test: http://localhost:3000    │                         │
│     │                                │                         │
│     │ Reply with:                    │                         │
│     │  • "validated" to confirm      │                         │
│     │  • Or describe needed changes  │                         │
│     └────────────────────────────────┘                         │
│     ↓                                                           │
│  3. WAITS for user response          →  User tests localhost    │
│                                       →  User replies            │
│     ↓                                                           │
│  4. If "validated":                                             │
│     - Saves to database                                         │
│     - Shows: "✅ Saved to memory"                               │
│     - Proceeds to next task                                     │
│                                                                 │
│  5. If refinement needed:                                       │
│     - Makes changes                                             │
│     - Shows new summary                                         │
│     - Waits again                                               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Database Schema (Already Created)

The `implementation_log` table stores all validated work:

```sql
implementation_log:
  - id
  - feature_name
  - feature_type (function/tool/app/methodology/enhancement/fix/integration)
  - description
  - files_created (JSON array)
  - files_modified (JSON array)
  - lines_added
  - status (pending/validated/reverted)
  - validation_message
  - validated_at
  - created_at
  - session_id
```

## CLI Validation Template

After EVERY implementation, Claude must output this format:

```
═══════════════════════════════════════════════════════════════════
✅ IMPLEMENTATION COMPLETE
═══════════════════════════════════════════════════════════════════

📦 Feature: [Feature Name]
📁 Type: [function | fix | enhancement | integration | tool | app]

📄 Files Created:
   • [path/to/new/file1.ts] (XX lines)
   • [path/to/new/file2.tsx] (XX lines)

📝 Files Modified:
   • [path/to/existing/file.ts]

📊 Summary:
   [Brief description of what was implemented]

═══════════════════════════════════════════════════════════════════
📋 VALIDATION REQUIRED
═══════════════════════════════════════════════════════════════════

🔗 Test at: http://localhost:3000

Please test the implementation, then reply:
  • "validated" - to confirm and save to memory
  • "validated: [message]" - to confirm with note
  • Or describe any issues/refinements needed

⏳ Waiting for your response...
═══════════════════════════════════════════════════════════════════
```

## After User Validates

When user says "validated", Claude runs:

```bash
curl -X POST http://localhost:3000/api/implementations \
  -H 'Content-Type: application/json' \
  -d '{
    "featureName": "[Feature Name]",
    "featureType": "[type]",
    "description": "[Description]",
    "filesCreated": ["file1.ts", "file2.tsx"],
    "filesModified": ["existing.ts"],
    "status": "validated",
    "validationMessage": "[User message or Validated]",
    "sessionId": "session-[date]"
  }'
```

Then outputs:

```
═══════════════════════════════════════════════════════════════════
✅ SAVED TO MEMORY
═══════════════════════════════════════════════════════════════════

Feature "[Feature Name]" has been registered in the database.
ID: [returned ID]
Status: validated

Ready for next task!
═══════════════════════════════════════════════════════════════════
```

## Progress Check Command

To see all validated implementations:

```bash
curl http://localhost:3000/api/implementations | jq
```

Or filtered:
```bash
curl "http://localhost:3000/api/implementations?status=validated" | jq
```
