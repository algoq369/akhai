# 🧠 AKHAI METACOGNITION SYSTEM

## Self-Awareness + Autonomous Intelligence + Validation Workflow

**Version:** 1.0
**Date:** December 31, 2025

---

# PART 1: VALIDATION WORKFLOW

## 1.1 The Rule

> **EVERY implementation must be VALIDATED before proceeding**

```
┌─────────────────────────────────────────────────────────────────┐
│                    VALIDATION WORKFLOW                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐ │
│   │  BUILD   │ → │   TEST   │ → │ VALIDATE │ → │   SAVE   │ │
│   │          │    │          │    │          │    │          │ │
│   │ Claude   │    │ User     │    │ User     │    │ Database │ │
│   │ creates  │    │ tests    │    │ confirms │    │ updated  │ │
│   └──────────┘    └──────────┘    └──────────┘    └──────────┘ │
│        │               │               │               │        │
│        ▼               ▼               ▼               ▼        │
│   Code written    Manual test     "Validated"    Progress       │
│   Files created   localhost       message from   persisted      │
│                                   user           + Next step    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## 1.2 Database Schema for Progress Tracking

```sql
-- New table: implementation_log
CREATE TABLE implementation_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  
  -- What was implemented
  feature_name TEXT NOT NULL,
  feature_type TEXT NOT NULL, -- 'function' | 'tool' | 'app' | 'methodology' | 'enhancement' | 'fix'
  description TEXT,
  
  -- Files affected
  files_created TEXT, -- JSON array of file paths
  files_modified TEXT, -- JSON array of file paths
  lines_added INTEGER DEFAULT 0,
  lines_modified INTEGER DEFAULT 0,
  
  -- Status tracking
  status TEXT DEFAULT 'pending', -- 'pending' | 'testing' | 'validated' | 'reverted'
  validation_message TEXT, -- User's confirmation message
  validated_at DATETIME,
  validated_by TEXT DEFAULT 'user',
  
  -- Metadata
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  session_id TEXT, -- Links related implementations
  parent_id INTEGER, -- For sub-tasks
  
  -- Technical details
  commit_hash TEXT, -- If using git
  rollback_instructions TEXT, -- How to undo if needed
  dependencies TEXT, -- JSON array of other feature_names
  
  FOREIGN KEY (parent_id) REFERENCES implementation_log(id)
);

-- Index for quick lookups
CREATE INDEX idx_impl_status ON implementation_log(status);
CREATE INDEX idx_impl_feature ON implementation_log(feature_name);
CREATE INDEX idx_impl_session ON implementation_log(session_id);

-- New table: implementation_metrics
CREATE TABLE implementation_metrics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  implementation_id INTEGER NOT NULL,
  
  -- Metrics
  metric_name TEXT NOT NULL,
  metric_value TEXT NOT NULL,
  metric_type TEXT, -- 'count' | 'duration' | 'percentage' | 'boolean'
  
  recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (implementation_id) REFERENCES implementation_log(id)
);
```

## 1.3 Implementation API

```typescript
// lib/implementation-tracker.ts

interface Implementation {
  id: number;
  featureName: string;
  featureType: 'function' | 'tool' | 'app' | 'methodology' | 'enhancement' | 'fix';
  description: string;
  filesCreated: string[];
  filesModified: string[];
  linesAdded: number;
  linesModified: number;
  status: 'pending' | 'testing' | 'validated' | 'reverted';
  validationMessage?: string;
  validatedAt?: Date;
  createdAt: Date;
  sessionId: string;
}

export class ImplementationTracker {
  
  // Start tracking a new implementation
  async startImplementation(data: {
    featureName: string;
    featureType: Implementation['featureType'];
    description: string;
    sessionId: string;
  }): Promise<number> {
    // Insert into database, return ID
  }
  
  // Update with files changed
  async updateFiles(id: number, data: {
    filesCreated?: string[];
    filesModified?: string[];
    linesAdded?: number;
    linesModified?: number;
  }): Promise<void> {
    // Update implementation record
  }
  
  // Mark as ready for testing
  async markTesting(id: number): Promise<void> {
    // Update status to 'testing'
  }
  
  // User validates the implementation
  async validate(id: number, message: string): Promise<void> {
    // Update status to 'validated'
    // Set validatedAt to now
    // Save validation message
  }
  
  // Revert if validation fails
  async revert(id: number, reason: string): Promise<void> {
    // Update status to 'reverted'
    // Log reason
  }
  
  // Get current session progress
  async getSessionProgress(sessionId: string): Promise<Implementation[]> {
    // Return all implementations for session
  }
  
  // Get overall progress
  async getOverallProgress(): Promise<{
    total: number;
    validated: number;
    pending: number;
    reverted: number;
    byType: Record<string, number>;
  }> {
    // Aggregate statistics
  }
}

export const tracker = new ImplementationTracker();
```

## 1.4 Validation UI Component

```typescript
// components/ValidationPrompt.tsx

interface ValidationPromptProps {
  implementation: {
    featureName: string;
    description: string;
    filesCreated: string[];
    filesModified: string[];
  };
  onValidate: (message: string) => void;
  onReject: (reason: string) => void;
}

