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
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Throttle } from '@nestjs/throttler';
import { RequireRestaurantPermissions } from '../../common/decorators/roles.decorator';
import { MAX_IMAGE_SIZE } from '../../common/upload/upload.service';
import {
  CreateAddOnDto,
  CreateAddOnGroupDto,
  CreateMenuCategoryDto,
  CreateMenuDto,
  CreateMenuItemDto,
  CreateVariantDto,
  CreateVariantOptionDto,
  MenuCategoryListQueryDto,
  MenuItemListQueryDto,
  MenuListQueryDto,
  UpdateMenuCategoryDto,
  UpdateMenuDto,
  UpdateMenuItemDto,
  UpdateAddOnDto,
  UpdateAddOnGroupDto,
  UpdateVariantDto,
  UpdateVariantOptionDto,
} from './dto/menu.dto';
import { MenuService } from './menu.service';

@Controller('restaurants/:restaurantId')
export class MenuController {
  constructor(private readonly menuService: MenuService) {}

  @Get('menus')
  @RequireRestaurantPermissions('menu.read')
  listMenus(
    @Param('restaurantId') restaurantId: string,
    @Query() query: MenuListQueryDto,
  ) {
    return this.menuService.listMenus(restaurantId, query);
  }

  @Post('menus')
  @RequireRestaurantPermissions('menu.create')
  createMenu(
    @Param('restaurantId') restaurantId: string,
    @Body() data: CreateMenuDto,
  ) {
    return this.menuService.createMenu(restaurantId, data);
  }

  @Get('menus/:menuId')
  @RequireRestaurantPermissions('menu.read')
  getMenu(
    @Param('restaurantId') restaurantId: string,
    @Param('menuId') menuId: string,
  ) {
    return this.menuService.getMenu(restaurantId, menuId);
  }

  @Patch('menus/:menuId')
  @RequireRestaurantPermissions('menu.update')
  updateMenu(
    @Param('restaurantId') restaurantId: string,
    @Param('menuId') menuId: string,
    @Body() data: UpdateMenuDto,
  ) {
    return this.menuService.updateMenu(restaurantId, menuId, data);
  }

