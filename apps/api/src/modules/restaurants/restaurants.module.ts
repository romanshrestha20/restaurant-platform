import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { UploadModule } from '../../common/upload/upload.module';
import { RestaurantsController } from './restaurants.controller';
import { RestaurantsRepository } from './restaurants.repository';
import { RestaurantsService } from './restaurants.service';

@Module({
  imports: [AuthModule, UploadModule],
  controllers: [RestaurantsController],
  providers: [RestaurantsRepository, RestaurantsService],
})
export class RestaurantsModule {}
