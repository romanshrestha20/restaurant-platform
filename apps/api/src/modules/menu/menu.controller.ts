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
  Query,
} from '@nestjs/common';
import { RequireRestaurantPermissions } from '../../common/decorators/roles.decorator';
import {
  CreateMenuCategoryDto,
  CreateMenuDto,
  CreateMenuItemDto,
  MenuCategoryListQueryDto,
  MenuItemListQueryDto,
  MenuListQueryDto,
  UpdateMenuCategoryDto,
  UpdateMenuDto,
  UpdateMenuItemDto,
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
}
