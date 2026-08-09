import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './controllers/auth.controller';
import { AuthRepository } from './repositories/auth.repository';
import { AuthService } from './services/auth.service';
import { AuthTokenService } from './services/auth-token.service';
import { AccessTokenStrategy } from './strategies/access-token.strategy';
import { RefreshTokenStrategy } from './strategies/refresh-token.strategy';
import { RolesGuard } from '../../common/guards/roles.guard';
import { RestaurantRolesGuard } from '../../common/guards/restaurant-roles.guard';
import { PasswordService } from './services/password.service';

@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_ACCESS_SECRET'),
        signOptions: { expiresIn: '15m' },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    AuthTokenService,
    PasswordService,
    AuthRepository,
    AccessTokenStrategy,
    RefreshTokenStrategy,
    RolesGuard,
    RestaurantRolesGuard,
  ],
  exports: [
    AuthService,
    AuthTokenService,
    JwtModule,
    RolesGuard,
    RestaurantRolesGuard,
  ],
})
export class AuthModule {}
