import { ApiError, createApiError } from './api-error';

type AuthHandlers = {
  getAccessToken: () => string | null;
  refreshSession: () => Promise<void>;
  onUnauthorized: () => void;
};

type RequestOptions = RequestInit & {
  skipAuthRefresh?: boolean;
  timeoutMs?: number;
  requestId?: string;
};

const DEFAULT_TIMEOUT_MS = 15_000;

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';

class ApiClient {
  private authHandlers: AuthHandlers = {
    getAccessToken: () => null,
    refreshSession: async () => undefined,
    onUnauthorized: () => undefined,
  };

  configureAuth(handlers: AuthHandlers) {
    this.authHandlers = handlers;
  }

  async request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const {
      requestId = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}`,
      skipAuthRefresh = false,
      timeoutMs = DEFAULT_TIMEOUT_MS,
      ...init
    } = options;
    const headers = new Headers(init.headers);
    const token = this.authHandlers.getAccessToken();

    if (init.body && !(init.body instanceof FormData)) {
      headers.set('Content-Type', 'application/json');
    }
    if (token) headers.set('Authorization', `Bearer ${token}`);
    headers.set('X-Request-ID', requestId);

    const controller = new AbortController();
    const abortFromCaller = () => controller.abort(init.signal?.reason);
    if (init.signal?.aborted) abortFromCaller();
    else init.signal?.addEventListener('abort', abortFromCaller, { once: true });
    const timeout = setTimeout(() => controller.abort('timeout'), timeoutMs);

    let response: Response;
    try {
      response = await fetch(`${API_URL}${path}`, {
        ...init,
        headers,
        credentials: 'include',
        signal: controller.signal,
      });
    } catch (error) {
      const timedOut = controller.signal.reason === 'timeout';
      throw new ApiError(
        0,
        [
          timedOut
            ? 'The request timed out. Please try again.'
            : 'Unable to reach the server. Check your connection and try again.',
        ],
        requestId,
      );
    } finally {
      clearTimeout(timeout);
      init.signal?.removeEventListener('abort', abortFromCaller);
    }

    if (response.status === 401 && !skipAuthRefresh) {
      try {
        await this.authHandlers.refreshSession();
        return this.request<T>(path, {
          ...init,
          requestId,
          skipAuthRefresh: true,
        });
      } catch {
        this.authHandlers.onUnauthorized();
        throw new ApiError(
          401,
          ['Your session has expired. Please sign in again.'],
          requestId,
        );
      }
    }

    if (response.status === 401) {
      this.authHandlers.onUnauthorized();
    }

    if (!response.ok) throw await createApiError(response);
    if (response.status === 204) return undefined as T;
    return response.json() as Promise<T>;
  }

  get<T>(path: string, options?: RequestOptions) {
    return this.request<T>(path, { ...options, method: 'GET' });
  }

  post<T>(path: string, body?: unknown, options?: RequestOptions) {
    return this.request<T>(path, {
      ...options,
      method: 'POST',
      ...(body !== undefined
        ? { body: body instanceof FormData ? body : JSON.stringify(body) }
        : {}),
    });
  }

  patch<T>(path: string, body?: unknown, options?: RequestOptions) {
    return this.request<T>(path, {
      ...options,
      method: 'PATCH',
      ...(body !== undefined
        ? { body: body instanceof FormData ? body : JSON.stringify(body) }
        : {}),
    });
  }

  put<T>(path: string, body?: unknown, options?: RequestOptions) {
    return this.request<T>(path, {
      ...options,
      method: 'PUT',
      ...(body !== undefined
        ? { body: body instanceof FormData ? body : JSON.stringify(body) }
        : {}),
    });
  }

  delete<T>(path: string, options?: RequestOptions) {
    return this.request<T>(path, { ...options, method: 'DELETE' });
  }
}

export const apiClient = new ApiClient();
