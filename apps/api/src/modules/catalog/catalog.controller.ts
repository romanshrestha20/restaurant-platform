import { Controller, Get, Param } from '@nestjs/common';
import { CatalogService } from './catalog.service';

@Controller('catalog/restaurants')
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @Get(':slug')
  getRestaurantCatalog(@Param('slug') slug: string) {
    return this.catalogService.getRestaurantCatalog(slug);
  }
}
