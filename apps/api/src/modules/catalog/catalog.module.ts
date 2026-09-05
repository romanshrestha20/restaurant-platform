import { Module } from '@nestjs/common';
import { CatalogController } from './catalog.controller';
import { CatalogService } from './catalog.service';
import { RestaurantsModule } from '../restaurants/restaurants.module';

@Module({ imports: [RestaurantsModule], controllers: [CatalogController], providers: [CatalogService] })
export class CatalogModule {}
