-- Twinship Database Schema
-- PostgreSQL 14+ with UUID extension and JSONB support

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Custom enums
CREATE TYPE twin_type AS ENUM ('identical', 'fraternal', 'other');
CREATE TYPE theme_color AS ENUM ('neon-pink', 'neon-blue', 'neon-green', 'neon-yellow', 'neon-purple', 'neon-orange', 'neon-cyan', 'neon-red');
CREATE TYPE message_type AS ENUM ('text', 'image', 'emoji', 'reaction', 'twintuition');
CREATE TYPE invitation_status AS ENUM ('pending', 'sent', 'delivered', 'accepted', 'declined', 'expired');
CREATE TYPE assessment_category AS ENUM (
  'identity_fusion', 'autonomy', 'boundaries', 'communication', 'codependency',
  'differentiation', 'attachment', 'conflict_resolution', 'partner_inclusion',
  'power_dynamics', 'openness', 'conscientiousness', 'extraversion',
  'agreeableness', 'neuroticism'
);
CREATE TYPE subscription_status AS ENUM ('active', 'cancelled', 'expired', 'pending');
CREATE TYPE research_study_status AS ENUM ('recruiting', 'active', 'completed', 'paused');
CREATE TYPE consent_status AS ENUM ('pending', 'granted', 'withdrawn', 'expired');

-- ============================================================================
-- CORE USER TABLES
-- ============================================================================

-- Users table - Core user authentication and profile data
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    age INTEGER CHECK (age > 0 AND age <= 120),
    gender VARCHAR(50),
    sexual_orientation VARCHAR(50),
    show_sexual_orientation BOOLEAN DEFAULT FALSE,
    twin_type twin_type NOT NULL,
    other_twin_type_description TEXT,
    twin_deceased BOOLEAN DEFAULT FALSE,
    birth_date DATE NOT NULL,
    zodiac_sign VARCHAR(20),
    place_of_birth VARCHAR(255),
    time_of_birth TIME,
    profile_picture_url TEXT,
    accent_color theme_color NOT NULL DEFAULT 'neon-purple',
    is_connected BOOLEAN DEFAULT FALSE,
    last_seen TIMESTAMP WITH TIME ZONE,
    email_verified BOOLEAN DEFAULT FALSE,
    email_verification_token VARCHAR(255),
    password_reset_token VARCHAR(255),
    password_reset_expires TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Twin pairs table - Manages twin relationships
CREATE TABLE twin_pairs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user1_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    user2_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    pair_code VARCHAR(20) UNIQUE,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'pending', 'inactive')),
    paired_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_interaction TIMESTAMP WITH TIME ZONE,
    sync_score DECIMAL(5,2) DEFAULT 0.00 CHECK (sync_score >= 0 AND sync_score <= 100),
    total_messages INTEGER DEFAULT 0,
    total_assessments INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure users can't be paired with themselves
    CONSTRAINT different_users CHECK (user1_id != user2_id),
    -- Ensure consistent ordering (user1_id < user2_id)
    CONSTRAINT ordered_pair CHECK (user1_id < user2_id),
    -- Unique twin relationships
    UNIQUE(user1_id, user2_id)
);

-- User settings table - App preferences and configuration
CREATE TABLE user_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    research_participation BOOLEAN DEFAULT FALSE,
    notifications_enabled BOOLEAN DEFAULT TRUE,
    push_notifications JSONB DEFAULT '{"messages": true, "twintuition": true, "assessments": false, "research": false}'::jsonb,
    privacy_settings JSONB DEFAULT '{"profile_visible": true, "share_usage_data": false, "allow_research_contact": true}'::jsonb,
    theme_preferences JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- INVITATION SYSTEM
-- ============================================================================

-- Invitations table - Twin invitation system
CREATE TABLE invitations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    inviter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    inviter_name VARCHAR(100) NOT NULL,
    recipient_email VARCHAR(255),
    recipient_phone VARCHAR(20),
    token VARCHAR(64) NOT NULL UNIQUE,
    status invitation_status DEFAULT 'pending',
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    attempt_count INTEGER DEFAULT 0,
    last_attempt_at TIMESTAMP WITH TIME ZONE,
    twin_type twin_type NOT NULL,
    accent_color theme_color NOT NULL,
    deep_link TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Must have either email or phone
    CONSTRAINT contact_required CHECK (recipient_email IS NOT NULL OR recipient_phone IS NOT NULL)
);

