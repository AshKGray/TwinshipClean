-- Twinship Supabase Schema
-- Uses Supabase Auth (auth.users) for authentication
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- PROFILES (linked to Supabase Auth)
-- ============================================================================

CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    name TEXT NOT NULL,
    age INTEGER CHECK (age > 0 AND age <= 120),
    gender TEXT,
    sexual_orientation TEXT,
    show_sexual_orientation BOOLEAN DEFAULT FALSE,
    twin_type TEXT NOT NULL CHECK (twin_type IN ('identical', 'fraternal', 'other')),
    other_twin_type_description TEXT,
    twin_deceased BOOLEAN DEFAULT FALSE,
    birth_date DATE,
    zodiac_sign TEXT,
    place_of_birth TEXT,
    time_of_birth TIME,
    profile_picture_url TEXT,
    accent_color TEXT NOT NULL DEFAULT 'celestial-indigo',
    is_connected BOOLEAN DEFAULT FALSE,
    is_onboarded BOOLEAN DEFAULT FALSE,
    last_seen TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- TWIN PAIRS
-- ============================================================================

CREATE TABLE twin_pairs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user1_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    user2_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    pair_code TEXT UNIQUE,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'pending', 'inactive')),
    paired_at TIMESTAMPTZ DEFAULT NOW(),
    last_interaction TIMESTAMPTZ,
    sync_score DECIMAL(5,2) DEFAULT 0.00,
    total_messages INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT different_users CHECK (user1_id != user2_id),
    UNIQUE(user1_id, user2_id)
);

-- ============================================================================
-- INVITATIONS
-- ============================================================================

CREATE TABLE invitations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    inviter_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    inviter_name TEXT NOT NULL,
    recipient_email TEXT,
    recipient_phone TEXT,
    token TEXT NOT NULL UNIQUE,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'accepted', 'declined', 'expired')),
    expires_at TIMESTAMPTZ NOT NULL,
    attempt_count INTEGER DEFAULT 0,
    twin_type TEXT NOT NULL,
    accent_color TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- MESSAGES
-- ============================================================================

CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    twin_pair_id UUID NOT NULL REFERENCES twin_pairs(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    sender_name TEXT NOT NULL,
    text TEXT NOT NULL,
    type TEXT DEFAULT 'text' CHECK (type IN ('text', 'image', 'emoji', 'reaction', 'twintuition')),
    image_url TEXT,
    reply_to_id UUID REFERENCES messages(id) ON DELETE SET NULL,
    is_delivered BOOLEAN DEFAULT FALSE,
    is_read BOOLEAN DEFAULT FALSE,
    accent_color TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE message_reactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    user_name TEXT NOT NULL,
    emoji TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(message_id, user_id, emoji)
);

-- ============================================================================
-- TWINTUITION MOMENTS
-- ============================================================================

CREATE TABLE twintuition_moments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    twin_pair_id UUID NOT NULL REFERENCES twin_pairs(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'sync' CHECK (type IN ('sync', 'intuition', 'connection', 'feeling', 'thought', 'action')),
    is_read BOOLEAN DEFAULT FALSE,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- TWINCIDENCES
-- ============================================================================

CREATE TABLE twincidences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    twin_pair_id UUID NOT NULL REFERENCES twin_pairs(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT,
    date TIMESTAMPTZ DEFAULT NOW(),
    photos TEXT[] DEFAULT '{}',
    is_shared BOOLEAN DEFAULT FALSE,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- ASSESSMENTS
-- ============================================================================

CREATE TABLE assessment_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    twin_pair_id UUID REFERENCES twin_pairs(id) ON DELETE SET NULL,
    is_complete BOOLEAN DEFAULT FALSE,
    current_progress DECIMAL(5,2) DEFAULT 0.00,
    session_metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

CREATE TABLE assessment_responses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES assessment_sessions(id) ON DELETE CASCADE,
    item_id TEXT NOT NULL,
    value INTEGER NOT NULL CHECK (value >= 1 AND value <= 7),
    response_time_ms INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(session_id, item_id)
);

CREATE TABLE assessment_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL UNIQUE REFERENCES assessment_sessions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    twin_pair_id UUID REFERENCES twin_pairs(id) ON DELETE SET NULL,
    subscale_scores JSONB NOT NULL,
    composite_scores JSONB NOT NULL,
    overall_profile TEXT,
    recommendations JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- GAME RESULTS
-- ============================================================================

CREATE TABLE game_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    twin_pair_id UUID REFERENCES twin_pairs(id) ON DELETE SET NULL,
    game_type TEXT NOT NULL,
    score INTEGER NOT NULL CHECK (score >= 0),
    twin_score INTEGER CHECK (twin_score >= 0),
    game_data JSONB DEFAULT '{}'::jsonb,
    insights JSONB DEFAULT '[]'::jsonb,
    duration_ms INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- USER SETTINGS
-- ============================================================================

CREATE TABLE user_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
    research_participation BOOLEAN DEFAULT FALSE,
    notifications_enabled BOOLEAN DEFAULT TRUE,
    push_notifications JSONB DEFAULT '{"messages": true, "twintuition": true, "assessments": false}'::jsonb,
    privacy_settings JSONB DEFAULT '{"profile_visible": true, "share_usage_data": false}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_twin_pairs_user1 ON twin_pairs(user1_id);
CREATE INDEX idx_twin_pairs_user2 ON twin_pairs(user2_id);
CREATE INDEX idx_twin_pairs_pair_code ON twin_pairs(pair_code);
CREATE INDEX idx_messages_pair_created ON messages(twin_pair_id, created_at DESC);
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_messages_unread ON messages(twin_pair_id, is_read) WHERE is_read = FALSE;
CREATE INDEX idx_twintuition_pair ON twintuition_moments(twin_pair_id, created_at DESC);
CREATE INDEX idx_twincidences_pair ON twincidences(twin_pair_id, created_at DESC);
CREATE INDEX idx_assessment_sessions_user ON assessment_sessions(user_id);
CREATE INDEX idx_game_results_user ON game_results(user_id, game_type);
CREATE INDEX idx_invitations_token ON invitations(token);

-- ============================================================================
-- AUTO-UPDATE TRIGGER
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_twin_pairs_updated_at BEFORE UPDATE ON twin_pairs FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_invitations_updated_at BEFORE UPDATE ON invitations FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_twincidences_updated_at BEFORE UPDATE ON twincidences FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON user_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- AUTO-CREATE PROFILE ON SIGNUP
-- ============================================================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO profiles (id, email, name, twin_type)
    VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'name', 'Twin'), 'identical');

    INSERT INTO user_settings (user_id) VALUES (NEW.id);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE twin_pairs ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE twintuition_moments ENABLE ROW LEVEL SECURITY;
