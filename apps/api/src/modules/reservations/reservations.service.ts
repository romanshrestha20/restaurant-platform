import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateReservationDto } from './dto/create-reservation.dto';

@Injectable()
export class ReservationsService {
  constructor(private readonly prisma: PrismaService) {}
  async list(userId: string) {
    return this.prisma.reservation.findMany({
      where: { userId },
      include: {
        restaurant: {
          select: {
            id: true,
            name: true,
            slug: true,
            addresses: {
              where: { isPrimary: true },
              take: 1,
              select: { street: true, city: true },
            },
          },
        },
      },
      orderBy: { reservationAt: 'desc' },
    });
  }
  async create(userId: string, dto: CreateReservationDto) {
    const when = new Date(dto.reservationAt);
    if (when <= new Date())
      throw new BadRequestException('Reservation time must be in the future');
    const restaurant = await this.prisma.restaurant.findFirst({
      where: {
        id: dto.restaurantId,
        isActive: true,
        status: 'ACTIVE',
        deletedAt: null,
        settings: { acceptsReservations: true },
      },
    });
    if (!restaurant)
      throw new NotFoundException('Restaurant is not accepting reservations');
    const conflict = await this.prisma.reservation.findFirst({
      where: {
        restaurantId: dto.restaurantId,
        reservationAt: {
          gte: new Date(when.getTime() - 90 * 60_000),
          lte: new Date(when.getTime() + 90 * 60_000),
        },
        status: { in: ['PENDING', 'CONFIRMED', 'SEATED'] },
      },
    });
    if (conflict)
      throw new BadRequestException('That time is no longer available');
    return this.prisma.reservation.create({
      data: { ...dto, reservationAt: when, userId, source: 'WEBSITE' },
      include: { restaurant: { select: { id: true, name: true, slug: true } } },
    });
  }
  async cancel(userId: string, id: string) {
    const reservation = await this.prisma.reservation.findFirst({
      where: { id, userId },
    });
    if (!reservation) throw new NotFoundException('Reservation not found');
    if (reservation.reservationAt <= new Date())
      throw new BadRequestException('Past reservations cannot be cancelled');
    return this.prisma.reservation.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });
  }
}
