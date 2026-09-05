import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AccessTokenGuard } from '../../common/guards/access-token.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AccessAuthUser } from '../auth/interfaces/auth-user.interface';
import { RequireRestaurantPermissions } from '../../common/decorators/roles.decorator';
import {
  CheckoutDto,
  OrderFilterDto,
  UpdateOrderStatusDto,
} from './dto/order.dto';
import { OrdersService } from './orders.service';
import { PrimaryRestaurantService } from '../restaurants/primary-restaurant.service';

@Controller()
export class OrdersController {
  constructor(private readonly ordersService: OrdersService, private readonly primary: PrimaryRestaurantService) {}

  // Customer Routes
  @Post('customer/orders/checkout')
  @UseGuards(AccessTokenGuard)
  checkout(
    @CurrentUser() user: AccessAuthUser,
    @Body() data: CheckoutDto,
  ) {
    return this.primary.getPrimaryRestaurant().then((r) => this.ordersService.checkout(user.id, { ...data, restaurantId: r.id }));
  }

  @Get('customer/orders')
  @UseGuards(AccessTokenGuard)
  getCustomerOrders(@CurrentUser() user: AccessAuthUser, @Query() filter: OrderFilterDto) {
    return this.ordersService.getCustomerOrders(user.id, filter);
  }

  @Get('customer/orders/delivery-quote')
  @UseGuards(AccessTokenGuard)
  async deliveryQuote(@CurrentUser() user: AccessAuthUser, @Query('restaurantId') _restaurantId: string, @Query('addressId') addressId: string) {
    const restaurant = await this.primary.getPrimaryRestaurant();
    return this.ordersService.getDeliveryQuote(user.id, restaurant.id, addressId);
  }

  @Get('customer/orders/:orderId')
  @UseGuards(AccessTokenGuard)
  getCustomerOrder(
    @CurrentUser() user: AccessAuthUser,
    @Param('orderId') orderId: string,
  ) {
    return this.ordersService.getCustomerOrder(user.id, orderId);
  }

  @Get('users/me/orders')
  @UseGuards(AccessTokenGuard)
  getUserOrders(@CurrentUser() user: AccessAuthUser, @Query() filter: OrderFilterDto) { return this.ordersService.getCustomerOrders(user.id, filter); }

  @Get('users/me/orders/:orderId')
  @UseGuards(AccessTokenGuard)
  getUserOrder(@CurrentUser() user: AccessAuthUser, @Param('orderId') orderId: string) { return this.ordersService.getCustomerOrder(user.id, orderId); }

  @Get('customer/orders/by-number/:orderNumber')
  @UseGuards(AccessTokenGuard)
  getCustomerOrderByNumber(
    @CurrentUser() user: AccessAuthUser,
    @Param('orderNumber') orderNumber: string,
  ) {
    return this.ordersService.getCustomerOrderByNumber(user.id, orderNumber);
  }

  // Restaurant Staff & Manager Routes
  @Get('restaurants/:restaurantId/orders')
  @RequireRestaurantPermissions('orders.read')
  getRestaurantOrders(
    @Param('restaurantId') restaurantId: string,
    @Query() filter: OrderFilterDto,
  ) {
    return this.ordersService.getRestaurantOrders(restaurantId, filter);
  }

  @Get('restaurants/:restaurantId/orders/:orderId')
  @RequireRestaurantPermissions('orders.read')
  getRestaurantOrder(
    @Param('restaurantId') restaurantId: string,
    @Param('orderId') orderId: string,
  ) {
    return this.ordersService.getRestaurantOrder(restaurantId, orderId);
  }

  @Patch('restaurants/:restaurantId/orders/:orderId/status')
  @RequireRestaurantPermissions('orders.update')
  updateOrderStatus(
    @CurrentUser() user: AccessAuthUser,
    @Param('restaurantId') restaurantId: string,
    @Param('orderId') orderId: string,
    @Body() data: UpdateOrderStatusDto,
  ) {
    return this.ordersService.updateOrderStatus(
      restaurantId,
      orderId,
      data,
      user.id,
    );
  }
}
