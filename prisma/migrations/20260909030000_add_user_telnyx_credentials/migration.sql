ALTER TABLE "User"
  ADD COLUMN "telnyxTelephonyCredentialId" TEXT,
  ADD COLUMN "telnyxCredentialConnectionId" TEXT;

CREATE UNIQUE INDEX "User_telnyxTelephonyCredentialId_key"
  ON "User"("telnyxTelephonyCredentialId");

CREATE INDEX "User_telnyxCredentialConnectionId_idx"
  ON "User"("telnyxCredentialConnectionId");
