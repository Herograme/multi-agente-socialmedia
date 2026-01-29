/**
 * WebSocket Server Setup
 *
 * Configures and registers the WebSocket plugin for Fastify.
 * Sets up the /ws route for WebSocket connections.
 *
 * @module websocket/server
 * @see Story 5.1 - WebSocket Server para Real-Time
 */

import type { FastifyInstance } from 'fastify';
import websocket from '@fastify/websocket';
import { v4 as uuidv4 } from 'uuid';
import { createLogger } from '@social-content/shared';
import { ConnectionManager } from './connection-manager';
import { startHeartbeat, stopHeartbeat, handlePong } from './heartbeat';
import { handleMessage, clearRateLimitForConnection, validateMessage } from './handlers';
import { WSEventType, WSEvent, ConnectedPayload, ErrorPayload } from './types';

const logger = createLogger('websocket:server');

/**
 * WebSocket server configuration options
 */
export interface WebSocketServerOptions {
  /** Maximum payload size in bytes (default: 1MB) */
  maxPayload?: number;
  /** Whether to track clients (default: true) */
  clientTracking?: boolean;
}

/**
 * Registers the WebSocket plugin and routes on a Fastify instance
 *
 * This function:
 * - Registers the @fastify/websocket plugin
 * - Sets up the /ws route for WebSocket connections
 * - Configures heartbeat for connection health
 * - Handles connection lifecycle (connect, message, close, error)
 * - Adds cleanup hooks for graceful shutdown
 *
 * @param fastify - The Fastify instance
 * @param options - Optional configuration
 *
 * @example
 * ```typescript
 * import Fastify from 'fastify';
 * import { registerWebSocket } from './websocket/server';
 *
 * const fastify = Fastify({ logger: true });
 * await registerWebSocket(fastify);
 * await fastify.listen({ port: 3000 });
 * ```
 */
export async function registerWebSocket(
  fastify: FastifyInstance,
  options: WebSocketServerOptions = {}
): Promise<void> {
  const { maxPayload = 1048576, clientTracking = true } = options;

  // Register the websocket plugin
  await fastify.register(websocket, {
    options: {
      maxPayload,
      clientTracking,
    },
  });

  // WebSocket route - Fastify 5.x uses 'socket' directly
  fastify.get('/ws', { websocket: true }, (socket, _request) => {
    const connectionId = uuidv4();
    const childLogger = fastify.log.child({ connectionId });

    childLogger.info('New WebSocket connection');

    // Register connection
    ConnectionManager.getInstance().addConnection(socket, connectionId);

    // Send connected event
    const connectedEvent: WSEvent<ConnectedPayload> = {
      type: WSEventType.CONNECTED,
      payload: { connectionId },
      timestamp: new Date().toISOString(),
    };
    socket.send(JSON.stringify(connectedEvent));

    // Message handler
    socket.on('message', (data: Buffer) => {
      try {
        const parsed = JSON.parse(data.toString());
        const message = validateMessage(parsed);

        if (!message) {
          const errorEvent: WSEvent<ErrorPayload> = {
            type: WSEventType.ERROR,
            payload: { error: 'Invalid message format' },
            timestamp: new Date().toISOString(),
          };
          socket.send(JSON.stringify(errorEvent));
          childLogger.warn({ data: data.toString() }, 'Invalid message format');
          return;
        }

        handleMessage(socket, connectionId, message, childLogger);
      } catch (error) {
        childLogger.error({ error }, 'Failed to parse WebSocket message');
        const errorEvent: WSEvent<ErrorPayload> = {
          type: WSEventType.ERROR,
          payload: { error: 'Failed to parse message' },
          timestamp: new Date().toISOString(),
        };
        socket.send(JSON.stringify(errorEvent));
      }
    });

    // Close handler
    socket.on('close', (code, reason) => {
      const reasonStr = reason ? reason.toString() : 'unknown';
      childLogger.info({ code, reason: reasonStr }, 'WebSocket connection closed');
      ConnectionManager.getInstance().removeConnection(connectionId);
      clearRateLimitForConnection(connectionId);
    });

    // Error handler
    socket.on('error', (error) => {
      childLogger.error({ error }, 'WebSocket error');
      ConnectionManager.getInstance().removeConnection(connectionId);
      clearRateLimitForConnection(connectionId);
    });

    // Pong handler for heartbeat
    socket.on('pong', () => {
      handlePong(connectionId);
    });
  });

  // Start heartbeat system
  startHeartbeat();

  // Cleanup on server shutdown
  fastify.addHook('onClose', async () => {
    logger.info('Shutting down WebSocket server');
    stopHeartbeat();
    ConnectionManager.getInstance().closeAll();
  });

  logger.info('WebSocket server registered on /ws');
}

/**
 * Gets the current connection count
 *
 * @returns Number of active WebSocket connections
 */
export function getConnectionCount(): number {
  return ConnectionManager.getInstance().getConnectionCount();
}

/**
 * Broadcasts an event to all connected clients
 *
 * @param event - The event to broadcast
 */
export function broadcastEvent(event: WSEvent): void {
  ConnectionManager.getInstance().broadcast(event);
}
