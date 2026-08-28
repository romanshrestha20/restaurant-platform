export interface PaymentProvider {
  createPayment(input: {
    amount: number;
    currency: string;
    orderId: string;
    attemptId: string;
  }): Promise<{ providerPaymentId: string; checkoutUrl?: string }>;
  refundPayment(providerPaymentId: string, amount: number): Promise<void>;
  cancelPayment(providerPaymentId: string): Promise<void>;
}
