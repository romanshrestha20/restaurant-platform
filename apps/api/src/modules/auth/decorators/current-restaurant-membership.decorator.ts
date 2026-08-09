import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { RestaurantMembershipAuth } from '../../../common/guards/restaurant-roles.guard';

export const CurrentRestaurantMembership = createParamDecorator(
  (_data: unknown, context: ExecutionContext): RestaurantMembershipAuth =>
    context
      .switchToHttp()
      .getRequest<{ restaurantMembership: RestaurantMembershipAuth }>()
      .restaurantMembership,
);
