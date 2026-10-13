-- CreateTable
CREATE TABLE "PaymentIntent" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'CINETPAY',
    "merchantTransactionId" TEXT NOT NULL,
    "providerTransactionId" TEXT,
    "amount" DECIMAL(12,4) NOT NULL,
    "chargeAmount" INTEGER NOT NULL,
    "chargeCurrency" TEXT NOT NULL,
    "notifyToken" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PaymentIntent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PaymentIntent_merchantTransactionId_key" ON "PaymentIntent"("merchantTransactionId");

-- CreateIndex
CREATE INDEX "PaymentIntent_organizationId_idx" ON "PaymentIntent"("organizationId");

-- CreateIndex
CREATE INDEX "PaymentIntent_providerTransactionId_idx" ON "PaymentIntent"("providerTransactionId");

-- AddForeignKey
ALTER TABLE "PaymentIntent" ADD CONSTRAINT "PaymentIntent_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
