import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import { healthRoutes } from './routes/health';
import { researcherRoutes, curadorRoutes } from './routes/agents';
import { pipelineRoutes } from './routes/pipeline';
import { postsRoutes } from './routes/posts';
import { devTemplatesRoutes } from './routes/dev';
import { thresholdRoutes } from './routes/config';
import { qualityMetricsRoutes } from './routes/metrics';
import { executionsRoutes } from './routes/executions';
import { errorHandler } from './middleware/error-handler';
import {
  getDatabase,
  closeDatabase,
  runMigrations,
  createRepositories,
  type Repositories,
} from './database';

export interface ServerOptions {
  logger?: boolean;
  /** Skip database initialization (for testing) */
  skipDatabase?: boolean;
}

// Extend FastifyInstance with database repositories
declare module 'fastify' {
  interface FastifyInstance {
    db: Repositories;
  }
}

const isDev = process.env['NODE_ENV'] !== 'production';

export async function createServer(options: ServerOptions = {}): Promise<FastifyInstance> {
  const fastify = Fastify({
    logger: options.logger ?? {
      level: isDev ? 'debug' : 'info',
      transport: isDev
        ? {
            target: 'pino-pretty',
            options: {
              colorize: true,
              translateTime: 'HH:MM:ss',
              ignore: 'pid,hostname',
            },
          }
        : undefined,
    },
  });

  // Register error handler
  fastify.setErrorHandler(errorHandler);

  // Register CORS
  await fastify.register(cors, {
    origin: isDev ? true : ['http://localhost:5173'],
    credentials: true,
  });

  // Initialize database (Story 4.1)
  if (!options.skipDatabase) {
    const db = getDatabase();
    runMigrations(db);

    // Register repositories as fastify decorator
    const repositories = createRepositories(db);
    fastify.decorate('db', repositories);

    // Close database on server shutdown
    fastify.addHook('onClose', async () => {
      fastify.log.info('Closing database connection...');
      closeDatabase();
    });

    fastify.log.info('Database initialized with SQLite');
  }

  // Register routes
  await fastify.register(healthRoutes);
  await fastify.register(researcherRoutes);
  await fastify.register(curadorRoutes);
  await fastify.register(pipelineRoutes);
  await fastify.register(postsRoutes);

  // Quality Gate routes (Story 4.6)
  await fastify.register(thresholdRoutes, { prefix: '/api/config' });
  await fastify.register(qualityMetricsRoutes, { prefix: '/api/metrics' });

  // Execution History routes (Story 4.8)
  await fastify.register(executionsRoutes);

  // Development-only routes
  if (isDev) {
    await fastify.register(devTemplatesRoutes);
  }

  return fastify;
}
