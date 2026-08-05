-- Reconcile PostgreSQL with schema.pg.ts.
-- Several feature SQL files were added outside Drizzle's migration journal.
-- This migration deliberately repeats those changes with idempotent DDL so
-- both existing deployments and brand-new developer databases converge.

CREATE EXTENSION IF NOT EXISTS vector;

ALTER TABLE "characters"
  ADD COLUMN IF NOT EXISTS "system_notification" boolean DEFAULT true NOT NULL;

ALTER TABLE "platform_accounts"
  ADD COLUMN IF NOT EXISTS "last_rotated_at" timestamp with time zone,
  ADD COLUMN IF NOT EXISTS "rotation_count" integer DEFAULT 0 NOT NULL,
  ADD COLUMN IF NOT EXISTS "key_version" integer DEFAULT 1 NOT NULL;

CREATE TABLE IF NOT EXISTS "credential_rotation_history" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "account_id" uuid NOT NULL REFERENCES "platform_accounts"("id") ON DELETE CASCADE,
  "credentials_encrypted" text NOT NULL,
  "encryption_key_id" text,
  "rotated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "rotated_by" text,
  "reason" text,
  "expires_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "credential_rotation_history_account_idx"
  ON "credential_rotation_history" ("account_id", "rotated_at" DESC);
CREATE INDEX IF NOT EXISTS "credential_rotation_history_expires_idx"
  ON "credential_rotation_history" ("expires_at") WHERE "expires_at" IS NOT NULL;

CREATE TABLE IF NOT EXISTS "credential_access_log" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "account_id" uuid NOT NULL REFERENCES "platform_accounts"("id") ON DELETE CASCADE,
  "user_id" uuid NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "action" varchar(16) NOT NULL,
  "ip_address" varchar(45),
  "user_agent" text,
  "accessed_at" timestamp with time zone DEFAULT now() NOT NULL,
  "metadata" jsonb DEFAULT NULL,
  "success" boolean DEFAULT true NOT NULL,
  "error_message" text
);
CREATE INDEX IF NOT EXISTS "credential_access_log_account_idx"
  ON "credential_access_log" ("account_id", "accessed_at" DESC);
CREATE INDEX IF NOT EXISTS "credential_access_log_user_idx"
  ON "credential_access_log" ("user_id", "accessed_at" DESC);
CREATE INDEX IF NOT EXISTS "credential_access_log_action_idx"
  ON "credential_access_log" ("action", "accessed_at" DESC);

ALTER TABLE "feedback" ALTER COLUMN "user_id" DROP NOT NULL;
ALTER TABLE "feedback"
  ADD COLUMN IF NOT EXISTS "contact_email" text,
  ADD COLUMN IF NOT EXISTS "type" text DEFAULT 'general' NOT NULL,
  ADD COLUMN IF NOT EXISTS "title" text DEFAULT '' NOT NULL,
  ADD COLUMN IF NOT EXISTS "description" text DEFAULT '' NOT NULL,
  ADD COLUMN IF NOT EXISTS "status" text DEFAULT 'open' NOT NULL,
  ADD COLUMN IF NOT EXISTS "priority" text DEFAULT 'medium',
  ADD COLUMN IF NOT EXISTS "source" text DEFAULT 'web',
  ADD COLUMN IF NOT EXISTS "system_info" json,
  ADD COLUMN IF NOT EXISTS "updated_at" timestamp DEFAULT now() NOT NULL;
CREATE INDEX IF NOT EXISTS "feedback_status_idx" ON "feedback" ("status");
CREATE INDEX IF NOT EXISTS "feedback_source_idx" ON "feedback" ("source");

ALTER TABLE "rss_subscriptions"
  ADD COLUMN IF NOT EXISTS "last_error_code" varchar(32),
  ADD COLUMN IF NOT EXISTS "last_error_message" text;

ALTER TABLE "survey"
  ADD COLUMN IF NOT EXISTS "work_description" text;

CREATE TABLE IF NOT EXISTS "insight_notes" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "insight_id" uuid NOT NULL REFERENCES "Insight"("id") ON DELETE CASCADE,
  "user_id" uuid NOT NULL REFERENCES "User"("id"),
  "content" text NOT NULL,
  "source" varchar(32) DEFAULT 'manual' NOT NULL,
  "source_message_id" uuid,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "insight_notes_insight_idx" ON "insight_notes" ("insight_id");
CREATE INDEX IF NOT EXISTS "insight_notes_user_idx" ON "insight_notes" ("user_id");
CREATE INDEX IF NOT EXISTS "insight_notes_created_at_idx" ON "insight_notes" ("created_at");

CREATE TABLE IF NOT EXISTS "insight_documents" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "insight_id" uuid NOT NULL REFERENCES "Insight"("id") ON DELETE CASCADE,
  "document_id" uuid NOT NULL REFERENCES "rag_documents"("id") ON DELETE CASCADE,
  "user_id" uuid NOT NULL REFERENCES "User"("id"),
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "unique_insight_document" UNIQUE ("insight_id", "document_id")
);
CREATE INDEX IF NOT EXISTS "insight_documents_insight_idx" ON "insight_documents" ("insight_id");
CREATE INDEX IF NOT EXISTS "insight_documents_document_idx" ON "insight_documents" ("document_id");
CREATE INDEX IF NOT EXISTS "insight_documents_user_idx" ON "insight_documents" ("user_id");

