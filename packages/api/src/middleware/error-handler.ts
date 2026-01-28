import { FastifyError, FastifyReply, FastifyRequest } from 'fastify';

export interface ApiError {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
    timestamp: string;
    requestId?: string;
  };
}

export function errorHandler(
  error: FastifyError,
  request: FastifyRequest,
  reply: FastifyReply
): void {
  const timestamp = new Date().toISOString();
  const requestId = request.id;

  // Log error
  request.log.error({ err: error, requestId }, 'Request error');

  // Determine status code
  const statusCode = error.statusCode || 500;

  // Build response
  const response: ApiError = {
    error: {
      code: error.code || 'INTERNAL_ERROR',
      message: error.message || 'An unexpected error occurred',
      details: error.validation ? { validation: error.validation } : undefined,
      timestamp,
      requestId,
    },
  };

  reply.status(statusCode).send(response);
}
