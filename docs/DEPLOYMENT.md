# Deployment

1. Provision PostgreSQL, Redis, object storage, and—only when event volume requires it—ClickHouse in separate failure domains.
2. Store Discord/OAuth/database secrets in the platform secret manager. Never bake them into images.
3. Run migrations as a dedicated release step before new services receive traffic.
4. Build immutable images, scan them, and deploy the API/dashboard behind TLS. Keep the bot in a long-lived worker environment rather than a request-bound serverless function.
5. Require `/health/live` for process health and `/health/ready` for dependency readiness. The foundation reports unconfigured dependencies honestly.
6. Enable structured log collection, Prometheus scraping, alerting, backups, restoration drills, and dependency/secret scanning.

`docker compose up -d` is for local infrastructure only. It does not represent a production topology.
