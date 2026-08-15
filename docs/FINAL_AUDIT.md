# Final audit

## Implemented

- pnpm strict-TypeScript monorepo, lint/format/build/test commands, CI, and local infrastructure definition.
- Normalized guild-scoped event contract with string Discord IDs and bounded metadata.
- Explainable member risk signals and levels.
- Deterministic anti-raid join velocity, anti-spam sliding windows, anti-nuke thresholds, and URL policy classification.
- Correlated raid, spam, and possible-nuke incidents with non-destructive response recommendations.
- discord.js gateway ingestion and permission-limited `/security status` command handler.
- Fastify API health/metrics endpoints, validation, timing-safe development authentication, guild authorization, IDOR protection, response hardening, and bounded rate limiting.
- Drizzle PostgreSQL schema plus ordered migration for core identity, guild, session, security, risk, audit, and retention entities.
- Responsive, keyboard-visible, reduced-motion SOC dashboard with honest preview/unconfigured states.
- Unit and API integration tests, Docker/local infrastructure, and operational/security/privacy documentation.

## Partial

- Observability: structured redacted logs and a minimal Prometheus endpoint exist; external error tracking and full metrics do not.
- Database: schema/migration exist; API and bot persistence adapters are not connected.
- Discord bot: gateway observation exists; audit-log correlation, sharding manager, command registration deployment, and action execution do not.
- Dashboard: production UI states exist; OAuth, RBAC data, realtime events, and persisted settings do not.
- Incident system: detection/correlation exists; durable timeline, evidence, notes, replay, and workflow integration do not.

## Not implemented

Discord OAuth/session rotation, persisted RBAC, Redis/event bus/workers, WebSocket gateway, ClickHouse/object-storage adapters, action queues, quarantine/lockdown execution, backups/restoration, moderation cases and appeals, verification/CAPTCHA, message archive/search, workflow builder/runtime, custom commands, community features, tickets, social alerts, AI helpers, billing, developer API keys/webhooks, sharding manager, full load tests, disaster-recovery automation, and production SLO dashboards.

## Security review

The implemented boundary rejects unauthenticated access, guild crossover, mixed-guild batches, oversized batches, and malformed snowflakes. It redacts likely secrets and avoids content retention. Public deployment is blocked until the development principal is replaced with OAuth sessions/RBAC and persistence/distributed limits are connected.

## Discord permissions

See `docs/DISCORD_PERMISSIONS.md`. Current ingestion needs Guilds, Guild Members, and Guild Messages. Message Content is disabled unless explicitly enabled. The command requires Manage Server by default.

## Database

Core tables and indexes are documented in `docs/DATABASE.md`; the foundation migration is `0000_foundation.sql`. It has not been applied to a production database.

## Deployment

Exact gating steps are in `docs/DEPLOYMENT.md`. The local compose file is development infrastructure, not a production claim.

## Testing

Verified on 2026-08-14: formatting and lint passed with zero warnings, strict type checking passed in all seven workspaces, all 10 unit/integration tests passed, and the complete Next.js 16.3.1 production build passed. `pnpm audit --prod` reported no known vulnerabilities after patched transitive overrides. Playwright verified a healthy response, nonce-based CSP, clean console, semantic desktop rendering, 375px layout without horizontal overflow, and working mobile navigation.

## Known limitations

See `docs/LIMITATIONS.md`. The most important limitation is observation-only behavior and preview dashboard data.

## Recommended next steps

Implement phase 2 in `docs/IMPLEMENTATION_PLAN.md`: Discord OAuth, persisted RBAC/sessions, Redis-backed windows/idempotency, event persistence, and WebSocket incident updates. Only then add hierarchy-safe Discord actions.
