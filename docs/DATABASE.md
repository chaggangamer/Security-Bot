# Database

PostgreSQL owns users, guilds, versioned settings, staff scopes, sessions, incidents, normalized events, risk signals, audit events, and retention policies. Discord IDs are text, never floating-point numbers.

The foundation migration is `packages/database/migrations/0000_foundation.sql`. High-volume access paths use `(guild_id, created_at)`, `(guild_id, event_type, created_at)`, and `(guild_id, discord_user_id, created_at)` indexes. Event IDs are primary keys and serve as idempotency anchors.

Run `pnpm db:migrate` with `DATABASE_URL` set. Production changes must be backward-compatible where practical: add, deploy readers/writers, backfill, switch, and remove only in a later migration. Verify plans for high-volume queries before release.
