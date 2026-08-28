ALTER TYPE "PaymentStatus" ADD VALUE IF NOT EXISTS 'REFUND_PENDING';
ALTER TYPE "PaymentStatus" ADD VALUE IF NOT EXISTS 'PARTIALLY_REFUNDED';
ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "providerPaymentId" TEXT;
CREATE TABLE IF NOT EXISTS "payment_attempts" (
  "id" TEXT NOT NULL, "paymentId" TEXT NOT NULL, "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
  "providerPaymentId" TEXT, "failureReason" TEXT, "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completedAt" TIMESTAMP(3), CONSTRAINT "payment_attempts_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "payment_attempts_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "payments"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "payment_attempts_paymentId_status_idx" ON "payment_attempts"("paymentId", "status");
CREATE TABLE IF NOT EXISTS "payment_events" (
  "id" TEXT NOT NULL, "paymentId" TEXT, "providerEventId" TEXT NOT NULL, "type" TEXT NOT NULL,
  "payload" JSONB NOT NULL, "processedAt" TIMESTAMP(3), "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "payment_events_pkey" PRIMARY KEY ("id"), CONSTRAINT "payment_events_providerEventId_key" UNIQUE ("providerEventId"),
  CONSTRAINT "payment_events_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "payments"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "payment_events_paymentId_createdAt_idx" ON "payment_events"("paymentId", "createdAt");
