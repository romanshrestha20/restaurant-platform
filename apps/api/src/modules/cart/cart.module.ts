import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { MenuModule } from '../menu/menu.module';
import { CartController } from './cart.controller';
import { CartService } from './cart.service';
import { RestaurantsModule } from '../restaurants/restaurants.module';

@Module({
  imports: [AuthModule, MenuModule, RestaurantsModule],
  controllers: [CartController],
  providers: [CartService],
  exports: [CartService],
})
export class CartModule {}
