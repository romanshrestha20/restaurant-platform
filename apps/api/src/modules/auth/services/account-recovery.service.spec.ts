import { BadRequestException } from '@nestjs/common';
import { compare } from 'bcrypt';
import { AuthRepository } from '../repositories/auth.repository';
import { ACCOUNT_TOKEN_TYPES } from '../types/account-token.type';
import { AccountRecoveryService } from './account-recovery.service';
import { AccountTokenService } from './account-token.service';
import { AuthMailService } from './auth-mail.service';
import { PasswordService } from './password.service';

const rawToken = 'a'.repeat(64);
const tokenHash = 'hashed-token';
const expiresAt = new Date('2026-08-10T00:00:00.000Z');

const createDependencies = () => {
  const repository = {
    findUserById: jest.fn(),
    findUserForAccountAction: jest.fn(),
    replaceAccountToken: jest.fn().mockResolvedValue(undefined),
    verifyEmailWithToken: jest.fn(),
    resetPasswordWithToken: jest.fn<Promise<boolean>, [string, string]>(),
  };
  const tokenService = {
    createToken: jest.fn().mockReturnValue({
      rawToken,
      tokenHash,
      expiresAt,
    }),
    hashToken: jest.fn().mockReturnValue(tokenHash),
  };
  const mailService = {
    sendEmailVerification: jest.fn().mockResolvedValue(undefined),
    sendPasswordReset: jest.fn().mockResolvedValue(undefined),
  };

  return { repository, tokenService, mailService };
};

const createService = (dependencies: ReturnType<typeof createDependencies>) =>
  new AccountRecoveryService(
    dependencies.repository as unknown as AuthRepository,
    dependencies.tokenService as unknown as AccountTokenService,
    dependencies.mailService as unknown as AuthMailService,
    new PasswordService(),
  );

describe('AccountRecoveryService email verification', () => {
  it('replaces the previous token and emails only the raw token', async () => {
    const dependencies = createDependencies();
    dependencies.repository.findUserById.mockResolvedValue({
      id: 'user-1',
      email: 'customer@example.com',
      emailVerified: false,
      isActive: true,
      deletedAt: null,
    });
    const service = createService(dependencies);

    await service.requestEmailVerification('user-1');

    expect(dependencies.repository.replaceAccountToken).toHaveBeenCalledWith({
      userId: 'user-1',
      type: ACCOUNT_TOKEN_TYPES.EMAIL_VERIFICATION,
      tokenHash,
      expiresAt,
    });
    expect(dependencies.mailService.sendEmailVerification).toHaveBeenCalledWith(
      'customer@example.com',
      rawToken,
    );
  });

  it('accepts a valid hash once and rejects invalid or expired tokens', async () => {
    const dependencies = createDependencies();
    const service = createService(dependencies);
    dependencies.repository.verifyEmailWithToken.mockResolvedValueOnce(true);

    await expect(service.verifyEmail(rawToken)).resolves.toEqual({
      message: 'Email verified successfully',
    });
    expect(dependencies.repository.verifyEmailWithToken).toHaveBeenCalledWith(
      tokenHash,
    );

    dependencies.repository.verifyEmailWithToken.mockResolvedValueOnce(false);
    await expect(service.verifyEmail(rawToken)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });
});

describe('AccountRecoveryService password reset', () => {
  it('returns the same response for known and unknown email addresses', async () => {
    const dependencies = createDependencies();
    const service = createService(dependencies);
    dependencies.repository.findUserForAccountAction.mockResolvedValueOnce({
      id: 'user-1',
      email: 'customer@example.com',
      isActive: true,
      deletedAt: null,
    });

    const known = await service.requestPasswordReset(' Customer@Example.com ');
    dependencies.repository.findUserForAccountAction.mockResolvedValueOnce(
      null,
    );
    const unknown = await service.requestPasswordReset('missing@example.com');

    expect(known).toEqual(unknown);
    expect(
      dependencies.repository.findUserForAccountAction,
    ).toHaveBeenNthCalledWith(1, 'customer@example.com');
    expect(dependencies.repository.replaceAccountToken).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-1',
        type: ACCOUNT_TOKEN_TYPES.PASSWORD_RESET,
        tokenHash,
      }),
    );
    expect(dependencies.mailService.sendPasswordReset).toHaveBeenCalledWith(
      'customer@example.com',
      rawToken,
    );
  });

  it('hashes the new password before completing a valid reset', async () => {
    const dependencies = createDependencies();
    dependencies.repository.resetPasswordWithToken.mockResolvedValue(true);
    const service = createService(dependencies);

    await service.resetPassword(rawToken, 'new-secure-password');

    const storedHash = dependencies.repository.resetPasswordWithToken.mock
      .calls[0]?.[1] as string;
    await expect(compare('new-secure-password', storedHash)).resolves.toBe(
      true,
    );
    expect(dependencies.repository.resetPasswordWithToken).toHaveBeenCalledWith(
      tokenHash,
      storedHash,
    );
  });

  it('rejects an invalid or already-used reset token', async () => {
    const dependencies = createDependencies();
    dependencies.repository.resetPasswordWithToken.mockResolvedValue(false);
    const service = createService(dependencies);

    await expect(
      service.resetPassword(rawToken, 'new-secure-password'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
