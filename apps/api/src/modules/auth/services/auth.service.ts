import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthRepository } from '../repositories/auth.repository';
import { LoginDto } from '../dto/login.dto';
import { RegisterDto } from '../dto/register.dto';
import { RefreshAuthUser } from '../interfaces/auth-user.interface';
import {
  AuthSessionResponse,
  AuthUserResponse,
} from '../types/auth-response.type';
import { LoginContext } from '../types/login-context.type';
import { AuthTokenService } from './auth-token.service';
import { PasswordService } from './password.service';

const INVALID_PASSWORD_HASH =
  '$2b$12$NQhfkaL70f.NppT3XQx9LO1SFMLocU.a9GigbRtGGU7xntazI/aqm';

@Injectable()
export class AuthService {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly tokenService: AuthTokenService,
    private readonly passwordService: PasswordService,
  ) {}

  async register(
    dto: RegisterDto,
    context: LoginContext = {},
  ): Promise<AuthSessionResponse> {
    const email = dto.email.trim().toLowerCase();
    const phone = dto.phone?.trim();
    const existingUser = await this.authRepository.findUserByEmail(email);

    if (existingUser) {
      throw new ConflictException('An account with this email already exists');
    }

    const passwordHash = await this.passwordService.hashPassword(dto.password);

    try {
      const user = await this.authRepository.createUser({
        email,
        passwordHash,
        firstName: dto.firstName.trim(),
        lastName: dto.lastName.trim(),
        ...(phone ? { phone } : {}),
      });

      const tokens = await this.createSessionTokens(user, context);

      return { user, ...tokens };
    } catch (error: unknown) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Email or phone is already registered');
      }

      throw error;
    }
  }

  async login(
    dto: LoginDto,
    context: LoginContext = {},
  ): Promise<AuthSessionResponse> {
    const email = dto.email.trim().toLowerCase();
    const user = await this.authRepository.findUserForLogin(email);
    const passwordHash = user?.passwordHash ?? INVALID_PASSWORD_HASH;
    const passwordMatches = await this.passwordService.verifyPassword(
      dto.password,
      passwordHash,
    );

    if (
      !user ||
      !user.passwordHash ||
      !passwordMatches ||
      !user.isActive ||
      user.deletedAt !== null
    ) {
      if (user) {
        await this.authRepository.recordLoginAttempt(user.id, false, context);
      }

      throw new UnauthorizedException('Invalid email or password');
    }

    await this.authRepository.recordLoginAttempt(user.id, true, context);

    const safeUser: AuthUserResponse = {
      id: user.id,
      email: user.email,
      phone: user.phone,
      emailVerified: user.emailVerified,
      phoneVerified: user.phoneVerified,
      isActive: user.isActive,
      createdAt: user.createdAt,
      profile: user.profile,
      roles: user.roles,
    };
    const tokens = await this.createSessionTokens(safeUser, context);

    return { user: safeUser, ...tokens };
  }

  async refresh(
    authUser: RefreshAuthUser,
    context: LoginContext = {},
  ): Promise<AuthSessionResponse> {
    const session = await this.authRepository.findSessionWithUser(
      authUser.sessionId,
    );

    if (
      !session ||
      session.userId !== authUser.id ||
      session.expiresAt.getTime() <= Date.now() ||
      !session.user.isActive ||
      session.user.deletedAt !== null
    ) {
      if (session) {
        await this.authRepository.deleteSession(session.id, session.userId);
      }
      throw new UnauthorizedException('Invalid refresh token');
    }

    const currentRefreshTokenHash = this.tokenService.hashRefreshToken(
      authUser.refreshToken,
    );

    if (
      !this.tokenService.refreshTokenMatches(
        authUser.refreshToken,
        session.refreshTokenHash,
      )
    ) {
      await this.authRepository.deleteSession(session.id, session.userId);
      throw new UnauthorizedException('Invalid refresh token');
    }

    const user = this.toSafeUser(session.user);
    const [accessToken, refreshToken] = await Promise.all([
      this.tokenService.signAccessToken(user),
      this.tokenService.signRefreshToken(user.id, session.id),
    ]);
    const nextRefreshTokenHash =
      this.tokenService.hashRefreshToken(refreshToken);
    const expiresAt = this.tokenService.getRefreshExpiration();
    const rotation = await this.authRepository.rotateSession({
      id: session.id,
      currentRefreshTokenHash,
      nextRefreshTokenHash,
      expiresAt,
      context,
    });

    if (rotation.count !== 1) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    return { user, accessToken, refreshToken };
  }

  async logout(authUser: RefreshAuthUser): Promise<void> {
    await this.authRepository.deleteSession(authUser.sessionId, authUser.id);
  }

  async logoutAll(userId: string): Promise<void> {
    await this.authRepository.deleteAllSessions(userId);
  }

  private async createSessionTokens(
    user: AuthUserResponse,
    context: LoginContext,
  ) {
    const sessionId = this.tokenService.createSessionId();
    const [accessToken, refreshToken] = await Promise.all([
      this.tokenService.signAccessToken(user),
      this.tokenService.signRefreshToken(user.id, sessionId),
    ]);

    await this.authRepository.createSession({
      id: sessionId,
      userId: user.id,
      refreshTokenHash: this.tokenService.hashRefreshToken(refreshToken),
      expiresAt: this.tokenService.getRefreshExpiration(),
      context,
    });

    return { accessToken, refreshToken };
  }

  private toSafeUser(user: AuthUserResponse & { deletedAt?: Date | null }) {
    return {
      id: user.id,
      email: user.email,
      phone: user.phone,
      emailVerified: user.emailVerified,
      phoneVerified: user.phoneVerified,
      isActive: user.isActive,
      createdAt: user.createdAt,
      profile: user.profile,
      roles: user.roles,
    };
  }
}
