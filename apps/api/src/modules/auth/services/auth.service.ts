import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { compare, hash } from 'bcrypt';
import { AuthRepository } from '../repositories/auth.repository';
import { LoginDto } from '../dto/login.dto';
import { RegisterDto } from '../dto/register.dto';
import { AuthResponse, AuthUserResponse } from '../types/auth-response.type';
import { LoginContext } from '../types/login-context.type';

const PASSWORD_SALT_ROUNDS = 12;
const INVALID_PASSWORD_HASH =
  '$2b$12$NQhfkaL70f.NppT3XQx9LO1SFMLocU.a9GigbRtGGU7xntazI/aqm';

@Injectable()
export class AuthService {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResponse> {
    const email = dto.email.trim().toLowerCase();
    const phone = dto.phone?.trim();
    const existingUser = await this.authRepository.findUserByEmail(email);

    if (existingUser) {
      throw new ConflictException('An account with this email already exists');
    }

    const passwordHash = await hash(dto.password, PASSWORD_SALT_ROUNDS);

    try {
      const user = await this.authRepository.createUser({
        email,
        passwordHash,
        firstName: dto.firstName.trim(),
        lastName: dto.lastName.trim(),
        ...(phone ? { phone } : {}),
      });

      const accessToken = await this.signAccessToken(user);

      return { user, accessToken };
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
  ): Promise<AuthResponse> {
    const email = dto.email.trim().toLowerCase();
    const user = await this.authRepository.findUserForLogin(email);
    const passwordHash = user?.passwordHash ?? INVALID_PASSWORD_HASH;
    const passwordMatches = await compare(dto.password, passwordHash);

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
    const accessToken = await this.signAccessToken(safeUser);

    return { user: safeUser, accessToken };
  }

  private signAccessToken(user: {
    id: string;
    email: string;
    roles: Array<{ role: { name: string } }>;
  }): Promise<string> {
    return this.jwtService.signAsync({
      sub: user.id,
      email: user.email,
      roles: user.roles.map(({ role }) => role.name),
    });
  }
}
