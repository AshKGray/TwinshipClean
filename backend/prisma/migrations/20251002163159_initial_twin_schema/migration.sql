-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "email_normalized" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "email_verified" BOOLEAN NOT NULL DEFAULT false,
    "email_verification_token" TEXT,
    "email_verification_expires" DATETIME,
    "display_name" TEXT,
    "avatar_url" TEXT,
    "failed_login_attempts" INTEGER NOT NULL DEFAULT 0,
    "account_locked_until" DATETIME,
    "last_login_at" DATETIME,
    "last_login_ip" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "deleted_at" DATETIME
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "token" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "device_id" TEXT,
    "user_agent" TEXT,
    "ip_address" TEXT,
    "expires_at" DATETIME NOT NULL,
    "revoked_at" DATETIME,
    "revoked_reason" TEXT,
    "replaced_by_token" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_used_at" DATETIME,
    CONSTRAINT "refresh_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "password_resets" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires_at" DATETIME NOT NULL,
    "used_at" DATETIME,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "password_resets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "login_history" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT,
    "email" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "success" BOOLEAN NOT NULL,
    "failure_reason" TEXT,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "device_fingerprint" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "login_history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "twin_pairs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user1_id" TEXT NOT NULL,
    "user2_id" TEXT NOT NULL,
    "pairing_code" TEXT,
    "paired_at" DATETIME,
    "pair_type" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "twin_pairs_user1_id_fkey" FOREIGN KEY ("user1_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "twin_pairs_user2_id_fkey" FOREIGN KEY ("user2_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "messages" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "twin_pair_id" TEXT NOT NULL,
    "sender_id" TEXT NOT NULL,
    "recipient_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "message_type" TEXT NOT NULL DEFAULT 'text',
    "accent_color" TEXT,
    "original_message_id" TEXT,
    "delivered_at" DATETIME,
    "read_at" DATETIME,
    "queued_at" DATETIME,
    "synced_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "deleted_at" DATETIME,
    CONSTRAINT "messages_twin_pair_id_fkey" FOREIGN KEY ("twin_pair_id") REFERENCES "twin_pairs" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "messages_recipient_id_fkey" FOREIGN KEY ("recipient_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "message_reactions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "message_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "emoji" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "message_reactions_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "messages" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "message_reactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "message_queue" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "twin_pair_id" TEXT NOT NULL,
    "sender_id" TEXT NOT NULL,
    "recipient_id" TEXT NOT NULL,
    "message_data" TEXT NOT NULL,
    "message_type" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "max_attempts" INTEGER NOT NULL DEFAULT 3,
    "next_attempt_at" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "error_message" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processed_at" DATETIME,
    "expires_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "user_presence" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'offline',
    "last_seen_at" DATETIME,
    "device_info" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "user_presence_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "twin_profiles" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "age" INTEGER NOT NULL,
    "gender" TEXT NOT NULL,
    "sexual_orientation" TEXT,
    "show_sexual_orientation" BOOLEAN NOT NULL DEFAULT false,
    "twin_type" TEXT NOT NULL,
    "other_twin_type_description" TEXT,
    "twin_deceased" BOOLEAN NOT NULL DEFAULT false,
    "birth_date" TEXT NOT NULL,
    "zodiac_sign" TEXT,
    "place_of_birth" TEXT,
    "time_of_birth" TEXT,
    "profile_picture" TEXT,
    "accent_color" TEXT NOT NULL DEFAULT 'neon-purple',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "game_results" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "twin_pair_id" TEXT,
    "game_type" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "twin_score" INTEGER,
    "cognitive_data" TEXT,
    "emotional_data" TEXT,
    "decision_data" TEXT,
    "duo_data" TEXT,
    "insights" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "stories" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "twin_pair_id" TEXT,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "photos" TEXT NOT NULL,
    "milestone" BOOLEAN NOT NULL DEFAULT false,
    "is_shared" BOOLEAN NOT NULL DEFAULT false,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "assessments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "twin_pair_id" TEXT,
    "assessment_type" TEXT NOT NULL,
    "responses" TEXT NOT NULL,
    "results" TEXT NOT NULL,
    "completed_at" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'in_progress',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "twintuition_alerts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "twin_pair_id" TEXT,
    "message" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "research_participation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "has_consented" BOOLEAN NOT NULL DEFAULT false,
    "consented_at" DATETIME,
    "consent_version" TEXT,
    "has_active_studies" BOOLEAN NOT NULL DEFAULT false,
    "contributions_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "invitations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sender_id" TEXT NOT NULL,
    "invitation_code" TEXT NOT NULL,
    "recipient_email" TEXT,
    "recipient_phone" TEXT,
    "recipient_name" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "accepted_at" DATETIME,
    "accepted_by" TEXT,
    "expires_at" DATETIME NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_normalized_key" ON "users"("email_normalized");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_verification_token_key" ON "users"("email_verification_token");

-- CreateIndex
CREATE INDEX "users_email_normalized_idx" ON "users"("email_normalized");

-- CreateIndex
CREATE INDEX "users_email_verification_token_idx" ON "users"("email_verification_token");

-- CreateIndex
CREATE INDEX "users_deleted_at_idx" ON "users"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_key" ON "refresh_tokens"("token");

-- CreateIndex
CREATE INDEX "refresh_tokens_token_idx" ON "refresh_tokens"("token");

-- CreateIndex
CREATE INDEX "refresh_tokens_user_id_idx" ON "refresh_tokens"("user_id");

-- CreateIndex
CREATE INDEX "refresh_tokens_expires_at_idx" ON "refresh_tokens"("expires_at");

-- CreateIndex
CREATE INDEX "refresh_tokens_revoked_at_idx" ON "refresh_tokens"("revoked_at");

-- CreateIndex
CREATE UNIQUE INDEX "password_resets_token_key" ON "password_resets"("token");

-- CreateIndex
CREATE INDEX "password_resets_token_idx" ON "password_resets"("token");

-- CreateIndex
CREATE INDEX "password_resets_user_id_idx" ON "password_resets"("user_id");

-- CreateIndex
CREATE INDEX "password_resets_expires_at_idx" ON "password_resets"("expires_at");

-- CreateIndex
CREATE INDEX "login_history_user_id_idx" ON "login_history"("user_id");

-- CreateIndex
CREATE INDEX "login_history_email_idx" ON "login_history"("email");

-- CreateIndex
CREATE INDEX "login_history_created_at_idx" ON "login_history"("created_at");

-- CreateIndex
CREATE INDEX "login_history_event_type_idx" ON "login_history"("event_type");

-- CreateIndex
CREATE INDEX "twin_pairs_user1_id_idx" ON "twin_pairs"("user1_id");

-- CreateIndex
CREATE INDEX "twin_pairs_user2_id_idx" ON "twin_pairs"("user2_id");

-- CreateIndex
CREATE INDEX "twin_pairs_pairing_code_idx" ON "twin_pairs"("pairing_code");

-- CreateIndex
CREATE INDEX "twin_pairs_status_idx" ON "twin_pairs"("status");

-- CreateIndex
CREATE UNIQUE INDEX "twin_pairs_user1_id_user2_id_key" ON "twin_pairs"("user1_id", "user2_id");

-- CreateIndex
CREATE INDEX "messages_twin_pair_id_idx" ON "messages"("twin_pair_id");

-- CreateIndex
CREATE INDEX "messages_sender_id_idx" ON "messages"("sender_id");

-- CreateIndex
CREATE INDEX "messages_recipient_id_idx" ON "messages"("recipient_id");

-- CreateIndex
CREATE INDEX "messages_created_at_idx" ON "messages"("created_at");

-- CreateIndex
CREATE INDEX "messages_delivered_at_idx" ON "messages"("delivered_at");

-- CreateIndex
CREATE INDEX "messages_read_at_idx" ON "messages"("read_at");

-- CreateIndex
CREATE INDEX "messages_deleted_at_idx" ON "messages"("deleted_at");

-- CreateIndex
CREATE INDEX "messages_queued_at_idx" ON "messages"("queued_at");

-- CreateIndex
CREATE INDEX "message_reactions_message_id_idx" ON "message_reactions"("message_id");

-- CreateIndex
CREATE INDEX "message_reactions_user_id_idx" ON "message_reactions"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "message_reactions_message_id_user_id_emoji_key" ON "message_reactions"("message_id", "user_id", "emoji");

-- CreateIndex
CREATE INDEX "message_queue_twin_pair_id_idx" ON "message_queue"("twin_pair_id");

-- CreateIndex
CREATE INDEX "message_queue_recipient_id_idx" ON "message_queue"("recipient_id");

-- CreateIndex
CREATE INDEX "message_queue_status_idx" ON "message_queue"("status");

-- CreateIndex
CREATE INDEX "message_queue_next_attempt_at_idx" ON "message_queue"("next_attempt_at");

-- CreateIndex
CREATE INDEX "message_queue_expires_at_idx" ON "message_queue"("expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "user_presence_user_id_key" ON "user_presence"("user_id");

-- CreateIndex
CREATE INDEX "user_presence_status_idx" ON "user_presence"("status");

-- CreateIndex
CREATE INDEX "user_presence_last_seen_at_idx" ON "user_presence"("last_seen_at");

-- CreateIndex
CREATE UNIQUE INDEX "twin_profiles_user_id_key" ON "twin_profiles"("user_id");

-- CreateIndex
CREATE INDEX "twin_profiles_user_id_idx" ON "twin_profiles"("user_id");

-- CreateIndex
CREATE INDEX "game_results_user_id_idx" ON "game_results"("user_id");

-- CreateIndex
CREATE INDEX "game_results_twin_pair_id_idx" ON "game_results"("twin_pair_id");

-- CreateIndex
CREATE INDEX "game_results_game_type_idx" ON "game_results"("game_type");

-- CreateIndex
CREATE INDEX "game_results_created_at_idx" ON "game_results"("created_at");

-- CreateIndex
CREATE INDEX "stories_user_id_idx" ON "stories"("user_id");

-- CreateIndex
CREATE INDEX "stories_twin_pair_id_idx" ON "stories"("twin_pair_id");

-- CreateIndex
CREATE INDEX "stories_created_at_idx" ON "stories"("created_at");

-- CreateIndex
CREATE INDEX "assessments_user_id_idx" ON "assessments"("user_id");

-- CreateIndex
CREATE INDEX "assessments_twin_pair_id_idx" ON "assessments"("twin_pair_id");

-- CreateIndex
CREATE INDEX "assessments_assessment_type_idx" ON "assessments"("assessment_type");

-- CreateIndex
CREATE INDEX "assessments_created_at_idx" ON "assessments"("created_at");

-- CreateIndex
CREATE INDEX "twintuition_alerts_user_id_idx" ON "twintuition_alerts"("user_id");

-- CreateIndex
CREATE INDEX "twintuition_alerts_twin_pair_id_idx" ON "twintuition_alerts"("twin_pair_id");

-- CreateIndex
CREATE INDEX "twintuition_alerts_is_read_idx" ON "twintuition_alerts"("is_read");

-- CreateIndex
CREATE INDEX "twintuition_alerts_created_at_idx" ON "twintuition_alerts"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "research_participation_user_id_key" ON "research_participation"("user_id");

-- CreateIndex
CREATE INDEX "research_participation_user_id_idx" ON "research_participation"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "invitations_invitation_code_key" ON "invitations"("invitation_code");

-- CreateIndex
CREATE INDEX "invitations_sender_id_idx" ON "invitations"("sender_id");

-- CreateIndex
CREATE INDEX "invitations_invitation_code_idx" ON "invitations"("invitation_code");

-- CreateIndex
CREATE INDEX "invitations_recipient_email_idx" ON "invitations"("recipient_email");

-- CreateIndex
CREATE INDEX "invitations_status_idx" ON "invitations"("status");

-- CreateIndex
CREATE INDEX "invitations_expires_at_idx" ON "invitations"("expires_at");
