const secretKeyPattern = /token|secret|password|authorization|cookie|api.?key/i;

function sanitize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sanitize);
  if (!value || typeof value !== 'object') return value;

  return Object.fromEntries(
    Object.entries(value).map(([key, nested]) => [
      key,
      secretKeyPattern.test(key) ? '[REDACTED]' : sanitize(nested),
    ]),
  );
}

export type LogContext = Record<string, unknown>;

export function createLogger(service: string) {
  const write = (level: 'info' | 'warn' | 'error', event: string, context: LogContext = {}) => {
    const entry = sanitize({
      timestamp: new Date().toISOString(),
      level,
      service,
      event,
      ...context,
    });
    const output = JSON.stringify(entry);
    if (level === 'error') console.error(output);
    else if (level === 'warn') console.warn(output);
    else console.info(output);
  };

  return {
    info: (event: string, context?: LogContext) => write('info', event, context),
    warn: (event: string, context?: LogContext) => write('warn', event, context),
    error: (event: string, context?: LogContext) => write('error', event, context),
  };
}
