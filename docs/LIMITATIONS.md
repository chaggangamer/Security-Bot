# Current limitations

- Discord role hierarchy can prevent moderation, quarantine, permission changes, or restoration.
- The bot cannot recover deleted history it never legitimately received and stored.
- Message Content and Guild Members may require privileged-intent approval.
- Presence is unavailable without the relevant privileged intent and may be incomplete.
- Discord rate limits and outages constrain action speed; retryable actions need bounded queues.
- Deleted Discord resources cannot necessarily be recreated with identical IDs or full metadata.
- The current API uses a development bearer principal, not Discord OAuth sessions.
- Redis windows, database persistence, WebSocket streaming, action execution, and archives are not connected in this release.
- Dashboard values are labeled preview data and are not operational telemetry.
