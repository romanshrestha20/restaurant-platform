import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { AuthRepository } from '../repositories/auth.repository';
import { ACCOUNT_TOKEN_TYPES } from '../types/account-token.type';
import { AccountTokenService } from './account-token.service';
import { AuthMailService } from './auth-mail.service';
import { PasswordService } from './password.service';

const EMAIL_VERIFICATION_RESPONSE = {
  message: 'If verification is required, an email has been sent',
} as const;

const PASSWORD_RESET_RESPONSE = {
  message: 'If an account exists for that email, a reset link has been sent',
} as const;

@Injectable()
export class AccountRecoveryService {
  private readonly logger = new Logger(AccountRecoveryService.name);

  constructor(
    private readonly authRepository: AuthRepository,
    private readonly accountTokenService: AccountTokenService,
    private readonly authMailService: AuthMailService,
    private readonly passwordService: PasswordService,
  ) {}

  async sendRegistrationVerification(user: {
    id: string;
    email: string;
    emailVerified: boolean;
  }): Promise<void> {
    if (user.emailVerified) {
      return;
    }

    try {
      await this.issueEmailVerification(user.id, user.email);
    } catch (error: unknown) {
      this.logger.error(
        `Could not send registration verification email for user ${user.id}`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }

  async requestEmailVerification(userId: string) {
    const user = await this.authRepository.findUserById(userId);

    if (
      user &&
      user.isActive &&
      user.deletedAt === null &&
      !user.emailVerified
    ) {
      await this.issueEmailVerification(user.id, user.email);
    }

    return EMAIL_VERIFICATION_RESPONSE;
  }

  async verifyEmail(rawToken: string) {
    const verified = await this.authRepository.verifyEmailWithToken(
      this.accountTokenService.hashToken(rawToken),
    );

    if (!verified) {
      throw new BadRequestException('Invalid or expired verification token');
    }

    return { message: 'Email verified successfully' } as const;
  }

  async requestPasswordReset(emailInput: string) {
    const email = emailInput.trim().toLowerCase();
    const user = await this.authRepository.findUserForAccountAction(email);

    if (user && user.isActive && user.deletedAt === null) {
      try {
        const token = this.accountTokenService.createToken(
          ACCOUNT_TOKEN_TYPES.PASSWORD_RESET,
        );
        await this.authRepository.replaceAccountToken({
          userId: user.id,
          type: ACCOUNT_TOKEN_TYPES.PASSWORD_RESET,
          tokenHash: token.tokenHash,
          expiresAt: token.expiresAt,
        });
        await this.authMailService.sendPasswordReset(
          user.email,
          token.rawToken,
        );
      } catch (error: unknown) {
        this.logger.error(
          `Could not send password-reset email for user ${user.id}`,
          error instanceof Error ? error.stack : undefined,
        );
      }
    }

    return PASSWORD_RESET_RESPONSE;
  }

  async resetPassword(rawToken: string, password: string) {
    const [tokenHash, passwordHash] = await Promise.all([
      Promise.resolve(this.accountTokenService.hashToken(rawToken)),
      this.passwordService.hashPassword(password),
    ]);
    const reset = await this.authRepository.resetPasswordWithToken(
      tokenHash,
      passwordHash,
    );

    if (!reset) {
      throw new BadRequestException('Invalid or expired password reset token');
    }

    return {
      message: 'Password reset successfully. Please sign in again',
    } as const;
  }

  private async issueEmailVerification(
    userId: string,
    email: string,
  ): Promise<void> {
    const token = this.accountTokenService.createToken(
      ACCOUNT_TOKEN_TYPES.EMAIL_VERIFICATION,
    );
    await this.authRepository.replaceAccountToken({
      userId,
      type: ACCOUNT_TOKEN_TYPES.EMAIL_VERIFICATION,
      tokenHash: token.tokenHash,
      expiresAt: token.expiresAt,
    });
    await this.authMailService.sendEmailVerification(email, token.rawToken);
  }
}
