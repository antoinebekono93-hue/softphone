-- AlterTable
ALTER TABLE "AIEmployee" ADD COLUMN "telnyxAssistantId" TEXT,
ADD COLUMN "voiceProvider" TEXT NOT NULL DEFAULT 'LEGACY';

-- AlterTable
ALTER TABLE "CallLog" ADD COLUMN "telnyxConversationId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "AIEmployee_telnyxAssistantId_key" ON "AIEmployee"("telnyxAssistantId");
