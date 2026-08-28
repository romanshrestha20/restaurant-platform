import { Body, Controller, Headers, Param, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { AccessTokenGuard } from '../../common/guards/access-token.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AccessAuthUser } from '../auth/interfaces/auth-user.interface';
import { PaymentsService } from './payments.service';
import { StripePaymentProvider } from './providers/stripe-payment.provider';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly payments: PaymentsService, private readonly stripe: StripePaymentProvider) {}
  @Post('orders/:orderId/retry') @UseGuards(AccessTokenGuard)
  retry(@CurrentUser() user: AccessAuthUser, @Param('orderId') orderId: string) { return this.payments.retry(user.id, orderId); }
  @Post('webhook')
  webhook(@Headers('stripe-signature') signature: string, @Req() request: Request & { rawBody?: Buffer }, @Body() body: unknown) {
    const event = this.stripe.verifyWebhook(request.rawBody ?? Buffer.from(JSON.stringify(body)), signature);
    const data = (event.data as { object?: Record<string, unknown> })?.object ?? {};
    const metadata = (data.metadata ?? {}) as Record<string, string>;
    const type = String(event.type);
    const paymentId = metadata.paymentId;
    const providerPaymentId = String(data.payment_intent ?? data.id ?? '');
    if (!paymentId) return { received: true, ignored: true };
    const mappedType = type === 'payment_intent.succeeded' ? 'payment.succeeded' : type === 'payment_intent.payment_failed' ? 'payment.failed' : type === 'payment_intent.canceled' ? 'payment.cancelled' : type === 'charge.refunded' ? 'payment.refunded' : type;
    return this.payments.webhook({ id: String(event.id), type: mappedType, paymentId, providerPaymentId, amount: typeof data.amount_received === 'number' ? data.amount_received / 100 : typeof data.amount === 'number' ? data.amount / 100 : undefined, currency: typeof data.currency === 'string' ? data.currency.toUpperCase() : undefined, failureReason: typeof data.last_payment_error === 'object' && data.last_payment_error ? String((data.last_payment_error as { message?: string }).message ?? '') : undefined, payload: event });
  }
}
