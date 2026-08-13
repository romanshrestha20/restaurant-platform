import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class RealtimeRoomService {
  constructor(private readonly prisma: PrismaService) {}

  async findRestaurantIdsForUser(userId: string): Promise<string[]> {
    const memberships = await this.prisma.restaurantMember.findMany({
      where: {
        userId,
        restaurant: { isActive: true, deletedAt: null },
      },
      select: { restaurantId: true },
    });

    return memberships.map(({ restaurantId }) => restaurantId);
  }
}