-- ============================================================================
-- MESSAGING SYSTEM
-- ============================================================================

-- Messages table - Chat messages between twins
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    twin_pair_id UUID NOT NULL REFERENCES twin_pairs(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    sender_name VARCHAR(100) NOT NULL,
    text TEXT NOT NULL,
    type message_type DEFAULT 'text',
    image_url TEXT,
    reply_to_id UUID REFERENCES messages(id) ON DELETE SET NULL,
    is_delivered BOOLEAN DEFAULT FALSE,
    is_read BOOLEAN DEFAULT FALSE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    read_at TIMESTAMP WITH TIME ZONE,
    accent_color theme_color NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Message reactions table
CREATE TABLE message_reactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    user_name VARCHAR(100) NOT NULL,
    emoji VARCHAR(10) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- One reaction per user per message
    UNIQUE(message_id, user_id, emoji)
);

-- Twintuition moments table - Psychic connection events
CREATE TABLE twintuition_moments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    twin_pair_id UUID NOT NULL REFERENCES twin_pairs(id) ON DELETE CASCADE,
    trigger_message_id UUID REFERENCES messages(id) ON DELETE SET NULL,
    message TEXT NOT NULL,
    type VARCHAR(20) DEFAULT 'sync' CHECK (type IN ('sync', 'intuition', 'connection')),
    confidence DECIMAL(4,3) CHECK (confidence >= 0 AND confidence <= 1),
    detection_algorithm VARCHAR(50),
    keywords_matched TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- ASSESSMENT SYSTEM
-- ============================================================================

-- Assessment items bank
CREATE TABLE assessment_items (
    id VARCHAR(20) PRIMARY KEY,
    question TEXT NOT NULL,
    category assessment_category NOT NULL,
    subcategory VARCHAR(50),
    reverse_scored BOOLEAN DEFAULT FALSE,
    weight DECIMAL(3,2) DEFAULT 1.00,
    composite_indices VARCHAR(10)[] DEFAULT '{}',
    version INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Assessment sessions
CREATE TABLE assessment_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    twin_pair_id UUID REFERENCES twin_pairs(id) ON DELETE SET NULL,
    start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completion_date TIMESTAMP WITH TIME ZONE,
    current_progress DECIMAL(5,2) DEFAULT 0.00 CHECK (current_progress >= 0 AND current_progress <= 100),
    is_complete BOOLEAN DEFAULT FALSE,
    session_metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Assessment responses
CREATE TABLE assessment_responses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES assessment_sessions(id) ON DELETE CASCADE,
    item_id VARCHAR(20) NOT NULL REFERENCES assessment_items(id),
    value INTEGER NOT NULL CHECK (value >= 1 AND value <= 7),
    response_time_ms INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- One response per item per session
    UNIQUE(session_id, item_id)
);

-- Assessment results
CREATE TABLE assessment_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL UNIQUE REFERENCES assessment_sessions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    twin_pair_id UUID REFERENCES twin_pairs(id) ON DELETE SET NULL,
    subscale_scores JSONB NOT NULL, -- Array of SubscaleScore objects
    composite_scores JSONB NOT NULL, -- Array of CompositeScore objects
    overall_profile TEXT,
    recommendations JSONB DEFAULT '[]'::jsonb, -- Array of Recommendation objects
    percentile_data JSONB DEFAULT '{}'::jsonb,
    completion_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Pair comparison results - when both twins complete assessments
CREATE TABLE pair_analyses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    twin_pair_id UUID NOT NULL REFERENCES twin_pairs(id) ON DELETE CASCADE,
    user1_session_id UUID NOT NULL REFERENCES assessment_sessions(id),
    user2_session_id UUID NOT NULL REFERENCES assessment_sessions(id),
    compatibility_score DECIMAL(5,2) CHECK (compatibility_score >= 0 AND compatibility_score <= 100),
    strength_areas assessment_category[],
    growth_areas assessment_category[],
    risk_factors TEXT[],
    pair_recommendations JSONB DEFAULT '[]'::jsonb,
    analysis_metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(twin_pair_id, user1_session_id, user2_session_id)
);

-- ============================================================================
-- RESEARCH SYSTEM
-- ============================================================================

