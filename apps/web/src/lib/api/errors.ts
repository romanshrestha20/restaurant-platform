import { AxiosError } from "axios";

export type ApiError = {
  status: number;
  message: string;
  details?: unknown;
};

export function toApiError(error: unknown): ApiError {
  if (error instanceof AxiosError) {
    const payload = error.response?.data as { message?: string } | undefined;
    return {
      status: error.response?.status ?? 0,
      message: payload?.message ?? error.message,
      details: error.response?.data,
    };
  }

  return { status: 0, message: error instanceof Error ? error.message : "Request failed" };
}
