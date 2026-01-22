-- ============================================================================
-- GNOSTIC AGI DATABASE MIGRATION (COMPLETE)
-- ============================================================================
-- Version: 003
-- Date: 2025-12-31
-- 
-- This migration adds all tables for:
-- 1. User Gnosis Profiles - Deep user understanding
-- 2. Evolution Records - Track user/AI growth
-- 3. Monad Reflections - AI self-reflection logs
-- 4. Tree States - Living Tree snapshots
-- 5. Experiments - Autonomous research tracking
-- 6. Wisdom Points - User ranking system
-- 7. Tournaments - Competitive challenges
-- 8. Leaderboards - Rankings
-- ============================================================================

-- ============================================================================
-- PART 1: USER GNOSIS SYSTEM
-- ============================================================================

-- User Gnosis Profiles
CREATE TABLE IF NOT EXISTS user_gnosis_profiles (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL UNIQUE,
    communication_style TEXT,
    worldview TEXT,
    learning_preferences TEXT,
    interaction_pattern TEXT,
    confidence_scores TEXT,
    interaction_count INTEGER DEFAULT 0,
    total_tokens INTEGER DEFAULT 0,
    first_interaction TEXT,
    last_interaction TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_gnosis_user_id ON user_gnosis_profiles(user_id);

-- User Evolution Records
CREATE TABLE IF NOT EXISTS user_evolution_records (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    event_type TEXT NOT NULL,
    event_data TEXT,
    insight TEXT,
    impact_score REAL,
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_evolution_user_id ON user_evolution_records(user_id);
CREATE INDEX IF NOT EXISTS idx_evolution_created ON user_evolution_records(created_at);

-- ============================================================================
-- PART 2: MONAD SYSTEM
-- ============================================================================

-- Monad Reflections
CREATE TABLE IF NOT EXISTS monad_reflections (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    session_id TEXT,
    query_hash TEXT,
    mirror_consciousness TEXT,
    word_alchemy TEXT,
    method_oracle TEXT,
    concept_map TEXT,
    response_quality TEXT,
    evolution_update TEXT,
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_monad_session ON monad_reflections(session_id);
CREATE INDEX IF NOT EXISTS idx_monad_user ON monad_reflections(user_id);

-- Tree States
CREATE TABLE IF NOT EXISTS tree_states (
    id TEXT PRIMARY KEY,
    session_id TEXT,
    sephiroth_activations TEXT,
    path_weights TEXT,
    tree_health TEXT,
    self_narrative TEXT,
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_tree_session ON tree_states(session_id);

-- ============================================================================
-- PART 3: EXPERIMENT CHAMBER
-- ============================================================================

-- Experiments
CREATE TABLE IF NOT EXISTS experiments (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    hypothesis TEXT NOT NULL,
    methodology TEXT,
    status TEXT DEFAULT 'conceived',
    results TEXT,
    applicable_to_user INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    started_at TEXT,
    completed_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_experiments_user ON experiments(user_id);
CREATE INDEX IF NOT EXISTS idx_experiments_status ON experiments(status);

-- Research Queue
CREATE TABLE IF NOT EXISTS research_queue (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    topic TEXT NOT NULL,
    priority INTEGER DEFAULT 5,
    estimated_effort INTEGER,
    expected_benefit TEXT,
    triggered_by TEXT,
    status TEXT DEFAULT 'queued',
    created_at TEXT DEFAULT (datetime('now')),
    started_at TEXT,
    completed_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_research_priority ON research_queue(priority DESC);
CREATE INDEX IF NOT EXISTS idx_research_status ON research_queue(status);

-- ============================================================================
-- PART 4: WISDOM POINTS SYSTEM
-- ============================================================================

-- User Wisdom Points
CREATE TABLE IF NOT EXISTS user_wisdom_points (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL UNIQUE,
    total_points INTEGER DEFAULT 0,
    current_level INTEGER DEFAULT 1,
    discovery_points TEXT,
    contribution_points TEXT,
    research_points TEXT,
    tournament_points TEXT,
    exploration_points TEXT,
    daily_points INTEGER DEFAULT 0,
    weekly_points INTEGER DEFAULT 0,
    monthly_points INTEGER DEFAULT 0,
    current_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    last_active_date TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_wisdom_user ON user_wisdom_points(user_id);
CREATE INDEX IF NOT EXISTS idx_wisdom_level ON user_wisdom_points(current_level);
CREATE INDEX IF NOT EXISTS idx_wisdom_total ON user_wisdom_points(total_points DESC);

-- Point Transactions
CREATE TABLE IF NOT EXISTS point_transactions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    points INTEGER NOT NULL,
    category TEXT NOT NULL,
    action TEXT NOT NULL,
    description TEXT,
    multiplier REAL DEFAULT 1.0,
    streak_bonus INTEGER DEFAULT 0,
    related_entity_type TEXT,
    related_entity_id TEXT,
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_transactions_user ON point_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON point_transactions(category);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON point_transactions(created_at);

-- ============================================================================
-- PART 5: TOURNAMENT SYSTEM
-- ============================================================================

-- Tournaments
CREATE TABLE IF NOT EXISTS tournaments (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    level INTEGER NOT NULL,
    type TEXT NOT NULL,
    registration_start TEXT,
    registration_end TEXT,
    tournament_start TEXT,
    tournament_end TEXT,
    min_participants INTEGER DEFAULT 2,
    max_participants INTEGER,
    entry_fee INTEGER DEFAULT 0,
    entry_points_required INTEGER DEFAULT 0,
    prize_pool TEXT,
    status TEXT DEFAULT 'upcoming',
    current_round INTEGER DEFAULT 0,
    winner_id TEXT,
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_tournaments_status ON tournaments(status);
CREATE INDEX IF NOT EXISTS idx_tournaments_level ON tournaments(level);

-- Tournament Participants
CREATE TABLE IF NOT EXISTS tournament_participants (
    id TEXT PRIMARY KEY,
    tournament_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    registered_at TEXT DEFAULT (datetime('now')),
    entry_fee_paid INTEGER DEFAULT 0,
    current_score REAL DEFAULT 0,
    rounds_completed INTEGER DEFAULT 0,
    elimination_round INTEGER,
    final_placement INTEGER,
    prize_earned TEXT,
    UNIQUE(tournament_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_participants_tournament ON tournament_participants(tournament_id);
CREATE INDEX IF NOT EXISTS idx_participants_user ON tournament_participants(user_id);

-- Tournament Rounds
CREATE TABLE IF NOT EXISTS tournament_rounds (
    id TEXT PRIMARY KEY,
    tournament_id TEXT NOT NULL,
    round_number INTEGER NOT NULL,
    challenge_type TEXT NOT NULL,
    challenge_prompt TEXT NOT NULL,
    challenge_resources TEXT,
    time_limit INTEGER,
    scoring_rubric TEXT,
    max_score REAL,
    start_time TEXT,
    end_time TEXT,
    status TEXT DEFAULT 'pending',
    UNIQUE(tournament_id, round_number)
);

CREATE INDEX IF NOT EXISTS idx_rounds_tournament ON tournament_rounds(tournament_id);

-- Tournament Submissions
CREATE TABLE IF NOT EXISTS tournament_submissions (
    id TEXT PRIMARY KEY,
    round_id TEXT NOT NULL,
    participant_id TEXT NOT NULL,
    content TEXT NOT NULL,
    attachments TEXT,
    submitted_at TEXT DEFAULT (datetime('now')),
    time_taken INTEGER,
    score REAL,
    feedback TEXT,
    judged_by TEXT,
    judged_at TEXT,
    UNIQUE(round_id, participant_id)
);

CREATE INDEX IF NOT EXISTS idx_submissions_round ON tournament_submissions(round_id);

-- ============================================================================
-- PART 6: LEADERBOARDS & ANALYTICS
-- ============================================================================

-- Leaderboards
CREATE TABLE IF NOT EXISTS leaderboards (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL,
    period_start TEXT,
    period_end TEXT,
    rankings TEXT NOT NULL,
    generated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_leaderboards_type ON leaderboards(type);

-- Sefirot Council Deliberations
CREATE TABLE IF NOT EXISTS council_deliberations (
    id TEXT PRIMARY KEY,
    session_id TEXT,
    query_hash TEXT,
    agents_participating TEXT,
    deliberation_log TEXT,
    consensus_reached INTEGER,
    final_decision TEXT,
    deliberation_time_ms INTEGER,
    rounds_needed INTEGER,
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_council_session ON council_deliberations(session_id);

-- Methodology Performance
CREATE TABLE IF NOT EXISTS methodology_performance (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    methodology TEXT NOT NULL,
    query_type TEXT,
    usage_count INTEGER DEFAULT 0,
    success_rate REAL DEFAULT 0.5,
    avg_quality_score REAL,
    avg_latency_ms INTEGER,
    explicit_positive INTEGER DEFAULT 0,
    explicit_negative INTEGER DEFAULT 0,
    updated_at TEXT DEFAULT (datetime('now'))
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_method_perf_unique 
    ON methodology_performance(user_id, methodology, query_type);

-- ============================================================================
-- PART 7: TRIGGERS
-- ============================================================================

-- Auto-update timestamps
CREATE TRIGGER IF NOT EXISTS update_gnosis_timestamp 
    AFTER UPDATE ON user_gnosis_profiles
BEGIN
    UPDATE user_gnosis_profiles SET updated_at = datetime('now') WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_wisdom_timestamp 
    AFTER UPDATE ON user_wisdom_points
BEGIN
    UPDATE user_wisdom_points SET updated_at = datetime('now') WHERE id = NEW.id;
END;

-- ============================================================================
-- PART 8: VIEWS
-- ============================================================================

-- User engagement summary
CREATE VIEW IF NOT EXISTS v_user_engagement AS
SELECT 
    ugp.user_id,
    ugp.interaction_count,
    COALESCE(uwp.total_points, 0) as wisdom_points,
    COALESCE(uwp.current_level, 1) as wisdom_level,
    json_extract(ugp.confidence_scores, '$.overall') as understanding_confidence,
    COUNT(DISTINCT uer.id) as evolution_events,
    MAX(ugp.last_interaction) as last_active
FROM user_gnosis_profiles ugp
LEFT JOIN user_wisdom_points uwp ON ugp.user_id = uwp.user_id
LEFT JOIN user_evolution_records uer ON ugp.user_id = uer.user_id
GROUP BY ugp.user_id;

-- Methodology effectiveness
CREATE VIEW IF NOT EXISTS v_methodology_effectiveness AS
SELECT 
    methodology,
    SUM(usage_count) as total_uses,
    AVG(success_rate) as avg_success,
    AVG(avg_quality_score) as avg_quality,
    SUM(explicit_positive) as thumbs_up,
    SUM(explicit_negative) as thumbs_down
FROM methodology_performance
GROUP BY methodology
ORDER BY avg_success DESC;

-- Tournament standings
CREATE VIEW IF NOT EXISTS v_tournament_standings AS
SELECT 
    t.id as tournament_id,
    t.name as tournament_name,
    t.level,
    t.status,
    tp.user_id,
    tp.current_score,
    tp.final_placement,
    RANK() OVER (PARTITION BY t.id ORDER BY tp.current_score DESC) as current_rank
FROM tournaments t
JOIN tournament_participants tp ON t.id = tp.tournament_id
WHERE t.status IN ('active', 'completed');

-- ============================================================================
-- PART 9: SEED DATA
-- ============================================================================

-- Default methodology performance
INSERT OR IGNORE INTO methodology_performance 
    (id, user_id, methodology, query_type, usage_count, success_rate)
VALUES
    ('default_direct', NULL, 'direct', 'conversational', 0, 0.8),
    ('default_cod', NULL, 'cod', 'creative', 0, 0.75),
    ('default_bot', NULL, 'bot', 'analytical', 0, 0.7),
    ('default_react', NULL, 'react', 'procedural', 0, 0.8),
    ('default_pot', NULL, 'pot', 'technical', 0, 0.75),
    ('default_gtp', NULL, 'gtp', 'complex', 0, 0.85),
    ('default_auto', NULL, 'auto', 'any', 0, 0.7);

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- Tables created: 16
-- Indexes created: 20
-- Views created: 3
-- Triggers created: 2
-- ============================================================================
