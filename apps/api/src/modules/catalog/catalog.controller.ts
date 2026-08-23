import { Controller, Get, Param, Query } from '@nestjs/common';
import { CatalogService } from './catalog.service';

@Controller('catalog/restaurants')
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

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
