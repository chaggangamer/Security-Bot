# Discord permissions and intents

OAuth invite scopes:

- `bot`
- `applications.commands`

Gateway intents in the foundation:

- Guilds
- Guild Members (privileged; needed for join risk and member lifecycle)
- Guild Messages
- Message Content only when `ENABLE_MESSAGE_CONTENT=true` and approved/required

Start with no Administrator permission. Grant only permissions required by enabled actions, such as View Audit Log for actor correlation, Manage Messages for deletion, Moderate Members for timeouts, and Manage Roles for a controlled quarantine role. Ban/Kick/Manage Channels must be separate, explicit capabilities.

The bot cannot act on members or roles at or above its highest role. Server owners cannot be punished automatically. Every Discord denial must be recorded as a failed action, never reported as success.