  @Delete('menus/:menuId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequireRestaurantPermissions('menu.delete')
  deleteMenu(
    @Param('restaurantId') restaurantId: string,
    @Param('menuId') menuId: string,
  ) {
    return this.menuService.deleteMenu(restaurantId, menuId);
  }

  @Get('menu-categories')
  @RequireRestaurantPermissions('menu.read')
  listCategories(
    @Param('restaurantId') restaurantId: string,
    @Query() query: MenuCategoryListQueryDto,
  ) {
    return this.menuService.listCategories(restaurantId, query);
  }

  @Post('menu-categories')
  @RequireRestaurantPermissions('menu.create')
  createCategory(
    @Param('restaurantId') restaurantId: string,
    @Body() data: CreateMenuCategoryDto,
  ) {
    return this.menuService.createCategory(restaurantId, data);
  }

  @Patch('menu-categories/:categoryId')
  @RequireRestaurantPermissions('menu.update')
  updateCategory(
    @Param('restaurantId') restaurantId: string,
    @Param('categoryId') categoryId: string,
    @Body() data: UpdateMenuCategoryDto,
  ) {
    return this.menuService.updateCategory(restaurantId, categoryId, data);
  }

  @Delete('menu-categories/:categoryId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequireRestaurantPermissions('menu.delete')
  deleteCategory(
    @Param('restaurantId') restaurantId: string,
    @Param('categoryId') categoryId: string,
  ) {
    return this.menuService.deleteCategory(restaurantId, categoryId);
  }

  @Get('menu-items')
  @RequireRestaurantPermissions('menu.read')
  listItems(
    @Param('restaurantId') restaurantId: string,
    @Query() query: MenuItemListQueryDto,
  ) {
    return this.menuService.listItems(restaurantId, query);
  }

  @Post('menu-items')
  @RequireRestaurantPermissions('menu.create')
  createItem(
    @Param('restaurantId') restaurantId: string,
    @Body() data: CreateMenuItemDto,
  ) {
    return this.menuService.createItem(restaurantId, data);
  }

  @Patch('menu-items/:itemId')
  @RequireRestaurantPermissions('menu.update')
  updateItem(
    @Param('restaurantId') restaurantId: string,
    @Param('itemId') itemId: string,
    @Body() data: UpdateMenuItemDto,
  ) {
    return this.menuService.updateItem(restaurantId, itemId, data);
  }

  @Delete('menu-items/:itemId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequireRestaurantPermissions('menu.delete')
  deleteItem(
    @Param('restaurantId') restaurantId: string,
    @Param('itemId') itemId: string,
  ) {
    return this.menuService.deleteItem(restaurantId, itemId);
  }

  @Get('menu-items/:itemId/configuration')
  @RequireRestaurantPermissions('menu.read')
  getItemConfiguration(
    @Param('restaurantId') restaurantId: string,
    @Param('itemId') itemId: string,
  ) {
    return this.menuService.getItemConfiguration(restaurantId, itemId);
  }

  @Post('menu-items/:itemId/media')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @UseInterceptors(
    FileInterceptor('image', {
      limits: { fileSize: MAX_IMAGE_SIZE, files: 1, fields: 1 },
    }),
  )
  @RequireRestaurantPermissions('menu.update')
  uploadItemMedia(
    @Param('restaurantId') restaurantId: string,
    @Param('itemId') itemId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body('alt') alt?: string,
  ) {
    return this.menuService.uploadItemMedia(restaurantId, itemId, file, alt);
  }

  @Delete('menu-items/:itemId/media/:mediaId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequireRestaurantPermissions('menu.update')
  removeItemMedia(
    @Param('restaurantId') restaurantId: string,
    @Param('itemId') itemId: string,
    @Param('mediaId') mediaId: string,
  ) {
    return this.menuService.removeItemMedia(restaurantId, itemId, mediaId);
  }

  @Post('menu-items/:itemId/variants')
  @RequireRestaurantPermissions('menu.update')
  createVariant(
    @Param('restaurantId') restaurantId: string,
    @Param('itemId') itemId: string,
    @Body() data: CreateVariantDto,
  ) {
    return this.menuService.createVariant(restaurantId, itemId, data);
  }

  @Patch('variants/:variantId')
  @RequireRestaurantPermissions('menu.update')
  updateVariant(
    @Param('restaurantId') restaurantId: string,
    @Param('variantId') variantId: string,
    @Body() data: UpdateVariantDto,
  ) {
    return this.menuService.updateVariant(restaurantId, variantId, data);
  }

  @Delete('variants/:variantId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequireRestaurantPermissions('menu.update')
  deleteVariant(
    @Param('restaurantId') restaurantId: string,
    @Param('variantId') variantId: string,
  ) {
    return this.menuService.deleteVariant(restaurantId, variantId);
  }

  @Post('variants/:variantId/options')
  @RequireRestaurantPermissions('menu.update')
  createVariantOption(
    @Param('restaurantId') restaurantId: string,
    @Param('variantId') variantId: string,
    @Body() data: CreateVariantOptionDto,
  ) {
    return this.menuService.createVariantOption(restaurantId, variantId, data);
  }

  @Patch('variant-options/:optionId')
  @RequireRestaurantPermissions('menu.update')
  updateVariantOption(
    @Param('restaurantId') restaurantId: string,
    @Param('optionId') optionId: string,
    @Body() data: UpdateVariantOptionDto,
  ) {
    return this.menuService.updateVariantOption(restaurantId, optionId, data);
  }

  @Delete('variant-options/:optionId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequireRestaurantPermissions('menu.update')
  deleteVariantOption(
    @Param('restaurantId') restaurantId: string,
    @Param('optionId') optionId: string,
  ) {
    return this.menuService.deleteVariantOption(restaurantId, optionId);
  }

  @Get('add-on-groups')
  @RequireRestaurantPermissions('menu.read')
  listAddOnGroups(@Param('restaurantId') restaurantId: string) {
    return this.menuService.listAddOnGroups(restaurantId);
  }

  @Post('add-on-groups')
  @RequireRestaurantPermissions('menu.update')
  createAddOnGroup(
    @Param('restaurantId') restaurantId: string,
    @Body() data: CreateAddOnGroupDto,
  ) {
    return this.menuService.createAddOnGroup(restaurantId, data);
  }

  @Patch('add-on-groups/:groupId')
  @RequireRestaurantPermissions('menu.update')
  updateAddOnGroup(
    @Param('restaurantId') restaurantId: string,
    @Param('groupId') groupId: string,
    @Body() data: UpdateAddOnGroupDto,
  ) {
    return this.menuService.updateAddOnGroup(restaurantId, groupId, data);
  }

  @Delete('add-on-groups/:groupId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequireRestaurantPermissions('menu.update')
  deleteAddOnGroup(
    @Param('restaurantId') restaurantId: string,
    @Param('groupId') groupId: string,
  ) {
    return this.menuService.deleteAddOnGroup(restaurantId, groupId);
  }

  @Post('add-on-groups/:groupId/add-ons')
  @RequireRestaurantPermissions('menu.update')
  createAddOn(
    @Param('restaurantId') restaurantId: string,
    @Param('groupId') groupId: string,
    @Body() data: CreateAddOnDto,
  ) {
    return this.menuService.createAddOn(restaurantId, groupId, data);
  }

  @Patch('add-ons/:addOnId')
  @RequireRestaurantPermissions('menu.update')
  updateAddOn(
    @Param('restaurantId') restaurantId: string,
    @Param('addOnId') addOnId: string,
    @Body() data: UpdateAddOnDto,
  ) {
    return this.menuService.updateAddOn(restaurantId, addOnId, data);
  }

  @Delete('add-ons/:addOnId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequireRestaurantPermissions('menu.update')
  deleteAddOn(
    @Param('restaurantId') restaurantId: string,
    @Param('addOnId') addOnId: string,
  ) {
    return this.menuService.deleteAddOn(restaurantId, addOnId);
  }

  @Put('menu-items/:itemId/add-on-groups/:groupId')
  @RequireRestaurantPermissions('menu.update')
  attachAddOnGroup(
    @Param('restaurantId') restaurantId: string,
    @Param('itemId') itemId: string,
    @Param('groupId') groupId: string,
  ) {
    return this.menuService.attachAddOnGroup(restaurantId, itemId, groupId);
  }

  @Delete('menu-items/:itemId/add-on-groups/:groupId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequireRestaurantPermissions('menu.update')
  detachAddOnGroup(
    @Param('restaurantId') restaurantId: string,
    @Param('itemId') itemId: string,
    @Param('groupId') groupId: string,
  ) {
    return this.menuService.detachAddOnGroup(restaurantId, itemId, groupId);
  }
}
