# Aegis implementation plan

## Current architecture

The repository was empty at discovery time. There was no package manager, application, database, authentication layer, deployment configuration, or test suite to preserve.

This first implementation establishes a pnpm TypeScript monorepo with three runnable applications:

- `apps/dashboard`: Next.js App Router security operations dashboard.
- `apps/api`: Fastify API with schema validation, guild-scoped authorization, health checks, and security evaluation.
- `apps/bot`: discord.js gateway client that normalizes Discord events before security evaluation.

Shared code lives in focused packages:

- `packages/types`: normalized event and incident contracts.
- `packages/security-engine`: deterministic anti-spam, anti-raid, anti-nuke, link, risk, and incident logic.
- `packages/database`: Drizzle PostgreSQL schema and migrations.
- `packages/logger`: structured, secret-safe logging.

## Missing systems

The master specification describes a multi-year commercial product. This first vertical slice does not claim to implement billing, full Discord OAuth/session persistence, Redis queues, ClickHouse ingestion, WebSocket fan-out, automated Discord punishments, backups/restoration, message archives, tickets, economy, social integrations, or AI features. These remain roadmap work and are recorded in `docs/FINAL_AUDIT.md`.

## Security problems to avoid

- Never infer guild access from a URL parameter. Every guild API route compares the authenticated principal's guild grants with the requested guild.
- Never make irreversible decisions from a single weak signal or an AI label.
- Never treat unavailable Redis, database history, or Discord audit logs as evidence.
- Never log bot tokens, OAuth secrets, message bodies, or API keys.
- Never convert Discord snowflakes to JavaScript numbers.
- Never archive message content by default.

## Scalability constraints

The initial engine is pure and stateless, so it can run in bot shards or workers. Durable sliding windows, idempotency, fan-out, and distributed rate limits require Redis before horizontal production deployment. PostgreSQL stores transactional records; high-volume telemetry is intentionally behind the normalized event boundary so a ClickHouse adapter can be added without changing the bot.

## Technical debt

- The API-key development guard must be replaced by Discord OAuth sessions and persisted RBAC before public deployment.
- Security evaluation accepts a bounded event batch; production windows must move to Redis atomically.
- Dashboard data is an explicitly labeled preview until OAuth and database adapters are connected.
- Discord responses are observation-only in this slice; destructive actions require hierarchy checks, previews, idempotency, and audit persistence.

## Phases

1. **Foundation:** monorepo, schema, API, bot, dashboard, validation, logging, tests, CI, local infrastructure.
2. **Core security:** Redis-backed windows, incident persistence, anti-raid/nuke simulations, quarantine and lockdown adapters.
3. **Identity:** Discord OAuth, encrypted tokens where storage is required, sessions, CSRF, RBAC, guild membership refresh.
4. **Moderation and verification:** cases, appeals, safe actions, CAPTCHA, signed one-time verification tokens.
5. **Realtime and archive:** event bus, WebSocket gateway, opt-in archives, retention jobs, search, export and deletion.
6. **Automation and community:** bounded workflow runtime, tickets, roles, levels, giveaways, polls, temporary voice.
7. **Scale and hardening:** sharding manager, ClickHouse/object storage adapters, load tests, SLOs, disaster recovery, external security review.

## Files and modules

This phase adds only the files required by the runnable vertical slice. New subsystems are added when their phase begins; placeholder packages are intentionally avoided.

## Migration strategy

All PostgreSQL changes are represented as ordered SQL migrations. Deploy additive changes first, backfill asynchronously, switch readers, then remove old columns in a later release. High-volume tables use guild/time composite indexes and string Discord IDs.

## Testing strategy

- Unit tests exercise risk scoring, correlation, fail-safe behavior, spam windows, link classification, and anti-nuke thresholds.
- API integration tests use Fastify injection to prove authentication and guild isolation.
- Type checking runs in every workspace.
- The dashboard receives production and responsive browser checks with Playwright.
- CI runs lint, typecheck, tests, and the production build.
