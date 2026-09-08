import { randomUUID } from 'node:crypto';
import type { ErrorRequestHandler, RequestHandler } from 'express';
import type { Logger } from 'pino';
export const requestId: RequestHandler = (_request, response, next) => {
  response.locals.requestId = randomUUID();
  response.setHeader('X-Request-ID', response.locals.requestId);
  next();
};
export function errorHandler(logger: Logger): ErrorRequestHandler {
  return (error, request, response, _next) => {
    const tooLarge = error?.type === 'entity.too.large';
    const malformed = error?.type === 'entity.parse.failed';
    const status = tooLarge ? 413 : malformed ? 400 : 500;
    const details = process.env.NODE_ENV === 'development' && error instanceof Error
      ? { name: error.name, message: error.message, stack: error.stack } : undefined;
    logger.error({ requestId: response.locals.requestId, code: status, method: request.method, path: request.path,
      ...(details ? { error: details } : {}) }, 'Request failed');
    response.status(status).json({ error: {
      code: tooLarge ? 'REQUEST_TOO_LARGE' : malformed ? 'INVALID_JSON' : 'INTERNAL_ERROR',
      message: tooLarge ? 'Request exceeds configured body limit.' : malformed ? 'Request body must be valid JSON.' : 'The request could not be completed.',
      request_id: response.locals.requestId, retryable: status === 500,
    } });
  };
}
