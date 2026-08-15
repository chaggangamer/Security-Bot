import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { after, before, describe, it } from 'node:test';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../src/app.js';

const apiKey = 'test-key-that-is-long-enough-for-safe-comparison';
const allowedGuild = '123456789012345678';
const deniedGuild = '223456789012345678';
let app: FastifyInstance;

before(async () => {
  app = buildApp({ apiKey, guildIds: new Set([allowedGuild]) });
  await app.ready();
});

after(async () => app.close());

describe('API security', () => {
  it('rejects anonymous requests', async () => {
    const response = await app.inject({
      method: 'GET',
      url: `/v1/guilds/${allowedGuild}/security/status`,
    });
    assert.equal(response.statusCode, 401);
  });

  it('prevents guild crossover (IDOR)', async () => {
    const response = await app.inject({
      method: 'GET',
      url: `/v1/guilds/${deniedGuild}/security/status`,
      headers: { authorization: `Bearer ${apiKey}` },
    });
    assert.equal(response.statusCode, 403);
  });

  it('rejects events scoped to another guild', async () => {
    const response = await app.inject({
      method: 'POST',
      url: `/v1/guilds/${allowedGuild}/security/evaluate`,
      headers: { authorization: `Bearer ${apiKey}` },
      payload: {
        events: [
          {
            id: randomUUID(),
            eventType: 'MEMBER_JOINED',
            guildId: deniedGuild,
            timestamp: new Date().toISOString(),
            severity: 'INFO',
            metadata: {},
            source: 'SIMULATION',
          },
        ],
      },
    });
    assert.equal(response.statusCode, 403);
  });

  it('evaluates a valid guild-scoped event batch', async () => {
    const response = await app.inject({
      method: 'POST',
      url: `/v1/guilds/${allowedGuild}/security/evaluate`,
      headers: { authorization: `Bearer ${apiKey}` },
      payload: {
        events: [
          {
            id: randomUUID(),
            eventType: 'MESSAGE_CREATED',
            guildId: allowedGuild,
            actorId: '323456789012345678',
            timestamp: new Date().toISOString(),
            severity: 'INFO',
            metadata: { mentionCount: 6 },
            source: 'SIMULATION',
          },
        ],
      },
    });
    assert.equal(response.statusCode, 200);
    assert.equal(response.json().riskScore, 15);
  });
});
