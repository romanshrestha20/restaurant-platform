import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  type WsResponse,
  WsException,
} from '@nestjs/websockets';
import { Logger, UseFilters, UseGuards } from '@nestjs/common';
import type { Namespace } from 'socket.io';

import { RealtimeAuthGuard } from './realtime-auth.guard';
import { RealtimeAuthService } from './realtime-auth.service';
import { RealtimeExceptionFilter } from './realtime-exception.filter';
import {
  REALTIME_EVENTS,
  REALTIME_NAMESPACE,
  realtimeUserRoom,
  realtimeRestaurantRoom,
} from './realtime.constant';
import { RealtimeRoomService } from './realtime-room.service';
import type {
  RealtimePingPayload,
  RealtimePongPayload,
  RealtimeSocket,
  ServerToClientEvents,
} from './realtime.types';

@WebSocketGateway({
  namespace: REALTIME_NAMESPACE,
})
@UseGuards(RealtimeAuthGuard)
@UseFilters(RealtimeExceptionFilter)
export class RealtimeGateway
  implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit
{
  private readonly logger = new Logger(RealtimeGateway.name);

  @WebSocketServer()
  server!: Namespace;

  constructor(
    private readonly realtimeAuthService: RealtimeAuthService,
    private readonly realtimeRoomService: RealtimeRoomService,
  ) {}

  afterInit(server: Namespace): void {
    server.use((socket, next) => {
      void this.realtimeAuthService
        .authenticate(socket as RealtimeSocket)
        .then(() => next())
        .catch(() => next(new Error('Unauthorized')));
    });
    this.logger.log('Socket.io Gateway initialized');
  }

  async handleConnection(
    @ConnectedSocket() client: RealtimeSocket,
  ): Promise<void> {
    if (!client.data.user) {
      client.disconnect(true);
      return;
    }

    client.data.connectedAt = new Date();
    const restaurantIds =
      await this.realtimeRoomService.findRestaurantIdsForUser(
        client.data.user.id,
      );
    await client.join([
      realtimeUserRoom(client.data.user.id),
      ...restaurantIds.map(realtimeRestaurantRoom),
    ]);
    client.emit(REALTIME_EVENTS.READY, {
      userId: client.data.user.id,
      connectedAt: client.data.connectedAt.toISOString(),
    });
    this.logger.log(
      `Socket connected: ${client.id} (user: ${client.data.user.id})`,
    );
  }

  handleDisconnect(@ConnectedSocket() client: RealtimeSocket): void {
    const duration = client.data.connectedAt
      ? new Date().getTime() - client.data.connectedAt.getTime()
      : 0;
    this.logger.log(
      `Socket disconnected: ${client.id} (user: ${client.data.user?.id ?? 'unknown'}, duration: ${duration} ms)`,
    );
  }

  @SubscribeMessage(REALTIME_EVENTS.PING)
  handlePing(
    @MessageBody() payload: RealtimePingPayload | undefined,
  ): WsResponse<RealtimePongPayload> {
    if (payload?.sentAt !== undefined && typeof payload.sentAt !== 'string') {
      throw new WsException('Invalid ping payload');
    }

    return {
      event: REALTIME_EVENTS.PONG,
      data: {
        sentAt: payload?.sentAt ?? null,
        receivedAt: new Date().toISOString(),
      },
    };
  }

  emitToUser<Event extends keyof ServerToClientEvents>(
    userId: string,
    event: Event,
    ...args: Parameters<ServerToClientEvents[Event]>
  ): void {
    this.server.to(realtimeUserRoom(userId)).emit(event, ...args);
  }

  emitToRestaurant<Event extends keyof ServerToClientEvents>(
    restaurantId: string,
    event: Event,
    ...args: Parameters<ServerToClientEvents[Event]>
  ): void {
    this.server.to(realtimeRestaurantRoom(restaurantId)).emit(event, ...args);
  }
}
