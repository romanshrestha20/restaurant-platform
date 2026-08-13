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
  UseGuards,
} from '@nestjs/common';
import { AccessTokenGuard } from '../../common/guards/access-token.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AccessAuthUser } from '../auth/interfaces/auth-user.interface';
import {
  AddCartItemDto,
  CartVersionDto,
  CreateCartDto,
  UpdateCartItemDto,
} from './dto/cart.dto';
import { CartService } from './cart.service';

@Controller('customer/carts')
@UseGuards(AccessTokenGuard)
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Post()
  getOrCreate(@CurrentUser() user: AccessAuthUser, @Body() data: CreateCartDto) {
    return this.cartService.getOrCreate(user.id, data.restaurantId);
  }

  @Get('current')
  getCurrent(
    @CurrentUser() user: AccessAuthUser,
    @Query('restaurantId') restaurantId: string,
  ) {
    return this.cartService.getCurrent(user.id, restaurantId);
  }

  @Post(':cartId/items')
  addItem(
    @CurrentUser() user: AccessAuthUser,
    @Param('cartId') cartId: string,
    @Body() data: AddCartItemDto,
  ) {
    return this.cartService.addItem(user.id, cartId, data);
  }

  @Patch(':cartId/items/:cartItemId')
  updateItem(
    @CurrentUser() user: AccessAuthUser,
    @Param('cartId') cartId: string,
    @Param('cartItemId') cartItemId: string,
    @Body() data: UpdateCartItemDto,
  ) {
    return this.cartService.updateItem(user.id, cartId, cartItemId, data);
  }

  @Delete(':cartId/items/:cartItemId')
  removeItem(
    @CurrentUser() user: AccessAuthUser,
    @Param('cartId') cartId: string,
    @Param('cartItemId') cartItemId: string,
    @Query() query: CartVersionDto,
  ) {
    return this.cartService.removeItem(user.id, cartId, cartItemId, query.version);
  }

  @Delete(':cartId')
  @HttpCode(HttpStatus.NO_CONTENT)
  clear(
    @CurrentUser() user: AccessAuthUser,
    @Param('cartId') cartId: string,
  ) {
    return this.cartService.clear(user.id, cartId);
  }

  @Post(':cartId/revalidate')
  revalidate(
    @CurrentUser() user: AccessAuthUser,
    @Param('cartId') cartId: string,
    @Body() data: CartVersionDto,
  ) {
    return this.cartService.revalidate(user.id, cartId, data.version);
  }
}
