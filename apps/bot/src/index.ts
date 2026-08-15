import { randomUUID } from 'node:crypto';
import { Client, Events, GatewayIntentBits, type Message } from 'discord.js';
import { createLogger } from '@aegis/logger';
import { evaluateSecurity } from '@aegis/security-engine';
import type { NormalizedEvent } from '@aegis/types';
import { z } from 'zod';

const logger = createLogger('bot');
const environment = z
  .object({
    DISCORD_TOKEN: z.string().min(1),
    ENABLE_MESSAGE_CONTENT: z.enum(['true', 'false']).default('false'),
  })
  .parse(process.env);

const intents = [
  GatewayIntentBits.Guilds,
  GatewayIntentBits.GuildMembers,
  GatewayIntentBits.GuildMessages,
];
if (environment.ENABLE_MESSAGE_CONTENT === 'true') intents.push(GatewayIntentBits.MessageContent);

const client = new Client({ intents });
const recentEvents = new Map<string, NormalizedEvent[]>();

function ingest(event: NormalizedEvent) {
  const current = recentEvents.get(event.guildId) ?? [];
  const cutoff = Date.parse(event.timestamp) - 30_000;
  const next = [...current.filter((item) => Date.parse(item.timestamp) >= cutoff), event].slice(
    -1_000,
  );
  recentEvents.set(event.guildId, next);
  const evaluation = evaluateSecurity(next);
  logger.info('security.event_evaluated', {
    guildId: event.guildId,
    eventType: event.eventType,
    threatState: evaluation.threatState,
    incidents: evaluation.incidents.map((incident) => incident.type),
  });
}

function messageMetadata(message: Message): Record<string, unknown> {
  if (environment.ENABLE_MESSAGE_CONTENT !== 'true') return { contentAvailable: false };
  const urls = message.content.match(/https?:\/\/[^\s<>]+/g) ?? [];
  return {
    contentAvailable: true,
    contentLength: message.content.length,
    mentionCount: message.mentions.users.size + message.mentions.roles.size,
    urls,
  };
}

client.once(Events.ClientReady, (readyClient) => {
  logger.info('gateway.ready', {
    botUserId: readyClient.user.id,
    guildCount: readyClient.guilds.cache.size,
  });
});

client.on(Events.GuildMemberAdd, (member) => {
  ingest({
    id: randomUUID(),
    eventType: 'MEMBER_JOINED',
    guildId: member.guild.id,
    actorId: member.id,
    timestamp: new Date().toISOString(),
    severity: 'INFO',
    metadata: { accountAgeHours: (Date.now() - member.user.createdTimestamp) / 3_600_000 },
    source: 'DISCORD_GATEWAY',
  });
});

client.on(Events.GuildDelete, (guild) => {
  recentEvents.delete(guild.id);
});

client.on(Events.MessageCreate, (message) => {
  if (!message.inGuild() || message.author.bot) return;
  ingest({
    id: randomUUID(),
    eventType: 'MESSAGE_CREATED',
    guildId: message.guildId,
    actorId: message.author.id,
    channelId: message.channelId,
    timestamp: new Date().toISOString(),
    severity: 'INFO',
    metadata: messageMetadata(message),
    source: 'DISCORD_GATEWAY',
  });
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand() || interaction.commandName !== 'security') return;
  if (!interaction.inCachedGuild()) {
    await interaction.reply({
      content: 'This command is only available in a server.',
      ephemeral: true,
    });
    return;
  }
  const evaluation = evaluateSecurity(recentEvents.get(interaction.guildId) ?? []);
  await interaction.reply({
    content: `Threat state: **${evaluation.threatState}**\nOpen correlated incidents: **${evaluation.incidents.length}**\nMode: **observation-only**`,
    ephemeral: true,
  });
});

const shutdown = async (signal: string) => {
  logger.info('shutdown.started', { signal });
  client.destroy();
  process.exit(0);
};
process.once('SIGINT', () => void shutdown('SIGINT'));
process.once('SIGTERM', () => void shutdown('SIGTERM'));

client.login(environment.DISCORD_TOKEN).catch((error: unknown) => {
  logger.error('gateway.login_failed', {
    message: error instanceof Error ? error.message : 'Unknown error',
  });
  process.exit(1);
});
