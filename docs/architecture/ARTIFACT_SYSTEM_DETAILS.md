# 🎨 AkhAI Artifact System - Detailed Specification

**Session 5: Artifact System** - Comprehensive export and research artifact management

---

## 📋 Overview

The **Artifact System** is a comprehensive export and research management feature that allows users to:
1. **Export** their research sessions in multiple formats (JSON, SVG, Markdown)
2. **Generate** AI-powered research summaries
3. **Organize** artifacts in a searchable library
4. **Share** research artifacts with others

---

## 🎯 Core Components

### 1. **Export Functionality**

#### **1.1 JSON Export**
**Purpose:** Machine-readable format for data analysis, backup, and integration

**What's Included:**
```json
{
  "metadata": {
    "exportDate": "2025-12-25T19:00:00Z",
    "version": "1.0.0",
    "userId": "user_123",
    "exportType": "full" | "mindmap" | "conversation" | "topics"
  },
  "conversation": {
    "messages": [
      {
        "id": "msg_123",
        "role": "user" | "assistant",
        "content": "...",
        "timestamp": "2025-12-25T18:00:00Z",
        "methodology": "auto",
        "guardResult": { ... }
      }
    ],
    "totalQueries": 5,
    "totalTokens": 15000,
    "totalCost": 0.45
  },
  "mindMap": {
    "nodes": [
      {
        "id": "topic_123",
        "name": "Bitcoin",
        "description": "...",
        "category": "finance",
        "color": "#3B82F6",
        "pinned": false,
        "archived": false,
        "queryCount": 3,
        "ai_instructions": "..."
      }
    ],
    "links": [
      {
        "source": "topic_123",
        "target": "topic_456",
        "type": "related",
        "strength": 0.85
      }
    ]
  },
  "topics": [
    {
      "id": "topic_123",
      "name": "Bitcoin",
      "description": "...",
      "category": "finance",
      "synopsis": "AI-generated synopsis of all conversations about this topic",
      "relatedQueries": ["query_1", "query_2"],
      "relatedTopics": ["topic_456", "topic_789"]
    }
  ],
  "queries": [
    {
      "id": "query_123",
      "query": "What is Bitcoin?",
      "response": "...",
      "methodology": "direct",
      "status": "complete",
      "tokens_used": 500,
      "cost": 0.015,
      "created_at": 1735156800,
      "guardResult": {
        "hypeTriggered": false,
        "echoTriggered": false,
        "driftTriggered": false,
        "issues": []
      }
    }
  ],
  "sideCanal": {
    "contextInjected": true,
    "suggestions": [...],
    "topicsExtracted": 3
  }
}
```

**Use Cases:**
- Data backup and restore
- Integration with other tools
- Programmatic analysis
- Research data portability

---

#### **1.2 SVG Export**
**Purpose:** High-quality vector graphics for presentations, documentation, and printing

**What's Included:**
- **Mind Map Visualization** as SVG
  - All nodes (topics) with colors, labels, and metadata
  - All links (relationships) with strength indicators
  - Custom styling (pinned nodes highlighted, archived nodes dimmed)
  - Legend for categories and relationship types
  - Title and metadata footer

**SVG Structure:**
```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 800">
  <defs>
    <!-- Gradients, filters, styles -->
  </defs>
  <g id="links">
    <!-- Relationship lines -->
  </g>
  <g id="nodes">
    <!-- Topic nodes with labels -->
  </g>
  <g id="legend">
    <!-- Category legend -->
  </g>
  <text id="title">AkhAI Research Mind Map</text>
  <text id="metadata">Exported: 2025-12-25 | 5 topics | 8 relationships</text>
</svg>
```

**Features:**
- Scalable vector graphics (infinite zoom)
- Print-ready (300 DPI equivalent)
- Customizable colors and styles
- Interactive elements (optional, for web use)

**Use Cases:**
- Research presentations
- Documentation
- Academic papers
- Visual reports

---

