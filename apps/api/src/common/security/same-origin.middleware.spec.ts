import type { NextFunction, Request, Response } from 'express';
import { createSameOriginMiddleware } from './same-origin.middleware';

describe('createSameOriginMiddleware', () => {
  const middleware = createSameOriginMiddleware('https://app.example.com');

  const run = (method: string, origin?: string) => {
    const request = {
      method,
      originalUrl: '/api/v1/auth/refresh',
      get: jest.fn().mockReturnValue(origin),
    } as unknown as Request;
    const json = jest.fn();
    const status = jest.fn().mockReturnValue({ json });
    const response = { status } as unknown as Response;
    const next = jest.fn() as NextFunction;

    middleware(request, response, next);
    return { status, json, next };
  };

  it('allows state changes from the configured frontend origin', () => {
    const result = run('POST', 'https://app.example.com');

    expect(result.next).toHaveBeenCalledTimes(1);
    expect(result.status).not.toHaveBeenCalled();
  });

  it('rejects state changes from a foreign or opaque origin', () => {
    for (const origin of ['https://evil.example', 'null']) {
      const result = run('POST', origin);
      expect(result.next).not.toHaveBeenCalled();
      expect(result.status).toHaveBeenCalledWith(403);
    }
  });

  it('allows safe requests and non-browser API clients', () => {
    expect(run('GET', 'https://evil.example').next).toHaveBeenCalledTimes(1);
    expect(run('POST').next).toHaveBeenCalledTimes(1);
  });
});
