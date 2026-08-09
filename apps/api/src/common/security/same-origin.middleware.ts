import type { NextFunction, Request, Response } from 'express';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

const normalizeOrigin = (value: string): string | null => {
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
};

/**
 * CORS controls whether another origin can read a response, but does not stop a
 * browser from sending a state-changing request. Rejecting foreign Origin
 * headers adds CSRF protection to cookie-backed auth routes and future writes.
 * Requests without Origin remain available to non-browser API clients.
 */
export const createSameOriginMiddleware = (clientUrl: string) => {
  const allowedOrigin = normalizeOrigin(clientUrl);

  if (!allowedOrigin) {
    throw new Error('CLIENT_URL must contain a valid origin');
  }

  return (request: Request, response: Response, next: NextFunction): void => {
    const origin = request.get('origin');

    if (
      origin &&
      !SAFE_METHODS.has(request.method.toUpperCase()) &&
      normalizeOrigin(origin) !== allowedOrigin
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
};
