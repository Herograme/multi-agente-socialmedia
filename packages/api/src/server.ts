import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import { healthRoutes } from './routes/health';
import { researcherRoutes, curadorRoutes } from './routes/agents';
import { pipelineRoutes } from './routes/pipeline';
import { postsRoutes } from './routes/posts';
import { approvalRoutes } from './routes/posts/approval';
import { devTemplatesRoutes } from './routes/dev';
import { thresholdRoutes } from './routes/config';
import { qualityMetricsRoutes, dashboardMetricsRoutes } from './routes/metrics';
import { executionsRoutes } from './routes/executions';
import { templatesRoutes } from './routes/templates';
import { settingsRoutes } from './routes/settings';
import { errorHandler } from './middleware/error-handler';
import {
  getDatabase,
  closeDatabase,
  runMigrations,
  createRepositories,
  type Repositories,
} from './database';
import { registerWebSocket } from './websocket';

export interface ServerOptions {
  logger?: boolean;
  /** Skip database initialization (for testing) */
  skipDatabase?: boolean;
  /** Skip WebSocket initialization (for testing) */
  skipWebSocket?: boolean;
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

  // Post Approval routes (Story 5.5)
  await fastify.register(approvalRoutes);

  // Quality Gate routes (Story 4.6)
  await fastify.register(thresholdRoutes, { prefix: '/api/config' });
  await fastify.register(qualityMetricsRoutes, { prefix: '/api/metrics' });

  // Dashboard Metrics routes (Story 5.3)
  await fastify.register(dashboardMetricsRoutes);

  // Execution History routes (Story 4.8)
  await fastify.register(executionsRoutes);

  // Template Editor routes (Story 5.7)
  await fastify.register(templatesRoutes, { prefix: '/api/templates' });

  // Settings routes (Story 5.6)
  await fastify.register(settingsRoutes, { prefix: '/api/settings' });

  // Development-only routes
  if (isDev) {
    await fastify.register(devTemplatesRoutes);
  }

  // WebSocket support (Story 5.1)
  if (!options.skipWebSocket) {
    await registerWebSocket(fastify);
    fastify.log.info('WebSocket server registered');
  }

  return fastify;
}
