# Debug & Implementation Plan

## Issues Identified & Fixed

### 1. ✅ Methodology Circle Flickering
**Problem**: Circle appears/disappears rapidly when hovering over logo
**Root Cause**: MouseLeave fires when cursor moves to the explorer modal
**Fix Applied**:
- Added `data-methodology-explorer` attribute to modal
- Check `relatedTarget` in mouseLeave to prevent closing when moving to modal
- Added `onMouseLeave` handler to explorer modal itself
- Added instrumentation logs to track mouse events

**Files Modified**:
- `packages/web/app/page.tsx` (lines 425-426)
- `packages/web/components/MethodologyExplorer.tsx` (lines 280-295)

### 2. ✅ Dashboard Link Added
**Fix**: Added "dashboard" link to footer navigation
**File**: `packages/web/app/page.tsx` (line 689)

### 3. ✅ GuardWarning Suggestion System
**Status**: Already implemented and functional
**Components**:
- `packages/web/components/GuardWarning.tsx` - UI component
- `packages/web/app/api/guard-suggestions/route.ts` - API endpoint
**Functionality**:
- Refine: Generates 3 refined query suggestions
- Pivot: Generates 3 alternative approach suggestions
- Uses Claude Haiku for fast, cheap suggestions

## Testing Required

### Test Methodology Circle (No Flickering)
1. Hover over ◊ diamond logo
2. Circle should appear smoothly and stay visible
3. Move mouse to circle items - should NOT disappear
4. Move mouse away from entire area - should disappear smoothly

### Test Suggestion Alerts
1. Submit query: "i have an idea that can make us 1 trillion in 30 days"
2. Should trigger sanity violations
3. Click "Refine" button
4. Should show 3 refined query suggestions
5. Click "Pivot" button  
6. Should show 3 alternative approach suggestions

## Side Canal & Mind Map Implementation Plan

### Current Status
- **Side Canal**: Mentioned in roadmap, not yet implemented
- **Mind Map**: Mentioned in roadmap, not yet implemented
- Both are Phase 2 features

### Side Canal (Autonomous Context Tracking)
**Purpose**: Track conversation topics and context autonomously

**Proposed Implementation**:
1. **Backend** (`lib/side-canal.ts`):
   - Extract topics from queries/responses
   - Build topic graph/network
   - Track topic relationships
   - Generate synopsis of conversation threads

2. **Frontend** (`components/SideCanal.tsx`):
   - Side panel showing active topics
   - Topic connections visualization
   - Click to filter/view related queries
   - Auto-updates as conversation progresses

3. **API** (`app/api/side-canal/route.ts`):
   - GET: Retrieve topic graph
   - POST: Update/add topics
   - DELETE: Clear topics

### Mind Map (Interactive Visualization)
**Purpose**: Visual representation of query relationships and topics

**Proposed Implementation**:
1. **Backend**:
   - Use Side Canal data
   - Generate graph structure
   - Calculate node positions
   - Track query-to-topic mappings

2. **Frontend** (`components/MindMap.tsx`):
   - Interactive D3.js or React Flow visualization
   - Nodes = topics/queries
   - Edges = relationships
   - Zoom, pan, click interactions
   - Real-time updates

3. **Integration**:
   - Link from dashboard
   - Show in explore page
   - Export as image/JSON

## Next Steps

### Phase 1: Debug & Verify (Current)
1. ✅ Fix methodology circle flickering
2. ✅ Add dashboard link
3. ⏳ Test suggestion alerts locally
4. ⏳ Verify all fixes work

### Phase 2: Side Canal Implementation
1. Create `lib/side-canal.ts` with topic extraction
2. Create `components/SideCanal.tsx` UI component
3. Create `app/api/side-canal/route.ts` API endpoint
4. Integrate with main chat interface
5. Test topic tracking

### Phase 3: Mind Map Implementation
1. Install visualization library (D3.js or React Flow)
2. Create `components/MindMap.tsx`
3. Connect to Side Canal data
4. Add to explore/dashboard pages
5. Test interactions

## Files to Create

### Side Canal
- `packages/web/lib/side-canal.ts`
- `packages/web/components/SideCanal.tsx`
- `packages/web/app/api/side-canal/route.ts`

### Mind Map
- `packages/web/components/MindMap.tsx`
- `packages/web/app/explore/page.tsx` (update)

## Dependencies Needed

```json
{
  "dependencies": {
    "d3": "^7.8.5",  // or "react-flow-renderer": "^10.x"
    "@types/d3": "^7.4.0"
  }
}
```

## Testing Checklist

- [ ] Methodology circle no longer flickers
- [ ] Dashboard link works
- [ ] Suggestion alerts trigger correctly
- [ ] Refine suggestions appear
- [ ] Pivot suggestions appear
- [ ] Side Canal tracks topics (after implementation)
- [ ] Mind Map visualizes relationships (after implementation)

