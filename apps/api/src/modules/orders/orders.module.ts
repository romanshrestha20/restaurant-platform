import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { RealtimeModule } from '../../common/realtime/realtime.module';
import { MenuModule } from '../menu/menu.module';
import { PaymentsModule } from '../payments/payments.module';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { RestaurantsModule } from '../restaurants/restaurants.module';

@Module({
  imports: [PrismaModule, RealtimeModule, MenuModule, PaymentsModule, RestaurantsModule],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
