-- Phase 4A.2 : horaires d'ouverture (business hours).
-- Une ligne = une fenêtre ouvrée pour un jour de la semaine. `aiEmployeeId`
-- NULL = horaire par défaut de l'organisation ; non NULL = horaire spécifique
-- qui REMPLACE entièrement le défaut pour cet employé.
-- `dayOfWeek` suit `Date.getDay()` (0 = dimanche … 6 = samedi).
-- `opensAt`/`closesAt` sont des heures MURALES locales "HH:mm" interprétées
-- dans le fuseau IANA, pas des instants UTC. Les fenêtres à cheval sur minuit
-- ne sont pas supportées (`opensAt` < `closesAt`).

-- CreateTable
CREATE TABLE "BusinessHour" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "aiEmployeeId" TEXT,
    "dayOfWeek" INTEGER NOT NULL,
    "opensAt" TEXT NOT NULL,
    "closesAt" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BusinessHour_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BusinessHour_organizationId_aiEmployeeId_dayOfWeek_idx" ON "BusinessHour"("organizationId", "aiEmployeeId", "dayOfWeek");

-- AddForeignKey
ALTER TABLE "BusinessHour" ADD CONSTRAINT "BusinessHour_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessHour" ADD CONSTRAINT "BusinessHour_aiEmployeeId_fkey" FOREIGN KEY ("aiEmployeeId") REFERENCES "AIEmployee"("id") ON DELETE CASCADE ON UPDATE CASCADE;