#### **1.3 Markdown Export**
**Purpose:** Human-readable format for documentation, notes, and sharing

**What's Included:**
```markdown
# AkhAI Research Artifact

**Export Date:** December 25, 2025  
**Research Session:** Bitcoin & Cryptocurrency Analysis  
**Total Queries:** 5  
**Total Tokens:** 15,000  
**Total Cost:** $0.45  

---

## 📊 Executive Summary

[AI-generated summary of the entire research session]

---

## 💬 Conversation History

### Query 1: "What is Bitcoin?"
**Methodology:** Direct  
**Date:** December 25, 2025, 6:00 PM  
**Tokens:** 500 | **Cost:** $0.015  

**Response:**
[Full AI response]

**Guard Results:**
- ✅ No hype detected
- ✅ No echo detected
- ✅ No drift detected

---

### Query 2: "How does Bitcoin mining work?"
[Similar structure...]

---

## 🗺️ Mind Map

### Topics Discovered

#### Bitcoin
- **Category:** Finance
- **Description:** Digital cryptocurrency
- **Related Queries:** 3
- **Related Topics:** Blockchain, Cryptocurrency

**Synopsis:**
[AI-generated synopsis of all conversations about Bitcoin]

---

#### Blockchain
[Similar structure...]

---

## 📈 Research Insights

### Key Findings
1. [AI-generated insight 1]
2. [AI-generated insight 2]
3. [AI-generated insight 3]

### Topic Relationships
- Bitcoin ↔ Blockchain (strength: 0.85)
- Bitcoin ↔ Cryptocurrency (strength: 0.92)

---

## 📝 Methodology Breakdown

| Methodology | Count | Avg Tokens | Avg Cost |
|-------------|-------|------------|----------|
| Direct      | 2     | 500        | $0.015   |
| CoD         | 1     | 800        | $0.024   |
| ReAct       | 2     | 2,500      | $0.075   |

---

*Generated by AkhAI on December 25, 2025*
```

**Features:**
- Clean, readable format
- GitHub-compatible markdown
- Includes all conversation context
- AI-generated summaries and insights
- Methodology statistics

**Use Cases:**
- Research notes
- Documentation
- Blog posts
- Academic papers
- Knowledge sharing

---

### 2. **Research Summaries**

#### **2.1 AI-Powered Summaries**

**Topic-Level Summaries:**
- Automatically generated for each topic using Side Canal synopsis
- Combines all queries related to a topic
- Highlights key findings and insights

**Session-Level Summaries:**
- Executive summary of entire research session
- Key findings and conclusions
- Methodology effectiveness analysis
- Topic relationship insights

**Summary Generation:**
- Uses Claude Haiku (fast, cost-effective)
- Triggered automatically after N queries or on-demand
- Stored in database for quick access
- Can be regenerated with updated data

---

### 3. **Artifact Library**

#### **3.1 Library Structure**

**Database Schema:**
```sql
CREATE TABLE artifacts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  artifact_type TEXT NOT NULL, -- 'full', 'mindmap', 'conversation', 'topic'
  format TEXT NOT NULL, -- 'json', 'svg', 'md'
  file_path TEXT, -- Path to stored file (if stored)
  metadata TEXT, -- JSON metadata
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE artifact_tags (
  artifact_id TEXT NOT NULL,
  tag TEXT NOT NULL,
  PRIMARY KEY (artifact_id, tag),
  FOREIGN KEY (artifact_id) REFERENCES artifacts(id)
);
```

**Features:**
- **Search & Filter:**
  - By date range
  - By topic/category
  - By methodology used
  - By tags
  - Full-text search in summaries

- **Organization:**
  - Folders/collections
  - Tags
  - Favorites/pinned
  - Archive

- **Metadata:**
  - Export date
  - Query count
  - Token usage
  - Cost
  - Topics covered
  - Methodologies used

---

#### **3.2 Artifact UI**

