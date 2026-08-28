import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { NoopPaymentProvider } from './providers/noop-payment.provider';
import { StripePaymentProvider } from './providers/stripe-payment.provider';
import { PAYMENT_PROVIDER } from './providers/payment-provider.token';
import { ConfigModule, ConfigService } from '@nestjs/config';
@Module({ imports: [PrismaModule, ConfigModule], controllers: [PaymentsController], providers: [PaymentsService, NoopPaymentProvider, StripePaymentProvider, { provide: PAYMENT_PROVIDER, inject: [ConfigService, NoopPaymentProvider, StripePaymentProvider], useFactory: (config: ConfigService, noop: NoopPaymentProvider, stripe: StripePaymentProvider) => config.get('STRIPE_SECRET_KEY') ? stripe : noop }], exports: [PaymentsService] })
export class PaymentsModule {}
