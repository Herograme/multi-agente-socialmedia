/**
 * WebSocket Heartbeat System
 *
 * Implements ping/pong mechanism to keep WebSocket connections alive
 * and detect stale connections that should be cleaned up.
 *
 * @module websocket/heartbeat
 * @see Story 5.1 - WebSocket Server para Real-Time
 */

import { WebSocket } from 'ws';
import { createLogger } from '@social-content/shared';
import { ConnectionManager } from './connection-manager';

const logger = createLogger('websocket:heartbeat');

/**
 * Heartbeat configuration from environment or defaults
 */
const HEARTBEAT_INTERVAL = parseInt(process.env['WS_HEARTBEAT_INTERVAL'] || '30000', 10);
const PONG_TIMEOUT = parseInt(process.env['WS_PONG_TIMEOUT'] || '10000', 10);

/**
 * Stores the heartbeat interval timer
 */
let heartbeatInterval: NodeJS.Timeout | null = null;

/**
 * Stores ping timestamps for latency calculation
 */
const pingTimestamps: Map<string, number> = new Map();

/**
 * Heartbeat metrics
 */
interface HeartbeatMetrics {
  totalPingsSent: number;
  totalPongsReceived: number;
  totalTimeouts: number;
  lastHeartbeatAt: Date | null;
}

const metrics: HeartbeatMetrics = {
  totalPingsSent: 0,
  totalPongsReceived: 0,
  totalTimeouts: 0,
  lastHeartbeatAt: null,
};

/**
 * Starts the heartbeat system
 *
 * Sends ping messages to all connected clients at regular intervals.
 * Connections that don't respond with pong are marked as dead and removed.
 *
 * @example
 * ```typescript
 * startHeartbeat();
 * // Later, when shutting down:
 * stopHeartbeat();
 * ```
 */
export function startHeartbeat(): void {
  if (heartbeatInterval) {
    logger.warn('Heartbeat already running');
    return;
  }

  heartbeatInterval = setInterval(() => {
    const manager = ConnectionManager.getInstance();
    const connections = manager.getAllConnections();
    metrics.lastHeartbeatAt = new Date();

    for (const [id, connection] of connections) {
      // If connection didn't respond to last ping, remove it
      if (!connection.isAlive) {
        logger.warn('Connection timed out', { connectionId: id });
        manager.removeConnection(id);
        metrics.totalTimeouts++;
        pingTimestamps.delete(id);
        continue;
      }

      // Mark as dead until we receive pong
      manager.markDead(id);

      // Send ping
      if (connection.ws.readyState === WebSocket.OPEN) {
        try {
          pingTimestamps.set(id, Date.now());
          connection.ws.ping();
          metrics.totalPingsSent++;
        } catch (error) {
          logger.error('Failed to send ping', { connectionId: id, error });
        }
      }
    }
  }, HEARTBEAT_INTERVAL);

  logger.info('Heartbeat started', { interval: HEARTBEAT_INTERVAL, pongTimeout: PONG_TIMEOUT });
}

/**
 * Stops the heartbeat system
 *
 * Clears the heartbeat interval and cleans up resources.
 */
export function stopHeartbeat(): void {
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
    heartbeatInterval = null;
    pingTimestamps.clear();
    logger.info('Heartbeat stopped');
  }
}

/**
 * Handles pong response from a client
 *
 * Should be called when a pong is received from a WebSocket connection.
 * Updates the connection's alive status and calculates latency.
 *
 * @param connectionId - The connection ID that sent the pong
 */
export function handlePong(connectionId: string): void {
  const manager = ConnectionManager.getInstance();
  const pingTime = pingTimestamps.get(connectionId);
  let latency: number | undefined;

  if (pingTime) {
    latency = Date.now() - pingTime;
    pingTimestamps.delete(connectionId);
  }

  manager.markAlive(connectionId, latency);
  metrics.totalPongsReceived++;

  logger.debug('Pong received', { connectionId, latency });
}

/**
 * Checks if the heartbeat system is running
 *
 * @returns true if heartbeat is active
 */
export function isHeartbeatRunning(): boolean {
  return heartbeatInterval !== null;
}

/**
 * Gets the configured heartbeat interval
 *
 * @returns Heartbeat interval in milliseconds
 */
export function getHeartbeatInterval(): number {
  return HEARTBEAT_INTERVAL;
}

/**
 * Gets the configured pong timeout
 *
 * @returns Pong timeout in milliseconds
 */
export function getPongTimeout(): number {
  return PONG_TIMEOUT;
}

/**
 * Gets heartbeat metrics
 *
 * @returns Current heartbeat metrics
 */
export function getHeartbeatMetrics(): HeartbeatMetrics {
  return { ...metrics };
}

/**
 * Resets heartbeat metrics (for testing)
 */
export function resetHeartbeatMetrics(): void {
  metrics.totalPingsSent = 0;
  metrics.totalPongsReceived = 0;
  metrics.totalTimeouts = 0;
  metrics.lastHeartbeatAt = null;
}
