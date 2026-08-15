# Aegis

Aegis is an original Discord security operations platform. The current release is a production-oriented foundation: a Discord gateway, deterministic security engine, guild-scoped API, PostgreSQL schema, and responsive SOC dashboard.

It is deliberately observation-only. It detects and explains patterns but does not perform destructive Discord actions until persistence, hierarchy checks, idempotency, previews, and full audit logging are connected.

## Architecture

```text
Discord gateway → normalized event → security engine → incident recommendation
                                            ↘ API → dashboard
                                             ↘ PostgreSQL schema
```

See `docs/ARCHITECTURE.md` and `docs/IMPLEMENTATION_PLAN.md` for boundaries and phased work.

## Prerequisites

- Node.js 22+
- pnpm 11+
- Docker Desktop for PostgreSQL, Redis, ClickHouse, and MinIO
- A Discord application for gateway testing

## Setup

```bash
pnpm install
copy .env.example .env
docker compose up -d
pnpm db:migrate
pnpm dev
```

The dashboard runs at `http://localhost:3000`. Run the API with `pnpm dev:api` and the bot with `pnpm dev:bot` after filling the relevant environment variables.

## Discord application

Create an application in the Discord Developer Portal, add a bot, and place its token only in the server-side `DISCORD_TOKEN` environment variable. The foundation uses `Guilds`, `GuildMembers`, and `GuildMessages`. Message Content is opt-in with `ENABLE_MESSAGE_CONTENT=true` and requires the corresponding privileged intent when applicable.

Generate the command payload locally with:

```bash
pnpm --filter @aegis/bot commands:verify
```

Invite scopes should be limited to `bot` and `applications.commands`; see `docs/DISCORD_PERMISSIONS.md` before granting bot permissions.

## Verification

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Additional guidance is in `docs/TESTING.md`. Current feature status and limitations are recorded in `docs/FINAL_AUDIT.md` and `docs/LIMITATIONS.md`.
