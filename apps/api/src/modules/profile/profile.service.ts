import {
  BadRequestException,
  BadGatewayException,
  ConflictException,
  HttpException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import type { UpdateProfileDto } from './dto/update-profile.dto';
import { ProfileRepository } from './profile.repository';
import { PasswordService } from '../auth/services/password.service';
import type { ChangePasswordDto } from './dto/change-password.dto';
import { UploadService } from '../../common/upload/upload.service';

const isPrismaUniqueConstraintError = (error: unknown) =>
  typeof error === 'object' &&
  error !== null &&
  'code' in error &&
  error.code === 'P2002';

@Injectable()
export class ProfileService {
  private readonly logger = new Logger(ProfileService.name);

  constructor(
    private readonly profileRepository: ProfileRepository,
    private readonly uploadService: UploadService,
    private readonly passwordService: PasswordService,
  ) {}

  async getProfile(userId: string) {
    const user = await this.profileRepository.findByUserId(userId);

    if (!user) {
      throw new NotFoundException('Profile not found');
    }

    return this.toResponse(user);
  }

  async updateProfile(userId: string, data: UpdateProfileDto) {
    try {
      const user = await this.profileRepository.updateByUserId(userId, data);

      if (!user) {
        throw new NotFoundException('Profile not found');
      }

      return this.toResponse(user);
    } catch (error: unknown) {
      if (isPrismaUniqueConstraintError(error)) {
        throw new ConflictException('Phone number is already in use');
      }

      throw error;
    }
  }

  async uploadPhoto(userId: string, file: Express.Multer.File) {
    const user = await this.profileRepository.findByUserId(userId);
    if (!user) {
      throw new NotFoundException('Profile not found');
    }

    let uploadedPhoto;
    try {
      uploadedPhoto = await this.uploadService.uploadImage(file, {
        folder: 'avatars',
        width: 800,
        height: 800,
        crop: 'fill',
      });
    } catch (error: unknown) {
      if (error instanceof HttpException) {
        throw error;
      }
      this.logger.error(
        `Profile photo upload failed for user ${userId}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw new BadGatewayException('Profile photo upload failed');
    }

    let replacement;
    try {
      const displayName = user.profile
        ? `${user.profile.firstName} ${user.profile.lastName}`.trim()
        : 'Profile photo';
      replacement = await this.profileRepository.replacePhoto(
        userId,
        uploadedPhoto,
        `${displayName} profile photo`,
      );
    } catch (error: unknown) {
      await this.uploadService.deleteQuietly(uploadedPhoto.publicId);
      throw error;
    }

    if (!replacement) {
      await this.uploadService.deleteQuietly(uploadedPhoto.publicId);
      throw new NotFoundException('Profile not found');
    }

    if (replacement.previousPublicId) {
      await this.uploadService.deleteQuietly(replacement.previousPublicId);
    }

    return this.getProfile(userId);
  }

  async changePassword(userId: string, data: ChangePasswordDto) {
    const user = await this.profileRepository.findPasswordByUserId(userId);

    if (!user) {
      throw new NotFoundException('Profile not found');
    }
    if (!user.passwordHash) {
      throw new BadRequestException(
        'Password changes are unavailable for this account',
      );
    }

    const currentPasswordMatches = await this.passwordService.verifyPassword(
      data.currentPassword,
      user.passwordHash,
    );
    if (!currentPasswordMatches) {
      throw new BadRequestException('Current password is incorrect');
    }
    if (data.currentPassword === data.newPassword) {
      throw new BadRequestException(
        'New password must be different from current password',
      );
    }

    const passwordHash = await this.passwordService.hashPassword(
      data.newPassword,
    );
    const changed = await this.profileRepository.changePasswordByUserId(
      userId,
      passwordHash,
    );

    if (!changed) {
      throw new NotFoundException('Profile not found');
    }

    return {
      message: 'Password changed successfully. Please sign in again.',
    } as const;
  }

  private toResponse(
    user: NonNullable<Awaited<ReturnType<ProfileRepository['findByUserId']>>>,
  ) {
    const { media, ...account } = user;
    const primaryPhoto = media[0];

    return {
      ...account,
      photo: primaryPhoto
        ? {
            ...primaryPhoto.media,
            alt: primaryPhoto.alt,
          }
        : null,
    };
  }
}
