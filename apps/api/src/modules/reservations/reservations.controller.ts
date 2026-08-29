import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AccessTokenGuard } from '../../common/guards/access-token.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AccessAuthUser } from '../auth/interfaces/auth-user.interface';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { ReservationsService } from './reservations.service';
@Controller('reservations')
@UseGuards(AccessTokenGuard)
export class ReservationsController {
  constructor(private readonly service: ReservationsService) {}
  @Get() list(@CurrentUser() user: AccessAuthUser) {
    return this.service.list(user.id);
  }
  @Post() create(
    @CurrentUser() user: AccessAuthUser,
    @Body() dto: CreateReservationDto,
  ) {
    return this.service.create(user.id, dto);
  }
  @Delete(':id') cancel(
    @CurrentUser() user: AccessAuthUser,
    @Param('id') id: string,
  ) {
    return this.service.cancel(user.id, id);
  }
}