**Library View:**
```
┌─────────────────────────────────────────────────┐
│  Artifact Library                    [+ Export] │
├─────────────────────────────────────────────────┤
│  [Search...]  [Filter: All]  [Sort: Recent]     │
├─────────────────────────────────────────────────┤
│  📄 Bitcoin Research - Dec 25, 2025            │
│    5 queries | 15k tokens | $0.45              │
│    Tags: #crypto #finance #bitcoin              │
│    [View] [Download] [Share] [Delete]           │
├─────────────────────────────────────────────────┤
│  📄 AI Ethics Analysis - Dec 24, 2025           │
│    12 queries | 45k tokens | $1.35              │
│    Tags: #ai #ethics #philosophy                │
│    [View] [Download] [Share] [Delete]           │
└─────────────────────────────────────────────────┘
```

**Export Modal:**
```
┌─────────────────────────────────────────┐
│  Export Research Artifact          [×] │
├─────────────────────────────────────────┤
│  Export Type:                           │
│  ○ Full Session (all data)              │
│  ○ Mind Map Only                        │
│  ○ Conversation Only                    │
│  ○ Selected Topics                      │
│                                         │
│  Format:                                │
│  ○ JSON  ○ SVG  ○ Markdown             │
│                                         │
│  Options:                               │
│  ☑ Include AI summaries                │
│  ☑ Include guard results                │
│  ☑ Include metadata                     │
│                                         │
│  [Cancel]  [Export]                     │
└─────────────────────────────────────────┘
```

---

### 4. **Sharing & Collaboration**

#### **4.1 Share Artifacts**

**Share Options:**
- **Public Link:** Generate shareable URL (read-only)
- **Export File:** Download and share manually
- **Embed:** Generate embed code for websites
- **PDF Export:** (Future) Convert markdown to PDF

**Share Permissions:**
- View-only (default)
- Download allowed
- Comments enabled (future)

---

## 🔧 Implementation Details

### **API Endpoints**

#### **Export Endpoints:**
```
POST /api/artifacts/export
  Body: {
    type: 'full' | 'mindmap' | 'conversation' | 'topics',
    format: 'json' | 'svg' | 'md',
    options: {
      includeSummaries: boolean,
      includeGuardResults: boolean,
      includeMetadata: boolean,
      topicIds?: string[],
      queryIds?: string[]
    }
  }
  Response: File download or JSON

GET /api/artifacts/:id
  Query: ?format=json|svg|md
  Response: Artifact file

GET /api/artifacts
  Query: ?page=1&limit=20&search=...&filter=...
  Response: { artifacts: [...], total: number }
```

#### **Summary Endpoints:**
```
POST /api/artifacts/:id/summarize
  Body: { type: 'topic' | 'session' }
  Response: { summary: string }

GET /api/artifacts/:id/summary
  Response: { summary: string, generatedAt: timestamp }
```

#### **Library Endpoints:**
```
GET /api/artifacts/library
  Query: ?page=1&limit=20&search=...&tags=...
  Response: { artifacts: [...], total: number }

POST /api/artifacts/library
  Body: { title, description, tags: [] }
  Response: { artifact: {...} }

DELETE /api/artifacts/:id
  Response: { success: boolean }
```

---

### **File Structure**

```
packages/web/
├── app/
│   └── api/
│       └── artifacts/
│           ├── export/
│           │   └── route.ts          # Export generation
│           ├── [id]/
│           │   ├── route.ts          # Get artifact
│           │   └── summarize/
│           │       └── route.ts      # Generate summary
│           └── library/
│               └── route.ts          # Library management
├── lib/
│   ├── artifacts/
│   │   ├── export-json.ts            # JSON export logic
│   │   ├── export-svg.ts             # SVG export logic
│   │   ├── export-markdown.ts        # Markdown export logic
│   │   └── summaries.ts              # Summary generation
│   └── database.ts                    # Artifact storage
└── components/
    ├── ArtifactLibrary.tsx            # Library UI
    ├── ExportModal.tsx                # Export dialog
    └── ArtifactCard.tsx                # Artifact card component
```

