ALTER TABLE "WhatsAppAccount"
  ADD COLUMN "telnyxId" TEXT,
  ADD COLUMN "accountReviewStatus" TEXT,
  ADD COLUMN "businessVerificationStatus" TEXT,
  ADD COLUMN "qualityRating" TEXT,
  ADD COLUMN "enabled" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "callingEnabled" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "webhookEnabled" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "timezone" TEXT,
  ADD COLUMN "messagingProfileId" TEXT,
  ALTER COLUMN "accessToken" DROP NOT NULL,
  ALTER COLUMN "status" SET DEFAULT 'PENDING';

CREATE UNIQUE INDEX "WhatsAppAccount_telnyxId_key" ON "WhatsAppAccount"("telnyxId");
CREATE INDEX "WhatsAppAccount_wabaId_idx" ON "WhatsAppAccount"("wabaId");
CREATE INDEX "WhatsAppAccount_phoneNumberId_idx" ON "WhatsAppAccount"("phoneNumberId");
CREATE INDEX "WhatsAppAccount_phoneNumber_idx" ON "WhatsAppAccount"("phoneNumber");

ALTER TABLE "WhatsAppTemplate"
  ADD COLUMN "telnyxId" TEXT,
  ADD COLUMN "metaTemplateId" TEXT,
  ADD COLUMN "rejectionReason" TEXT,
  ALTER COLUMN "status" SET DEFAULT 'PENDING';

CREATE UNIQUE INDEX "WhatsAppTemplate_telnyxId_key" ON "WhatsAppTemplate"("telnyxId");
CREATE INDEX "WhatsAppTemplate_metaTemplateId_idx" ON "WhatsAppTemplate"("metaTemplateId");