export function ValidationPrompt({ 
  implementation, 
  onValidate, 
  onReject 
}: ValidationPromptProps) {
  return (
    <div className="bg-zinc-900 border border-zinc-700 p-4">
      <div className="text-[10px] uppercase tracking-wider text-zinc-500 mb-2">
        VALIDATION REQUIRED
      </div>
      
      <div className="text-zinc-100 font-medium mb-2">
        {implementation.featureName}
      </div>
      
      <div className="text-zinc-400 text-sm mb-4">
        {implementation.description}
      </div>
      
      <div className="text-[10px] text-zinc-500 mb-4">
        Files: {implementation.filesCreated.length} created, 
        {implementation.filesModified.length} modified
      </div>
      
      <div className="flex gap-2">
        <button
          onClick={() => onValidate('Validated and approved')}
          className="bg-emerald-600/20 text-emerald-400 px-4 py-2 text-sm"
        >
          VALIDATE ✓
        </button>
        <button
          onClick={() => onReject('Needs revision')}
          className="bg-red-600/20 text-red-400 px-4 py-2 text-sm"
        >
          REJECT ✗
        </button>
      </div>
    </div>
  );
}
```

---

# PART 2: SELF-AWARENESS POWER

## 2.1 Concept

```
┌─────────────────────────────────────────────────────────────────┐
│                    SELF-AWARENESS POWER                          │
│              "AkhAI Observes and Understands"                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   USER ACTIVITY                    AKHAI OBSERVES               │
│   ──────────────                   ─────────────────            │
│                                                                 │
│   Query patterns      ────────►    Topic interests              │
│   Time spent          ────────►    Engagement level             │
│   Methodology used    ────────►    Thinking style               │
│   Topics explored     ────────►    Knowledge gaps               │
│   Questions asked     ────────►    Learning goals               │
│   Responses accepted  ────────►    Satisfaction signals         │
│   Responses rejected  ────────►    Improvement areas            │
│                                                                 │
│                         │                                       │
│                         ▼                                       │
│                                                                 │
│              ┌─────────────────────────────┐                    │
│              │    USER UNDERSTANDING       │                    │
│              │         PROFILE             │                    │
│              │                             │                    │
│              │  • Communication style      │                    │
│              │  • Expertise level          │                    │
│              │  • Interest patterns        │                    │
│              │  • Preferred methodologies  │                    │
│              │  • Peak activity times      │                    │
│              │  • Topic clusters           │                    │
│              │  • Growth trajectory        │                    │
│              └─────────────────────────────┘                    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## 2.2 Database Schema for Self-Awareness

```sql
-- User behavior tracking
CREATE TABLE user_behavior_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  
  -- Action details
  action_type TEXT NOT NULL, -- 'query' | 'view' | 'click' | 'copy' | 'feedback' | 'expand'
  action_target TEXT, -- What was acted upon
  action_context TEXT, -- JSON with context
  
  -- Timing
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  session_id TEXT,
  duration_ms INTEGER, -- How long action took
  
  -- Related entities
  query_id INTEGER,
  topic_id INTEGER,
  methodology TEXT,
  
  FOREIGN KEY (query_id) REFERENCES queries(id)
);

-- User understanding profile (computed)
CREATE TABLE user_profile_insights (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL UNIQUE,
  
  -- Communication analysis
  communication_style TEXT, -- JSON: {formality, technicality, verbosity}
  expertise_level TEXT, -- 'beginner' | 'intermediate' | 'advanced' | 'expert'
  preferred_response_length TEXT, -- 'short' | 'medium' | 'detailed'
  
  -- Interest patterns
  top_topics TEXT, -- JSON array of topic IDs with weights
  topic_clusters TEXT, -- JSON: clustered interests
  emerging_interests TEXT, -- JSON: recently growing topics
  
  -- Methodology preferences
  methodology_preferences TEXT, -- JSON: {method: usage_count, satisfaction_rate}
  thinking_style TEXT, -- 'analytical' | 'creative' | 'practical' | 'mixed'
  
  -- Engagement patterns
  peak_activity_hours TEXT, -- JSON: hour -> activity_count
  average_session_duration INTEGER, -- minutes
  queries_per_session REAL,
  
  -- Growth tracking
  knowledge_trajectory TEXT, -- JSON: topic -> proficiency over time
  wisdom_velocity REAL, -- Points earned per day average
  ascent_progress TEXT, -- JSON: sephirotic level progress
  
  -- Satisfaction signals
  acceptance_rate REAL, -- Responses accepted vs rejected
  expansion_rate REAL, -- How often user expands/explores
  return_rate REAL, -- Session return frequency
  
  -- Timestamps
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_computed_at DATETIME
);

-- Metrics snapshots (for trends)
CREATE TABLE user_metrics_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  metric_name TEXT NOT NULL,
  metric_value REAL NOT NULL,
  recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_metrics_user ON user_metrics_history(user_id, metric_name);
CREATE INDEX idx_metrics_time ON user_metrics_history(recorded_at);
```

## 2.3 Self-Awareness Engine

