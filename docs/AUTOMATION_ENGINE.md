# Automation engine

The normalized event boundary is ready for a future `Trigger → Conditions → Actions` runtime, but that runtime is not implemented in this release.

The production design must validate versioned workflow schemas, enforce guild scope and permissions on every action, cap execution depth and action count, prevent event/message/role loops, use idempotency keys and cooldowns, and isolate priorities so security work outranks community automation. HTTP actions require SSRF defenses across protocol validation, DNS resolution, redirects, private/link-local networks, timeouts, and response size.

Visual editing must operate on the same validated schema as the worker. A drag-and-drop canvas is not acceptance unless execution, logs, retries, errors, testing, and disabled states work end to end.
