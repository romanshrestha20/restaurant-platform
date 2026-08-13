import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Put,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Throttle } from '@nestjs/throttler';
import { RequireRestaurantPermissions } from '../../common/decorators/roles.decorator';
import { AccessTokenGuard } from '../../common/guards/access-token.guard';
import { MAX_IMAGE_SIZE } from '../../common/upload/upload.service';
import { CurrentRestaurantMembership } from '../auth/decorators/current-restaurant-membership.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AccessAuthUser } from '../auth/interfaces/auth-user.interface';
import type { RestaurantMembershipAuth } from '../../common/guards/restaurant-roles.guard';
import { AddRestaurantAddressDto } from './dto/add-restaurant-address.dto';
import { CreateRestaurantDto } from './dto/create-restaurant.dto';
import { ReplaceOpeningHoursDto } from './dto/replace-opening-hours.dto';
import { UpdateRestaurantAddressDto } from './dto/update-restaurant-address.dto';
import { UpdateRestaurantDto } from './dto/update-restaurant.dto';
import { RestaurantsService } from './restaurants.service';

@Controller('restaurants')
export class RestaurantsController {
  constructor(private readonly restaurantsService: RestaurantsService) {}

  @Post()
  @UseGuards(AccessTokenGuard)
  create(
    @CurrentUser() user: AccessAuthUser,
    @Body() data: CreateRestaurantDto,
  ) {
    return this.restaurantsService.create(user.id, data);
  }

  @Get()
  @UseGuards(AccessTokenGuard)
  findAll(@CurrentUser() user: AccessAuthUser) {
    return this.restaurantsService.findAllForUser(user.id);
  }

  @Get(':restaurantId')
  @RequireRestaurantPermissions('restaurant.read')
  getManagement(
    @Param('restaurantId') restaurantId: string,
    @CurrentRestaurantMembership() membership: RestaurantMembershipAuth,
  ) {
    return this.restaurantsService.getManagement(restaurantId, membership.role);
  }

  @Patch(':restaurantId')
  @RequireRestaurantPermissions('restaurant.update')
  update(
    @Param('restaurantId') restaurantId: string,
    @CurrentRestaurantMembership() membership: RestaurantMembershipAuth,
    @Body() data: UpdateRestaurantDto,
  ) {
    return this.restaurantsService.update(restaurantId, membership.role, data);
  }

  @Put(':restaurantId/opening-hours')
  @RequireRestaurantPermissions('restaurant.update')
  replaceOpeningHours(
    @Param('restaurantId') restaurantId: string,
    @Body() data: ReplaceOpeningHoursDto,
  ) {
    return this.restaurantsService.replaceOpeningHours(restaurantId, data);
  }

  @Get(':restaurantId/addresses')
  @RequireRestaurantPermissions('restaurant.read')
  listAddresses(@Param('restaurantId') restaurantId: string) {
    return this.restaurantsService.listAddresses(restaurantId);
  }

  @Post(':restaurantId/addresses')
  @RequireRestaurantPermissions('restaurant.update')
  addAddress(
    @Param('restaurantId') restaurantId: string,
    @Body() data: AddRestaurantAddressDto,
  ) {
    return this.restaurantsService.addAddress(restaurantId, data);
  }

  @Patch(':restaurantId/addresses/:addressId')
  @RequireRestaurantPermissions('restaurant.update')
  updateAddress(
    @Param('restaurantId') restaurantId: string,
    @Param('addressId') addressId: string,
    @Body() data: UpdateRestaurantAddressDto,
  ) {
    return this.restaurantsService.updateAddress(restaurantId, addressId, data);
  }

  @Delete(':restaurantId/addresses/:addressId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequireRestaurantPermissions('restaurant.update')
  deleteAddress(
    @Param('restaurantId') restaurantId: string,
    @Param('addressId') addressId: string,
  ) {
    return this.restaurantsService.deleteAddress(restaurantId, addressId);
  }

  @Post(':restaurantId/logo')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @UseInterceptors(
    FileInterceptor('logo', {
      limits: { fileSize: MAX_IMAGE_SIZE, files: 1, fields: 0 },
    }),
  )
  @RequireRestaurantPermissions('restaurant.update')
  uploadLogo(
    @Param('restaurantId') restaurantId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.restaurantsService.uploadLogo(restaurantId, file);
  }

  @Delete(':restaurantId/logo')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequireRestaurantPermissions('restaurant.update')
  removeLogo(@Param('restaurantId') restaurantId: string) {
    return this.restaurantsService.removeLogo(restaurantId);
  }

  @Post(':restaurantId/cover')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @UseInterceptors(
    FileInterceptor('cover', {
      limits: { fileSize: MAX_IMAGE_SIZE, files: 1, fields: 0 },
    }),
  )
  @RequireRestaurantPermissions('restaurant.update')
  uploadCover(
    @Param('restaurantId') restaurantId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.restaurantsService.uploadCover(restaurantId, file);
  }

  @Delete(':restaurantId/cover')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequireRestaurantPermissions('restaurant.update')
  removeCover(@Param('restaurantId') restaurantId: string) {
    return this.restaurantsService.removeCover(restaurantId);
  }
}
