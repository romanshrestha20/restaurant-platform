import { Module } from '@nestjs/common';
import { AuthModule } from '../../modules/auth/auth.module';
import { RealtimeAuthGuard } from './realtime-auth.guard';
import { RealtimeAuthService } from './realtime-auth.service';
import { RealtimeExceptionFilter } from './realtime-exception.filter';
import { RealtimeGateway } from './realtime.gateway';
import { RealtimeRoomService } from './realtime-room.service';

@Module({
  imports: [AuthModule],
  providers: [
    RealtimeGateway,
    RealtimeAuthService,
    RealtimeAuthGuard,
    RealtimeExceptionFilter,
    RealtimeRoomService,
  ],
  exports: [RealtimeGateway],
})
export class RealtimeModule {}
