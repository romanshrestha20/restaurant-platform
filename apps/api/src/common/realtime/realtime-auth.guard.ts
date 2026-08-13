import type { CanActivate, ExecutionContext } from '@nestjs/common';
import { Injectable } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import type { RealtimeSocket } from './realtime.types';

@Injectable()
export class RealtimeAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const client = context.switchToWs().getClient<RealtimeSocket>();
    if (!client.data.user) {
      throw new WsException('Unauthorized');
    }
    return true;
  }
}