CREATE TABLE IF NOT EXISTS "insight_brief_categories" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "insight_id" uuid NOT NULL REFERENCES "Insight"("id") ON DELETE CASCADE,
  "category" varchar(20) NOT NULL,
  "dedupe_key" text,
  "title" text,
  "assigned_at" timestamp with time zone DEFAULT now() NOT NULL,
  "source" varchar(20) DEFAULT 'manual' NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS "insight_brief_categories_user_insight_idx"
  ON "insight_brief_categories" ("user_id", "insight_id");
CREATE INDEX IF NOT EXISTS "insight_brief_categories_user_idx"
  ON "insight_brief_categories" ("user_id");
CREATE INDEX IF NOT EXISTS "insight_brief_categories_dedupe_idx"
  ON "insight_brief_categories" ("dedupe_key");
CREATE INDEX IF NOT EXISTS "insight_brief_categories_category_idx"
  ON "insight_brief_categories" ("category");
CREATE INDEX IF NOT EXISTS "insight_brief_categories_assigned_at_idx"
  ON "insight_brief_categories" ("assigned_at");

ALTER TABLE "Insight"
  ADD COLUMN IF NOT EXISTS "valid_from" timestamp with time zone,
  ADD COLUMN IF NOT EXISTS "valid_to" timestamp with time zone;
CREATE INDEX IF NOT EXISTS "insight_valid_from_idx" ON "Insight" ("valid_from");
CREATE INDEX IF NOT EXISTS "insight_valid_to_idx" ON "Insight" ("valid_to");
CREATE INDEX IF NOT EXISTS "insight_valid_time_idx" ON "Insight" ("valid_from", "valid_to");

CREATE TABLE IF NOT EXISTS "insight_connections" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "insight_id_a" uuid NOT NULL REFERENCES "Insight"("id") ON DELETE CASCADE,
  "insight_id_b" uuid NOT NULL REFERENCES "Insight"("id") ON DELETE CASCADE,
  "user_id" uuid NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "strength" numeric(10, 6) DEFAULT 0.1 NOT NULL,
  "co_access_count" integer DEFAULT 0 NOT NULL,
  "last_strengthened_at" timestamp with time zone,
  "stability" numeric(10, 4) DEFAULT 1.0 NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS "insight_connection_unique_idx"
  ON "insight_connections" ("insight_id_a", "insight_id_b", "user_id");
CREATE INDEX IF NOT EXISTS "insight_connection_user_idx" ON "insight_connections" ("user_id");
CREATE INDEX IF NOT EXISTS "insight_connection_insight_a_idx" ON "insight_connections" ("insight_id_a");
CREATE INDEX IF NOT EXISTS "insight_connection_insight_b_idx" ON "insight_connections" ("insight_id_b");
CREATE INDEX IF NOT EXISTS "insight_connection_strength_idx" ON "insight_connections" ("user_id", "strength");
CREATE INDEX IF NOT EXISTS "insight_connection_last_strengthened_idx"
  ON "insight_connections" ("user_id", "last_strengthened_at");

CREATE TABLE IF NOT EXISTS "entities" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "entity_type" varchar(30) NOT NULL,
  "canonical_name" text NOT NULL,
  "aliases" text[] DEFAULT ARRAY[]::text[] NOT NULL,
  "disambiguation_context" text,
  "source_bot_ids" uuid[] DEFAULT ARRAY[]::uuid[] NOT NULL,
  "insight_count" integer DEFAULT 0 NOT NULL,
  "first_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
  "last_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
  "is_pinned" boolean DEFAULT false NOT NULL,
  "is_ignored" boolean DEFAULT false NOT NULL,
  "notes" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS "entity_unique_idx"
  ON "entities" ("user_id", "entity_type", "canonical_name");
CREATE INDEX IF NOT EXISTS "entity_user_idx" ON "entities" ("user_id");
CREATE INDEX IF NOT EXISTS "entity_type_idx" ON "entities" ("entity_type");
CREATE INDEX IF NOT EXISTS "entity_name_search_idx" ON "entities" ("canonical_name");
CREATE INDEX IF NOT EXISTS "entity_last_seen_idx" ON "entities" ("user_id", "last_seen_at");

CREATE TABLE IF NOT EXISTS "insight_entities" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "insight_id" uuid NOT NULL REFERENCES "Insight"("id") ON DELETE CASCADE,
  "entity_id" uuid NOT NULL REFERENCES "entities"("id") ON DELETE CASCADE,
  "role" varchar(20) NOT NULL,
  "confidence" numeric(5, 4) DEFAULT 0.5 NOT NULL,
  "text_span" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS "insight_entity_unique_idx"
  ON "insight_entities" ("insight_id", "entity_id");
CREATE INDEX IF NOT EXISTS "insight_entity_insight_idx" ON "insight_entities" ("insight_id");
CREATE INDEX IF NOT EXISTS "insight_entity_entity_idx" ON "insight_entities" ("entity_id");
CREATE INDEX IF NOT EXISTS "insight_entity_role_idx" ON "insight_entities" ("role");

ALTER TABLE "raw_messages"
  ADD COLUMN IF NOT EXISTS "deprecated_at" bigint,
  ADD COLUMN IF NOT EXISTS "deprecation_reason" text,
  ADD COLUMN IF NOT EXISTS "superseded_by_summary_id" text;
CREATE INDEX IF NOT EXISTS "raw_messages_active_user_idx"
  ON "raw_messages" ("user_id", "memory_stage", "deprecated_at")
  WHERE "deprecated_at" IS NULL;
