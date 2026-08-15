import { randomUUID } from 'node:crypto';
import type { Incident, NormalizedEvent, RiskSignal, Severity, ThreatState } from '@aegis/types';

const destructiveTypes = new Set<NormalizedEvent['eventType']>([
  'CHANNEL_DELETED',
  'ROLE_DELETED',
  'MEMBER_BANNED',
  'WEBHOOK_CREATED',
  'PERMISSIONS_CHANGED',
]);

const knownMaliciousDomains = new Set([
  'discord-gift.example',
  'discordnitro.example',
  'steam-vote.example',
]);
const redirectorDomains = new Set(['bit.ly', 'tinyurl.com', 't.co']);

export type RiskLevel = 'LOW' | 'WATCH' | 'SUSPICIOUS' | 'HIGH' | 'CRITICAL';

export type SecurityConfig = {
  joinWindowMs: number;
  elevatedJoins: number;
  highJoins: number;
  raidJoins: number;
  spamWindowMs: number;
  spamMessageCount: number;
};

export type SecurityEvaluation = {
  threatState: ThreatState;
  riskScore: number;
  riskLevel: RiskLevel;
  signals: RiskSignal[];
  incidents: Incident[];
  recommendedActions: string[];
};

export const balancedSecurityConfig: SecurityConfig = {
  joinWindowMs: 10_000,
  elevatedJoins: 5,
  highJoins: 10,
  raidJoins: 20,
  spamWindowMs: 5_000,
  spamMessageCount: 5,
};

function withinWindow(events: NormalizedEvent[], windowMs: number): NormalizedEvent[] {
  const newest = events.at(-1);
  if (!newest) return [];
  const cutoff = Date.parse(newest.timestamp) - windowMs;
  return events.filter((event) => Date.parse(event.timestamp) >= cutoff);
}

function scoreLevel(score: number): RiskLevel {
  if (score >= 80) return 'CRITICAL';
  if (score >= 60) return 'HIGH';
  if (score >= 40) return 'SUSPICIOUS';
  if (score >= 20) return 'WATCH';
  return 'LOW';
}

function severityFromScore(score: number): Severity {
  if (score >= 80) return 'CRITICAL';
  if (score >= 60) return 'HIGH';
  if (score >= 40) return 'MEDIUM';
  if (score >= 20) return 'LOW';
  return 'INFO';
}

export function classifyUrl(rawUrl: string): 'ALLOW' | 'WARN' | 'DELETE' {
  try {
    const url = new URL(rawUrl);
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return 'DELETE';
    const host = url.hostname.toLowerCase().replace(/\.$/, '');
    if (knownMaliciousDomains.has(host)) return 'DELETE';
    if (host.startsWith('xn--') || redirectorDomains.has(host)) return 'WARN';
    return 'ALLOW';
  } catch {
    return 'DELETE';
  }
}

function riskSignals(events: NormalizedEvent[], threatState: ThreatState): RiskSignal[] {
  const signals: RiskSignal[] = [];

  for (const event of events) {
    const add = (code: string, reason: string, points: number) =>
      signals.push({ code, reason, points, eventId: event.id });

    const accountAgeHours = event.metadata.accountAgeHours;
    if (typeof accountAgeHours === 'number' && accountAgeHours < 24) {
      add('YOUNG_ACCOUNT', 'Account is younger than 24 hours', 10);
    }
    if (event.eventType === 'VERIFICATION_FAILED') {
      add('VERIFICATION_FAILURE', 'Verification attempt failed', 10);
    }
    if (event.eventType === 'AUTOMOD_TRIGGERED') {
      add('AUTOMOD_HIT', 'Automatic moderation rule triggered', 8);
    }
    const mentionCount = event.metadata.mentionCount;
    if (typeof mentionCount === 'number' && mentionCount >= 5) {
      add('MENTION_SPAM', `${mentionCount} mentions in one message`, 15);
    }
    const urls = event.metadata.urls;
    if (
      Array.isArray(urls) &&
      urls.some((url) => typeof url === 'string' && classifyUrl(url) === 'DELETE')
    ) {
      add('MALICIOUS_LINK', 'Known malicious or invalid link detected', 20);
    }
  }

  if (threatState === 'RAID' || threatState === 'LOCKDOWN') {
    signals.push({
      code: 'ACTIVE_RAID',
      reason: 'Activity occurred during raid state',
      points: 18,
    });
  }

  return signals;
}

function detectThreatState(events: NormalizedEvent[], config: SecurityConfig): ThreatState {
  const joins = withinWindow(events, config.joinWindowMs).filter(
    (event) => event.eventType === 'MEMBER_JOINED',
  ).length;
  if (joins >= config.raidJoins) return 'RAID';
  if (joins >= config.highJoins) return 'HIGH';
  if (joins >= config.elevatedJoins) return 'ELEVATED';
  return 'NORMAL';
}

