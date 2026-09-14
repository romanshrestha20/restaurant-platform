export interface ApiErrorResponse {
  statusCode: number;
  message: string | string[];
  error: string;
  details?: Record<string, unknown>;
  path?: string;
  timestamp?: string;
}

const CUSTOMER_NETWORK_MESSAGE = 'Unable to connect to the restaurant service.';
const CUSTOMER_UNKNOWN_MESSAGE = 'Something went wrong. Please try again.';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const isApiErrorResponse = (value: unknown): value is ApiErrorResponse =>
  isRecord(value) &&
  typeof value.statusCode === 'number' &&
  (typeof value.message === 'string' ||
    (Array.isArray(value.message) && value.message.every((item) => typeof item === 'string'))) &&
  typeof value.error === 'string';

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
    const axiosError = error as {
      response?: { data?: unknown; status?: number; statusText?: string };
      request?: unknown;
    };
    if (!axiosError.response && axiosError.request) {
      return new ApiError({
        statusCode: 0,
        message: CUSTOMER_NETWORK_MESSAGE,
        error: 'NetworkError',
      });
    }
    if (isApiErrorResponse(axiosError.response?.data)) {
      return new ApiError(axiosError.response.data);
    }
    return new ApiError({
      statusCode: axiosError.response?.status ?? 500,
      message: 'The restaurant service returned an invalid error response.',
      error: 'ApiError',
    });
  }

  if (
    typeof error === 'object' &&
    error !== null &&
    'request' in error &&
    !('response' in error)
  ) {
    return new ApiError({
      statusCode: 0,
      message: CUSTOMER_NETWORK_MESSAGE,
      error: 'NetworkError',
    });
  }

  if (error instanceof Error) {
    return new ApiError({
      statusCode: 500,
      message: CUSTOMER_UNKNOWN_MESSAGE,
      error: 'InternalError',
    });
  }

  return new ApiError({
    statusCode: 500,
    message: CUSTOMER_UNKNOWN_MESSAGE,
    error: 'UnknownError',
  });
}
