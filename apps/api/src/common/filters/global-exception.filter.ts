import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';

type ErrorMessage = string | string[];

type ErrorDetails = {
  statusCode: number;
  message: ErrorMessage;
  error: string;
  details?: Record<string, unknown>;
};

export type ApiErrorResponse = ErrorDetails & {
  path: string;
  timestamp: string;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const getPrismaErrorCode = (exception: unknown): string | undefined => {
  if (!isRecord(exception) || typeof exception.code !== 'string') {
    return undefined;
  }

  return /^P\d{4}$/.test(exception.code) ? exception.code : undefined;
};

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const http = host.switchToHttp();
    const request = http.getRequest<Request>();
    const response = http.getResponse<Response>();
    const details = this.getErrorDetails(exception);

    if (details.statusCode >= 500) {
      const stack = exception instanceof Error ? exception.stack : undefined;
      this.logger.error(
        `${request.method} ${request.originalUrl} failed`,
        stack,
      );
    }

    const body: ApiErrorResponse = {
      ...details,
      path: request.originalUrl,
      timestamp: new Date().toISOString(),
    };

    response.status(details.statusCode).json(body);
  }

  private getErrorDetails(exception: unknown): ErrorDetails {
    if (exception instanceof HttpException) {
      return this.fromHttpException(exception);
    }

    const prismaCode = getPrismaErrorCode(exception);
    if (prismaCode) {
      return this.fromPrismaError(prismaCode);
    }

    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'An unexpected error occurred',
      error: 'Internal Server Error',
    };
  }

  private fromHttpException(exception: HttpException): ErrorDetails {
    const statusCode = exception.getStatus();
    const response = exception.getResponse();

    if (typeof response === 'string') {
      return {
        statusCode,
        message: response,
        error: exception.name.replace(/Exception$/, ''),
      };
    }

    const responseBody = isRecord(response) ? response : {};
    const message = this.getMessage(responseBody.message, exception.message);
    const error =
      typeof responseBody.error === 'string'
        ? responseBody.error
        : exception.name.replace(/Exception$/, '');
    const details = isRecord(responseBody.details)
      ? responseBody.details
      : undefined;

    return {
      statusCode,
      message,
      error,
      ...(details ? { details } : {}),
    };
  }

  private fromPrismaError(code: string): ErrorDetails {
    switch (code) {
      case 'P2002':
        return {
          statusCode: HttpStatus.CONFLICT,
          message: 'A resource with these details already exists',
          error: 'Conflict',
        };
      case 'P2025':
        return {
          statusCode: HttpStatus.NOT_FOUND,
          message: 'The requested resource was not found',
          error: 'Not Found',
        };
      case 'P2003':
        return {
          statusCode: HttpStatus.CONFLICT,
          message: 'This operation conflicts with a related resource',
          error: 'Conflict',
        };
      default:
        return {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'A database operation failed',
          error: 'Internal Server Error',
        };
    }
  }

  private getMessage(value: unknown, fallback: string): ErrorMessage {
    if (typeof value === 'string') {
      return value;
    }

    if (
      Array.isArray(value) &&
      value.every((item) => typeof item === 'string')
    ) {
      return value;
    }

    return fallback;
  }
}
