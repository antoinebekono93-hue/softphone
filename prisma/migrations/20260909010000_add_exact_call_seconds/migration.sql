ALTER TABLE "Organization"
ADD COLUMN "callSecondsUsedThisMonth" INTEGER NOT NULL DEFAULT 0;

UPDATE "Organization"
SET "callSecondsUsedThisMonth" = GREATEST("minutesUsedThisMonth", 0) * 60;
