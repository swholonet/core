-- AlterTable
ALTER TABLE "Ship" ADD COLUMN     "currentGalaxyX" INTEGER,
ADD COLUMN     "currentGalaxyY" INTEGER,
ADD COLUMN     "currentSystemId" INTEGER,
ADD COLUMN     "currentSystemX" INTEGER,
ADD COLUMN     "currentSystemY" INTEGER,
ADD COLUMN     "destinationX" INTEGER,
ADD COLUMN     "destinationY" INTEGER,
ADD COLUMN     "energyDrive" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "energyWeapons" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'DOCKED';

-- AlterTable
ALTER TABLE "ShipType" ADD COLUMN     "driveEfficiency" INTEGER NOT NULL DEFAULT 10,
ADD COLUMN     "maxEnergyDrive" INTEGER NOT NULL DEFAULT 500,
ADD COLUMN     "maxEnergyWeapons" INTEGER NOT NULL DEFAULT 100,
ADD COLUMN     "sensorRange" INTEGER NOT NULL DEFAULT 3;

-- AddForeignKey
ALTER TABLE "Ship" ADD CONSTRAINT "Ship_currentSystemId_fkey" FOREIGN KEY ("currentSystemId") REFERENCES "System"("id") ON DELETE SET NULL ON UPDATE CASCADE;
