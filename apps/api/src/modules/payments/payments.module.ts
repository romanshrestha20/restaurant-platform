import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { NoopPaymentProvider } from './providers/noop-payment.provider';
@Module({ imports: [PrismaModule], controllers: [PaymentsController], providers: [PaymentsService, NoopPaymentProvider], exports: [PaymentsService] })
export class PaymentsModule {}
