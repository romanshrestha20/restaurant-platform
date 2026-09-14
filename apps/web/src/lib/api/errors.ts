export interface ApiErrorResponse {
  statusCode: number;
  message: string | string[];
  error: string;
  details?: Record<string, unknown>;
  path?: string;
  timestamp?: string;
}

export class ApiError extends Error {
  readonly statusCode: number;
  readonly error: string;
  readonly details?: Record<string, unknown>;
  readonly messages: string[];

  constructor(payload: ApiErrorResponse) {
    const formattedMessage = Array.isArray(payload.message)
      ? payload.message.join(', ')
      : payload.message || 'An unexpected error occurred';
    super(formattedMessage);
    this.name = 'ApiError';
    this.statusCode = payload.statusCode;
    this.error = payload.error;
    this.details = payload.details;
    this.messages = Array.isArray(payload.message) ? payload.message : [payload.message];
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

export function normalizeError(error: unknown): ApiError {
  if (isApiError(error)) {
    return error;
  }

  if (typeof error === 'object' && error !== null && 'response' in error) {
    const axiosError = error as { response?: { data?: ApiErrorResponse; status?: number; statusText?: string } };
    if (axiosError.response?.data) {
      return new ApiError(axiosError.response.data);
    }
    return new ApiError({
      statusCode: axiosError.response?.status ?? 500,
      message: axiosError.response?.statusText ?? 'Network error',
      error: 'NetworkError',
    });
  }

  if (error instanceof Error) {
    return new ApiError({
      statusCode: 500,
      message: error.message,
      error: error.name,
    });
  }

  return new ApiError({
    statusCode: 500,
    message: 'An unknown error occurred',
    error: 'UnknownError',
  });
}
