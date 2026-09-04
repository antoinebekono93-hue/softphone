-- Phase 1 : Plans "Appels Illimités" (APP_TO_APP) & Facturation
-- ============================================================
-- APP_TO_APP  : WebRTC natif P2P, sans Telnyx, ni quota/wallet (illimité commercial)
-- APP_TO_PSTN : via Telnyx, TOUJOURS soumis au quota/wallet + pré-autorisation
-- Les limites 3600/1/20/100 sont des PROTECTIONS TECHNIQUES / fair-use,
-- pas le quota commercial APP_TO_APP.

-- CreateEnum
CREATE TYPE "CallType" AS ENUM ('APP_TO_APP', 'APP_TO_PSTN');

-- CreateEnum
CREATE TYPE "AppCallStatus" AS ENUM ('OFFERING', 'RINGING', 'CONNECTING', 'ACTIVE', 'ENDED', 'MISSED', 'DECLINED', 'FAILED');

-- AlterTable : User — identité d'appel APP_TO_APP unique par organisation
ALTER TABLE "User" ADD COLUMN "callExtension" TEXT,
ADD COLUMN "callUsername" TEXT,
ADD COLUMN "isCallable" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable : Organization — Float -> Decimal (USING pour cast explicit des données existantes)
ALTER TABLE "Organization" ADD COLUMN "activeCallsCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Organization" ALTER COLUMN "walletBalance" SET DATA TYPE DECIMAL(12,4) USING "walletBalance"::decimal(12,4);

-- AlterTable : CallLog — facturation & snapshot du plan au moment de l'appel
ALTER TABLE "CallLog" ADD COLUMN "billedAmount" DECIMAL(12,4),
ADD COLUMN "billedAt" TIMESTAMP(3),
ADD COLUMN "cost" DECIMAL(12,4),
ADD COLUMN "isBilled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "planIdAtCallTime" TEXT;

-- AlterTable : PricingPlan — limites commerciales / fair-use & fonctionnalités
-- allowedDestinations/blockedDestinations : chaîne vide ("") = AUCUNE restriction configurée
-- (jamais interprété comme "aucune destination autorisée")
ALTER TABLE "PricingPlan" ADD COLUMN "allowedDestinations" TEXT NOT NULL DEFAULT '',
ADD COLUMN "blockedDestinations" TEXT NOT NULL DEFAULT '',
ADD COLUMN "hasAdvancedAnalytics" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "hasCallRouting" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "hasRecording" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "hasTransfer" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "internationalEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "maxCallDurationSeconds" INTEGER NOT NULL DEFAULT 3600,
ADD COLUMN "maxCallsPerDay" INTEGER NOT NULL DEFAULT 100,
ADD COLUMN "maxCallsPerHour" INTEGER NOT NULL DEFAULT 20,
ADD COLUMN "maxConcurrentCalls" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN "preAuthRequired" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "unlimitedCalls" BOOLEAN NOT NULL DEFAULT false;

-- Float -> Decimal (USING explicit)
ALTER TABLE "PricingPlan" ALTER COLUMN "monthlyPrice" SET DATA TYPE DECIMAL(12,4) USING "monthlyPrice"::decimal(12,4);

-- AlterTable : WalletTransaction — idempotence de facturation (callControlId + UNIQUE(type))
ALTER TABLE "WalletTransaction" ADD COLUMN "callControlId" TEXT;
ALTER TABLE "WalletTransaction" ALTER COLUMN "amount" SET DATA TYPE DECIMAL(12,4) USING "amount"::decimal(12,4);

-- AlterTable : SystemSettings — Float -> Decimal (USING explicit)
ALTER TABLE "SystemSettings" ALTER COLUMN "smsRate" SET DATA TYPE DECIMAL(12,6) USING "smsRate"::decimal(12,6),
ALTER COLUMN "callRatePerMinute" SET DATA TYPE DECIMAL(12,6) USING "callRatePerMinute"::decimal(12,6),
ALTER COLUMN "aiAgentRatePerMinute" SET DATA TYPE DECIMAL(12,6) USING "aiAgentRatePerMinute"::decimal(12,6),
ALTER COLUMN "whatsappRate" SET DATA TYPE DECIMAL(12,6) USING "whatsappRate"::decimal(12,6),
ALTER COLUMN "phoneNumberRate" SET DATA TYPE DECIMAL(12,4) USING "phoneNumberRate"::decimal(12,4),
ALTER COLUMN "eSimRate" SET DATA TYPE DECIMAL(12,4) USING "eSimRate"::decimal(12,4),
ALTER COLUMN "phoneNumberMarkupFixed" SET DATA TYPE DECIMAL(12,4) USING "phoneNumberMarkupFixed"::decimal(12,4),
ALTER COLUMN "phoneNumberMarkupMultiplier" SET DATA TYPE DECIMAL(12,4) USING "phoneNumberMarkupMultiplier"::decimal(12,4);

