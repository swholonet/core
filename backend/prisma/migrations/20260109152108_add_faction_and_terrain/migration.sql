-- AlterTable
ALTER TABLE "BuildingType" ADD COLUMN     "allowedFieldTypes" TEXT NOT NULL DEFAULT 'LAND';

-- AlterTable
ALTER TABLE "ResearchType" ADD COLUMN     "factionId" INTEGER;

-- AddForeignKey
ALTER TABLE "ResearchType" ADD CONSTRAINT "ResearchType_factionId_fkey" FOREIGN KEY ("factionId") REFERENCES "Faction"("id") ON DELETE SET NULL ON UPDATE CASCADE;
