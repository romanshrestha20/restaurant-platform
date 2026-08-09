import {
  ArgumentsHost,
  BadRequestException,
  HttpStatus,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { GlobalExceptionFilter } from './global-exception.filter';

describe('GlobalExceptionFilter', () => {
  const createHost = () => {
    const response = {
      status: jest.fn(),
      json: jest.fn(),
    };
    response.status.mockReturnValue(response);

    const host = {
      switchToHttp: () => ({
        getRequest: () => ({ method: 'POST', originalUrl: '/api/v1/test' }),
        getResponse: () => response,
      }),
    } as unknown as ArgumentsHost;

    return { host, response };
  };

  beforeEach(() => {
    jest.restoreAllMocks();
  });

  it('preserves validation message arrays', () => {
    const { host, response } = createHost();
    const filter = new GlobalExceptionFilter();

    filter.catch(
      new BadRequestException({
        message: ['email must be an email', 'password is too short'],
        error: 'Bad Request',
      }),
      host,
    );

    expect(response.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(response.json).toHaveBeenCalledWith({
      statusCode: HttpStatus.BAD_REQUEST,
      message: ['email must be an email', 'password is too short'],
      error: 'Bad Request',
      path: '/api/v1/test',
      timestamp: expect.any(String),
    });
  });

  it('standardizes unauthorized responses', () => {
    const { host, response } = createHost();
    const filter = new GlobalExceptionFilter();

    filter.catch(new UnauthorizedException(), host);

    expect(response.status).toHaveBeenCalledWith(HttpStatus.UNAUTHORIZED);
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.UNAUTHORIZED,
        message: 'Unauthorized',
        error: 'Unauthorized',
      }),
    );
  });

  it('maps Prisma unique-constraint errors to conflict', () => {
    const { host, response } = createHost();
    const filter = new GlobalExceptionFilter();

    filter.catch({ code: 'P2002' }, host);

    expect(response.status).toHaveBeenCalledWith(HttpStatus.CONFLICT);
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.CONFLICT,
        error: 'Conflict',
      }),
    );
  });

  it('logs unexpected errors without exposing their details', () => {
    const { host, response } = createHost();
    const logger = jest.spyOn(Logger.prototype, 'error').mockImplementation();
    const filter = new GlobalExceptionFilter();

    filter.catch(new Error('database password was exposed'), host);

    expect(logger).toHaveBeenCalled();
    expect(response.status).toHaveBeenCalledWith(
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'An unexpected error occurred',
        error: 'Internal Server Error',
      }),
    );
    expect(response.json).not.toHaveBeenCalledWith(
      expect.objectContaining({ message: 'database password was exposed' }),
    );
  });
});
