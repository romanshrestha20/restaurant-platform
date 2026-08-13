import { randomUUID } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';

const REQUEST_ID_HEADER = 'x-request-id';

export function requestIdMiddleware(
  request: Request,
  response: Response,
  next: NextFunction,
): void {
  const candidate = request.header(REQUEST_ID_HEADER)?.trim();
  const requestId =
    candidate && candidate.length <= 128 ? candidate : randomUUID();
  request.headers[REQUEST_ID_HEADER] = requestId;
  response.setHeader(REQUEST_ID_HEADER, requestId);
  next();
}
