# Security

## Current controls

- Strict schemas validate Discord snowflakes as strings and cap event batches at 1,000.
- API bearer comparison is timing-safe; guild grants are server-side; cross-guild events are rejected.
- API bodies are capped at 1 MiB and protected responses receive CSP, frame, MIME, and referrer headers.
- Structured logs redact fields whose names indicate tokens, secrets, passwords, cookies, authorization, or API keys.
- Message content is not stored and is not inspected unless the privileged intent is explicitly enabled.
- Security scoring is deterministic and includes human-readable signals.

## Production gate

The development API key is not public authentication. Before internet deployment, replace it with Discord OAuth, encrypted server-side credentials where required, hashed/rotated sessions, CSRF state, persisted RBAC, distributed rate limits, and revocation. Add audit persistence to every sensitive mutation. Discord actions also require hierarchy checks, owner/bot-self protection, idempotency, confirmation previews, and exact success/failure recording.

Never send message bodies to error tracking by default. Use a managed key service for encryption and never invent cryptography.
