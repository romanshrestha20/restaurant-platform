import { Body, Controller, Headers, Param, Post, UseGuards } from '@nestjs/common';
import { AccessTokenGuard } from '../../common/guards/access-token.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AccessAuthUser } from '../auth/interfaces/auth-user.interface';
import { PaymentsService } from './payments.service';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly payments: PaymentsService) {}
  @Post('orders/:orderId/retry') @UseGuards(AccessTokenGuard)
  retry(@CurrentUser() user: AccessAuthUser, @Param('orderId') orderId: string) { return this.payments.retry(user.id, orderId); }
  @Post('webhook')
  webhook(@Headers('x-provider-event-id') id: string, @Body() body: { type: string; paymentId: string; providerPaymentId?: string; amount?: number; currency?: string; failureReason?: string }) { return this.payments.webhook({ ...body, id }); }
}
