import { z } from 'zod';

export const discordIdSchema = z
  .string()
  .regex(/^\d{17,20}$/, 'Discord IDs must be 17-20 digit strings');

export const severitySchema = z.enum(['INFO', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL']);
export type Severity = z.infer<typeof severitySchema>;

export const threatStateSchema = z.enum(['NORMAL', 'ELEVATED', 'HIGH', 'RAID', 'LOCKDOWN']);
export type ThreatState = z.infer<typeof threatStateSchema>;

export const eventTypeSchema = z.enum([
  'MEMBER_JOINED',
  'MEMBER_LEFT',
  'MESSAGE_CREATED',
  'MESSAGE_UPDATED',
  'MESSAGE_DELETED',
  'CHANNEL_CREATED',
  'CHANNEL_DELETED',
  'ROLE_CREATED',
  'ROLE_DELETED',
  'MEMBER_BANNED',
  'WEBHOOK_CREATED',
  'PERMISSIONS_CHANGED',
  'VERIFICATION_FAILED',
  'AUTOMOD_TRIGGERED',
]);
export type EventType = z.infer<typeof eventTypeSchema>;

export const normalizedEventSchema = z.object({
  id: z.uuid(),
  eventType: eventTypeSchema,
  guildId: discordIdSchema,
  actorId: discordIdSchema.optional(),
  targetId: discordIdSchema.optional(),
  channelId: discordIdSchema.optional(),
  timestamp: z.iso.datetime({ offset: true }),
  severity: severitySchema,
  metadata: z.record(z.string(), z.unknown()).default({}),
  source: z.enum(['DISCORD_GATEWAY', 'DASHBOARD', 'SIMULATION']),
});
export type NormalizedEvent = z.infer<typeof normalizedEventSchema>;

export const riskSignalSchema = z.object({
  code: z.string().min(1).max(80),
  reason: z.string().min(1).max(240),
  points: z.number().int().min(-100).max(100),
  eventId: z.uuid().optional(),
});
export type RiskSignal = z.infer<typeof riskSignalSchema>;

export const incidentSchema = z.object({
  id: z.uuid(),
  guildId: discordIdSchema,
  type: z.enum([
    'RAID',
    'POSSIBLE_NUKE',
    'PHISHING_CAMPAIGN',
    'SPAM_ATTACK',
    'WEBHOOK_ABUSE',
    'PERMISSION_ESCALATION',
  ]),
  severity: severitySchema,
  status: z.enum(['OPEN', 'MITIGATING', 'RESOLVED', 'DISMISSED']),
  detectedAt: z.iso.datetime({ offset: true }),
  eventIds: z.array(z.uuid()).min(1),
  actorIds: z.array(discordIdSchema),
  signals: z.array(riskSignalSchema),
  summary: z.string().min(1).max(500),
});
export type Incident = z.infer<typeof incidentSchema>;
