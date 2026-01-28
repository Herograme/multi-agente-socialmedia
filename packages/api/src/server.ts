import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import { healthRoutes } from './routes/health';
import { researcherRoutes, curadorRoutes } from './routes/agents';
import { pipelineRoutes } from './routes/pipeline';
import { postsRoutes } from './routes/posts';
import { devTemplatesRoutes } from './routes/dev';
import { errorHandler } from './middleware/error-handler';

export interface ServerOptions {
  logger?: boolean;
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

  // Register routes
  await fastify.register(healthRoutes);
  await fastify.register(researcherRoutes);
  await fastify.register(curadorRoutes);
  await fastify.register(pipelineRoutes);
  await fastify.register(postsRoutes);

  // Development-only routes
  if (isDev) {
    await fastify.register(devTemplatesRoutes);
  }

  return fastify;
}
