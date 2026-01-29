/**
 * WebSocket Message Handlers
 *
 * Handles messages received from WebSocket clients.
 * Includes subscribe/unsubscribe, ping/pong, and status requests.
 * Implements rate limiting per connection.
 *
 * @module websocket/handlers
 * @see Story 5.1 - WebSocket Server para Real-Time
 */

import { WebSocket } from 'ws';
import type { FastifyBaseLogger } from 'fastify';
import { ConnectionManager } from './connection-manager';
import {
  WSClientMessage,
  SubscribePayload,
  WSEventType,
  WSEvent,
  ClientMessage,
  ErrorPayload,
  HeartbeatPayload,
} from './types';

/**
 * Rate limiting configuration
 */
const RATE_LIMIT = parseInt(process.env['WS_RATE_LIMIT'] || '60', 10); // messages per window
const RATE_WINDOW = parseInt(process.env['WS_RATE_WINDOW'] || '60000', 10); // 1 minute window

/**
 * Rate limit tracking per connection
 */
interface RateLimitInfo {
  count: number;
  resetAt: number;
}

const rateLimits = new Map<string, RateLimitInfo>();

/**
 * Processes a message received from a WebSocket client
 *
 * @param ws - The WebSocket connection
 * @param connectionId - Unique identifier for this connection
 * @param message - The parsed message from the client
 * @param logger - Fastify logger instance
 */
export function handleMessage(
  ws: WebSocket,
  connectionId: string,
  message: ClientMessage,
  logger: FastifyBaseLogger
): void {
  // Rate limiting check
  if (!checkRateLimit(connectionId)) {
    const errorEvent: WSEvent<ErrorPayload> = {
      type: WSEventType.ERROR,
      payload: { error: 'Rate limit exceeded', retryAfter: 60 },
      timestamp: new Date().toISOString(),
    };
    ws.send(JSON.stringify(errorEvent));
    logger.warn({ connectionId }, 'Rate limit exceeded');
    return;
  }

  logger.debug({ message }, 'Received message from client');

  switch (message.type) {
    case WSClientMessage.SUBSCRIBE:
      handleSubscribe(ws, connectionId, message.payload as SubscribePayload, logger);
      break;

    case WSClientMessage.UNSUBSCRIBE:
      handleUnsubscribe(ws, connectionId, logger);
      break;

    case WSClientMessage.PING:
      handlePing(ws, connectionId, logger);
      break;

    case WSClientMessage.GET_STATUS:
      handleGetStatus(ws, connectionId, logger);
      break;

    default: {
      const errorEvent: WSEvent<ErrorPayload> = {
        type: WSEventType.ERROR,
        payload: { error: `Unknown message type: ${message.type}` },
        timestamp: new Date().toISOString(),
      };
      ws.send(JSON.stringify(errorEvent));
      logger.warn({ type: message.type }, 'Unknown message type');
    }
  }
}

/**
 * Handles subscribe messages
 *
 * Allows clients to filter events by execution ID and/or event types.
 *
 * @param ws - The WebSocket connection
 * @param connectionId - Connection identifier
 * @param payload - Subscription filters
 * @param logger - Logger instance
 */
function handleSubscribe(
  ws: WebSocket,
  connectionId: string,
  payload: SubscribePayload | undefined,
  logger: FastifyBaseLogger
): void {
  const manager = ConnectionManager.getInstance();
  const subscriptions = payload || {};

  manager.updateSubscriptions(connectionId, subscriptions);

  // Send confirmation
  const response: WSEvent<HeartbeatPayload> = {
    type: WSEventType.HEARTBEAT,
    payload: {
      status: 'connected',
      connectionId,
      subscriptions,
    },
    timestamp: new Date().toISOString(),
  };
  ws.send(JSON.stringify(response));

  logger.info({ connectionId, subscriptions }, 'Client subscribed');
}

/**
 * Handles unsubscribe messages
 *
 * Clears all subscription filters for the connection.
 *
 * @param ws - The WebSocket connection
 * @param connectionId - Connection identifier
 * @param logger - Logger instance
 */
