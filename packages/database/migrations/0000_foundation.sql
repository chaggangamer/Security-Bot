CREATE TYPE "incident_severity" AS ENUM ('INFO', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
CREATE TYPE "incident_status" AS ENUM ('OPEN', 'MITIGATING', 'RESOLVED', 'DISMISSED');

CREATE TABLE "users" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "discord_id" text UNIQUE NOT NULL,
  "username" text NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE "guild_staff" (
  "guild_id" text REFERENCES "guilds"("id") ON DELETE CASCADE NOT NULL,
  "user_id" uuid REFERENCES "users"("id") ON DELETE CASCADE NOT NULL,
  "role" text NOT NULL,
  "scopes" text[] NOT NULL,
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY ("guild_id", "user_id")
);

CREATE TABLE "sessions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" uuid REFERENCES "users"("id") ON DELETE CASCADE NOT NULL,
  "token_hash" text NOT NULL,
  "user_agent" text,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "last_active_at" timestamptz NOT NULL DEFAULT now(),
  "expires_at" timestamptz NOT NULL,
  "revoked_at" timestamptz
);
CREATE UNIQUE INDEX "sessions_token_hash_idx" ON "sessions" ("token_hash");

CREATE TABLE "security_incidents" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "guild_id" text REFERENCES "guilds"("id") ON DELETE CASCADE NOT NULL,
  "type" text NOT NULL,
  "severity" incident_severity NOT NULL,
  "status" incident_status NOT NULL DEFAULT 'OPEN',
  "summary" text NOT NULL,
  "detected_at" timestamptz NOT NULL DEFAULT now(),
  "resolved_at" timestamptz
);
CREATE INDEX "incidents_guild_detected_idx" ON "security_incidents" ("guild_id", "detected_at");

CREATE TABLE "security_events" (
  "id" uuid PRIMARY KEY,
  "guild_id" text REFERENCES "guilds"("id") ON DELETE CASCADE NOT NULL,
  "incident_id" uuid REFERENCES "security_incidents"("id") ON DELETE SET NULL,
  "discord_actor_id" text,
  "discord_target_id" text,
  "discord_channel_id" text,
  "event_type" text NOT NULL,
  "severity" incident_severity NOT NULL,
  "metadata" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "occurred_at" timestamptz NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX "security_events_guild_created_idx" ON "security_events" ("guild_id", "created_at");
CREATE INDEX "security_events_guild_type_created_idx" ON "security_events" ("guild_id", "event_type", "created_at");
CREATE INDEX "security_events_incident_idx" ON "security_events" ("incident_id");

CREATE TABLE "risk_scores" (
  "guild_id" text REFERENCES "guilds"("id") ON DELETE CASCADE NOT NULL,
  "discord_user_id" text NOT NULL,
  "score" integer NOT NULL DEFAULT 0 CHECK ("score" BETWEEN 0 AND 100),
  "level" text NOT NULL DEFAULT 'LOW',
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY ("guild_id", "discord_user_id")
);

CREATE TABLE "risk_signals" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "guild_id" text REFERENCES "guilds"("id") ON DELETE CASCADE NOT NULL,
  "discord_user_id" text NOT NULL,
  "event_id" uuid REFERENCES "security_events"("id") ON DELETE SET NULL,
  "code" text NOT NULL,
  "reason" text NOT NULL,
  "points" integer NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX "risk_signals_guild_user_created_idx" ON "risk_signals" ("guild_id", "discord_user_id", "created_at");

CREATE TABLE "audit_events" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "guild_id" text REFERENCES "guilds"("id") ON DELETE CASCADE NOT NULL,
  "user_id" uuid REFERENCES "users"("id") ON DELETE SET NULL,
  "action" text NOT NULL,
  "before" jsonb,
  "after" jsonb,
  "request_id" text NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX "audit_events_guild_created_idx" ON "audit_events" ("guild_id", "created_at");

CREATE TABLE "retention_policies" (
  "guild_id" text REFERENCES "guilds"("id") ON DELETE CASCADE NOT NULL,
  "data_category" text NOT NULL,
  "retention_days" integer CHECK ("retention_days" IS NULL OR "retention_days" > 0),
  "enabled" boolean NOT NULL DEFAULT false,
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY ("guild_id", "data_category")
);
