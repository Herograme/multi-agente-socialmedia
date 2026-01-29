import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from root .env file
config({ path: resolve(__dirname, '../../../.env') });

import { createServer } from './server';

const PORT = process.env['PORT'] ? parseInt(process.env['PORT'], 10) : 3001;
const HOST = process.env['HOST'] || '0.0.0.0';

async function main() {
  const server = await createServer();

  // Graceful shutdown handler
  const shutdown = async (signal: string) => {
    server.log.info(`Received ${signal}, shutting down gracefully...`);

    try {
      await server.close();
      server.log.info('Server closed successfully');
      process.exit(0);
    } catch (err) {
      server.log.error(err, 'Error during shutdown');
      process.exit(1);
    }
  };

  // Register shutdown handlers
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  // Handle uncaught errors
  process.on('uncaughtException', (err) => {
    server.log.error(err, 'Uncaught exception');
    process.exit(1);
  });

  process.on('unhandledRejection', (reason) => {
    server.log.error(reason, 'Unhandled rejection');
    process.exit(1);
  });

  try {
    await server.listen({ port: PORT, host: HOST });
    server.log.info(`Server running at http://${HOST}:${PORT}`);
  } catch (err) {
    server.log.error(err, 'Failed to start server');
    process.exit(1);
  }
}

main();
