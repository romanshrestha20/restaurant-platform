import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Throttle } from '@nestjs/throttler';
import type { CookieOptions, Request, Response } from 'express';
import { AccessTokenGuard } from '../../../common/guards/access-token.guard';
import { RefreshTokenGuard } from '../../../common/guards/refresh-token.guard';
import { AppEnvironment } from '../../../config/env';
import { REFRESH_TOKEN_COOKIE } from '../constants/auth.constants';
import { CurrentUser } from '../decorators/current-user.decorator';
import { LoginDto } from '../dto/login.dto';
import { RegisterDto } from '../dto/register.dto';
import type {
  AccessAuthUser,
  RefreshAuthUser,
} from '../interfaces/auth-user.interface';
import { AuthService } from '../services/auth.service';
import { AuthSessionResponse } from '../types/auth-response.type';
import { LoginContext } from '../types/login-context.type';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly config: ConfigService<AppEnvironment, true>,
  ) {}

  @Post('register')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async register(
    @Body() dto: RegisterDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authService.register(
      dto,
      this.getLoginContext(request),
    );
    return this.setRefreshCookie(response, result);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async login(
    @Body() dto: LoginDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authService.login(
      dto,
      this.getLoginContext(request),
    );
    return this.setRefreshCookie(response, result);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @UseGuards(RefreshTokenGuard)
  async refresh(
    @CurrentUser() authUser: RefreshAuthUser,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authService.refresh(
      authUser,
      this.getLoginContext(request),
    );
    return this.setRefreshCookie(response, result);
  }

  @Get('me')
  @UseGuards(AccessTokenGuard)
  me(@CurrentUser() authUser: AccessAuthUser) {
    return authUser;
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(RefreshTokenGuard)
  async logout(
    @CurrentUser() authUser: RefreshAuthUser,
    @Res({ passthrough: true }) response: Response,
  ): Promise<void> {
    await this.authService.logout(authUser);
    response.clearCookie(REFRESH_TOKEN_COOKIE, this.getCookieOptions());
  }

  @Post('logout-all')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(AccessTokenGuard)
  async logoutAll(
    @CurrentUser() authUser: AccessAuthUser,
    @Res({ passthrough: true }) response: Response,
  ): Promise<void> {
    await this.authService.logoutAll(authUser.id);
    response.clearCookie(REFRESH_TOKEN_COOKIE, this.getCookieOptions());
  }

  private setRefreshCookie(response: Response, result: AuthSessionResponse) {
    response.cookie(
      REFRESH_TOKEN_COOKIE,
      result.refreshToken,
      this.getCookieOptions(true),
    );

    return { user: result.user, accessToken: result.accessToken };
  }

  private getCookieOptions(includeMaxAge = false): CookieOptions {
    const options: CookieOptions = {
      httpOnly: true,
      secure: this.config.get('NODE_ENV', { infer: true }) === 'production',
      sameSite: 'lax',
      path: '/api/v1/auth',
    };

    if (includeMaxAge) {
      options.maxAge =
        this.config.get('JWT_REFRESH_TTL_SECONDS', { infer: true }) * 1_000;
    }

    return options;
  }

  private getLoginContext(request: Request): LoginContext {
    const userAgent = request.get('user-agent');
    return {
      ipAddress: request.ip,
      ...(userAgent ? { userAgent } : {}),
    };
  }
}