function handleUnsubscribe(ws: WebSocket, connectionId: string, logger: FastifyBaseLogger): void {
  const manager = ConnectionManager.getInstance();
  manager.clearSubscriptions(connectionId);

  // Send confirmation
  const response: WSEvent<HeartbeatPayload> = {
    type: WSEventType.HEARTBEAT,
    payload: {
      status: 'connected',
      connectionId,
      subscriptions: {},
    },
    timestamp: new Date().toISOString(),
  };
  ws.send(JSON.stringify(response));

  logger.info({ connectionId }, 'Client unsubscribed');
}

/**
 * Handles manual ping messages
 *
 * Responds with a pong and marks the connection as alive.
 *
 * @param ws - The WebSocket connection
 * @param connectionId - Connection identifier
 * @param logger - Logger instance
 */
function handlePing(ws: WebSocket, connectionId: string, logger: FastifyBaseLogger): void {
  const manager = ConnectionManager.getInstance();
  manager.markAlive(connectionId);

  const pongEvent: WSEvent<HeartbeatPayload> = {
    type: WSEventType.HEARTBEAT,
    payload: { status: 'pong', connectionId },
    timestamp: new Date().toISOString(),
  };
  ws.send(JSON.stringify(pongEvent));
  logger.debug({ connectionId }, 'Responded to manual ping');
}

/**
 * Handles get_status messages
 *
 * Returns current connection information.
 *
 * @param ws - The WebSocket connection
 * @param connectionId - Connection identifier
 * @param logger - Logger instance
 */
function handleGetStatus(ws: WebSocket, connectionId: string, logger: FastifyBaseLogger): void {
  const manager = ConnectionManager.getInstance();
  const connection = manager.getConnection(connectionId);

  const statusEvent: WSEvent<HeartbeatPayload> = {
    type: WSEventType.HEARTBEAT,
    payload: {
      status: 'connected',
      connectionId,
      connectedAt: connection?.connectedAt.toISOString(),
      subscriptions: connection?.subscriptions,
      totalConnections: manager.getConnectionCount(),
    },
    timestamp: new Date().toISOString(),
  };
  ws.send(JSON.stringify(statusEvent));
  logger.debug({ connectionId }, 'Sent connection status');
}

/**
 * Checks if a connection is within rate limits
 *
 * @param connectionId - Connection identifier
 * @returns true if within limits, false if exceeded
 */
function checkRateLimit(connectionId: string): boolean {
  const now = Date.now();
  const limit = rateLimits.get(connectionId);

  if (!limit || now > limit.resetAt) {
    rateLimits.set(connectionId, { count: 1, resetAt: now + RATE_WINDOW });
    return true;
  }

  if (limit.count >= RATE_LIMIT) {
    return false;
  }

  limit.count++;
  return true;
}

/**
 * Clears rate limit tracking for a connection
 *
 * Should be called when a connection is closed.
 *
 * @param connectionId - Connection identifier
 */
export function clearRateLimitForConnection(connectionId: string): void {
  rateLimits.delete(connectionId);
}

/**
 * Clears all rate limits (for testing)
 */
export function clearRateLimits(): void {
  rateLimits.clear();
}

/**
 * Gets current rate limit info for a connection (for testing)
 *
 * @param connectionId - Connection identifier
 * @returns Rate limit info or undefined
 */
export function getRateLimitInfo(connectionId: string): RateLimitInfo | undefined {
  return rateLimits.get(connectionId);
}

/**
 * Validates a client message structure
 *
 * @param data - Raw message data
 * @returns Parsed message or null if invalid
 */
export function validateMessage(data: unknown): ClientMessage | null {
  if (!data || typeof data !== 'object') {
    return null;
  }

  const msg = data as Record<string, unknown>;

  if (typeof msg['type'] !== 'string') {
    return null;
  }

  const validTypes = Object.values(WSClientMessage);
  if (!validTypes.includes(msg['type'] as WSClientMessage)) {
    return null;
  }

  return {
    type: msg['type'] as WSClientMessage,
    payload: msg['payload'],
  };
}
