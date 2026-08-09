type ApiErrorBody = {
  message?: string | string[];
  error?: string;
};

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly messages: string[],
  ) {
    super(messages[0] ?? 'Request failed');
    this.name = 'ApiError';
  }
}

export type ApiErrorFeedback = {
  title: string;
  description?: string;
};

export function getApiErrorFeedback(
  error: unknown,
  fallback: string,
): ApiErrorFeedback | null {
  if (!(error instanceof ApiError)) return { title: fallback };

  // Authentication recovery and validation feedback are handled by the API
  // client and forms respectively, so neither should create a toast here.
  if ([400, 401, 409, 422].includes(error.status)) return null;
  if (error.status === 403) return { title: 'Access denied' };
  if (error.status === 0) {
    return {
      title: 'Connection unavailable',
      description: 'Check your connection and try again.',
    };
  }
  if (error.status >= 500) {
    return {
      title: 'Something went wrong',
      description: 'Please try again in a moment.',
    };
  }

  return { title: fallback };
}

export async function createApiError(response: Response) {
  const fallback = `Request failed with status ${response.status}`;

  try {
    const body = (await response.json()) as ApiErrorBody;
    const messages = Array.isArray(body.message)
      ? body.message
      : [body.message ?? body.error ?? fallback];
    return new ApiError(response.status, messages);
  } catch {
    return new ApiError(response.status, [fallback]);
  }
}
