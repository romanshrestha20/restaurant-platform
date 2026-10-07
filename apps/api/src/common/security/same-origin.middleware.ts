import type { NextFunction, Request, Response } from 'express';
import type { OriginPolicy } from './origin-policy';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

/**
 * CORS controls whether another origin can read a response, but does not stop a
 * browser from sending a state-changing request. Rejecting foreign Origin
 * headers adds CSRF protection to cookie-backed auth routes and future writes.
 * Requests without Origin remain available to non-browser API clients.
 */
export const createSameOriginMiddleware =
  (isAllowedOrigin: OriginPolicy) =>
  (request: Request, response: Response, next: NextFunction): void => {
    const origin = request.get('origin');

    if (
      origin &&
      !SAFE_METHODS.has(request.method.toUpperCase()) &&
      !isAllowedOrigin(origin)
    ) {
      response.status(403).json({
        statusCode: 403,
        message: 'Cross-origin request rejected',
        error: 'Forbidden',
        path: request.originalUrl,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    next();
  };
