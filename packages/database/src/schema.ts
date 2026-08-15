import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

export const incidentSeverity = pgEnum('incident_severity', [
  'INFO',
  'LOW',
  'MEDIUM',
  'HIGH',
  'CRITICAL',
]);
export const incidentStatus = pgEnum('incident_status', [
  'OPEN',
  'MITIGATING',
  'RESOLVED',
  'DISMISSED',
]);

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  discordId: text('discord_id').notNull().unique(),
  username: text('username').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const guilds = pgTable('guilds', {
  // Existing application table. Discord guild IDs are text, not UUIDs.
  id: text('id').primaryKey(),
});

export const guildSettings = pgTable('guild_settings', {
  guildId: text('guild_id')
    .primaryKey()
    .references(() => guilds.id, { onDelete: 'cascade' }),
  version: integer('version').default(1).notNull(),
  antiRaidEnabled: boolean('anti_raid_enabled').default(true).notNull(),
  antiNukeEnabled: boolean('anti_nuke_enabled').default(true).notNull(),
  automodEnabled: boolean('automod_enabled').default(true).notNull(),
  archiveMessageContent: boolean('archive_message_content').default(false).notNull(),
  configuration: jsonb('configuration').$type<Record<string, unknown>>().default({}).notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const guildStaff = pgTable(
  'guild_staff',
  {
    guildId: text('guild_id')
      .references(() => guilds.id, { onDelete: 'cascade' })
      .notNull(),
    userId: uuid('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    role: text('role').notNull(),
    scopes: text('scopes').array().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [primaryKey({ columns: [table.guildId, table.userId] })],
);

export const sessions = pgTable(
  'sessions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    tokenHash: text('token_hash').notNull(),
    userAgent: text('user_agent'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    lastActiveAt: timestamp('last_active_at', { withTimezone: true }).defaultNow().notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    revokedAt: timestamp('revoked_at', { withTimezone: true }),
  },
  (table) => [uniqueIndex('sessions_token_hash_idx').on(table.tokenHash)],
);

export const securityIncidents = pgTable(
  'security_incidents',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    guildId: text('guild_id')
      .references(() => guilds.id, { onDelete: 'cascade' })
      .notNull(),
    type: text('type').notNull(),
    severity: incidentSeverity('severity').notNull(),
    status: incidentStatus('status').default('OPEN').notNull(),
    summary: text('summary').notNull(),
    detectedAt: timestamp('detected_at', { withTimezone: true }).defaultNow().notNull(),
    resolvedAt: timestamp('resolved_at', { withTimezone: true }),
  },
  (table) => [index('incidents_guild_detected_idx').on(table.guildId, table.detectedAt)],
);

export const securityEvents = pgTable(
  'security_events',
  {
    id: uuid('id').primaryKey(),
    guildId: text('guild_id')
      .references(() => guilds.id, { onDelete: 'cascade' })
      .notNull(),
    incidentId: uuid('incident_id').references(() => securityIncidents.id, {
      onDelete: 'set null',
    }),
    discordActorId: text('discord_actor_id'),
    discordTargetId: text('discord_target_id'),
    discordChannelId: text('discord_channel_id'),
    eventType: text('event_type').notNull(),
    severity: incidentSeverity('severity').notNull(),
    metadata: jsonb('metadata').$type<Record<string, unknown>>().default({}).notNull(),
    occurredAt: timestamp('occurred_at', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('security_events_guild_created_idx').on(table.guildId, table.createdAt),
    index('security_events_guild_type_created_idx').on(
      table.guildId,
      table.eventType,
      table.createdAt,
    ),
    index('security_events_incident_idx').on(table.incidentId),
  ],
);

export const riskScores = pgTable(
  'risk_scores',
  {
    guildId: text('guild_id')
      .references(() => guilds.id, { onDelete: 'cascade' })
      .notNull(),
    discordUserId: text('discord_user_id').notNull(),
    score: integer('score').default(0).notNull(),
    level: text('level').default('LOW').notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [primaryKey({ columns: [table.guildId, table.discordUserId] })],
);

export const riskSignals = pgTable(
  'risk_signals',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    guildId: text('guild_id')
      .references(() => guilds.id, { onDelete: 'cascade' })
      .notNull(),
    discordUserId: text('discord_user_id').notNull(),
    eventId: uuid('event_id').references(() => securityEvents.id, { onDelete: 'set null' }),
    code: text('code').notNull(),
    reason: text('reason').notNull(),
    points: integer('points').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('risk_signals_guild_user_created_idx').on(
      table.guildId,
      table.discordUserId,
      table.createdAt,
    ),
  ],
);

export const auditEvents = pgTable(
  'audit_events',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    guildId: text('guild_id')
      .references(() => guilds.id, { onDelete: 'cascade' })
      .notNull(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
    action: text('action').notNull(),
    before: jsonb('before').$type<Record<string, unknown>>(),
    after: jsonb('after').$type<Record<string, unknown>>(),
    requestId: text('request_id').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index('audit_events_guild_created_idx').on(table.guildId, table.createdAt)],
);

export const retentionPolicies = pgTable(
  'retention_policies',
  {
    guildId: text('guild_id')
      .references(() => guilds.id, { onDelete: 'cascade' })
      .notNull(),
    dataCategory: text('data_category').notNull(),
    retentionDays: integer('retention_days'),
    enabled: boolean('enabled').default(false).notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [primaryKey({ columns: [table.guildId, table.dataCategory] })],
);
