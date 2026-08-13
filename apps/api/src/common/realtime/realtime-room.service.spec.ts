import { Test, type TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../prisma/prisma.service';
import { RealtimeRoomService } from './realtime-room.service';

describe('RealtimeRoomService', () => {
  let service: RealtimeRoomService;
  let findMany: jest.Mock;

  beforeEach(async () => {
    findMany = jest
      .fn()
      .mockResolvedValue([
        { restaurantId: 'restaurant-1' },
        { restaurantId: 'restaurant-2' },
      ]);
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RealtimeRoomService,
        {
          provide: PrismaService,
          useValue: { restaurantMember: { findMany } },
        },
      ],
    }).compile();

    service = module.get(RealtimeRoomService);
  });

  it('returns active restaurant memberships for a user', async () => {
    await expect(service.findRestaurantIdsForUser('user-1')).resolves.toEqual([
      'restaurant-1',
      'restaurant-2',
    ]);
    expect(findMany).toHaveBeenCalledWith({
      where: {
        userId: 'user-1',
        restaurant: { isActive: true, deletedAt: null },
      },
      select: { restaurantId: true },
    });
  });
});
