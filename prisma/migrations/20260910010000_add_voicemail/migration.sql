ALTER TABLE "PhoneNumber"
ADD COLUMN "voicemailEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "voicemailDelaySeconds" INTEGER NOT NULL DEFAULT 25,
ADD COLUMN "voicemailGreeting" TEXT;

ALTER TABLE "CallLog"
ADD COLUMN "voicemailStatus" TEXT,
ADD COLUMN "voicemailDueAt" TIMESTAMP(3),
ADD COLUMN "voicemailCommandId" TEXT,
ADD COLUMN "voicemailStartedAt" TIMESTAMP(3),
ADD COLUMN "voicemailRecordingId" TEXT;

CREATE UNIQUE INDEX "CallLog_voicemailCommandId_key" ON "CallLog"("voicemailCommandId");
CREATE INDEX "CallLog_voicemailStatus_voicemailDueAt_idx" ON "CallLog"("voicemailStatus", "voicemailDueAt");
