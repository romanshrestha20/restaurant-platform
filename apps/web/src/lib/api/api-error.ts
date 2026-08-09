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
