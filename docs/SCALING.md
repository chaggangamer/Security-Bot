# Scaling

Bot shards should publish normalized events to a durable event bus. P0 security and P1 moderation receive isolated capacity ahead of automation, community, and analytics. Redis owns distributed windows and locks; PostgreSQL owns product state; ClickHouse receives append-heavy telemetry; object storage holds expiring evidence and exports.

Services remain stateless where practical. Shard ID, guild ID, correlation ID, request ID, and incident ID accompany work. Backpressure and bounded queues are mandatory; duplicate delivery is expected and controlled with event/action idempotency keys.

Do not claim scale from architecture alone. Measure event-processing p95, queue lag, memory, CPU, database plans, API p95, and dashboard update latency at increasing guild/event volumes.