function spamEvents(events: NormalizedEvent[], config: SecurityConfig): NormalizedEvent[] {
  const recent = withinWindow(events, config.spamWindowMs).filter(
    (event) => event.eventType === 'MESSAGE_CREATED' && event.actorId,
  );
  const counts = new Map<string, number>();
  for (const event of recent) {
    const actorId = event.actorId;
    if (actorId) counts.set(actorId, (counts.get(actorId) ?? 0) + 1);
  }
  const offenders = new Set(
    [...counts].filter(([, count]) => count >= config.spamMessageCount).map(([actorId]) => actorId),
  );
  return recent.filter((event) => event.actorId && offenders.has(event.actorId));
}

function nukeEvents(events: NormalizedEvent[]): NormalizedEvent[] {
  const newest = events.at(-1);
  if (!newest) return [];
  const actorCounts = new Map<string, Map<NormalizedEvent['eventType'], number>>();
  const recent = withinWindow(events, 30_000).filter(
    (event) => destructiveTypes.has(event.eventType) && event.actorId,
  );

  for (const event of recent) {
    const actorId = event.actorId;
    if (!actorId) continue;
    const counts = actorCounts.get(actorId) ?? new Map();
    counts.set(event.eventType, (counts.get(event.eventType) ?? 0) + 1);
    actorCounts.set(actorId, counts);
  }

  const flagged = new Set<string>();
  for (const [actorId, counts] of actorCounts) {
    if (
      (counts.get('CHANNEL_DELETED') ?? 0) >= 2 ||
      (counts.get('ROLE_DELETED') ?? 0) >= 3 ||
      (counts.get('MEMBER_BANNED') ?? 0) >= 8 ||
      (counts.get('WEBHOOK_CREATED') ?? 0) >= 3 ||
      (counts.get('PERMISSIONS_CHANGED') ?? 0) >= 2
    ) {
      flagged.add(actorId);
    }
  }
  return recent.filter((event) => event.actorId && flagged.has(event.actorId));
}

function incident(
  type: Incident['type'],
  events: NormalizedEvent[],
  signals: RiskSignal[],
  summary: string,
  score: number,
): Incident | undefined {
  const first = events[0];
  if (!first) return undefined;
  return {
    id: randomUUID(),
    guildId: first.guildId,
    type,
    severity: severityFromScore(score),
    status: 'OPEN',
    detectedAt: events.at(-1)?.timestamp ?? first.timestamp,
    eventIds: events.map((event) => event.id),
    actorIds: [...new Set(events.flatMap((event) => (event.actorId ? [event.actorId] : [])))],
    signals,
    summary,
  };
}

export function evaluateSecurity(
  unsortedEvents: NormalizedEvent[],
  config: SecurityConfig = balancedSecurityConfig,
): SecurityEvaluation {
  const events = [...unsortedEvents].sort(
    (left, right) => Date.parse(left.timestamp) - Date.parse(right.timestamp),
  );
  if (events.length === 0) {
    return {
      threatState: 'NORMAL',
      riskScore: 0,
      riskLevel: 'LOW',
      signals: [],
      incidents: [],
      recommendedActions: [],
    };
  }

  const guildId = events[0]?.guildId;
  if (!guildId || events.some((event) => event.guildId !== guildId)) {
    throw new Error('Security evaluation cannot mix guilds');
  }
  if (events.length > 1_000) throw new Error('Security evaluation batch exceeds 1,000 events');

  const threatState = detectThreatState(events, config);
  const signals = riskSignals(events, threatState);
  const spam = spamEvents(events, config);
  const nuke = nukeEvents(events);
  const riskScore = Math.max(
    0,
    Math.min(
      100,
      signals.reduce((sum, signal) => sum + signal.points, 0),
    ),
  );
  const incidents: Incident[] = [];

  if (threatState === 'RAID') {
    const created = incident(
      'RAID',
      withinWindow(events, config.joinWindowMs).filter(
        (event) => event.eventType === 'MEMBER_JOINED',
      ),
      signals,
      'Join velocity crossed the configured raid threshold',
      Math.max(riskScore, 80),
    );
    if (created) incidents.push(created);
  }
  if (spam.length > 0) {
    const created = incident(
      'SPAM_ATTACK',
      spam,
      signals,
      'Repeated messages crossed the spam window',
      60,
    );
    if (created) incidents.push(created);
  }
  if (nuke.length > 0) {
    const created = incident(
      'POSSIBLE_NUKE',
      nuke,
      signals,
      'Destructive administrative activity crossed a safety threshold',
      90,
    );
    if (created) incidents.push(created);
  }

  return {
    threatState,
    riskScore,
    riskLevel: scoreLevel(riskScore),
    signals,
    incidents,
    recommendedActions:
      incidents.length === 0
        ? []
        : [
            'Preserve relevant evidence',
            'Notify authorized security staff',
            'Require human review',
          ],
  };
}
