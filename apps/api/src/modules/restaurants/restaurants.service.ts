import {
  BadGatewayException,
  BadRequestException,
  ConflictException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { DayOfWeek, RestaurantMediaType } from '@restaurant/database/generated';
import {
  isRestaurantRole,
  restaurantPermissionsForRole,
} from '@restaurant/database/authorization';
import { UploadService } from '../../common/upload/upload.service';
import type { AddRestaurantAddressDto } from './dto/add-restaurant-address.dto';
import type { CreateOpeningHourDto } from './dto/create-opening-hour.dto';
import type { CreateRestaurantDto } from './dto/create-restaurant.dto';
import type { ReplaceOpeningHoursDto } from './dto/replace-opening-hours.dto';
import type { UpdateRestaurantAddressDto } from './dto/update-restaurant-address.dto';
import type { UpdateRestaurantDto } from './dto/update-restaurant.dto';
import {
  CannotDeleteLastAddressError,
  CannotUnsetPrimaryAddressError,
  OnboardingUserNotFoundError,
  OwnerRoleNotConfiguredError,
  RestaurantsRepository,
} from './restaurants.repository';

const DAYS = Object.values(DayOfWeek);

const isPrismaUniqueConstraintError = (error: unknown) =>
  typeof error === 'object' &&
  error !== null &&
  'code' in error &&
  error.code === 'P2002';

const isAddressConcurrencyError = (error: unknown) =>
  typeof error === 'object' &&
  error !== null &&
  'code' in error &&
  (error.code === 'P2002' || error.code === 'P2034');

@Injectable()
export class RestaurantsService {
  private readonly logger = new Logger(RestaurantsService.name);

  constructor(
    private readonly restaurantsRepository: RestaurantsRepository,
    private readonly uploadService: UploadService,
  ) {}

  async create(userId: string, data: CreateRestaurantDto) {
    this.validateOpeningHours(data.openingHours ?? []);
    const slug = data.slug ?? this.slugify(data.name);

    if (!slug) {
      throw new BadRequestException(
        'A slug is required when the restaurant name cannot form a public URL',
      );
    }

    try {
      return await this.restaurantsRepository.createForOwner(
        userId,
        slug,
        data,
      );
    } catch (error: unknown) {
      if (isPrismaUniqueConstraintError(error)) {
        throw new ConflictException('Restaurant slug is already in use');
      }
      if (error instanceof OnboardingUserNotFoundError) {
        throw new UnauthorizedException('The authenticated user is not active');
      }
      if (error instanceof OwnerRoleNotConfiguredError) {
        throw new InternalServerErrorException(
          'Restaurant onboarding is not configured',
        );
      }
      throw error;
    }
  }

  findAllForUser(userId: string) {
    return this.restaurantsRepository
      .findMembershipsByUserId(userId)
      .then((memberships) =>
        memberships.map(({ role, ...membership }) => ({
          ...membership,
          callerRole: role.name,
          callerPermissions: isRestaurantRole(role.name)
            ? restaurantPermissionsForRole(role.name)
            : [],
        })),
      );
  }

  async getManagement(restaurantId: string, callerRole: string) {
    const restaurant =
      await this.restaurantsRepository.findManagementById(restaurantId);
    if (!restaurant) {
      throw new NotFoundException('Restaurant not found');
    }
    return {
      ...restaurant,
      callerRole,
      callerPermissions: isRestaurantRole(callerRole)
        ? restaurantPermissionsForRole(callerRole)
        : [],
    };
  }

  async update(
    restaurantId: string,
    callerRole: string,
    data: UpdateRestaurantDto,
  ) {
    if (Object.keys(data).length === 0) {
      throw new BadRequestException(
        'At least one restaurant field is required',
      );
    }
    const restaurant = await this.restaurantsRepository.updateById(
      restaurantId,
      data,
    );
    if (!restaurant) {
      throw new NotFoundException('Restaurant not found');
    }
    return {
      ...restaurant,
      callerRole,
      callerPermissions: isRestaurantRole(callerRole)
        ? restaurantPermissionsForRole(callerRole)
        : [],
    };
  }

  async replaceOpeningHours(
    restaurantId: string,
    data: ReplaceOpeningHoursDto,
  ) {
    this.validateOpeningHours(data.openingHours);
    const openingHours = await this.restaurantsRepository.replaceOpeningHours(
      restaurantId,
      data,
    );
    if (!openingHours) {
      throw new NotFoundException('Restaurant not found');
    }
    return { openingHours };
  }

  listAddresses(restaurantId: string) {
    return this.restaurantsRepository.listAddresses(restaurantId);
  }

  async addAddress(restaurantId: string, data: AddRestaurantAddressDto) {
    try {
      const address = await this.restaurantsRepository.addAddress(
        restaurantId,
        data,
      );
      if (!address) {
        throw new NotFoundException('Restaurant not found');
      }
      return address;
    } catch (error: unknown) {
      if (isAddressConcurrencyError(error)) {
        throw new ConflictException(
          'The primary address changed concurrently; retry the request',
        );
      }
      throw error;
    }
  }

  async updateAddress(
    restaurantId: string,
    addressId: string,
    data: UpdateRestaurantAddressDto,
  ) {
    if (Object.keys(data).length === 0) {
      throw new BadRequestException('At least one address field is required');
    }
    try {
      const address = await this.restaurantsRepository.updateAddress(
        restaurantId,
        addressId,
        data,
      );
      if (!address) {
        throw new NotFoundException('Restaurant address not found');
      }
      return address;
    } catch (error: unknown) {
      if (error instanceof CannotUnsetPrimaryAddressError) {
        throw new BadRequestException(
          'Set another address as primary before unsetting this address',
        );
      }
      if (isAddressConcurrencyError(error)) {
        throw new ConflictException(
          'The primary address changed concurrently; retry the request',
        );
      }
      throw error;
    }
  }

  async deleteAddress(restaurantId: string, addressId: string): Promise<void> {
    try {
      const deleted = await this.restaurantsRepository.deleteAddress(
        restaurantId,
        addressId,
      );
      if (!deleted) {
        throw new NotFoundException('Restaurant address not found');
      }
    } catch (error: unknown) {
      if (error instanceof CannotDeleteLastAddressError) {
        throw new BadRequestException(
          'A restaurant must retain at least one address',
        );
      }
      if (isAddressConcurrencyError(error)) {
        throw new ConflictException(
          'The address list changed concurrently; retry the request',
        );
      }
      throw error;
    }
  }

  uploadLogo(restaurantId: string, file: Express.Multer.File) {
    return this.uploadMedia(restaurantId, RestaurantMediaType.LOGO, file);
  }

  uploadCover(restaurantId: string, file: Express.Multer.File) {
    return this.uploadMedia(restaurantId, RestaurantMediaType.COVER, file);
  }

  removeLogo(restaurantId: string) {
    return this.removeMedia(restaurantId, RestaurantMediaType.LOGO);
  }

  removeCover(restaurantId: string) {
    return this.removeMedia(restaurantId, RestaurantMediaType.COVER);
  }

  private validateOpeningHours(schedule: CreateOpeningHourDto[]): void {
    if (!schedule.length) {
      return;
    }

    if (
      schedule.length !== DAYS.length ||
      !DAYS.every((day) => schedule.some((hours) => hours.day === day))
    ) {
      throw new BadRequestException(
        'openingHours must be empty or contain exactly one entry for every weekday',
      );
    }

    for (const hours of schedule) {
      if (hours.isClosed) {
        if (hours.opensAt != null || hours.closesAt != null) {
          throw new BadRequestException(
            `${hours.day} must not include opening or closing times when closed`,
          );
        }
        continue;
      }

      if (!hours.opensAt || !hours.closesAt) {
        throw new BadRequestException(
          `${hours.day} requires opening and closing times`,
        );
      }
      if (hours.opensAt === hours.closesAt) {
        throw new BadRequestException(
          `${hours.day} opening and closing times must be different`,
        );
      }
    }
  }

  private async uploadMedia(
    restaurantId: string,
    type: RestaurantMediaType,
    file: Express.Multer.File,
  ) {
    const isLogo = type === RestaurantMediaType.LOGO;
    let uploaded;
    try {
      uploaded = await this.uploadService.uploadImage(file, {
        folder: `restaurants/${restaurantId}/${type.toLowerCase()}`,
        width: isLogo ? 800 : 1600,
        height: isLogo ? 800 : 900,
        crop: 'fill',
      });
    } catch (error: unknown) {
      if (error instanceof HttpException) {
        throw error;
      }
      this.logger.error(
        `Restaurant ${type.toLowerCase()} upload failed for ${restaurantId}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw new BadGatewayException(
        `Restaurant ${type.toLowerCase()} upload failed`,
      );
    }

    let replacement;
    try {
      replacement = await this.restaurantsRepository.replaceMedia(
        restaurantId,
        type,
        uploaded,
      );
    } catch (error: unknown) {
      await this.uploadService.deleteQuietly(uploaded.publicId);
      throw error;
    }

    if (!replacement) {
      await this.uploadService.deleteQuietly(uploaded.publicId);
      throw new NotFoundException('Restaurant not found');
    }
    if (replacement.previousPublicId) {
      await this.uploadService.deleteQuietly(replacement.previousPublicId);
    }
    return { type: replacement.type, ...replacement.media };
  }

  private async removeMedia(
    restaurantId: string,
    type: RestaurantMediaType,
  ): Promise<void> {
    const publicId = await this.restaurantsRepository.removeMedia(
      restaurantId,
      type,
    );
    if (publicId) {
      await this.uploadService.deleteQuietly(publicId);
    }
  }

  private slugify(name: string): string {
    return name
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 80)
      .replace(/-+$/g, '');
  }
}
