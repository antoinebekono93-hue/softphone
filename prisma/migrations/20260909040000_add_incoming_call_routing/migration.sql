ALTER TABLE "PhoneNumber"
  ADD COLUMN "incomingRoutingMode" TEXT NOT NULL DEFAULT 'APP',
  ADD COLUMN "incomingRoutingEnabled" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "forwardToE164" TEXT,
  ADD COLUMN "ringAppSeconds" INTEGER NOT NULL DEFAULT 15;

ALTER TABLE "CallLog"
  ADD COLUMN "callPurpose" TEXT NOT NULL DEFAULT 'PSTN',
  ADD COLUMN "parentCallLogId" TEXT,
  ADD COLUMN "forwardStatus" TEXT,
  ADD COLUMN "forwardDueAt" TIMESTAMP(3),
  ADD COLUMN "forwardToE164" TEXT,
  ADD COLUMN "forwardCommandId" TEXT,
  ADD COLUMN "forwardStartedAt" TIMESTAMP(3);

CREATE UNIQUE INDEX "CallLog_parentCallLogId_key" ON "CallLog"("parentCallLogId");
CREATE UNIQUE INDEX "CallLog_forwardCommandId_key" ON "CallLog"("forwardCommandId");
CREATE INDEX "CallLog_forwardStatus_forwardDueAt_idx" ON "CallLog"("forwardStatus", "forwardDueAt");
CREATE INDEX "CallLog_callPurpose_idx" ON "CallLog"("callPurpose");

ALTER TABLE "CallLog"
  ADD CONSTRAINT "CallLog_parentCallLogId_fkey"
  FOREIGN KEY ("parentCallLogId") REFERENCES "CallLog"("id") ON DELETE SET NULL ON UPDATE CASCADE;
