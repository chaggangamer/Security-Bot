import { createLogger } from '@aegis/logger';
import { z } from 'zod';
import { buildApp } from './app.js';

const logger = createLogger('api');
const environment = z
  .object({
    DEVELOPMENT_API_KEY: z.string().min(32),
    DEVELOPMENT_GUILD_IDS: z.string().min(1),
    API_HOST: z.string().default('127.0.0.1'),
    API_PORT: z.coerce.number().int().min(1).max(65_535).default(4000),
  })
  .parse(process.env);

const app = buildApp({
  apiKey: environment.DEVELOPMENT_API_KEY,
  guildIds: new Set(environment.DEVELOPMENT_GUILD_IDS.split(',').map((id) => id.trim())),
});

const close = async (signal: string) => {
  logger.info('shutdown.started', { signal });
  await app.close();
  process.exit(0);
};

process.once('SIGINT', () => void close('SIGINT'));
process.once('SIGTERM', () => void close('SIGTERM'));

try {
  await app.listen({ host: environment.API_HOST, port: environment.API_PORT });
  logger.info('server.started', { host: environment.API_HOST, port: environment.API_PORT });
} catch (error) {
  logger.error('server.start_failed', {
    message: error instanceof Error ? error.message : 'Unknown error',
  });
  process.exit(1);
}
