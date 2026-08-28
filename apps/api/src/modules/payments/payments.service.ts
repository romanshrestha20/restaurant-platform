import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PaymentStatus, Prisma } from '@restaurant/database/generated';
import { PrismaService } from '../../prisma/prisma.service';
import type { PaymentProvider } from './providers/payment-provider.interface';
import { PAYMENT_PROVIDER } from './providers/payment-provider.token';

@Injectable()
export class PaymentsService {
  constructor(private readonly prisma: PrismaService, @Inject(PAYMENT_PROVIDER) private readonly provider: PaymentProvider) {}

  async retry(userId: string, orderId: string) {
    const payment = await this.prisma.payment.findFirst({ where: { orderId, order: { userId } }, include: { order: true } });
    if (!payment) throw new NotFoundException('Payment not found');
    if (payment.status === PaymentStatus.PAID) throw new ConflictException('Payment is already paid');
    const attempt = await this.prisma.paymentAttempt.create({ data: { paymentId: payment.id, status: PaymentStatus.PROCESSING } });
    const created = await this.provider.createPayment({ amount: Number(payment.amount), currency: payment.currency, orderId, paymentId: payment.id, attemptId: attempt.id });
    await this.prisma.payment.update({ where: { id: payment.id }, data: { status: PaymentStatus.PROCESSING, providerPaymentId: created.providerPaymentId } });
    return { paymentId: payment.id, attemptId: attempt.id, status: PaymentStatus.PROCESSING, clientSecret: created.clientSecret ?? null, checkoutUrl: created.checkoutUrl ?? null };
  }

  async webhook(event: { id: string; type: string; paymentId: string; providerPaymentId?: string; amount?: number; currency?: string; failureReason?: string; payload?: unknown }) {
    try {
      return await this.prisma.$transaction(async (tx) => {
        const existing = await tx.paymentEvent.findUnique({ where: { providerEventId: event.id } });
        if (existing) return { duplicate: true };
        const payment = await tx.payment.findUnique({ where: { id: event.paymentId }, include: { order: true } });
        if (!payment) throw new NotFoundException('Payment not found');
        if (event.amount !== undefined && Number(payment.amount) !== event.amount) throw new ConflictException('Payment amount mismatch');
        if (event.currency && payment.currency !== event.currency) throw new ConflictException('Payment currency mismatch');
        const status = event.type === 'payment.succeeded' ? PaymentStatus.PAID : event.type === 'payment.failed' ? PaymentStatus.FAILED : event.type === 'payment.cancelled' ? PaymentStatus.CANCELLED : event.type === 'payment.refunded' ? PaymentStatus.REFUNDED : payment.status;
        await tx.paymentEvent.create({ data: { providerEventId: event.id, paymentId: payment.id, type: event.type, payload: (event.payload ?? event) as Prisma.InputJsonValue, processedAt: new Date() } });
        await tx.payment.update({ where: { id: payment.id }, data: { status, providerPaymentId: event.providerPaymentId ?? payment.providerPaymentId, paidAt: status === PaymentStatus.PAID ? new Date() : payment.paidAt, refundedAt: status === PaymentStatus.REFUNDED ? new Date() : payment.refundedAt } });
        if (status === PaymentStatus.PAID) await tx.order.update({ where: { id: payment.orderId }, data: { status: 'CONFIRMED' } });
        return { duplicate: false, status };
      });
    } catch (error) { throw error; }
  }
}
