/*
  Warnings:

  - You are about to drop the column `level` on the `Incident` table. All the data in the column will be lost.
  - You are about to drop the column `memo` on the `Incident` table. All the data in the column will be lost.
  - You are about to drop the column `overridden` on the `Incident` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Incident" DROP COLUMN "level",
DROP COLUMN "memo",
DROP COLUMN "overridden",
ADD COLUMN     "description" TEXT,
ADD COLUMN     "impactManual" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "type" TEXT,
ADD COLUMN     "urgencyManual" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "status" SET DEFAULT 'open',
ALTER COLUMN "urgency" DROP NOT NULL,
ALTER COLUMN "impact" DROP NOT NULL;

-- CreateTable
CREATE TABLE "IncidentHistory" (
    "id" TEXT NOT NULL,
    "incidentId" TEXT NOT NULL,
    "field" TEXT NOT NULL,
    "oldValue" TEXT,
    "newValue" TEXT,
    "changedBy" TEXT NOT NULL,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IncidentHistory_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "IncidentHistory" ADD CONSTRAINT "IncidentHistory_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "Incident"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