-- Research studies
CREATE TABLE research_studies (
    id VARCHAR(50) PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    full_description TEXT,
    duration VARCHAR(50),
    compensation TEXT[],
    participant_count INTEGER DEFAULT 0,
    target_participants INTEGER,
    status research_study_status DEFAULT 'recruiting',
    category VARCHAR(50),
    requirements TEXT[],
    ethics_approval VARCHAR(50),
    lead_researcher VARCHAR(100),
    institution VARCHAR(200),
    consent_version INTEGER DEFAULT 1,
    data_types JSONB NOT NULL, -- Array of ResearchDataType objects
    benefits TEXT[],
    start_date DATE,
    end_date DATE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Research consent records
CREATE TABLE research_consent (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    study_id VARCHAR(50) NOT NULL REFERENCES research_studies(id),
    consent_version INTEGER NOT NULL,
    status consent_status DEFAULT 'pending',
    consented_to JSONB NOT NULL, -- Specific consent items
    ip_address INET,
    location VARCHAR(255),
    withdrawal_date TIMESTAMP WITH TIME ZONE,
    withdrawal_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- One consent record per user per study version
    UNIQUE(user_id, study_id, consent_version)
);

-- Research participation tracking
CREATE TABLE research_participation (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    active_studies VARCHAR(50)[] DEFAULT '{}',
    total_studies INTEGER DEFAULT 0,
    total_contributions INTEGER DEFAULT 0,
    preferences JSONB DEFAULT '{}'::jsonb,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Research data contributions
CREATE TABLE research_contributions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    study_id VARCHAR(50) NOT NULL REFERENCES research_studies(id),
    data_type VARCHAR(50) NOT NULL, -- 'assessment', 'behavioral', 'games', 'communication'
    data_points INTEGER DEFAULT 1,
    anonymized_id VARCHAR(32) NOT NULL,
    contribution_metadata JSONB DEFAULT '{}'::jsonb,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processed', 'included', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Research telemetry data
CREATE TABLE research_telemetry (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL, -- Allow anonymous data
    study_id VARCHAR(50) REFERENCES research_studies(id),
    event_type VARCHAR(50) NOT NULL,
    event_data JSONB NOT NULL,
    session_id VARCHAR(50),
    anonymized_user_id VARCHAR(32),
    consented BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- SUBSCRIPTION SYSTEM
-- ============================================================================

-- Subscription plans
CREATE TABLE subscription_plans (
    id VARCHAR(50) PRIMARY KEY, -- matches RevenueCat product IDs
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price_usd DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    period_type VARCHAR(20) NOT NULL CHECK (period_type IN ('monthly', 'yearly')),
    period_length INTEGER NOT NULL, -- in days
    trial_period_days INTEGER DEFAULT 0,
    features TEXT[] DEFAULT '{}',
    is_popular BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User subscriptions
CREATE TABLE user_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan_id VARCHAR(50) NOT NULL REFERENCES subscription_plans(id),
    platform VARCHAR(20) NOT NULL CHECK (platform IN ('ios', 'android', 'web')),
    external_subscription_id VARCHAR(255) NOT NULL, -- RevenueCat subscription ID
    original_transaction_id VARCHAR(255) NOT NULL,
    status subscription_status DEFAULT 'pending',
    purchase_date TIMESTAMP WITH TIME ZONE NOT NULL,
    expires_date TIMESTAMP WITH TIME ZONE NOT NULL,
    is_trial_period BOOLEAN DEFAULT FALSE,
    auto_renewing BOOLEAN DEFAULT TRUE,
    entitlements TEXT[] DEFAULT '{}',
    receipt_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- One active subscription per user per platform
    UNIQUE(user_id, platform, status) DEFERRABLE INITIALLY DEFERRED
);

-- Subscription events (for audit trail)
CREATE TABLE subscription_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subscription_id UUID NOT NULL REFERENCES user_subscriptions(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL, -- 'purchase', 'renew', 'cancel', 'expire', 'refund'
    event_data JSONB DEFAULT '{}'::jsonb,
    processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- GAME SYSTEM
-- ============================================================================

-- Game sessions and results
CREATE TABLE game_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    twin_pair_id UUID REFERENCES twin_pairs(id) ON DELETE SET NULL,
    game_type VARCHAR(50) NOT NULL, -- 'cognitive_sync_maze', 'emotional_resonance', etc.
    score INTEGER NOT NULL CHECK (score >= 0),
    twin_score INTEGER CHECK (twin_score >= 0),
    game_data JSONB DEFAULT '{}'::jsonb, -- Game-specific data
    insights JSONB DEFAULT '[]'::jsonb, -- Array of GameInsight objects
    session_duration_ms INTEGER,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- STORY SYSTEM
-- ============================================================================

-- Shared stories between twins
CREATE TABLE stories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    twin_pair_id UUID NOT NULL REFERENCES twin_pairs(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    photos TEXT[] DEFAULT '{}', -- Array of photo URLs
    is_shared BOOLEAN DEFAULT FALSE,
    is_milestone BOOLEAN DEFAULT FALSE,
    visibility VARCHAR(20) DEFAULT 'twin_only' CHECK (visibility IN ('twin_only', 'private', 'research')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- SYSTEM TABLES
-- ============================================================================

-- API keys for external services
CREATE TABLE api_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    service_name VARCHAR(50) NOT NULL UNIQUE,
    key_data JSONB NOT NULL, -- Encrypted key storage
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Audit log for important events
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50),
    resource_id VARCHAR(100),
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Session storage for Redis backup
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_token VARCHAR(255) NOT NULL UNIQUE,
    refresh_token VARCHAR(255) NOT NULL UNIQUE,
    device_info JSONB DEFAULT '{}'::jsonb,
    ip_address INET,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- User indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_email_verified ON users(email_verified);
CREATE INDEX idx_users_last_seen ON users(last_seen);
CREATE INDEX idx_users_created_at ON users(created_at);

-- Twin pair indexes
CREATE INDEX idx_twin_pairs_user1 ON twin_pairs(user1_id);
CREATE INDEX idx_twin_pairs_user2 ON twin_pairs(user2_id);
CREATE INDEX idx_twin_pairs_status ON twin_pairs(status);
CREATE INDEX idx_twin_pairs_pair_code ON twin_pairs(pair_code);

-- Message indexes (most critical for performance)
CREATE INDEX idx_messages_twin_pair_created ON messages(twin_pair_id, created_at DESC);
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_messages_type ON messages(type);
CREATE INDEX idx_messages_unread ON messages(twin_pair_id, is_read) WHERE is_read = FALSE;

-- Assessment indexes
CREATE INDEX idx_assessment_sessions_user ON assessment_sessions(user_id);
CREATE INDEX idx_assessment_sessions_twin_pair ON assessment_sessions(twin_pair_id);
CREATE INDEX idx_assessment_responses_session ON assessment_responses(session_id);
CREATE INDEX idx_assessment_results_user ON assessment_results(user_id);

-- Research indexes
CREATE INDEX idx_research_consent_user_study ON research_consent(user_id, study_id);
CREATE INDEX idx_research_contributions_user ON research_contributions(user_id);
CREATE INDEX idx_research_contributions_study ON research_contributions(study_id);
CREATE INDEX idx_research_telemetry_user_event ON research_telemetry(user_id, event_type, created_at);

-- Subscription indexes
CREATE INDEX idx_subscriptions_user_status ON user_subscriptions(user_id, status);
CREATE INDEX idx_subscriptions_expires ON user_subscriptions(expires_date);
CREATE INDEX idx_subscription_events_sub_type ON subscription_events(subscription_id, event_type);

-- Game and story indexes
CREATE INDEX idx_game_results_user_type ON game_results(user_id, game_type);
CREATE INDEX idx_game_results_twin_pair ON game_results(twin_pair_id);
CREATE INDEX idx_stories_twin_pair ON stories(twin_pair_id);
CREATE INDEX idx_stories_author ON stories(author_id);

-- System indexes
CREATE INDEX idx_audit_logs_user_action ON audit_logs(user_id, action, created_at);
CREATE INDEX idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX idx_user_sessions_user_expires ON user_sessions(user_id, expires_at);

-- ============================================================================
-- FUNCTIONS AND TRIGGERS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers to relevant tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_twin_pairs_updated_at BEFORE UPDATE ON twin_pairs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON user_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_invitations_updated_at BEFORE UPDATE ON invitations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_messages_updated_at BEFORE UPDATE ON messages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_assessment_sessions_updated_at BEFORE UPDATE ON assessment_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_research_studies_updated_at BEFORE UPDATE ON research_studies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_subscription_plans_updated_at BEFORE UPDATE ON subscription_plans FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_subscriptions_updated_at BEFORE UPDATE ON user_subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically create user settings when user is created
CREATE OR REPLACE FUNCTION create_user_settings()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_settings (user_id) VALUES (NEW.id);
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER create_user_settings_trigger AFTER INSERT ON users FOR EACH ROW EXECUTE FUNCTION create_user_settings();

-- ============================================================================
-- INITIAL DATA
-- ============================================================================

-- Insert default subscription plans
INSERT INTO subscription_plans (id, name, description, price_usd, period_type, period_length, features, is_popular) VALUES
('twinship_monthly', 'Twinship Premium Monthly', 'Unlock all premium features with monthly billing', 9.99, 'monthly', 30, 
 ARRAY['unlimited_assessments', 'advanced_insights', 'premium_games', 'priority_support', 'research_access'], false),
('twinship_yearly', 'Twinship Premium Yearly', 'Best value - yearly billing with 2 months free', 59.99, 'yearly', 365,
 ARRAY['unlimited_assessments', 'advanced_insights', 'premium_games', 'priority_support', 'research_access', 'early_features'], true);

-- Insert sample research studies
INSERT INTO research_studies (id, title, description, full_description, duration, compensation, status, category, requirements, ethics_approval, lead_researcher, institution, data_types, benefits) VALUES
('twin-sync-2024', 'Twin Synchronicity & Intuition Study', 'Investigating psychic connections and synchronicity between twins',
 'This comprehensive study explores the phenomenon of twin telepathy, synchronicity, and intuitive connections. We analyze communication patterns, simultaneous experiences, and predictive behaviors between twin pairs.',
 '12 months', ARRAY['Research insights', 'Early feature access', 'Scientific publications acknowledgment'], 'recruiting', 'synchronicity',
 ARRAY['Both twins must participate', 'Regular app usage', 'Complete assessments'], 'IRB-2024-TWIN-001',
 'Dr. Sarah Chen, PhD', 'Stanford Twin Research Institute',
 '[{"type": "games", "description": "Psychic game results and response patterns", "anonymizationLevel": "full", "retentionPeriod": "7 years", "sharingScope": "academic"}]'::jsonb,
 ARRAY['Contributing to twin psychology research', 'Understanding your twin connection', 'Access to anonymized comparison data']);

-- Add sample assessment items (subset for testing)
INSERT INTO assessment_items (id, question, category, reverse_scored, weight) VALUES
('IF_001', 'My twin and I often think the same thoughts at the same time', 'identity_fusion', false, 1.0),
('IF_002', 'I feel incomplete when my twin is not around', 'identity_fusion', false, 1.0),
('AUT_001', 'I make important decisions without consulting my twin', 'autonomy', false, 1.0),
('COM_001', 'My twin and I communicate without words', 'communication', false, 1.0),
('ATT_001', 'I trust my twin completely', 'attachment', false, 1.0);

-- ============================================================================
-- VIEWS FOR COMMON QUERIES
-- ============================================================================

-- View for active twin pairs with user details
CREATE VIEW active_twin_pairs_view AS
SELECT 
    tp.id as pair_id,
    tp.pair_code,
    tp.sync_score,
    tp.total_messages,
    u1.id as user1_id,
    u1.name as user1_name,
    u1.accent_color as user1_color,
    u2.id as user2_id,
    u2.name as user2_name,
    u2.accent_color as user2_color,
    tp.paired_at,
    tp.last_interaction
FROM twin_pairs tp
JOIN users u1 ON tp.user1_id = u1.id
JOIN users u2 ON tp.user2_id = u2.id
WHERE tp.status = 'active';

-- View for user subscription status
CREATE VIEW user_subscription_status AS
SELECT 
    u.id as user_id,
    u.email,
    u.name,
    COALESCE(us.status, 'free') as subscription_status,
    us.plan_id,
    sp.name as plan_name,
    us.expires_date,
    us.auto_renewing,
    us.entitlements
FROM users u
LEFT JOIN user_subscriptions us ON u.id = us.user_id AND us.status = 'active'
LEFT JOIN subscription_plans sp ON us.plan_id = sp.id;

-- View for recent messages with user details
CREATE VIEW recent_messages_view AS
SELECT 
    m.id,
    m.twin_pair_id,
    m.text,
    m.type,
    m.sender_id,
    m.sender_name,
    u.accent_color as sender_accent_color,
    m.is_delivered,
    m.is_read,
    m.created_at,
    COUNT(mr.id) as reaction_count
FROM messages m
JOIN users u ON m.sender_id = u.id
LEFT JOIN message_reactions mr ON m.id = mr.message_id
GROUP BY m.id, u.accent_color
ORDER BY m.created_at DESC;

-- ============================================================================
-- SECURITY POLICIES (Row Level Security)
-- ============================================================================

-- Enable RLS on sensitive tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE twin_pairs ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE research_consent ENABLE ROW LEVEL SECURITY;

-- Users can only access their own data
CREATE POLICY users_own_data ON users FOR ALL USING (id = current_setting('app.current_user_id')::uuid);

-- Twin pairs - users can access pairs they're part of
CREATE POLICY twin_pairs_member_access ON twin_pairs FOR ALL 
USING (user1_id = current_setting('app.current_user_id')::uuid OR user2_id = current_setting('app.current_user_id')::uuid);

-- Messages - only accessible to twin pair members
CREATE POLICY messages_twin_access ON messages FOR ALL 
USING (twin_pair_id IN (
    SELECT id FROM twin_pairs 
    WHERE user1_id = current_setting('app.current_user_id')::uuid 
       OR user2_id = current_setting('app.current_user_id')::uuid
));

-- Assessment sessions - only accessible to the user
CREATE POLICY assessment_sessions_own_data ON assessment_sessions FOR ALL 
USING (user_id = current_setting('app.current_user_id')::uuid);

-- Assessment results - only accessible to the user
CREATE POLICY assessment_results_own_data ON assessment_results FOR ALL 
USING (user_id = current_setting('app.current_user_id')::uuid);

-- User subscriptions - only accessible to the user
CREATE POLICY user_subscriptions_own_data ON user_subscriptions FOR ALL 
USING (user_id = current_setting('app.current_user_id')::uuid);

-- Research consent - only accessible to the user
CREATE POLICY research_consent_own_data ON research_consent FOR ALL 
USING (user_id = current_setting('app.current_user_id')::uuid);

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE users IS 'Core user profiles and authentication data';
COMMENT ON TABLE twin_pairs IS 'Twin relationship mapping and sync tracking';
COMMENT ON TABLE messages IS 'Chat messages between twin pairs with delivery tracking';
COMMENT ON TABLE assessment_sessions IS 'Psychological assessment sessions and progress';
COMMENT ON TABLE assessment_results IS 'Completed assessment results and recommendations';
COMMENT ON TABLE research_studies IS 'Available research studies for user participation';
COMMENT ON TABLE research_consent IS 'User consent records for research participation';
COMMENT ON TABLE user_subscriptions IS 'Premium subscription tracking and entitlements';
COMMENT ON TABLE research_telemetry IS 'Anonymized usage data for research purposes';
COMMENT ON TABLE game_results IS 'Twin synchronicity game results and scoring';
COMMENT ON TABLE stories IS 'Shared stories and memories between twins';

COMMENT ON COLUMN users.zodiac_sign IS 'Automatically calculated from birth_date';
COMMENT ON COLUMN twin_pairs.sync_score IS 'Calculated synchronicity score (0-100)';
COMMENT ON COLUMN messages.accent_color IS 'Sender accent color for message theming';
COMMENT ON COLUMN research_telemetry.anonymized_user_id IS 'Hashed user ID for privacy';
COMMENT ON COLUMN user_subscriptions.entitlements IS 'Array of granted premium features';

-- ============================================================================
-- FINAL OPTIMIZATIONS
-- ============================================================================

-- Partitioning for large tables (messages by month)
-- This would be implemented as needed for scale:
-- CREATE TABLE messages_y2024m01 PARTITION OF messages FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

-- Full-text search setup for messages (if needed)
-- ALTER TABLE messages ADD COLUMN search_vector tsvector;
-- CREATE INDEX idx_messages_search ON messages USING gin(search_vector);

COMMIT;