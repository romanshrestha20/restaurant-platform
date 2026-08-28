import { Injectable } from '@nestjs/common';
import type { PaymentProvider } from './payment-provider.interface';

@Injectable()
export class NoopPaymentProvider implements PaymentProvider {
  async createPayment(input: {
    amount: number;
    currency: string;
    orderId: string;
    attemptId: string;
  }): Promise<{ providerPaymentId: string; checkoutUrl?: string }> {
    return { providerPaymentId: `pending_${input.attemptId}` };
  }
  async refundPayment(_providerPaymentId: string, _amount: number) {}
  async cancelPayment(_providerPaymentId: string) {}
}
