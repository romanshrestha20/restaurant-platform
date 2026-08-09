import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Throttle } from '@nestjs/throttler';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { AccessTokenGuard } from '../../common/guards/access-token.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AccessAuthUser } from '../auth/interfaces/auth-user.interface';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ProfileService } from './profile.service';
import { ChangePasswordDto } from './dto/change-password.dto';
import { REFRESH_TOKEN_COOKIE } from '../auth/constants/auth.constants';
import type { AppEnvironment } from '../../config/env';

@Controller('profile')
@UseGuards(AccessTokenGuard)
export class ProfileController {
  constructor(
    private readonly profileService: ProfileService,
    private readonly config: ConfigService<AppEnvironment, true>,
  ) {}

  @Get()
  getProfile(@CurrentUser() user: AccessAuthUser) {
    return this.profileService.getProfile(user.id);
  }

  @Patch()
  updateProfile(
    @CurrentUser() user: AccessAuthUser,
    @Body() data: UpdateProfileDto,
  ) {
    return this.profileService.updateProfile(user.id, data);
  }

  @Post('photo')
  @UseInterceptors(FileInterceptor('photo'))
  uploadPhoto(
    @CurrentUser() user: AccessAuthUser,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.profileService.uploadPhoto(user.id, file);
  }

  @Patch('password')
  @Throttle({ default: { limit: 5, ttl: 60 * 60_000 } })
  async changePassword(
    @CurrentUser() user: AccessAuthUser,
    @Body() data: ChangePasswordDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.profileService.changePassword(user.id, data);
    response.clearCookie(REFRESH_TOKEN_COOKIE, {
      httpOnly: true,
      secure: this.config.get('NODE_ENV', { infer: true }) === 'production',
      sameSite: 'lax',
      path: '/api/v1/auth',
    });
    return result;
  }
}
