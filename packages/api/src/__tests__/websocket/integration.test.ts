/**
 * WebSocket Integration Tests
 *
 * End-to-end tests for WebSocket server functionality.
 *
 * @see Story 5.1 - WebSocket Server para Real-Time
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import Fastify, { FastifyInstance } from 'fastify';
import WebSocket from 'ws';
import { registerWebSocket } from '../../websocket/server';
import { ConnectionManager } from '../../websocket/connection-manager';
import { stopHeartbeat } from '../../websocket/heartbeat';
import { clearRateLimits } from '../../websocket/handlers';
import { WSEventType, WSClientMessage } from '../../websocket/types';
import { PipelineEventEmitter } from '../../websocket/pipeline-emitter';

describe('WebSocket Integration', () => {
  let fastify: FastifyInstance;
  let port: number;

  beforeAll(async () => {
    // Reset singletons before creating the server
    ConnectionManager.resetInstance();
    PipelineEventEmitter.resetInstance();
    clearRateLimits();

    fastify = Fastify({ logger: false });
    await registerWebSocket(fastify);
    await fastify.listen({ port: 0 });
    const address = fastify.server.address();
    port = typeof address === 'object' ? address!.port : 0;
  });

  afterAll(async () => {
    stopHeartbeat();
    await fastify.close();
  });

  beforeEach(() => {
    clearRateLimits();
  });

  describe('connection', () => {
    it('should accept WebSocket connection', async () => {
      const ws = new WebSocket(`ws://localhost:${port}/ws`);

      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          ws.close();
          reject(new Error('Connection timeout'));
        }, 5000);

        ws.on('open', () => {
          clearTimeout(timeout);
          ws.close();
          resolve();
        });
        ws.on('error', (err) => {
          clearTimeout(timeout);
          reject(err);
        });
      });
    });

    it('should send connected event on connection', async () => {
      const ws = new WebSocket(`ws://localhost:${port}/ws`);

      const message = await new Promise<{ type: string; payload: { connectionId: string } }>(
        (resolve, reject) => {
          const timeout = setTimeout(() => {
            ws.close();
            reject(new Error('Message timeout'));
          }, 5000);

          ws.on('message', (data) => {
            clearTimeout(timeout);
            resolve(JSON.parse(data.toString()));
            ws.close();
          });
          ws.on('error', (err) => {
            clearTimeout(timeout);
            reject(err);
          });
        }
      );

      expect(message.type).toBe(WSEventType.CONNECTED);
      expect(message.payload.connectionId).toBeDefined();
    });
  });

  describe('messaging', () => {
    it('should respond to manual ping', async () => {
      const ws = new WebSocket(`ws://localhost:${port}/ws`);

      const pongMessage = await new Promise<{ type: string; payload: { status: string } }>(
        (resolve, reject) => {
          const timeout = setTimeout(() => {
            ws.close();
            reject(new Error('Message timeout'));
          }, 5000);

          let messageCount = 0;

          ws.on('message', (data) => {
            messageCount++;
            const message = JSON.parse(data.toString());

            if (messageCount === 1) {
              // Connected event
              ws.send(JSON.stringify({ type: WSClientMessage.PING }));
            } else if (messageCount === 2) {
              // Pong response
              clearTimeout(timeout);
              resolve(message);
              ws.close();
            }
          });

          ws.on('error', (err) => {
            clearTimeout(timeout);
            reject(err);
          });
        }
      );

      expect(pongMessage.type).toBe(WSEventType.HEARTBEAT);
      expect(pongMessage.payload.status).toBe('pong');
    });

    it('should handle subscribe message', async () => {
      const ws = new WebSocket(`ws://localhost:${port}/ws`);

      const response = await new Promise<{
        type: string;
        payload: { subscriptions: { executionId: string } };
      }>((resolve, reject) => {
        const timeout = setTimeout(() => {
          ws.close();
          reject(new Error('Message timeout'));
        }, 5000);

        let messageCount = 0;

        ws.on('message', (data) => {
          messageCount++;
          const message = JSON.parse(data.toString());

          if (messageCount === 1) {
            // Connected event
            ws.send(
              JSON.stringify({
                type: WSClientMessage.SUBSCRIBE,
                payload: { executionId: 'exec-123' },
              })
            );
          } else if (messageCount === 2) {
            // Subscribe response
            clearTimeout(timeout);
            resolve(message);
            ws.close();
          }
        });

        ws.on('error', (err) => {
          clearTimeout(timeout);
          reject(err);
        });
      });

      expect(response.type).toBe(WSEventType.HEARTBEAT);
      expect(response.payload.subscriptions?.executionId).toBe('exec-123');
    });

    it('should handle get_status message', async () => {
      const ws = new WebSocket(`ws://localhost:${port}/ws`);

      const response = await new Promise<{
        type: string;
        payload: { status: string; connectionId: string; totalConnections: number };
      }>((resolve, reject) => {
        const timeout = setTimeout(() => {
          ws.close();
          reject(new Error('Message timeout'));
        }, 5000);

        let messageCount = 0;

        ws.on('message', (data) => {
          messageCount++;
          const message = JSON.parse(data.toString());

          if (messageCount === 1) {
            // Connected event
            ws.send(JSON.stringify({ type: WSClientMessage.GET_STATUS }));
          } else if (messageCount === 2) {
            // Status response
            clearTimeout(timeout);
            resolve(message);
            ws.close();
          }
        });

        ws.on('error', (err) => {
          clearTimeout(timeout);
          reject(err);
        });
      });

      expect(response.type).toBe(WSEventType.HEARTBEAT);
      expect(response.payload.status).toBe('connected');
      expect(response.payload.connectionId).toBeDefined();
      expect(response.payload.totalConnections).toBeGreaterThanOrEqual(1);
    });

    it('should handle invalid message format', async () => {
      const ws = new WebSocket(`ws://localhost:${port}/ws`);

      const response = await new Promise<{ type: string; payload: { error: string } }>(
        (resolve, reject) => {
          const timeout = setTimeout(() => {
            ws.close();
            reject(new Error('Message timeout'));
          }, 5000);

          let messageCount = 0;

          ws.on('message', (data) => {
            messageCount++;
            const message = JSON.parse(data.toString());

            if (messageCount === 1) {
              // Connected event - send invalid JSON
              ws.send('not json');
            } else if (messageCount === 2) {
              // Error response
              clearTimeout(timeout);
              resolve(message);
              ws.close();
            }
          });

          ws.on('error', (err) => {
            clearTimeout(timeout);
            reject(err);
          });
        }
      );

      expect(response.type).toBe(WSEventType.ERROR);
      expect(response.payload.error).toBeDefined();
    });

    it('should handle invalid message type', async () => {
      const ws = new WebSocket(`ws://localhost:${port}/ws`);

      const response = await new Promise<{ type: string; payload: { error: string } }>(
        (resolve, reject) => {
          const timeout = setTimeout(() => {
            ws.close();
            reject(new Error('Message timeout'));
          }, 5000);

          let messageCount = 0;

          ws.on('message', (data) => {
            messageCount++;
            const message = JSON.parse(data.toString());

            if (messageCount === 1) {
              // Connected event - send invalid type
              ws.send(JSON.stringify({ type: 'invalid_type' }));
            } else if (messageCount === 2) {
              // Error response
              clearTimeout(timeout);
              resolve(message);
              ws.close();
            }
          });

          ws.on('error', (err) => {
            clearTimeout(timeout);
            reject(err);
          });
        }
      );

      expect(response.type).toBe(WSEventType.ERROR);
      expect(response.payload.error).toContain('Invalid message format');
    });
  });

  describe('broadcast', () => {
    it('should receive broadcast events', async () => {
      const ws = new WebSocket(`ws://localhost:${port}/ws`);

      const broadcastMessage = await new Promise<{
        type: string;
        payload: { executionId: string };
      }>((resolve, reject) => {
        const timeout = setTimeout(() => {
          ws.close();
          reject(new Error('Message timeout'));
        }, 5000);

        let messageCount = 0;

        ws.on('message', (data) => {
          messageCount++;
          const message = JSON.parse(data.toString());

          if (messageCount === 1) {
            // Connected event - broadcast a pipeline event
            const emitter = PipelineEventEmitter.getInstance();
            emitter.emitPipelineStart('exec-test', {
              numPosts: 3,
              platforms: ['instagram'],
              includeVisual: true,
              qualityThreshold: 6.0,
            });
          } else if (messageCount === 2) {
            // Broadcast message
            clearTimeout(timeout);
            resolve(message);
            ws.close();
          }
        });

        ws.on('error', (err) => {
          clearTimeout(timeout);
          reject(err);
        });
      });

      expect(broadcastMessage.type).toBe(WSEventType.PIPELINE_START);
      expect(broadcastMessage.payload.executionId).toBe('exec-test');
    });
  });

  describe('multiple connections', () => {
    it('should handle multiple simultaneous connections', async () => {
      const connections: WebSocket[] = [];
      const connectedPromises: Promise<void>[] = [];

      // Create 3 connections
      for (let i = 0; i < 3; i++) {
        const ws = new WebSocket(`ws://localhost:${port}/ws`);
        connections.push(ws);

        connectedPromises.push(
          new Promise<void>((resolve, reject) => {
            const timeout = setTimeout(() => {
              reject(new Error('Connection timeout'));
            }, 5000);

            ws.on('open', () => {
              clearTimeout(timeout);
              resolve();
            });
            ws.on('error', (err) => {
              clearTimeout(timeout);
              reject(err);
            });
          })
        );
      }

      await Promise.all(connectedPromises);

      expect(ConnectionManager.getInstance().getConnectionCount()).toBeGreaterThanOrEqual(3);

      // Close all connections
      for (const ws of connections) {
        ws.close();
      }

      // Wait for cleanup
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    it('should broadcast to all connections', async () => {
      const connections: WebSocket[] = [];
      const receivedMessages: Map<number, unknown[]> = new Map();
      const connectedPromises: Promise<void>[] = [];

      // Create 2 connections
      for (let i = 0; i < 2; i++) {
        const ws = new WebSocket(`ws://localhost:${port}/ws`);
        connections.push(ws);
        receivedMessages.set(i, []);

        const idx = i;
        ws.on('message', (data) => {
          receivedMessages.get(idx)?.push(JSON.parse(data.toString()));
        });

        connectedPromises.push(
          new Promise<void>((resolve, reject) => {
            const timeout = setTimeout(() => {
              reject(new Error('Connection timeout'));
            }, 5000);

            ws.on('open', () => {
              clearTimeout(timeout);
              resolve();
            });
            ws.on('error', (err) => {
              clearTimeout(timeout);
              reject(err);
            });
          })
        );
      }

      // Wait for all to connect
      await Promise.all(connectedPromises);
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Broadcast a message
      const emitter = PipelineEventEmitter.getInstance();
      emitter.emitAgentStart('exec-broadcast-multi', 'researcher', 'Pesquisador');

      // Wait for messages
      await new Promise((resolve) => setTimeout(resolve, 200));

      // Each connection should have received connected + broadcast
      for (let i = 0; i < 2; i++) {
        const messages = receivedMessages.get(i) || [];
        expect(messages.length).toBeGreaterThanOrEqual(2); // connected + broadcast
      }

      // Close all connections
      for (const ws of connections) {
        ws.close();
      }
    });
  });
});
