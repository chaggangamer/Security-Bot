# Testing

`pnpm test` runs unit and integration suites. Security tests cover cross-guild IDOR, event-scope mismatch, mixed-guild evaluation, malicious URL classification, sliding-window spam, join bursts, and destructive activity thresholds.

`pnpm typecheck`, `pnpm lint`, and `pnpm build` are independent required gates. Browser verification covers desktop and mobile layout, semantic structure, console errors, health response, and reduced-motion behavior.

Future suites must add OAuth state/CSRF/session fixation, persisted RBAC, Redis atomicity, database isolation, SSRF redirect/DNS rebinding, Discord permission hierarchy, idempotent actions, queue retries, retention deletion, export authorization, shard routing, and sustained load tests at measured event rates.