ALTER TABLE twincidences ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read any profile, update only their own
CREATE POLICY profiles_select ON profiles FOR SELECT USING (true);
CREATE POLICY profiles_update ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY profiles_insert ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Twin pairs: members can access their pairs
CREATE POLICY twin_pairs_select ON twin_pairs FOR SELECT
    USING (user1_id = auth.uid() OR user2_id = auth.uid());
CREATE POLICY twin_pairs_insert ON twin_pairs FOR INSERT
    WITH CHECK (user1_id = auth.uid() OR user2_id = auth.uid());
CREATE POLICY twin_pairs_update ON twin_pairs FOR UPDATE
    USING (user1_id = auth.uid() OR user2_id = auth.uid());

-- Messages: only twin pair members
CREATE POLICY messages_select ON messages FOR SELECT
    USING (twin_pair_id IN (SELECT id FROM twin_pairs WHERE user1_id = auth.uid() OR user2_id = auth.uid()));
CREATE POLICY messages_insert ON messages FOR INSERT
    WITH CHECK (sender_id = auth.uid() AND twin_pair_id IN (SELECT id FROM twin_pairs WHERE user1_id = auth.uid() OR user2_id = auth.uid()));

-- Message reactions: twin pair members
CREATE POLICY reactions_select ON message_reactions FOR SELECT
    USING (message_id IN (SELECT m.id FROM messages m JOIN twin_pairs tp ON m.twin_pair_id = tp.id WHERE tp.user1_id = auth.uid() OR tp.user2_id = auth.uid()));
CREATE POLICY reactions_insert ON message_reactions FOR INSERT
    WITH CHECK (user_id = auth.uid());
CREATE POLICY reactions_delete ON message_reactions FOR DELETE
    USING (user_id = auth.uid());

-- Twintuition: twin pair members
CREATE POLICY twintuition_select ON twintuition_moments FOR SELECT
    USING (twin_pair_id IN (SELECT id FROM twin_pairs WHERE user1_id = auth.uid() OR user2_id = auth.uid()));
CREATE POLICY twintuition_insert ON twintuition_moments FOR INSERT
    WITH CHECK (sender_id = auth.uid());

-- Twincidences: twin pair members
CREATE POLICY twincidences_select ON twincidences FOR SELECT
    USING (twin_pair_id IN (SELECT id FROM twin_pairs WHERE user1_id = auth.uid() OR user2_id = auth.uid()));
CREATE POLICY twincidences_insert ON twincidences FOR INSERT
    WITH CHECK (author_id = auth.uid());
CREATE POLICY twincidences_update ON twincidences FOR UPDATE
    USING (author_id = auth.uid());
CREATE POLICY twincidences_delete ON twincidences FOR DELETE
    USING (author_id = auth.uid());

-- Assessments: own data only
CREATE POLICY assessment_sessions_all ON assessment_sessions FOR ALL USING (user_id = auth.uid());
CREATE POLICY assessment_responses_select ON assessment_responses FOR SELECT
    USING (session_id IN (SELECT id FROM assessment_sessions WHERE user_id = auth.uid()));
CREATE POLICY assessment_responses_insert ON assessment_responses FOR INSERT
    WITH CHECK (session_id IN (SELECT id FROM assessment_sessions WHERE user_id = auth.uid()));
CREATE POLICY assessment_results_all ON assessment_results FOR ALL USING (user_id = auth.uid());

-- Game results: own data
CREATE POLICY game_results_select ON game_results FOR SELECT USING (user_id = auth.uid());
CREATE POLICY game_results_insert ON game_results FOR INSERT WITH CHECK (user_id = auth.uid());

-- User settings: own data
CREATE POLICY user_settings_all ON user_settings FOR ALL USING (user_id = auth.uid());

-- Invitations: inviter can manage, anyone can view by token
CREATE POLICY invitations_select ON invitations FOR SELECT
    USING (inviter_id = auth.uid() OR token IS NOT NULL);
CREATE POLICY invitations_insert ON invitations FOR INSERT
    WITH CHECK (inviter_id = auth.uid());
CREATE POLICY invitations_update ON invitations FOR UPDATE
    USING (inviter_id = auth.uid());

-- ============================================================================
-- REALTIME (enable for chat)
-- ============================================================================

ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE twintuition_moments;
ALTER PUBLICATION supabase_realtime ADD TABLE twin_pairs;
