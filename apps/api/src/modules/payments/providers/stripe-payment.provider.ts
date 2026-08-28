import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, timingSafeEqual } from 'node:crypto';
import type { PaymentProvider } from './payment-provider.interface';

@Injectable()
export class StripePaymentProvider implements PaymentProvider {
  constructor(private readonly config: ConfigService) {}
  private async call(path: string, body: URLSearchParams, key: string) {
    const secret = this.config.get<string>('STRIPE_SECRET_KEY');
    if (!secret) throw new ServiceUnavailableException('Card payments are not configured');
    const response = await fetch(`https://api.stripe.com/v1/${path}`, { method: 'POST', headers: { Authorization: `Bearer ${secret}`, 'Content-Type': 'application/x-www-form-urlencoded', 'Idempotency-Key': key }, body });
    const result = await response.json() as { id?: string; client_secret?: string; error?: { message?: string } };
    if (!response.ok) throw new ServiceUnavailableException(result.error?.message ?? 'Payment provider request failed');
    return result;
  }
  async createPayment(input: { amount: number; currency: string; orderId: string; paymentId: string; attemptId: string }) {
    const result = await this.call('payment_intents', new URLSearchParams({ amount: String(Math.round(input.amount * 100)), currency: input.currency.toLowerCase(), 'metadata[orderId]': input.orderId, 'metadata[paymentId]': input.paymentId, 'metadata[attemptId]': input.attemptId, 'automatic_payment_methods[enabled]': 'true' }), `payment-attempt:${input.attemptId}`);
    return { providerPaymentId: result.id!, clientSecret: result.client_secret };
  }
  async refundPayment(providerPaymentId: string, amount: number) { await this.call('refunds', new URLSearchParams({ payment_intent: providerPaymentId, amount: String(Math.round(amount * 100)) }), `refund:${providerPaymentId}:${amount}`); }
  async cancelPayment(providerPaymentId: string) { await this.call(`payment_intents/${providerPaymentId}`, new URLSearchParams(), `cancel:${providerPaymentId}`); }
  verifyWebhook(rawBody: Buffer, signature: string): Record<string, unknown> {
    const secret = this.config.get<string>('STRIPE_WEBHOOK_SECRET');
    if (!secret) throw new ServiceUnavailableException('Stripe webhook verification is not configured');
    const parts = Object.fromEntries(signature.split(',').map((part) => part.split('=')));
    const timestamp = parts.t as string | undefined;
    const received = parts.v1 as string | undefined;
    if (!timestamp || !received || Math.abs(Date.now() / 1000 - Number(timestamp)) > 300) throw new ServiceUnavailableException('Invalid Stripe webhook signature');
    const expected = createHmac('sha256', secret).update(`${timestamp}.${rawBody.toString('utf8')}`).digest('hex');
    if (received.length !== expected.length || !timingSafeEqual(Buffer.from(received), Buffer.from(expected))) throw new ServiceUnavailableException('Invalid Stripe webhook signature');
    return JSON.parse(rawBody.toString('utf8')) as Record<string, unknown>;
  }
}
