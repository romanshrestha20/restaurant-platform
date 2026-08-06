import {
  ConflictException,
  Injectable,
  NotImplementedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { hash } from 'bcrypt';
import { AuthRepository } from '../repositories/auth.repository';
import { LoginDto } from '../dto/login.dto';
import { RegisterDto } from '../dto/register.dto';

const PASSWORD_SALT_ROUNDS = 12;

@Injectable()
export class AuthService {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
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

      const accessToken = await this.jwtService.signAsync({
        sub: user.id,
        email: user.email,
        roles: user.roles.map(({ role }) => role.name),
      });

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

  login(_dto: LoginDto): never {
    throw new NotImplementedException('Login has not been implemented yet');
  }
}