```typescript
// lib/self-awareness.ts

interface UserInsight {
  userId: string;
  
  // Communication
  communicationStyle: {
    formality: number;      // 0-1 (casual to formal)
    technicality: number;   // 0-1 (simple to technical)
    verbosity: number;      // 0-1 (concise to detailed)
  };
  
  // Expertise
  expertiseLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  expertiseByTopic: Record<string, number>;
  
  // Interests
  topTopics: Array<{
    topicId: string;
    name: string;
    weight: number;
    lastAccessed: Date;
    queryCount: number;
  }>;
  
  topicClusters: Array<{
    name: string;
    topics: string[];
    coherence: number;
  }>;
  
  // Methodology
  methodologyPreferences: Record<string, {
    usageCount: number;
    satisfactionRate: number;
    averageDuration: number;
  }>;
  
  thinkingStyle: 'analytical' | 'creative' | 'practical' | 'mixed';
  
  // Engagement
  peakActivityHours: number[];
  averageSessionDuration: number;
  queriesPerSession: number;
  
  // Growth
  wisdomVelocity: number;
  ascentProgress: {
    currentLevel: number;
    levelName: string;
    progressToNext: number;
  };
  
  // Satisfaction
  acceptanceRate: number;
  expansionRate: number;
  returnRate: number;
}

export class SelfAwarenessEngine {
  
  // Log user behavior
  async logBehavior(data: {
    userId: string;
    actionType: string;
    actionTarget?: string;
    context?: Record<string, any>;
    durationMs?: number;
    queryId?: number;
    topicId?: number;
    methodology?: string;
  }): Promise<void> {
    // Insert into user_behavior_log
  }
  
  // Compute user insights (run periodically)
  async computeInsights(userId: string): Promise<UserInsight> {
    // 1. Fetch all behavior logs for user
    const behaviors = await this.getBehaviors(userId);
    
    // 2. Analyze communication style
    const communicationStyle = this.analyzeCommunicationStyle(behaviors);
    
    // 3. Determine expertise level
    const expertiseLevel = this.analyzeExpertise(behaviors);
    
    // 4. Extract topic interests
    const topTopics = this.extractTopTopics(behaviors);
    const topicClusters = this.clusterTopics(topTopics);
    
    // 5. Analyze methodology preferences
    const methodologyPreferences = this.analyzeMethodologyUsage(behaviors);
    const thinkingStyle = this.inferThinkingStyle(methodologyPreferences);
    
    // 6. Calculate engagement metrics
    const engagement = this.calculateEngagement(behaviors);
    
    // 7. Track growth
    const growth = this.trackGrowth(userId, behaviors);
    
    // 8. Measure satisfaction
    const satisfaction = this.measureSatisfaction(behaviors);
    
    // 9. Save to database
    await this.saveInsights(userId, {
      communicationStyle,
      expertiseLevel,
      topTopics,
      topicClusters,
      methodologyPreferences,
      thinkingStyle,
      ...engagement,
      ...growth,
      ...satisfaction
    });
    
    return this.getInsights(userId);
  }
  
  // Get current insights
  async getInsights(userId: string): Promise<UserInsight | null> {
    // Fetch from user_profile_insights
  }
  
  // Get insights for AI context injection
  async getContextForAI(userId: string): Promise<string> {
    const insights = await this.getInsights(userId);
    if (!insights) return '';
    
    return `
USER PROFILE:
- Communication: ${insights.communicationStyle.formality > 0.5 ? 'formal' : 'casual'}, 
  ${insights.communicationStyle.technicality > 0.5 ? 'technical' : 'simple'}
- Expertise: ${insights.expertiseLevel}
- Top interests: ${insights.topTopics.slice(0, 3).map(t => t.name).join(', ')}
- Preferred methodology: ${this.getPreferredMethodology(insights.methodologyPreferences)}
- Thinking style: ${insights.thinkingStyle}
- Current level: ${insights.ascentProgress.levelName} (L${insights.ascentProgress.currentLevel})
    `.trim();
  }
  
  // Analyze patterns
  private analyzeCommunicationStyle(behaviors: any[]): UserInsight['communicationStyle'] {
    // Analyze query lengths, vocabulary complexity, question patterns
    // Return formality, technicality, verbosity scores
  }
  
  private analyzeExpertise(behaviors: any[]): UserInsight['expertiseLevel'] {
    // Look at topic depth, terminology used, question complexity
    // Return expertise level
  }
  
  private extractTopTopics(behaviors: any[]): UserInsight['topTopics'] {
    // Count topic occurrences, weight by recency
    // Return sorted top topics
  }
  
  private clusterTopics(topics: UserInsight['topTopics']): UserInsight['topicClusters'] {
    // Group related topics using semantic similarity
    // Return clusters
  }
  
  private inferThinkingStyle(prefs: UserInsight['methodologyPreferences']): string {
    // PoT heavy -> analytical
    // GTP heavy -> thorough
    // Direct heavy -> practical
    // CoD heavy -> iterative
  }
}

export const selfAwareness = new SelfAwarenessEngine();
```

## 2.4 Self-Awareness UI Component

