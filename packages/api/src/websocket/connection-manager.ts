/**
 * WebSocket Connection Manager
 *
 * Manages WebSocket connections using the Singleton pattern.
 * Provides methods for adding, removing, and broadcasting to connections.
 * Supports subscription-based filtering for targeted message delivery.
 *
 * @module websocket/connection-manager
 * @see Story 5.1 - WebSocket Server para Real-Time
 */

import { WebSocket } from 'ws';
import { createLogger } from '@social-content/shared';
import { WSEvent, ConnectionInfo, SubscribePayload } from './types';

const logger = createLogger('websocket:connection-manager');

/**
 * Internal representation of a managed connection
 */
interface ManagedConnection {
  /** The underlying WebSocket connection */
  ws: WebSocket;
  /** Unique connection identifier */
  id: string;
  /** When the connection was established */
  connectedAt: Date;
  /** Last time a pong was received */
  lastPing: Date;
  /** Current subscription filters */
  subscriptions: SubscribePayload;
  /** Whether the connection is considered alive */
  isAlive: boolean;
  /** Latency of last ping/pong in ms */
  latency: number;
}

/**
 * Singleton manager for WebSocket connections
 *
 * Handles:
 * - Adding and removing connections
 * - Broadcasting messages to all or filtered connections
 * - Tracking connection health (alive/dead)
 * - Subscription-based message filtering
 *
 * @example
 * ```typescript
 * const manager = ConnectionManager.getInstance();
 * manager.addConnection(ws, 'conn-123');
 * manager.broadcast({ type: WSEventType.PIPELINE_START, payload: {...}, timestamp: '...' });
 * ```
 */
export class ConnectionManager {
  private static instance: ConnectionManager | null = null;
  private connections: Map<string, ManagedConnection> = new Map();

  private constructor() {
    logger.debug('ConnectionManager initialized');
  }

  /**
   * Gets the singleton instance of ConnectionManager
   *
   * @returns The ConnectionManager instance
   */
  static getInstance(): ConnectionManager {
    if (!ConnectionManager.instance) {
      ConnectionManager.instance = new ConnectionManager();
    }
    return ConnectionManager.instance;
  }

  /**
   * Resets the singleton instance (for testing purposes)
   *
   * This method closes all connections and clears the instance.
   * Only use in test environments.
   */
  static resetInstance(): void {
    if (ConnectionManager.instance) {
      ConnectionManager.instance.closeAll();
      ConnectionManager.instance = null;
    }
  }

  /**
   * Adds a new WebSocket connection to management
   *
   * @param ws - The WebSocket connection
   * @param id - Unique identifier for this connection
   */
  addConnection(ws: WebSocket, id: string): void {
    const connection: ManagedConnection = {
      ws,
      id,
      connectedAt: new Date(),
      lastPing: new Date(),
      subscriptions: {},
      isAlive: true,
      latency: 0,
    };

    this.connections.set(id, connection);
    logger.info('Connection added', { connectionId: id, totalConnections: this.connections.size });
  }

  /**
   * Removes a connection from management
   *
   * @param id - The connection ID to remove
   */
  removeConnection(id: string): void {
    const connection = this.connections.get(id);
    if (connection) {
      if (connection.ws.readyState === WebSocket.OPEN) {
        connection.ws.close(1000, 'Connection removed');
      }
      this.connections.delete(id);
      logger.info('Connection removed', { connectionId: id, totalConnections: this.connections.size });
    }
  }

  /**
   * Gets a connection by ID
   *
   * @param id - The connection ID
   * @returns The managed connection or undefined
   */
  getConnection(id: string): ManagedConnection | undefined {
    return this.connections.get(id);
  }

  /**
   * Updates subscription filters for a connection
   *
   * @param id - The connection ID
   * @param subscriptions - New subscription filters
   */
  updateSubscriptions(id: string, subscriptions: SubscribePayload): void {
    const connection = this.connections.get(id);
    if (connection) {
      connection.subscriptions = { ...connection.subscriptions, ...subscriptions };
      logger.debug('Updated subscriptions', { connectionId: id, subscriptions: connection.subscriptions });
    }
  }

  /**
   * Clears all subscription filters for a connection
   *
   * @param id - The connection ID
   */
  clearSubscriptions(id: string): void {
    const connection = this.connections.get(id);
    if (connection) {
      connection.subscriptions = {};
      logger.debug('Cleared subscriptions', { connectionId: id });
    }
  }

