import { Catch } from '@nestjs/common';
import { BaseWsExceptionFilter } from '@nestjs/websockets';

@Catch()
export class RealtimeExceptionFilter extends BaseWsExceptionFilter {}