```typescript
// components/SelfAwarenessPanel.tsx

interface SelfAwarenessPanelProps {
  insights: UserInsight;
  isActive: boolean;
  onToggle: () => void;
}

export function SelfAwarenessPanel({ insights, isActive, onToggle }: SelfAwarenessPanelProps) {
  return (
    <div className="bg-zinc-900 border border-zinc-700">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-600'}`} />
          <span className="text-[10px] uppercase tracking-wider text-zinc-400">
            SELF-AWARENESS
          </span>
        </div>
        <button
          onClick={onToggle}
          className={`px-3 py-1 text-[9px] uppercase ${
            isActive 
              ? 'bg-emerald-600/20 text-emerald-400' 
              : 'bg-zinc-800 text-zinc-500'
          }`}
        >
          {isActive ? 'ACTIVE' : 'INACTIVE'}
        </button>
      </div>
      
      {isActive && (
        <div className="p-3 space-y-4">
          {/* Communication Style */}
          <div>
            <div className="text-[9px] uppercase text-zinc-500 mb-2">
              COMMUNICATION PROFILE
            </div>
            <div className="grid grid-cols-3 gap-2">
              <MetricBar label="Formality" value={insights.communicationStyle.formality} />
              <MetricBar label="Technical" value={insights.communicationStyle.technicality} />
              <MetricBar label="Detail" value={insights.communicationStyle.verbosity} />
            </div>
          </div>
          
          {/* Top Interests */}
          <div>
            <div className="text-[9px] uppercase text-zinc-500 mb-2">
              TOP INTERESTS
            </div>
            <div className="flex flex-wrap gap-1">
              {insights.topTopics.slice(0, 5).map(topic => (
                <span 
                  key={topic.topicId}
                  className="px-2 py-0.5 bg-zinc-800 text-zinc-400 text-[10px]"
                >
                  {topic.name}
                </span>
              ))}
            </div>
          </div>
          
          {/* Thinking Style */}
          <div>
            <div className="text-[9px] uppercase text-zinc-500 mb-1">
              THINKING STYLE
            </div>
            <div className="text-zinc-300 text-sm capitalize">
              {insights.thinkingStyle}
            </div>
          </div>
          
          {/* Engagement */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <div className="text-[9px] text-zinc-500">Satisfaction</div>
              <div className="text-emerald-400 font-mono">
                {Math.round(insights.acceptanceRate * 100)}%
              </div>
            </div>
            <div>
              <div className="text-[9px] text-zinc-500">Exploration</div>
              <div className="text-blue-400 font-mono">
                {Math.round(insights.expansionRate * 100)}%
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
```

---

# PART 3: AUTONOMOUS POWER

## 3.1 Concept

```
┌─────────────────────────────────────────────────────────────────┐
│                     AUTONOMOUS POWER                             │
│           "AkhAI Proactively Creates for You"                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  WHEN ACTIVATED:                                                │
│                                                                 │
│   1. ANALYZE TOP TOPICS                                         │
│      │                                                          │
│      │  Side Canal ──► Get top 5 most important topics          │
│      │                  Based on: recency, frequency, pinned    │
│      ▼                                                          │
│                                                                 │
│   2. IDENTIFY OPPORTUNITIES                                     │
│      │                                                          │
│      │  For each topic:                                         │
│      │  - What hasn't been explored?                            │
│      │  - What connections exist between topics?                │
│      │  - What would user benefit from knowing?                 │
│      ▼                                                          │
│                                                                 │
│   3. GENERATE DRAFTS                                            │
│      │                                                          │
│      │  Create proactive content:                               │
│      │  - Research summaries                                    │
│      │  - Connection insights                                   │
│      │  - Action suggestions                                    │
│      │  - Questions to consider                                 │
│      ▼                                                          │
│                                                                 │
│   4. PRESENT TO USER                                            │
│                                                                 │
│      ┌─────────────────────────────────────────────────────┐   │
│      │  💡 AUTONOMOUS DRAFT                                │   │
│      │                                                     │   │
│      │  Based on your interest in [Topic A] and [Topic B], │   │
│      │  I noticed an interesting connection...             │   │
│      │                                                     │   │
│      │  [Full draft content]                               │   │
│      │                                                     │   │
│      │  ┌─────────┐ ┌─────────┐ ┌─────────┐              │   │
│      │  │ EXPLORE │ │  SAVE   │ │ DISMISS │              │   │
│      │  └─────────┘ └─────────┘ └─────────┘              │   │
│      └─────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## 3.2 Database Schema for Autonomous

```sql
-- Autonomous drafts
CREATE TABLE autonomous_drafts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  
  -- Draft content
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  draft_type TEXT NOT NULL, -- 'insight' | 'summary' | 'connection' | 'suggestion' | 'question'
  
  -- Source topics
  source_topics TEXT NOT NULL, -- JSON array of topic IDs
  topic_connections TEXT, -- JSON: how topics relate
  
  -- Generation details
  methodology_used TEXT,
  confidence_score REAL,
  relevance_score REAL,
  
  -- Status
  status TEXT DEFAULT 'pending', -- 'pending' | 'viewed' | 'explored' | 'saved' | 'dismissed'
  user_action TEXT, -- What user did with it
  user_feedback TEXT, -- Optional feedback
  
  -- Timestamps
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  viewed_at DATETIME,
  actioned_at DATETIME,
  
  -- Scheduling
  scheduled_for DATETIME, -- When to show
  priority INTEGER DEFAULT 5, -- 1-10
  
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX idx_drafts_user ON autonomous_drafts(user_id, status);
CREATE INDEX idx_drafts_schedule ON autonomous_drafts(scheduled_for);

-- Autonomous run log
CREATE TABLE autonomous_runs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  
  -- Run details
  started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME,
  status TEXT DEFAULT 'running', -- 'running' | 'completed' | 'failed'
  
  -- Results
  topics_analyzed INTEGER,
  drafts_generated INTEGER,
  errors TEXT, -- JSON array
  
  -- Performance
  duration_ms INTEGER,
  tokens_used INTEGER,
  cost_estimate REAL
);
```

## 3.3 Autonomous Engine

```typescript
// lib/autonomous-engine.ts

interface AutonomousDraft {
  id: number;
  title: string;
  content: string;
  draftType: 'insight' | 'summary' | 'connection' | 'suggestion' | 'question';
  sourceTopics: Array<{
    id: string;
    name: string;
    relevance: number;
  }>;
  topicConnections?: Array<{
    from: string;
    to: string;
    relationship: string;
  }>;
  confidence: number;
  relevance: number;
  createdAt: Date;
}

interface AutonomousConfig {
  enabled: boolean;
  maxDraftsPerRun: number;
  runFrequency: 'on_demand' | 'daily' | 'weekly';
  focusTopics?: string[]; // Specific topics to focus on
  draftTypes: Array<AutonomousDraft['draftType']>;
  minConfidence: number;
}

export class AutonomousEngine {
  
  // Run autonomous analysis
  async run(userId: string, config?: Partial<AutonomousConfig>): Promise<AutonomousDraft[]> {
    const runId = await this.startRun(userId);
    
    try {
      // 1. Get top topics from Side Canal
      const topics = await this.getTopTopics(userId, 5);
      
      // 2. Analyze each topic for opportunities
      const opportunities = await this.analyzeOpportunities(userId, topics);
      
      // 3. Find connections between topics
      const connections = await this.findConnections(topics);
      
      // 4. Generate drafts
      const drafts = await this.generateDrafts(userId, {
        topics,
        opportunities,
        connections,
        config: { ...this.defaultConfig, ...config }
      });
      
      // 5. Save drafts
      const savedDrafts = await this.saveDrafts(userId, drafts);
      
      // 6. Complete run
      await this.completeRun(runId, savedDrafts.length);
      
      return savedDrafts;
      
    } catch (error) {
      await this.failRun(runId, error);
      throw error;
    }
  }
  
  // Get top topics from Side Canal
  private async getTopTopics(userId: string, limit: number) {
    // Query Side Canal store
    // Sort by: pinned first, then by frequency * recency
    // Return top N topics
  }
  
  // Analyze opportunities for each topic
  private async analyzeOpportunities(userId: string, topics: any[]) {
    const opportunities = [];
    
    for (const topic of topics) {
      // What queries were asked?
      const queries = await this.getTopicQueries(topic.id);
      
      // What wasn't explored yet?
      const unexplored = await this.findUnexploredAngles(topic, queries);
      
      // What recent developments exist?
      const developments = await this.checkDevelopments(topic);
      
      opportunities.push({
        topicId: topic.id,
        unexploredAngles: unexplored,
        recentDevelopments: developments,
        suggestedQuestions: this.generateQuestions(topic, unexplored)
      });
    }
    
    return opportunities;
  }
  
  // Find connections between topics
  private async findConnections(topics: any[]) {
    const connections = [];
    
    // Compare each pair of topics
    for (let i = 0; i < topics.length; i++) {
      for (let j = i + 1; j < topics.length; j++) {
        const connection = await this.analyzeConnection(topics[i], topics[j]);
        if (connection.strength > 0.3) {
          connections.push({
            from: topics[i].id,
            to: topics[j].id,
            relationship: connection.relationship,
            strength: connection.strength,
            insight: connection.insight
          });
        }
      }
    }
    
    return connections;
  }
  
  // Generate drafts based on analysis
  private async generateDrafts(userId: string, data: {
    topics: any[];
    opportunities: any[];
    connections: any[];
    config: AutonomousConfig;
  }): Promise<AutonomousDraft[]> {
    const drafts: AutonomousDraft[] = [];
    
    // 1. Generate insight drafts from connections
    if (data.config.draftTypes.includes('connection')) {
      for (const conn of data.connections.slice(0, 2)) {
        const draft = await this.generateConnectionDraft(conn, data.topics);
        if (draft.confidence >= data.config.minConfidence) {
          drafts.push(draft);
        }
      }
    }
    
    // 2. Generate summary drafts for active topics
    if (data.config.draftTypes.includes('summary')) {
      const mostActive = data.topics[0];
      const draft = await this.generateSummaryDraft(mostActive);
      if (draft.confidence >= data.config.minConfidence) {
        drafts.push(draft);
      }
    }
    
    // 3. Generate suggestion drafts from opportunities
    if (data.config.draftTypes.includes('suggestion')) {
      for (const opp of data.opportunities.slice(0, 2)) {
        if (opp.unexploredAngles.length > 0) {
          const draft = await this.generateSuggestionDraft(opp);
          if (draft.confidence >= data.config.minConfidence) {
            drafts.push(draft);
          }
        }
      }
    }
    
    // 4. Generate questions to consider
    if (data.config.draftTypes.includes('question')) {
      const questions = await this.generateQuestionDraft(data.opportunities);
      if (questions.confidence >= data.config.minConfidence) {
        drafts.push(questions);
      }
    }
    
    return drafts.slice(0, data.config.maxDraftsPerRun);
  }
  
  // Generate a connection insight draft
  private async generateConnectionDraft(
    connection: any, 
    topics: any[]
  ): Promise<AutonomousDraft> {
    const topic1 = topics.find(t => t.id === connection.from);
    const topic2 = topics.find(t => t.id === connection.to);
    
    // Use AI to generate insight
    const prompt = `
      Based on these two topics of interest:
      1. ${topic1.name}: ${topic1.synopsis}
      2. ${topic2.name}: ${topic2.synopsis}
      
      Generate a brief insight (2-3 paragraphs) about how these topics 
      connect and what the user might find valuable exploring at their 
      intersection. Be specific and actionable.
    `;
    
    const content = await this.callAI(prompt, 'direct');
    
    return {
      id: 0, // Will be set on save
      title: `Connection: ${topic1.name} ↔ ${topic2.name}`,
      content,
      draftType: 'connection',
      sourceTopics: [
        { id: topic1.id, name: topic1.name, relevance: connection.strength },
        { id: topic2.id, name: topic2.name, relevance: connection.strength }
      ],
      topicConnections: [connection],
      confidence: connection.strength,
      relevance: 0.8,
      createdAt: new Date()
    };
  }
  
  // Get pending drafts for user
  async getPendingDrafts(userId: string): Promise<AutonomousDraft[]> {
    // Query autonomous_drafts where status = 'pending'
  }
  
  // User actions
  async exploreDraft(draftId: number): Promise<void> {
    // Mark as explored, possibly trigger new query
  }
  
  async saveDraft(draftId: number): Promise<void> {
    // Save to user's artifacts
  }
  
  async dismissDraft(draftId: number, feedback?: string): Promise<void> {
    // Mark as dismissed, save feedback for learning
  }
  
  private defaultConfig: AutonomousConfig = {
    enabled: true,
    maxDraftsPerRun: 3,
    runFrequency: 'on_demand',
    draftTypes: ['connection', 'insight', 'suggestion'],
    minConfidence: 0.6
  };
}

export const autonomous = new AutonomousEngine();
```

## 3.4 Autonomous UI Component

```typescript
// components/AutonomousDraftCard.tsx

interface AutonomousDraftCardProps {
  draft: AutonomousDraft;
  onExplore: () => void;
  onSave: () => void;
  onDismiss: () => void;
}

export function AutonomousDraftCard({ 
  draft, 
  onExplore, 
  onSave, 
  onDismiss 
}: AutonomousDraftCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  return (
    <div className="bg-zinc-900 border border-zinc-700">
      {/* Header */}
      <div className="p-3 border-b border-zinc-800">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-1.5 h-1.5 bg-amber-500 animate-pulse" />
          <span className="text-[9px] uppercase tracking-wider text-amber-500/80">
            AUTONOMOUS DRAFT
          </span>
          <span className="text-[9px] text-zinc-600">
            {draft.draftType.toUpperCase()}
          </span>
        </div>
        <div className="text-zinc-200 font-medium">
          {draft.title}
        </div>
      </div>
      
      {/* Topics */}
      <div className="px-3 py-2 border-b border-zinc-800/50">
        <div className="flex flex-wrap gap-1">
          {draft.sourceTopics.map(topic => (
            <span 
              key={topic.id}
              className="px-2 py-0.5 bg-zinc-800 text-zinc-400 text-[10px]"
            >
              {topic.name}
            </span>
          ))}
        </div>
      </div>
      
      {/* Content Preview / Full */}
      <div className="p-3">
        <div className={`text-zinc-400 text-sm ${!isExpanded && 'line-clamp-3'}`}>
          {draft.content}
        </div>
        {draft.content.length > 200 && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-[10px] text-zinc-500 hover:text-zinc-400 mt-2"
          >
            {isExpanded ? 'SHOW LESS' : 'SHOW MORE'}
          </button>
        )}
      </div>
      
      {/* Actions */}
      <div className="flex border-t border-zinc-800">
        <button
          onClick={onExplore}
          className="flex-1 py-2 text-[10px] uppercase tracking-wider text-emerald-400 hover:bg-emerald-600/10 border-r border-zinc-800"
        >
          EXPLORE
        </button>
        <button
          onClick={onSave}
          className="flex-1 py-2 text-[10px] uppercase tracking-wider text-blue-400 hover:bg-blue-600/10 border-r border-zinc-800"
        >
          SAVE
        </button>
        <button
          onClick={onDismiss}
          className="flex-1 py-2 text-[10px] uppercase tracking-wider text-zinc-500 hover:bg-zinc-800"
        >
          DISMISS
        </button>
      </div>
      
      {/* Confidence */}
      <div className="px-3 py-1 bg-zinc-950 text-[9px] text-zinc-600 flex justify-between">
        <span>Confidence: {Math.round(draft.confidence * 100)}%</span>
        <span>Relevance: {Math.round(draft.relevance * 100)}%</span>
      </div>
    </div>
  );
}
```

## 3.5 Autonomous Toggle Button

```typescript
// components/AutonomousButton.tsx

interface AutonomousButtonProps {
  isActive: boolean;
  isRunning: boolean;
  draftCount: number;
  onToggle: () => void;
  onRun: () => void;
}

export function AutonomousButton({
  isActive,
  isRunning,
  draftCount,
  onToggle,
  onRun
}: AutonomousButtonProps) {
  return (
    <div className="flex items-center gap-2">
      {/* Power Toggle */}
      <button
        onClick={onToggle}
        className={`
          relative px-3 py-1.5 text-[10px] uppercase tracking-wider
          border transition-all duration-300
          ${isActive 
            ? 'bg-purple-600/20 border-purple-500/50 text-purple-400' 
            : 'bg-zinc-900 border-zinc-700 text-zinc-500'
          }
        `}
      >
        <div className="flex items-center gap-2">
          <div className={`
            w-1.5 h-1.5 rounded-full
            ${isActive ? 'bg-purple-500 animate-pulse' : 'bg-zinc-600'}
          `} />
          AUTONOMOUS
        </div>
        
        {/* Draft count badge */}
        {draftCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-amber-500 text-zinc-900 text-[9px] flex items-center justify-center font-bold">
            {draftCount}
          </span>
        )}
      </button>
      
      {/* Run Button (when active) */}
      {isActive && (
        <button
          onClick={onRun}
          disabled={isRunning}
          className={`
            px-2 py-1.5 text-[10px] uppercase
            ${isRunning 
              ? 'bg-zinc-800 text-zinc-500 cursor-wait' 
              : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
            }
          `}
        >
          {isRunning ? (
            <span className="flex items-center gap-1">
              <span className="animate-spin">◌</span> RUNNING
            </span>
          ) : (
            'RUN NOW'
          )}
        </button>
      )}
    </div>
  );
}
```

---

# PART 4: INTEGRATION

## 4.1 Combined Powers Panel

```typescript
// components/MetacognitionPanel.tsx

export function MetacognitionPanel() {
  const [activeTab, setActiveTab] = useState<'awareness' | 'autonomous'>('awareness');
  
  // Self-Awareness state
  const [awarenessActive, setAwarenessActive] = useState(false);
  const [insights, setInsights] = useState<UserInsight | null>(null);
  
  // Autonomous state
  const [autonomousActive, setAutonomousActive] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [drafts, setDrafts] = useState<AutonomousDraft[]>([]);
  
  return (
    <div className="bg-zinc-950 border border-zinc-800 h-full flex flex-col">
      {/* Header */}
      <div className="p-3 border-b border-zinc-800">
        <div className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 mb-2">
          METACOGNITION
        </div>
        
        {/* Tab Switcher */}
        <div className="flex">
          <button
            onClick={() => setActiveTab('awareness')}
            className={`flex-1 py-1.5 text-[9px] uppercase ${
              activeTab === 'awareness' 
                ? 'bg-zinc-800 text-zinc-200' 
                : 'text-zinc-500'
            }`}
          >
            SELF-AWARENESS
          </button>
          <button
            onClick={() => setActiveTab('autonomous')}
            className={`flex-1 py-1.5 text-[9px] uppercase ${
              activeTab === 'autonomous' 
                ? 'bg-zinc-800 text-zinc-200' 
                : 'text-zinc-500'
            }`}
          >
            AUTONOMOUS
            {drafts.length > 0 && (
              <span className="ml-1 text-amber-500">({drafts.length})</span>
            )}
          </button>
        </div>
      </div>
      
      {/* Content */}
      <div className="flex-1 overflow-auto">
        {activeTab === 'awareness' ? (
          <SelfAwarenessPanel
            insights={insights}
            isActive={awarenessActive}
            onToggle={() => setAwarenessActive(!awarenessActive)}
          />
        ) : (
          <div className="p-3 space-y-3">
            <AutonomousButton
              isActive={autonomousActive}
              isRunning={isRunning}
              draftCount={drafts.length}
              onToggle={() => setAutonomousActive(!autonomousActive)}
              onRun={handleRunAutonomous}
            />
            
            {/* Drafts List */}
            {drafts.map(draft => (
              <AutonomousDraftCard
                key={draft.id}
                draft={draft}
                onExplore={() => handleExplore(draft)}
                onSave={() => handleSave(draft)}
                onDismiss={() => handleDismiss(draft)}
              />
            ))}
            
            {drafts.length === 0 && autonomousActive && (
              <div className="text-center py-8 text-zinc-600 text-sm">
                No drafts yet. Click "RUN NOW" to generate.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
```

## 4.2 Add to Main Layout

```typescript
// In app/page.tsx or layout

// Add MetacognitionPanel to sidebar or as toggle panel
<MetacognitionPanel />

// Or as floating buttons in navbar
<div className="flex items-center gap-2">
  <SelfAwarenessToggle />
  <AutonomousButton />
</div>
```

---

# PART 5: CLAUDE CLI COMMANDS

## Command: Implementation Tracker

```bash
claude "In /Users/sheirraza/akhai/packages/web:

TASK: Create Implementation Tracker system for validation workflow

1. CREATE database migration:
File: lib/migrations/004_implementation_tracking.sql

Tables:
- implementation_log (id, feature_name, feature_type, description, files_created, files_modified, lines_added, lines_modified, status, validation_message, validated_at, created_at, session_id, parent_id)
- implementation_metrics (id, implementation_id, metric_name, metric_value, metric_type, recorded_at)

2. CREATE tracker library:
File: lib/implementation-tracker.ts

Class ImplementationTracker with methods:
- startImplementation(data)
- updateFiles(id, data)
- markTesting(id)
- validate(id, message)
- revert(id, reason)
- getSessionProgress(sessionId)
- getOverallProgress()

3. CREATE validation UI:
File: components/ValidationPrompt.tsx

- Shows feature name, description, files changed
- VALIDATE button (green)
- REJECT button (red)
- Styled in Code Relic aesthetic

4. CREATE API endpoint:
File: app/api/implementations/route.ts

- GET: List implementations
- POST: Start new implementation
- PATCH: Update status (validate/reject)

5. RUN migration to create tables

TEST: Create test implementation, validate it, check database"
```

## Command: Self-Awareness System

```bash
claude "In /Users/sheirraza/akhai/packages/web:

TASK: Create Self-Awareness system for AkhAI metacognition

1. CREATE database migration:
File: lib/migrations/005_self_awareness.sql

Tables:
- user_behavior_log (action tracking)
- user_profile_insights (computed insights)
- user_metrics_history (trends)

2. CREATE awareness engine:
File: lib/self-awareness.ts

Class SelfAwarenessEngine with methods:
- logBehavior(data)
- computeInsights(userId)
- getInsights(userId)
- getContextForAI(userId)
- Analysis methods for: communication, expertise, topics, methodology

3. CREATE awareness UI:
File: components/SelfAwarenessPanel.tsx

Shows:
- Communication profile (formality, technicality, detail bars)
- Top interests (topic tags)
- Thinking style
- Engagement metrics (satisfaction, exploration)
- Active/Inactive toggle

4. INTEGRATE behavior logging:
Update app/page.tsx and app/api/simple-query/route.ts to log:
- Queries
- Methodology used
- Response feedback (accept/reject)
- Topic interactions

5. RUN migration

TEST: Make queries, check behavior logged, see insights computed"
```

## Command: Autonomous System

```bash
claude "In /Users/sheirraza/akhai/packages/web:

TASK: Create Autonomous intelligence system

1. CREATE database migration:
File: lib/migrations/006_autonomous.sql

Tables:
- autonomous_drafts (drafts with status tracking)
- autonomous_runs (run history)

2. CREATE autonomous engine:
File: lib/autonomous-engine.ts

Class AutonomousEngine with methods:
- run(userId, config)
- getTopTopics(userId)
- analyzeOpportunities(userId, topics)
- findConnections(topics)
- generateDrafts(userId, data)
- getPendingDrafts(userId)
- exploreDraft(id), saveDraft(id), dismissDraft(id)

3. CREATE autonomous UI:
File: components/AutonomousButton.tsx
File: components/AutonomousDraftCard.tsx

Button with:
- Power toggle (purple when active)
- Draft count badge
- RUN NOW button
- Running state

Draft card with:
- Title, type badge
- Source topics
- Content (expandable)
- Actions: EXPLORE | SAVE | DISMISS
- Confidence/relevance scores

4. CREATE combined panel:
File: components/MetacognitionPanel.tsx

Tabbed panel with:
- SELF-AWARENESS tab
- AUTONOMOUS tab with drafts list

5. ADD to main interface:
Update app/page.tsx to include MetacognitionPanel in sidebar or as toggleable panel

6. RUN migration

TEST: Activate autonomous, run, see drafts generated from topics"
```

---

# SUMMARY

| System | Purpose | Key Components |
|--------|---------|----------------|
| **Validation Workflow** | Track & verify all implementations | implementation_log table, ValidationPrompt UI |
| **Self-Awareness** | Observe & understand user behavior | behavior_log, SelfAwarenessEngine, insights panel |
| **Autonomous** | Proactively generate drafts | AutonomousEngine, draft cards, topic analysis |

**Integration Flow:**
1. Build feature → 2. Test on localhost → 3. User validates → 4. Save to database → 5. Move to next

**Metacognition Powers:**
- **Self-Awareness Button:** Always analyzing user behavior in background
- **Autonomous Button:** On-demand or scheduled draft generation

---

*AkhAI Metacognition System v1.0*
*Building Self-Aware, Autonomous AI Intelligence*
