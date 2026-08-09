import {
  ConflictException,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common';
import { compare, hash } from 'bcrypt';
import { createHash } from 'node:crypto';
import { AuthRepository } from '../repositories/auth.repository';
import { CreateUserData } from '../types/create-user.type';
import { AuthService } from './auth.service';
import { AuthTokenService } from './auth-token.service';
import { PasswordService } from './password.service';

const passwordService = new PasswordService();

const hashToken = (token: string) =>
  createHash('sha256').update(token).digest('hex');

const createTokenService = () => ({
  createSessionId: jest.fn().mockReturnValue('session-1'),
  signAccessToken: jest.fn().mockResolvedValue('access-token'),
  signRefreshToken: jest.fn().mockResolvedValue('refresh-token'),
  hashRefreshToken: jest.fn((token: string) => hashToken(token)),
  refreshTokenMatches: jest.fn(
    (token: string, storedHash: string) => hashToken(token) === storedHash,
  ),
  getRefreshExpiration: jest
    .fn()
    .mockReturnValue(new Date('2026-09-06T00:00:00.000Z')),
});

const safeUser = {
  id: 'user-1',
  email: 'customer@example.com',
  phone: '+358401234567',
  emailVerified: true,
  phoneVerified: false,
  isActive: true,
  createdAt: new Date('2026-08-07T00:00:00.000Z'),
  profile: { firstName: 'Test', lastName: 'Customer' },
  roles: [{ role: { name: 'CUSTOMER' } }],
};

describe('AuthService registration', () => {
  const createRepository = () => ({
    findUserByEmail: jest.fn(),
    createUser: jest.fn<Promise<typeof safeUser>, [CreateUserData]>(),
    createSession: jest.fn().mockResolvedValue(undefined),
  });

  it('normalizes input, hashes the password, and creates a session', async () => {
    const repository = createRepository();
    repository.findUserByEmail.mockResolvedValue(null);
    repository.createUser.mockResolvedValue(safeUser);
    const tokenService = createTokenService();
    const service = new AuthService(
      repository as unknown as AuthRepository,
      tokenService as unknown as AuthTokenService,
      passwordService,
    );

    const result = await service.register({
      firstName: ' Test ',
      lastName: ' Customer ',
      email: ' Customer@Example.COM ',
      password: 'a-secure-password',
      phone: '+358401234567',
    });

    const createData = repository.createUser.mock.calls[0]?.[0];
    expect(createData).toBeDefined();
    if (!createData) {
      throw new Error('Expected createUser to be called');
    }
    expect(createData).toMatchObject({
      email: 'customer@example.com',
      firstName: 'Test',
      lastName: 'Customer',
    });
    await expect(
      compare('a-secure-password', createData.passwordHash),
    ).resolves.toBe(true);
    expect(repository.createSession).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'session-1',
        userId: safeUser.id,
        refreshTokenHash: hashToken('refresh-token'),
      }),
    );
    expect(result).toEqual({
      user: safeUser,
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    });
  });

  it('rejects an existing email', async () => {
    const repository = createRepository();
    repository.findUserByEmail.mockResolvedValue({ id: 'existing-user' });
    const service = new AuthService(
      repository as unknown as AuthRepository,
      createTokenService() as unknown as AuthTokenService,
      passwordService,
    );

    await expect(
      service.register({
        firstName: 'Test',
        lastName: 'Customer',
        email: 'customer@example.com',
        password: 'a-secure-password',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(repository.createUser).not.toHaveBeenCalled();
  });
});

describe('AuthService login', () => {
  const createRepository = () => ({
    findUserForLogin: jest.fn(),
    recordLoginAttempt: jest.fn().mockResolvedValue(undefined),
    createSession: jest.fn().mockResolvedValue(undefined),
  });

  const createLoginUser = async () => ({
    ...safeUser,
    passwordHash: await hash('correct-password', 4),
    deletedAt: null,
  });

  it('checks the password, records success, and issues a token pair', async () => {
    const repository = createRepository();
    const user = await createLoginUser();
    repository.findUserForLogin.mockResolvedValue(user);
    const tokenService = createTokenService();
    const service = new AuthService(
      repository as unknown as AuthRepository,
      tokenService as unknown as AuthTokenService,
      passwordService,
    );
    const context = { ipAddress: '127.0.0.1', userAgent: 'test-agent' };

    const result = await service.login(
      { email: ' Customer@Example.COM ', password: 'correct-password' },
      context,
    );

    expect(repository.findUserForLogin).toHaveBeenCalledWith(
      'customer@example.com',
    );
    expect(repository.recordLoginAttempt).toHaveBeenCalledWith(
      user.id,
      true,
      context,
    );
    expect(tokenService.signAccessToken).toHaveBeenCalledWith(
      expect.objectContaining({ id: user.id }),
    );
    expect(result).toMatchObject({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    });
    expect(result.user).not.toHaveProperty('passwordHash');
  });

  it('records a failed attempt for a known user', async () => {
    const repository = createRepository();
    const user = await createLoginUser();
    repository.findUserForLogin.mockResolvedValue(user);
    const tokenService = createTokenService();
    const service = new AuthService(
      repository as unknown as AuthRepository,
      tokenService as unknown as AuthTokenService,
      passwordService,
    );

    await expect(
      service.login({
        email: 'customer@example.com',
        password: 'wrong-password',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(repository.recordLoginAttempt).toHaveBeenCalledWith(
      user.id,
      false,
      {},
    );
    expect(tokenService.signAccessToken).not.toHaveBeenCalled();
  });

  it('does not reveal that an email is unknown', async () => {
    const repository = createRepository();
    repository.findUserForLogin.mockResolvedValue(null);
    const service = new AuthService(
      repository as unknown as AuthRepository,
      createTokenService() as unknown as AuthTokenService,
      passwordService,
    );

    await expect(
      service.login({
        email: 'missing@example.com',
        password: 'wrong-password',
      }),
    ).rejects.toMatchObject({
      status: HttpStatus.UNAUTHORIZED,
      message: 'Invalid email or password',
    });
    expect(repository.recordLoginAttempt).not.toHaveBeenCalled();
  });
});

describe('AuthService sessions', () => {
  const oldRefreshToken = 'old-refresh-token';
  const createRepository = () => ({
    findSessionWithUser: jest.fn().mockResolvedValue({
      id: 'session-1',
      userId: safeUser.id,
      refreshTokenHash: hashToken(oldRefreshToken),
      expiresAt: new Date(Date.now() + 60_000),
      user: { ...safeUser, deletedAt: null },
    }),
    rotateSession: jest.fn().mockResolvedValue({ count: 1 }),
    deleteSession: jest.fn().mockResolvedValue({ count: 1 }),
    deleteAllSessions: jest.fn().mockResolvedValue({ count: 2 }),
  });

  it('rotates the token hash atomically', async () => {
    const repository = createRepository();
    const tokenService = createTokenService();
    tokenService.signAccessToken.mockResolvedValue('new-access-token');
    tokenService.signRefreshToken.mockResolvedValue('new-refresh-token');
    const service = new AuthService(
      repository as unknown as AuthRepository,
      tokenService as unknown as AuthTokenService,
      passwordService,
    );

    const result = await service.refresh({
      id: safeUser.id,
      sessionId: 'session-1',
      refreshToken: oldRefreshToken,
    });

    expect(repository.rotateSession).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'session-1',
        currentRefreshTokenHash: hashToken(oldRefreshToken),
        nextRefreshTokenHash: hashToken('new-refresh-token'),
      }),
    );
    expect(result).toMatchObject({
      accessToken: 'new-access-token',
      refreshToken: 'new-refresh-token',
    });
  });

  it('revokes the session when a stale token is reused', async () => {
    const repository = createRepository();
    const service = new AuthService(
      repository as unknown as AuthRepository,
      createTokenService() as unknown as AuthTokenService,
      passwordService,
    );

    await expect(
      service.refresh({
        id: safeUser.id,
        sessionId: 'session-1',
        refreshToken: 'stale-refresh-token',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(repository.deleteSession).toHaveBeenCalledWith(
      'session-1',
      safeUser.id,
    );
    expect(repository.rotateSession).not.toHaveBeenCalled();
  });

  it('deletes one session on logout and all sessions on logout-all', async () => {
    const repository = createRepository();
    const service = new AuthService(
      repository as unknown as AuthRepository,
      createTokenService() as unknown as AuthTokenService,
      passwordService,
    );

    await service.logout({
      id: safeUser.id,
      sessionId: 'session-1',
      refreshToken: oldRefreshToken,
    });
    await service.logoutAll(safeUser.id);

    expect(repository.deleteSession).toHaveBeenCalledWith(
      'session-1',
      safeUser.id,
    );
    expect(repository.deleteAllSessions).toHaveBeenCalledWith(safeUser.id);
  });
});
