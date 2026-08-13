import { ApiError, createApiError } from './api-error';

type AuthHandlers = {
  getAccessToken: () => string | null;
  refreshSession: () => Promise<void>;
  onUnauthorized: () => void;
};

type RequestOptions = RequestInit & {
  skipAuthRefresh?: boolean;
};

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
    const { skipAuthRefresh = false, ...init } = options;
    const headers = new Headers(init.headers);
    const token = this.authHandlers.getAccessToken();

    if (init.body && !(init.body instanceof FormData)) {
      headers.set('Content-Type', 'application/json');
    }
    if (token) headers.set('Authorization', `Bearer ${token}`);

    let response: Response;
    try {
      response = await fetch(`${API_URL}${path}`, {
        ...init,
        headers,
        credentials: 'include',
      });
    } catch {
      throw new ApiError(0, [
        'Unable to reach the server. Check your connection and try again.',
      ]);
    }

    if (response.status === 401 && !skipAuthRefresh) {
      try {
        await this.authHandlers.refreshSession();
        return this.request<T>(path, { ...init, skipAuthRefresh: true });
      } catch {
        this.authHandlers.onUnauthorized();
        throw new ApiError(401, [
          'Your session has expired. Please sign in again.',
        ]);
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
