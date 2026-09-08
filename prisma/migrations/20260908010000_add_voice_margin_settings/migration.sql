-- Telnyx voice pricing configured in God Mode.
-- Existing effective sell rate is preserved: $0.02/min × (1 + 0%).
ALTER TABLE "SystemSettings"
  ADD COLUMN "callBaseRatePerMinute" DECIMAL(12,6) NOT NULL DEFAULT 0.02,
  ADD COLUMN "callMarkupPercent" DECIMAL(8,4) NOT NULL DEFAULT 0.0;