-- CreateTable : CallReservation — pré-autorisation de solde
-- callLogId NULLABLE + UNIQUE + FK ON DELETE SET NULL (FK côté réservation, jamais sur CallLog)
CREATE TABLE "CallReservation" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "callLogId" TEXT,
    "amount" DECIMAL(12,4) NOT NULL,
    "actualCost" DECIMAL(12,4),
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "settledAt" TIMESTAMP(3),

    CONSTRAINT "CallReservation_pkey" PRIMARY KEY ("id")
);

-- CreateTable : CallLimit — suspensions / avertissements anti-abus
CREATE TABLE "CallLimit" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CallLimit_pkey" PRIMARY KEY ("id")
);

-- CreateTable : UsageLog — audit trail des opérations d'appels & de facturation
CREATE TABLE "UsageLog" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "callControlId" TEXT,
    "destination" TEXT,
    "durationSeconds" INTEGER,
    "cost" DECIMAL(12,4),
    "details" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UsageLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable : AppCallSession — session WebRTC APP_TO_APP (enums réels PostgreSQL)
-- organizationId NOT NULL (MVP : appels uniquement intra-organisation)
CREATE TABLE "AppCallSession" (
    "id" TEXT NOT NULL,
    "callType" "CallType" NOT NULL DEFAULT 'APP_TO_APP',
    "status" "AppCallStatus" NOT NULL DEFAULT 'OFFERING',
    "callerId" TEXT NOT NULL,
    "calleeId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "answeredAt" TIMESTAMP(3),
    "connectedAt" TIMESTAMP(3),
    "endedAt" TIMESTAMP(3),
    "durationSeconds" INTEGER NOT NULL DEFAULT 0,
    "failReason" TEXT,

    CONSTRAINT "AppCallSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex : CallReservation
CREATE UNIQUE INDEX "CallReservation_callLogId_key" ON "CallReservation"("callLogId");
CREATE INDEX "CallReservation_organizationId_idx" ON "CallReservation"("organizationId");
CREATE INDEX "CallReservation_callLogId_idx" ON "CallReservation"("callLogId");
CREATE INDEX "CallReservation_status_idx" ON "CallReservation"("status");

-- CreateIndex : CallLimit
CREATE INDEX "CallLimit_organizationId_idx" ON "CallLimit"("organizationId");
CREATE INDEX "CallLimit_active_idx" ON "CallLimit"("active");
CREATE INDEX "CallLimit_organizationId_active_idx" ON "CallLimit"("organizationId", "active");

-- CreateIndex : UsageLog
CREATE INDEX "UsageLog_organizationId_idx" ON "UsageLog"("organizationId");
CREATE INDEX "UsageLog_callControlId_idx" ON "UsageLog"("callControlId");
CREATE INDEX "UsageLog_action_idx" ON "UsageLog"("action");
CREATE INDEX "UsageLog_createdAt_idx" ON "UsageLog"("createdAt");
CREATE INDEX "UsageLog_organizationId_action_createdAt_idx" ON "UsageLog"("organizationId", "action", "createdAt");

-- CreateIndex : AppCallSession
CREATE INDEX "AppCallSession_status_idx" ON "AppCallSession"("status");
CREATE INDEX "AppCallSession_callerId_idx" ON "AppCallSession"("callerId");
CREATE INDEX "AppCallSession_calleeId_idx" ON "AppCallSession"("calleeId");
CREATE INDEX "AppCallSession_organizationId_idx" ON "AppCallSession"("organizationId");

-- CreateIndex : User — identité d'appel unique par organisation
CREATE UNIQUE INDEX "User_organizationId_callUsername_key" ON "User"("organizationId", "callUsername");
CREATE UNIQUE INDEX "User_organizationId_callExtension_key" ON "User"("organizationId", "callExtension");

-- CreateIndex : CallLog — file de facturation idempotente
CREATE INDEX "CallLog_isBilled_idx" ON "CallLog"("isBilled");
CREATE INDEX "CallLog_organizationId_isBilled_idx" ON "CallLog"("organizationId", "isBilled");

-- CreateIndex : WalletTransaction — idempotence de facturation
CREATE INDEX "WalletTransaction_callControlId_idx" ON "WalletTransaction"("callControlId");
CREATE UNIQUE INDEX "unique_billing_per_call" ON "WalletTransaction"("callControlId", "type");

-- AddForeignKey : CallReservation -> Organization / CallLog (SET NULL)
ALTER TABLE "CallReservation" ADD CONSTRAINT "CallReservation_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CallReservation" ADD CONSTRAINT "CallReservation_callLogId_fkey" FOREIGN KEY ("callLogId") REFERENCES "CallLog"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey : CallLimit -> Organization
ALTER TABLE "CallLimit" ADD CONSTRAINT "CallLimit_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey : UsageLog -> Organization / User
ALTER TABLE "UsageLog" ADD CONSTRAINT "UsageLog_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UsageLog" ADD CONSTRAINT "UsageLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey : AppCallSession -> User (caller/callee RESTRICT) / Organization
ALTER TABLE "AppCallSession" ADD CONSTRAINT "AppCallSession_callerId_fkey" FOREIGN KEY ("callerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AppCallSession" ADD CONSTRAINT "AppCallSession_calleeId_fkey" FOREIGN KEY ("calleeId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AppCallSession" ADD CONSTRAINT "AppCallSession_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