  /**
   * Broadcasts an event to all connected clients that match subscription filters
   *
   * @param event - The event to broadcast
   */
  broadcast(event: WSEvent): void {
    const message = JSON.stringify(event);
    let sentCount = 0;

    for (const connection of this.connections.values()) {
      if (connection.ws.readyState === WebSocket.OPEN) {
        if (this.shouldReceive(connection, event)) {
          try {
            connection.ws.send(message);
            sentCount++;
          } catch (error) {
            logger.error('Failed to send message', { connectionId: connection.id, error });
          }
        }
      }
    }

    logger.debug('Broadcast completed', { eventType: event.type, sentCount, totalConnections: this.connections.size });
  }

  /**
   * Sends an event to a specific connection
   *
   * @param id - The connection ID
   * @param event - The event to send
   * @returns true if sent successfully, false otherwise
   */
  sendTo(id: string, event: WSEvent): boolean {
    const connection = this.connections.get(id);
    if (connection && connection.ws.readyState === WebSocket.OPEN) {
      try {
        connection.ws.send(JSON.stringify(event));
        return true;
      } catch (error) {
        logger.error('Failed to send message', { connectionId: id, error });
        return false;
      }
    }
    return false;
  }

  /**
   * Gets information about all connections
   *
   * @returns Array of connection information
   */
  getConnections(): ConnectionInfo[] {
    return Array.from(this.connections.values()).map((conn) => ({
      id: conn.id,
      connectedAt: conn.connectedAt.toISOString(),
      lastPing: conn.lastPing.toISOString(),
      subscriptions: conn.subscriptions,
      isAlive: conn.isAlive,
    }));
  }

  /**
   * Gets the number of active connections
   *
   * @returns The connection count
   */
  getConnectionCount(): number {
    return this.connections.size;
  }

  /**
   * Gets all connections (for internal use, e.g., heartbeat)
   *
   * @returns Map of all managed connections
   */
  getAllConnections(): Map<string, ManagedConnection> {
    return this.connections;
  }

  /**
   * Marks a connection as alive (received pong)
   *
   * @param id - The connection ID
   * @param latency - Optional latency measurement in ms
   */
  markAlive(id: string, latency?: number): void {
    const connection = this.connections.get(id);
    if (connection) {
      connection.isAlive = true;
      connection.lastPing = new Date();
      if (latency !== undefined) {
        connection.latency = latency;
      }
    }
  }

  /**
   * Marks a connection as dead (no pong received)
   *
   * @param id - The connection ID
   */
  markDead(id: string): void {
    const connection = this.connections.get(id);
    if (connection) {
      connection.isAlive = false;
    }
  }

  /**
   * Gets the latency for a connection
   *
   * @param id - The connection ID
   * @returns Latency in ms or undefined
   */
  getLatency(id: string): number | undefined {
    return this.connections.get(id)?.latency;
  }

  /**
   * Removes dead connections
   *
   * @returns Number of connections removed
   */
  cleanupDeadConnections(): number {
    let removedCount = 0;
    for (const [id, connection] of this.connections) {
      if (!connection.isAlive) {
        logger.warn('Removing dead connection', { connectionId: id });
        this.removeConnection(id);
        removedCount++;
      }
    }
    return removedCount;
  }

  /**
   * Closes all connections
   */
  closeAll(): void {
    for (const connection of this.connections.values()) {
      if (connection && connection.ws && connection.ws.readyState === WebSocket.OPEN) {
        try {
          connection.ws.close(1000, 'Server shutdown');
        } catch {
          // Ignore close errors
        }
      }
    }
    this.connections.clear();
    logger.info('All connections closed');
  }

  /**
   * Checks if a connection should receive an event based on its subscriptions
   *
   * @param connection - The connection to check
   * @param event - The event to check against
   * @returns true if the connection should receive the event
   */
  private shouldReceive(connection: ManagedConnection, event: WSEvent): boolean {
    const { subscriptions } = connection;

    // If no filters, receive everything
    if (!subscriptions.executionId && (!subscriptions.events || subscriptions.events.length === 0)) {
      return true;
    }

    // Filter by execution ID
    if (subscriptions.executionId && event.executionId) {
      if (subscriptions.executionId !== event.executionId) {
        return false;
      }
    }

    // Filter by event type
    if (subscriptions.events && subscriptions.events.length > 0) {
      if (!subscriptions.events.includes(event.type)) {
        return false;
      }
    }

    return true;
  }
}

/**
 * Gets the ConnectionManager singleton instance
 *
 * @returns The ConnectionManager instance
 */
export function getConnectionManager(): ConnectionManager {
  return ConnectionManager.getInstance();
}
