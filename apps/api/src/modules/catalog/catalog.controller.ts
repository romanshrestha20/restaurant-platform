import { Controller, Get, Param, Query } from '@nestjs/common';
import { CatalogService } from './catalog.service';
import { PrimaryRestaurantService } from '../restaurants/primary-restaurant.service';

@Controller('catalog/restaurants')
export class CatalogController {
  constructor(private readonly catalogService: CatalogService, private readonly primary: PrimaryRestaurantService) {}

  @Get()
  getPrimaryCatalog() {
    return this.primary.getPrimaryRestaurant().then((restaurant) => this.catalogService.getRestaurantCatalog(restaurant.slug));
  }

  @Get()
  listRestaurants(@Query('lat') latitude?: string, @Query('lng') longitude?: string) {
    return this.catalogService.listRestaurants(
      latitude === undefined ? undefined : Number(latitude),
      longitude === undefined ? undefined : Number(longitude),
    );
  }

  @Get(':slug')
  getRestaurantCatalog(@Param('slug') slug: string) {
    return this.catalogService.getRestaurantCatalog(slug);
  }
}
