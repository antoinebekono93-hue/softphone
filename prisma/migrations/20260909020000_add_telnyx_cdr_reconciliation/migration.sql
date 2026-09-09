ALTER TABLE "CallLog"
  ADD COLUMN "providerCost" DECIMAL(12,6),
  ADD COLUMN "providerCurrency" TEXT,
  ADD COLUMN "providerBilledSeconds" INTEGER,
  ADD COLUMN "providerReconciledAt" TIMESTAMP(3);

CREATE INDEX "CallLog_providerReconciledAt_idx" ON "CallLog"("providerReconciledAt");

ALTER TABLE "NumberOrder" ADD COLUMN "requestedUserId" TEXT;