---

## 📊 Data Flow

### **Export Flow:**
```
User clicks "Export"
  ↓
ExportModal opens
  ↓
User selects type, format, options
  ↓
POST /api/artifacts/export
  ↓
Server gathers data:
  - Conversation messages
  - Mind map nodes/links
  - Topics and relationships
  - Guard results
  - Metadata
  ↓
Format-specific export:
  - JSON: Serialize to JSON
  - SVG: Generate SVG from D3 data
  - Markdown: Generate markdown template
  ↓
Return file download or save to library
```

### **Summary Generation Flow:**
```
User requests summary OR auto-triggered
  ↓
POST /api/artifacts/:id/summarize
  ↓
Gather all relevant data:
  - All queries for topic/session
  - Responses and context
  - Topic relationships
  ↓
Call Claude Haiku with prompt:
  "Summarize this research session..."
  ↓
Store summary in database
  ↓
Return summary to user
```

---

## 🎨 UI/UX Considerations

### **Export Button Placement:**
- **Main Chat:** Export button in chat header
- **Mind Map:** Export button in Mind Map toolbar
- **Topics Panel:** Export selected topics
- **History Page:** Bulk export option

### **Export Progress:**
- Show progress indicator for large exports
- Estimate time remaining
- Allow cancellation

### **Library Features:**
- Infinite scroll or pagination
- Quick preview on hover
- Drag-and-drop organization (future)
- Keyboard shortcuts

---

## 🚀 Future Enhancements

### **Phase 2.5 (Post-Launch):**
- **PDF Export:** Convert markdown to PDF with styling
- **Collaborative Artifacts:** Share with team members
- **Version History:** Track artifact changes over time
- **Templates:** Pre-configured export templates
- **Scheduled Exports:** Auto-export on schedule
- **Integration:** Export to Notion, Obsidian, etc.

### **Phase 3:**
- **Public Gallery:** Share artifacts publicly
- **Artifact Analytics:** Usage statistics
- **AI Recommendations:** Suggest related artifacts
- **Export Automation:** Auto-export based on triggers

---

## 📝 Implementation Checklist

### **Phase 1: Core Export (Week 1)**
- [ ] Design artifact data structure
- [ ] Implement JSON export
- [ ] Implement Markdown export
- [ ] Create export API endpoints
- [ ] Build ExportModal component

### **Phase 2: SVG Export (Week 2)**
- [ ] Design SVG structure
- [ ] Implement D3-to-SVG conversion
- [ ] Add styling and legends
- [ ] Test print quality

### **Phase 3: Summaries (Week 2-3)**
- [ ] Implement summary generation API
- [ ] Create summary prompts
- [ ] Add summary caching
- [ ] Build summary UI

### **Phase 4: Library (Week 3-4)**
- [ ] Create artifact database schema
- [ ] Implement library API
- [ ] Build ArtifactLibrary component
- [ ] Add search and filters
- [ ] Implement tags system

### **Phase 5: Polish (Week 4)**
- [ ] Add export progress indicators
- [ ] Implement error handling
- [ ] Add export history
- [ ] Performance optimization
- [ ] Documentation

---

## 💡 Key Design Principles

1. **User Control:** Users decide what to export and how
2. **Format Flexibility:** Multiple formats for different use cases
3. **Data Completeness:** Export includes all relevant context
4. **Performance:** Large exports should be fast and non-blocking
5. **Privacy:** User data is never exposed without permission
6. **Portability:** Exports should work offline and be tool-agnostic

---

## 🔒 Security & Privacy

- **Authentication:** All exports require user authentication
- **Data Isolation:** Users can only export their own data
- **Share Links:** Use secure tokens, not sequential IDs
- **File Storage:** Optional server-side storage (encrypted)
- **GDPR Compliance:** Users can delete all artifacts

---

*This specification is part of Session 5: Artifact System in the AkhAI roadmap.*






