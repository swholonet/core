/*
  Warnings:

  - You are about to drop the column `health` on the `Ship` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "ModuleCategory" AS ENUM ('HYPERDRIVE', 'SUBLIGHT_ENGINE', 'WEAPONS', 'SHIELDS', 'SENSORS', 'CARGO', 'LIFE_SUPPORT', 'HULL', 'TRACTOR_BEAM', 'SPECIAL');

-- CreateEnum
CREATE TYPE "ShipClass" AS ENUM ('FIGHTER', 'BOMBER', 'CORVETTE', 'FRIGATE', 'CRUISER', 'CAPITAL', 'TRANSPORT');

-- DropForeignKey
ALTER TABLE "Ship" DROP CONSTRAINT "Ship_shipTypeId_fkey";

-- AlterTable
ALTER TABLE "Ship" DROP COLUMN "health",
ADD COLUMN     "blueprintId" INTEGER,
ADD COLUMN     "cargoCapacity" INTEGER NOT NULL DEFAULT 100,
ADD COLUMN     "crewCapacity" INTEGER NOT NULL DEFAULT 10,
ADD COLUMN     "deflectorShieldStrength" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "hullPoints" INTEGER NOT NULL DEFAULT 100,
ADD COLUMN     "hyperdriveRating" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
ADD COLUMN     "sensorRange" INTEGER NOT NULL DEFAULT 3,
ADD COLUMN     "subLightSpeed" INTEGER NOT NULL DEFAULT 5,
ADD COLUMN     "weaponDamage" INTEGER NOT NULL DEFAULT 10,
ALTER COLUMN "shipTypeId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "ModuleType" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" "ModuleCategory" NOT NULL,
    "maxLevel" INTEGER NOT NULL DEFAULT 10,
    "baseHullPoints" INTEGER NOT NULL DEFAULT 0,
    "baseDamage" INTEGER NOT NULL DEFAULT 0,
    "baseShieldStrength" INTEGER NOT NULL DEFAULT 0,
    "baseSensorRange" INTEGER NOT NULL DEFAULT 0,
    "baseCargoCapacity" INTEGER NOT NULL DEFAULT 0,
    "baseCrewCapacity" INTEGER NOT NULL DEFAULT 0,
    "baseSpeed" INTEGER NOT NULL DEFAULT 0,
    "hyperdriveRating" DOUBLE PRECISION,
    "tibannaConsumption" INTEGER NOT NULL DEFAULT 0,
    "baseCostCredits" INTEGER NOT NULL DEFAULT 0,
    "baseCostDurastahl" INTEGER NOT NULL DEFAULT 0,
    "baseCostKyberKristalle" INTEGER NOT NULL DEFAULT 0,
    "baseCostTibannaGas" INTEGER NOT NULL DEFAULT 0,
    "baseCostBeskar" INTEGER NOT NULL DEFAULT 0,
    "baseCostKristallinesSilizium" INTEGER NOT NULL DEFAULT 0,
    "baseCostEnergiemodule" INTEGER NOT NULL DEFAULT 0,
    "baseBuildTime" INTEGER NOT NULL DEFAULT 5,
    "requiredResearchId" INTEGER,
    "requiredResearchLevel" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "ModuleType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShipBlueprint" (
    "id" SERIAL NOT NULL,
    "playerId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "shipClass" "ShipClass" NOT NULL,
    "description" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "totalHullPoints" INTEGER NOT NULL DEFAULT 0,
    "totalShieldStrength" INTEGER NOT NULL DEFAULT 0,
    "totalDamage" INTEGER NOT NULL DEFAULT 0,
    "totalSpeed" INTEGER NOT NULL DEFAULT 0,
    "totalSensorRange" INTEGER NOT NULL DEFAULT 0,
    "totalCargoCapacity" INTEGER NOT NULL DEFAULT 0,
    "totalCrewRequired" INTEGER NOT NULL DEFAULT 0,
    "hyperdriveRating" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "totalCostCredits" INTEGER NOT NULL DEFAULT 0,
    "totalCostDurastahl" INTEGER NOT NULL DEFAULT 0,
    "totalCostKyberKristalle" INTEGER NOT NULL DEFAULT 0,
    "totalCostTibannaGas" INTEGER NOT NULL DEFAULT 0,
    "totalCostBeskar" INTEGER NOT NULL DEFAULT 0,
    "totalCostKristallinesSilizium" INTEGER NOT NULL DEFAULT 0,
    "totalCostEnergiemodule" INTEGER NOT NULL DEFAULT 0,
    "totalBuildTime" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ShipBlueprint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BlueprintModule" (
    "id" SERIAL NOT NULL,
    "blueprintId" INTEGER NOT NULL,
    "moduleTypeId" INTEGER NOT NULL,
    "level" INTEGER NOT NULL DEFAULT 1,
    "slotPosition" INTEGER NOT NULL,

    CONSTRAINT "BlueprintModule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BlueprintBuildQueue" (
    "id" SERIAL NOT NULL,
    "planetId" INTEGER NOT NULL,
    "blueprintId" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "constructionStartedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "BlueprintBuildQueue_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ModuleType_name_key" ON "ModuleType"("name");

-- CreateIndex
CREATE UNIQUE INDEX "ShipBlueprint_playerId_name_key" ON "ShipBlueprint"("playerId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "BlueprintModule_blueprintId_slotPosition_key" ON "BlueprintModule"("blueprintId", "slotPosition");

-- AddForeignKey
ALTER TABLE "ModuleType" ADD CONSTRAINT "ModuleType_requiredResearchId_fkey" FOREIGN KEY ("requiredResearchId") REFERENCES "ResearchType"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShipBlueprint" ADD CONSTRAINT "ShipBlueprint_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlueprintModule" ADD CONSTRAINT "BlueprintModule_blueprintId_fkey" FOREIGN KEY ("blueprintId") REFERENCES "ShipBlueprint"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlueprintModule" ADD CONSTRAINT "BlueprintModule_moduleTypeId_fkey" FOREIGN KEY ("moduleTypeId") REFERENCES "ModuleType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlueprintBuildQueue" ADD CONSTRAINT "BlueprintBuildQueue_planetId_fkey" FOREIGN KEY ("planetId") REFERENCES "Planet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlueprintBuildQueue" ADD CONSTRAINT "BlueprintBuildQueue_blueprintId_fkey" FOREIGN KEY ("blueprintId") REFERENCES "ShipBlueprint"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ship" ADD CONSTRAINT "Ship_shipTypeId_fkey" FOREIGN KEY ("shipTypeId") REFERENCES "ShipType"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ship" ADD CONSTRAINT "Ship_blueprintId_fkey" FOREIGN KEY ("blueprintId") REFERENCES "ShipBlueprint"("id") ON DELETE SET NULL ON UPDATE CASCADE;
