import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';

/** Resolves the one restaurant exposed by the product while retaining DB scoping. */
@Injectable()
export class PrimaryRestaurantService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async getPrimaryRestaurant() {
    const slug = this.config.get<string>('PRIMARY_RESTAURANT_SLUG', 'nordic-table-helsinki');
    const restaurant = await this.prisma.restaurant.findFirst({
      where: { slug, isActive: true, status: 'ACTIVE', deletedAt: null },
    });
    if (!restaurant) throw new NotFoundException('Primary restaurant is not configured');
    return restaurant;
  }
}
