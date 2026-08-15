import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { describe, it } from 'node:test';
import type { NormalizedEvent } from '@aegis/types';
import { classifyUrl, evaluateSecurity } from '../src/index.js';

const guildId = '123456789012345678';
const actorId = '223456789012345678';

function event(
  eventType: NormalizedEvent['eventType'],
  second: number,
  metadata: Record<string, unknown> = {},
): NormalizedEvent {
  return {
    id: randomUUID(),
    eventType,
    guildId,
    actorId,
    timestamp: new Date(Date.UTC(2026, 7, 14, 10, 0, second)).toISOString(),
    severity: 'INFO',
    metadata,
    source: 'SIMULATION',
  };
}

describe('security engine', () => {
  it('stays fail-safe for an empty batch', () => {
    assert.deepEqual(evaluateSecurity([]), {
      threatState: 'NORMAL',
      riskScore: 0,
      riskLevel: 'LOW',
      signals: [],
      incidents: [],
      recommendedActions: [],
    });
  });

  it('correlates a join burst into one raid incident', () => {
    const result = evaluateSecurity(
      Array.from({ length: 20 }, (_, index) =>
        event('MEMBER_JOINED', index / 10, { accountAgeHours: 2 }),
      ),
    );
    assert.equal(result.threatState, 'RAID');
    assert.equal(result.incidents.filter((item) => item.type === 'RAID').length, 1);
    assert.ok(result.incidents[0]?.eventIds.length === 20);
  });

  it('detects destructive activity by one actor', () => {
    const result = evaluateSecurity([event('CHANNEL_DELETED', 0), event('CHANNEL_DELETED', 1)]);
    assert.equal(result.incidents[0]?.type, 'POSSIBLE_NUKE');
    assert.equal(result.incidents[0]?.severity, 'CRITICAL');
  });

  it('detects spam with a sliding window', () => {
    const result = evaluateSecurity(
      Array.from({ length: 5 }, (_, index) => event('MESSAGE_CREATED', index)),
    );
    assert.equal(result.incidents[0]?.type, 'SPAM_ATTACK');
  });

  it('rejects cross-guild evaluation', () => {
    const foreign = { ...event('MEMBER_JOINED', 1), guildId: '323456789012345678' };
    assert.throws(
      () => evaluateSecurity([event('MEMBER_JOINED', 0), foreign]),
      /cannot mix guilds/,
    );
  });

  it('classifies malicious, obfuscated, and ordinary links', () => {
    assert.equal(classifyUrl('https://discord-gift.example/login'), 'DELETE');
    assert.equal(classifyUrl('https://xn--e1afmkfd.xn--p1ai'), 'WARN');
    assert.equal(classifyUrl('https://discord.com/channels/@me'), 'ALLOW');
    assert.equal(classifyUrl('javascript:alert(1)'), 'DELETE');
  });
});
