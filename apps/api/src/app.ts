import { randomUUID, timingSafeEqual } from 'node:crypto';
import Fastify, { type FastifyError, type FastifyRequest } from 'fastify';
import { createLogger } from '@aegis/logger';
import { evaluateSecurity } from '@aegis/security-engine';
import { discordIdSchema, normalizedEventSchema } from '@aegis/types';
import { z } from 'zod';

const logger = createLogger('api');

export type ApiOptions = {
  apiKey: string;
  guildIds: ReadonlySet<string>;
};

const evaluationBodySchema = z.object({
  events: z.array(normalizedEventSchema).min(1).max(1_000),
});

function equalSecret(left: string, right: string): boolean {
  const leftBytes = Buffer.from(left);
  const rightBytes = Buffer.from(right);
  return leftBytes.length === rightBytes.length && timingSafeEqual(leftBytes, rightBytes);
}

export function buildApp(options: ApiOptions) {
  const app = Fastify({
    logger: false,
    bodyLimit: 1_048_576,
    requestIdHeader: 'x-request-id',
    genReqId: () => randomUUID(),
  });
  let windowStartedAt = Date.now();
  let requestCount = 0;

  app.addHook('onSend', async (_request, reply, payload) => {
    reply
      .header('content-security-policy', "default-src 'none'; frame-ancestors 'none'")
      .header('referrer-policy', 'no-referrer')
      .header('x-content-type-options', 'nosniff')
      .header('x-frame-options', 'DENY');
    return payload;
  });

  app.setErrorHandler<FastifyError>((error, request, reply) => {
    logger.error('request.failed', {
      requestId: request.id,
      method: request.method,
      path: request.url,
      message: error.message,
    });
    const status = error.statusCode && error.statusCode < 500 ? error.statusCode : 500;
    return reply.code(status).send({
      error: status === 500 ? 'Internal server error' : error.message,
      requestId: request.id,
    });
  });

  const authorize = async (request: FastifyRequest, guildId?: string) => {
    const header = request.headers.authorization;
    const provided = header?.startsWith('Bearer ') ? header.slice(7) : '';
    if (!provided || !equalSecret(provided, options.apiKey)) {
      throw Object.assign(new Error('Authentication required'), { statusCode: 401 });
    }
    if (guildId && !options.guildIds.has(guildId)) {
      throw Object.assign(new Error('Guild access denied'), { statusCode: 403 });
    }

    const now = Date.now();
    if (now - windowStartedAt >= 60_000) {
      windowStartedAt = now;
      requestCount = 0;
    }
    requestCount += 1;
    if (requestCount > 60) {
      throw Object.assign(new Error('Rate limit exceeded'), { statusCode: 429 });
    }
  };

  app.get('/health', async () => ({ status: 'healthy', service: 'api' }));
  app.get('/health/live', async () => ({ status: 'alive' }));
  app.get('/health/ready', async () => ({
    status: 'ready',
    checks: { api: 'healthy', database: 'not-configured', redis: 'not-configured' },
  }));
  app.get('/metrics', async (_request, reply) => {
    reply.type('text/plain; version=0.0.4');
    return '# HELP aegis_api_up API process readiness\n# TYPE aegis_api_up gauge\naegis_api_up 1\n';
  });

  app.get('/v1/guilds/:guildId/security/status', async (request, reply) => {
    const parsed = discordIdSchema.safeParse((request.params as { guildId?: unknown }).guildId);
    if (!parsed.success) return reply.code(400).send({ error: 'Invalid guild ID' });
    await authorize(request, parsed.data);
    return {
      guildId: parsed.data,
      threatState: 'NORMAL',
      mode: 'observation-only',
      messageArchive: false,
    };
  });

  app.post('/v1/guilds/:guildId/security/evaluate', async (request, reply) => {
    const guild = discordIdSchema.safeParse((request.params as { guildId?: unknown }).guildId);
    if (!guild.success) return reply.code(400).send({ error: 'Invalid guild ID' });
    await authorize(request, guild.data);

    const body = evaluationBodySchema.safeParse(request.body);
    if (!body.success) {
      return reply.code(400).send({ error: 'Invalid event batch', issues: body.error.issues });
    }
    if (body.data.events.some((event) => event.guildId !== guild.data)) {
      return reply.code(403).send({ error: 'Event guild scope does not match route guild' });
    }

    const evaluation = evaluateSecurity(body.data.events);
    logger.info('security.evaluated', {
      requestId: request.id,
      guildId: guild.data,
      eventCount: body.data.events.length,
      incidentCount: evaluation.incidents.length,
      threatState: evaluation.threatState,
    });
    return evaluation;
  });

  return app;
}
