# Architecture

The gateway converts Discord-specific payloads into a small `NormalizedEvent` contract. Pure security functions consume only that contract, which prevents Discord transport concerns from leaking into policy logic and allows the same evaluation to run in tests, workers, or an API.

The API is a separate Fastify process. Its development principal is configured server-side and includes an immutable set of guild grants; routes never derive access from browser-submitted roles or guild IDs. The Next.js dashboard uses App Router Server Components by default and does not currently consume privileged data.

PostgreSQL is the transactional source of truth. Redis will own distributed sliding windows, cooldowns, idempotency, and fan-out. ClickHouse is reserved for high-volume analytics, and S3-compatible storage is reserved for expiring exports/evidence. These services are not emulated by process memory in production design.

Failure policy is conservative: unavailable history or audit attribution prevents destructive action. The current release recommends human review and does not execute punishments.
