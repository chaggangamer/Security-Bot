# Privacy architecture

Member intelligence is guild-scoped. Aegis does not build cross-server dossiers and does not claim access to IP addresses, physical location, passwords, device identity, browser history, unrelated DMs, unrelated servers, or voice content.

The event contract carries metadata, not raw message bodies. Content processing is an explicit privileged-intent configuration; persistent archives require a second explicit guild-owner opt-in and channel-level allowlist. Analytics should prefer aggregates that do not require raw content.

Admins must be able to review collection categories, retention, exports, and deletion. Configuration exports exclude tokens, OAuth secrets, API keys, and session material.
