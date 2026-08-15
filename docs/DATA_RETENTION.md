# Data retention

Defaults are conservative: message content archive is off, presence history is off, and only metadata required for immediate security evaluation is held in the bot's bounded 30-second development window.

Production retention is configured independently by category. Suggested starting points are 7 days for opted-in message content, 30 days for message metadata, 90 days for security evidence, 365 days for moderation cases, and 180 days for ticket transcripts. A null duration means disabled, not infinite retention.

Deletion jobs must preserve referential integrity and audit facts. When deletion would corrupt an audit chain, anonymize the subject while keeping the action record. Exports must be asynchronous, authorized, auditable, encrypted at rest, time-limited, and delivered with expiring signed URLs.
